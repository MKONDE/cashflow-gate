# CFG Ledger Integrity Engine V1 — Implementation Notes

## Implemented database controls

- Posting requires at least one debit and one credit.
- Debit and credit totals must balance exactly for every currency.
- USD-equivalent debit and credit totals must also balance exactly.
- Posting locks the parent transaction row, serializing concurrent entry edits and posting.
- Posting is idempotent: retrying an already-posted transaction returns the same transaction ID.
- Entry currency must match its ledger account currency.
- CFG and CFGG customer ledger domains cannot be mixed in one transaction.
- Draft entries may be edited only while the parent transaction is DRAFT.
- Posted transactions and entries are immutable. Corrections must use a separate, auditable reversal journal; the original posted journal is not edited.
- Browser roles cannot execute the posting function.
- Before explicit LIVE_AUTHORIZED plus real_money_enabled=true, only RESERVE_RECONCILIATION journals may post. This preserves the current hard-disabled live-money posture.

## Scope boundary

This migration does not add payment, deposit, withdrawal, issuance, redemption, customer transfer, or agent float APIs. It does not create or change wallet balances. It does not enable real money. The posting function is a database primitive, not proof that reserve assets exist.

## Tests

`supabase/tests/cfg_ledger_integrity_v1.sql` contains database-catalog assertions for the posting function, both guard triggers, and least-privilege execution grants. Transactional behavior still requires integration testing in a disposable isolated database.

These tests are authored for an isolated disposable database and have not yet been executed. Do not apply this migration to the connected production database.
