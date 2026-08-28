# CONTEXT.md Format

`CONTEXT.md` is the ubiquitous language glossary for the codebase. It defines canonical terminology and concepts.

## Rules:
1. **Glossary Only:** `CONTEXT.md` is strictly a glossary of terms, concepts, and relationships. It must be totally devoid of implementation details, file paths, library references, framework classes, or architectural scratch notes.
2. **Alphabetical Order:** Terms are grouped alphabetically or by bounded context.
3. **Relationships & Invariants:** Express how terms relate to each other and what business invariants hold true.

---

## Example `CONTEXT.md`

```markdown
# Domain Context & Glossary

## Account
A customer profile and security principal within the system. An Account can hold multiple Wallets, but each Wallet belongs to exactly one Account.

## Order
A binding purchase request initiated by a Customer.
- **Invariants:**
  - An Order cannot be cancelled once in `Shipped` status.
  - An Order contains one or more LineItems.

## Settlement
The final transfer of funds for an Order between the payment gateway and the merchant ledger.
```
