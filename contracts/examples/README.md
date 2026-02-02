# Example Integrations

> ⚠️ **These are REFERENCE IMPLEMENTATIONS only.**
>
> They demonstrate how to integrate with KarmaTrust infrastructure but are **NOT** part of our core product offering.

## What's in This Folder

### `TieredLending.sol`

An example lending protocol that:
- Queries `VCSMStateManager` to get user credit tiers
- Adjusts collateral requirements based on tier (150% → 110%)
- Demonstrates how institutions can use our infrastructure

**This is NOT KarmaTrust's product.** In production:
- Banks/DeFi protocols write their own lending logic
- They call our `VCSMStateManager.getLevel()` for credit verification
- They make their own risk assessment and lending decisions

### `TieredLending.test.ts`

Test suite for the example lending contract.

---

## KarmaTrust's Core Infrastructure

Our actual product is:

```
contracts/contracts/
├── VCSMStateManager.sol  🏛️ CORE INFRASTRUCTURE
    - Credit state storage
    - Tier verification
    - State transitions
```

Everything in `examples/` is just to show how to use it.

---

## Analogy

- **FICO**: Provides credit scores → **Banks** decide who gets a loan
- **KarmaTrust**: Provides credit infrastructure → **You** make lending decisions

We're the FICO in this analogy, not the bank.
