# 🔗 Week 3-4: Dirty But Real Integration Guide

**Goal**: 打通完整流程 - 评分 → ZK证明 → 链上写入 → 借款

---

## 📋 前置条件

### 1. 部署合约到 Base Sepolia

如果还没部署，先运行：

```bash
cd contracts
npx hardhat run scripts/deploy-base.ts --network baseSepolia
```

**保存输出的地址**：
- `CreditRegistry`: 0xABC...
- `KarmaTrustLending`: 0xDEF...

### 2. 更新环境变量

在根目录的 `.env` 文件添加：

```bash
# Base Sepolia 配置
CREDIT_REGISTRY_ADDRESS=0xABC...
LENDING_CONTRACT_ADDRESS=0xDEF...
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Backend 配置
BACKEND_URL=http://localhost:3001

# 部署钱包（需要 Base Sepolia ETH）
PRIVATE_KEY=0x...

# Basescan 验证（可选）
BASESCAN_API_KEY=...
```

### 3. 启动后端

```bash
cd backend
npm install
npm run dev
```

**验证后端运行**：
```bash
curl http://localhost:3001/api/health
# 应该返回: {"status":"healthy"}
```

---

## 🚀 完整流程演示

### Step 1: 评分 + 设置链上等级

使用 CLI 脚本一键完成 "评分 → ZK证明 → 上链"：

```bash
# 在项目根目录运行
npx ts-node scripts/score-and-set-tier.ts 0xYOUR_WALLET_ADDRESS
```

**示例输出**：
```
🚀 KarmaTrust Score-and-Set-Tier CLI

============================================================
📋 Configuration:
   Wallet:   0x123...abc
   Backend:  http://localhost:3001
   Registry: 0xABC...
   Network:  Base Sepolia
============================================================

📊 Step 1/3: Scoring wallet...
✅ Score: 720/850
✅ Tier: 3 (Gold)
   Factors:
     - transactionHistory: 180.00
     - tokenHoldings: 150.00
     - defiParticipation: 140.00
     ...

🔐 Step 2/3: Generating ZK proof...
✅ Proof generated in 1823ms
   Public signals: 4 elements

⛓️  Step 3/3: Writing tier on-chain...
   Deployer: 0xDEF...
   Balance: 0.05 ETH
   Current tier: 0
   New tier: 3
   Sending transaction...
   TX hash: 0x789...xyz
   Waiting for confirmation...
✅ Transaction confirmed in block 12345678
   Gas used: 48392
   Verified tier: 3

============================================================
✨ SUCCESS - Tier set on-chain!
============================================================
Wallet:     0x123...abc
Score:      720/850
Tier:       3 (Gold)
Registry:   0xABC...
Explorer:   https://sepolia.basescan.org/address/0x123...abc
============================================================

🎯 Next step: Test borrowing with reduced collateral!
```

---

### Step 2: 测试借款（降低抵押率）

现在用户的信用等级已经上链，可以享受降低的抵押率：

```bash
cd contracts
npx hardhat run scripts/test-borrow.ts --network baseSepolia
```

**示例输出**：
```
🧪 Testing KarmaTrust Lending on Base Sepolia

============================================================
📋 Configuration:
   Borrower:  0x123...abc
   Registry:  0xABC...
   Lending:   0xDEF...
   Balance:   0.05 ETH
============================================================

📊 Step 1/3: Checking credit tier...
✅ Credit tier: 3 (Gold)
✅ Collateral ratio: 130%

💰 Borrowing details:
   Borrow amount:       0.01 ETH
   Required collateral: 0.013 ETH
   Savings vs Bronze:   0.002 ETH  👈 省了 13.3%!

💎 Pool status:
   Pool balance: 0.1 ETH

⛓️  Step 2/3: Borrowing 0.01 ETH...
   Sending 0.013 ETH as collateral...
   TX hash: 0xabc...def
   Waiting for confirmation...
✅ Transaction confirmed in block 12345679
   Gas used: 78234

📊 Step 3/3: Verifying balance change...
   Balance before:  0.05 ETH
   Balance after:   0.047 ETH
   Net change:      -0.003 ETH
   Expected:        -0.003 ETH
   Gas cost:        0.0001 ETH
✅ Balance change matches expected

============================================================
✨ SUCCESS - Borrowed with tier-based collateral!
============================================================
Borrower:          0x123...abc
Credit tier:       3 (Gold)
Borrowed:          0.01 ETH
Collateral paid:   0.013 ETH
Collateral ratio:  130%
TX:                https://sepolia.basescan.org/tx/0xabc...def
============================================================

🎯 Key insight:
   A Bronze user would need 0.015 ETH collateral
   You only needed 0.013 ETH
   Savings: 0.002 ETH (13.33%)
```

---

## 📊 抵押率对比

| 等级 | 抵押率 | 借 1 ETH 需要 | 相比 Bronze 节省 |
|------|--------|---------------|------------------|
| Unrated | 200% | 2.00 ETH | -33.3% ❌ |
| Bronze | 150% | 1.50 ETH | 0% (基准) |
| Silver | 140% | 1.40 ETH | 0.10 ETH (6.7%) |
| Gold | 130% | 1.30 ETH | 0.20 ETH (13.3%) ⭐ |
| Platinum | 125% | 1.25 ETH | 0.25 ETH (16.7%) 🏆 |
| Diamond | 120% | 1.20 ETH | 0.30 ETH (20%) 💎 |

---

## 🛠️ 常见问题

### Q1: `Error: CREDIT_REGISTRY_ADDRESS not set in .env`
**A**: 在根目录 `.env` 文件添加合约地址（从部署输出复制）

### Q2: `Error: No credit tier found for this address`
**A**: 先运行 `npx ts-node scripts/score-and-set-tier.ts YOUR_ADDRESS`

### Q3: `Error: Insufficient pool funds`
**A**: 为借贷池充值：
```bash
npx hardhat console --network baseSepolia
> const lending = await ethers.getContractAt("KarmaTrustLending", "0xDEF...")
> await lending.fund({ value: ethers.parseEther("0.1") })
```

### Q4: `Error: Failed to score wallet`
**A**: 确保后端正在运行：
```bash
cd backend
npm run dev
# 另一个终端测试: curl http://localhost:3001/api/health
```

### Q5: `Error: ZK circuit files not found`
**A**: 编译电路：
```bash
cd circuits
npm install
npm run build:circuits
```

### Q6: 交易很慢/卡住
**A**: Base Sepolia 有时候会慢，耐心等待。查看交易状态：
```
https://sepolia.basescan.org/tx/0xYOUR_TX_HASH
```

---

## 🔍 验证流程

### 1. 验证链上等级

```bash
npx hardhat console --network baseSepolia
```

```javascript
const registry = await ethers.getContractAt(
  "CreditRegistry", 
  "0xABC..."
);
const tier = await registry.getTier("0x123...abc");
console.log("Tier:", tier); // 应该返回 3n (Gold)
```

### 2. 查看链上事件

访问 Basescan:
```
https://sepolia.basescan.org/address/0xABC...#events
```

应该看到 `TierUpdated` 事件：
```
TierUpdated(
  user: 0x123...abc,
  oldTier: 0,
  newTier: 3,
  timestamp: 1738800000
)
```

### 3. 查看借款记录

```
https://sepolia.basescan.org/address/0xDEF...#events
```

应该看到 `Borrowed` 事件：
```
Borrowed(
  user: 0x123...abc,
  amount: 0.01 ETH,
  collateral: 0.013 ETH,
  tier: 3
)
```

---

## 🎯 核心价值证明

这个"脏但真实"的集成证明了：

1. ✅ **真实数据源**: 从 Etherscan 获取真实的链上历史
2. ✅ **真实 ZK 证明**: 使用编译的 Circom 电路生成 Groth16 proof
3. ✅ **真实链上状态**: 信用等级存储在 Base Sepolia 智能合约
4. ✅ **真实经济激励**: 高等级用户确实能省钱（Platinum 比 Bronze 少 16.7% 抵押）

**这不是 Demo，这是真正工作的产品原型！** 🚀

---

## 📝 代码文件清单

| 文件 | 用途 |
|------|------|
| `scripts/score-and-set-tier.ts` | CLI 脚本：评分 + ZK证明 + 上链 |
| `contracts/scripts/test-borrow.ts` | 测试借款脚本 |
| `contracts/scripts/deploy-base.ts` | 部署合约到 Base Sepolia |
| `contracts/contracts/CreditRegistry.sol` | 信用等级注册合约 (73行) |
| `contracts/contracts/KarmaTrustLending.sol` | 极简借贷合约 (59行) |

---

## 🚀 下一步 (Week 5-6)

完成 Week 3-4 后，下一步是：

1. **升级到 CreditRegistryV2**:
   - 添加链上 ZK 验证
   - 用户自己提交 proof，合约验证
   - 移除 owner 权限（完全去中心化）

2. **完整端到端流程**:
   - 用户: 生成 ZK proof
   - 用户: 提交 proof + tier 到链上
   - 合约: 验证 proof（链上）
   - 合约: 如果 valid，更新 tier
   - 用户: 借款（自动读取最新 tier）

3. **集成 Morpho Protocol**:
   - 部署真实的 Morpho Vault
   - 用 KarmaTrust tier 调整借款参数

---

## ⚠️ 安全提醒

这是 **MVP / Testnet** 版本。生产环境需要：

- ✅ 多签钱包（不用单个 EOA 作为 owner）
- ✅ Timelock（tier 更新有延迟）
- ✅ Rate limiting（防止垃圾交易）
- ✅ Pausable（紧急暂停功能）
- ✅ 审计（智能合约安全审计）

**当前版本仅用于 Base Sepolia 测试！**
