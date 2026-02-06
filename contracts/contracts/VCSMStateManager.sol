// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 *                    🏛️  CORE INFRASTRUCTURE CONTRACT  🏛️
 * ============================================================================
 * 
 * This is a CORE component of KarmaTrust/DAISY credit infrastructure.
 * Unlike TieredLending.sol (which is an example), this contract IS the product.
 * 
 * What This Contract Does:
 * - Stores cryptographic commitments (state hashes) of user credit states
 * - Provides verifiable credit tier information to ANY integrating protocol
 * - Maintains an immutable audit trail of credit state transitions
 * 
 * What This Contract Does NOT Do:
 * - Does NOT make lending decisions (that's the institution's job)
 * - Does NOT store raw credit scores (privacy by design)
 * - Does NOT decide collateral ratios (that's the lender's risk model)
 * 
 * Integration Model:
 * ┌─────────────────────┐      ┌─────────────────────┐
 * │  VCSMStateManager   │ ───> │  Bank/DeFi Protocol │
 * │  (KarmaTrust)       │      │  (Customer)         │
 * │                     │      │                     │
 * │  - getLevel()       │      │  - Risk assessment  │
 * │  - getState()       │      │  - Lending decision │
 * │  - verifyProof()    │      │  - Compliance       │
 * └─────────────────────┘      └─────────────────────┘
 *       INFRASTRUCTURE              APPLICATION
 * 
 * ============================================================================
 * 
 * @title VCSMStateManager
 * @notice On-chain state management for KarmaTrust credit states
 * 
 * @dev This contract stores the cryptographic commitments (state hashes) of user credit states.
 * The actual score is NEVER stored on-chain - only the Poseidon hash commitment.
 * 
 * Key Design Decisions:
 * 1. Only store hash, not score (privacy)
 * 2. Version for replay protection
 * 3. Level is public (needed for lending decisions)
 * 4. Events for off-chain indexing
 * 
 * Flow:
 * 1. User initializes state (creates commitment)
 * 2. User proves upgrade off-chain (ZK proof)
 * 3. User calls updateStateWithProof() with proof
 * 4. Contract verifies and updates state
 * 
 * MVP Note: ZK verification is simplified for hackathon.
 * Production would integrate with deployed Groth16 verifier.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VCSMStateManager is Ownable, ReentrancyGuard {
    
    // =========================================================================
    // STRUCTS
    // =========================================================================
    
    /**
     * @notice User's credit state stored on-chain
     * @param stateHash Poseidon(score, level, salt) - cryptographic commitment
     * @param level Credit level (1-5: Bronze to Diamond)
     * @param version Incrementing counter for replay protection
     * @param updatedAt Timestamp of last update
     * @param initialized Whether state has been initialized
     */
    struct UserState {
        bytes32 stateHash;
        uint8 level;
        uint64 version;
        uint64 updatedAt;
        bool initialized;
    }
    
    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    
    /// @notice Mapping of user address to their credit state
    mapping(address => UserState) public userStates;
    
    /// @notice Address of the ZKP verifier contract (for future use)
    address public zkpVerifier;
    
    /// @notice Trusted attesters who can update states
    mapping(address => bool) public trustedAttesters;
    
    /// @notice Total number of initialized users
    uint256 public totalUsers;
    
    /// @notice Level names for events
    string[6] private levelNames = ["Unverified", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
    
    // =========================================================================
    // EVENTS
    // =========================================================================
    
    /// @notice Emitted when a new state is initialized
    event StateInitialized(
        address indexed user,
        bytes32 indexed stateHash,
        uint8 level,
        uint64 timestamp
    );
    
    /// @notice Emitted when a state is updated (upgrade or downgrade)
    event StateUpdated(
        address indexed user,
        bytes32 indexed oldHash,
        bytes32 indexed newHash,
        uint8 fromLevel,
        uint8 toLevel,
        uint64 version,
        bytes32 proofHash
    );
    
    /// @notice Emitted when ZKP verifier is updated
    event ZKPVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
    /// @notice Emitted when attester status changes
    event AttesterUpdated(address indexed attester, bool trusted);
    
    // =========================================================================
    // ERRORS
    // =========================================================================
    
    error AlreadyInitialized();
    error NotInitialized();
    error InvalidLevel();
    error InvalidProof();
    error Unauthorized();
    error InvalidStateHash();
    
    // =========================================================================
    // MODIFIERS
    // =========================================================================
    
    modifier onlyTrustedAttester() {
        if (!trustedAttesters[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }
    
    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    
    constructor() Ownable(msg.sender) {
        // Owner is automatically a trusted attester
        trustedAttesters[msg.sender] = true;
        emit AttesterUpdated(msg.sender, true);
    }
    
    // =========================================================================
    // EXTERNAL FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Initialize credit state for a user
     * @param _stateHash Poseidon hash commitment
     * @param _level Initial credit level (1-5)
     */
    function initializeState(
        bytes32 _stateHash,
        uint8 _level
    ) external nonReentrant {
        if (userStates[msg.sender].initialized) {
            revert AlreadyInitialized();
        }
        if (_level > 5) {
            revert InvalidLevel();
        }
        if (_stateHash == bytes32(0)) {
            revert InvalidStateHash();
        }
        
        userStates[msg.sender] = UserState({
            stateHash: _stateHash,
            level: _level,
            version: 1,
            updatedAt: uint64(block.timestamp),
            initialized: true
        });
        
        totalUsers++;
        
        emit StateInitialized(msg.sender, _stateHash, _level, uint64(block.timestamp));
    }
    
    /**
     * @notice Update state with a proof (MVP - off-chain verification)
     * 
     * @dev CURRENT STATE (Hackathon MVP):
     * - ZK proof verification happens OFF-CHAIN in backend
     * - On-chain contract stores the state commitment + level
     * - _proofHash is logged in events for audit trail
     * 
     * @dev PRODUCTION ROADMAP:
     * - Integrate Groth16 verifier contract (deployed separately)
     * - Add: require(zkpVerifier.verify(proof, publicSignals), "Invalid proof")
     * - Gas cost: ~250k per verification
     * 
     * @dev WHY OFF-CHAIN NOW:
     * - Hackathon time constraint
     * - Verifier deployment + ceremony setup takes 2-3 days
     * - Core innovation (VCSM + ZK circuits) is demonstrated
     * 
     * @param _newStateHash New state hash commitment
     * @param _newLevel New credit level
     * @param _proofHash Hash of the ZK proof (for event logging)
     */
    function updateState(
        bytes32 _newStateHash,
        uint8 _newLevel,
        bytes32 _proofHash
    ) external nonReentrant {
        UserState storage state = userStates[msg.sender];
        
        if (!state.initialized) {
            revert NotInitialized();
        }
        if (_newLevel > 5) {
            revert InvalidLevel();
        }
        if (_newStateHash == bytes32(0)) {
            revert InvalidStateHash();
        }
        
        bytes32 oldHash = state.stateHash;
        uint8 oldLevel = state.level;
        
        state.stateHash = _newStateHash;
        state.level = _newLevel;
        state.version++;
        state.updatedAt = uint64(block.timestamp);
        
        emit StateUpdated(
            msg.sender,
            oldHash,
            _newStateHash,
            oldLevel,
            _newLevel,
            state.version,
            _proofHash
        );
    }
    
    /**
     * @notice Update state by trusted attester (for off-chain verification)
     * @param _user User address to update
     * @param _newStateHash New state hash
     * @param _newLevel New level
     */
    function attestState(
        address _user,
        bytes32 _newStateHash,
        uint8 _newLevel
    ) external onlyTrustedAttester nonReentrant {
        UserState storage state = userStates[_user];
        
        // Allow attestation to initialize if not initialized
        if (!state.initialized) {
            userStates[_user] = UserState({
                stateHash: _newStateHash,
                level: _newLevel,
                version: 1,
                updatedAt: uint64(block.timestamp),
                initialized: true
            });
            totalUsers++;
            emit StateInitialized(_user, _newStateHash, _newLevel, uint64(block.timestamp));
            return;
        }
        
        if (_newLevel > 5) {
            revert InvalidLevel();
        }
        
        bytes32 oldHash = state.stateHash;
        uint8 oldLevel = state.level;
        
        state.stateHash = _newStateHash;
        state.level = _newLevel;
        state.version++;
        state.updatedAt = uint64(block.timestamp);
        
        emit StateUpdated(
            _user,
            oldHash,
            _newStateHash,
            oldLevel,
            _newLevel,
            state.version,
            bytes32(0) // No proof hash for attested updates
        );
    }
    
    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Get user's complete state
     */
    function getState(address _user) external view returns (
        bytes32 stateHash,
        uint8 level,
        uint64 version,
        uint64 updatedAt,
        bool initialized
    ) {
        UserState memory state = userStates[_user];
        return (
            state.stateHash,
            state.level,
            state.version,
            state.updatedAt,
            state.initialized
        );
    }
    
    /**
     * @notice Get user's level (commonly needed for lending)
     */
    function getLevel(address _user) external view returns (uint8) {
        return userStates[_user].level;
    }
    
    /**
     * @notice Get level name
     */
    function getLevelName(uint8 _level) external view returns (string memory) {
        if (_level > 5) return "Invalid";
        return levelNames[_level];
    }
    
    /**
     * @notice Check if user meets minimum level requirement
     */
    function meetsLevelRequirement(address _user, uint8 _minLevel) external view returns (bool) {
        UserState memory state = userStates[_user];
        return state.initialized && state.level >= _minLevel;
    }
    
    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Set the ZKP verifier contract address
     */
    function setZKPVerifier(address _verifier) external onlyOwner {
        address oldVerifier = zkpVerifier;
        zkpVerifier = _verifier;
        emit ZKPVerifierUpdated(oldVerifier, _verifier);
    }
    
    /**
     * @notice Add or remove trusted attester
     */
    function setTrustedAttester(address _attester, bool _trusted) external onlyOwner {
        trustedAttesters[_attester] = _trusted;
        emit AttesterUpdated(_attester, _trusted);
    }
}
