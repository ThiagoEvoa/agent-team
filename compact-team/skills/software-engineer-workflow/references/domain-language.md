# Domain language maintenance

Use when clarifying business terminology or updating CONTEXT.md.

Read existing `CONTEXT.md` and relevant ADRs before changing domain behavior. Resolve overloaded terms against concrete scenarios and existing rules. Separate business uncertainty from an implementation choice; investigate the code first and ask only when product intent remains unresolved.

Create or update `CONTEXT.md` when a concept becomes clear. Keep it limited to canonical terms, relationships, and business invariants, grouped alphabetically or by bounded context. Keep implementation paths, framework types, and architectural scratch notes elsewhere. Example:

```markdown
## Order
A customer's binding purchase request containing one or more Line Items.
An Order can be cancelled until it is Shipped; a Shipped Order is final.
```



For a qualifying architecture decision, use [ADR recording](architecture-decisions.md).
