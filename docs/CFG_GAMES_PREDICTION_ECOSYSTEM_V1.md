# CFG Global Games & Prediction Ecosystem V1

Status: ADDITIVE DESIGN / DEMO-FIRST. This document does not authorize real-money betting, deposits, withdrawals, cash prizes, or production activation.

## 1. Repository baseline and preservation rules

- Repository: MKONDE/cashflow-gate
- Base branch: main
- Work branch: feature/cfg-games-prediction-ecosystem-v1
- Preserve existing Cashflow Gate Trading V1 experience and the approved ROI Mining Pool Engine V1 specification.
- Do not change CFG Core, the 1,000,000,000 CFG authorized supply ceiling, the 100% verified reserve-backing requirement, Treasury/Reserve/Issuance rules, or ROI Investment 2.
- Do not merge this project with Jakay V3 or Maharoos Mini.
- Demo balances, XP, scores, prices and outcomes must be visibly marked as simulated.
- Do not introduce or retain VPT as an internal denomination. Any additive demo balance label must use CFG (DEMO) and must never be represented as a real wallet balance.

## 2. Product structure

### CFG PLAY
Free-to-play entertainment, learning and skill competitions:
- Quiz & Knowledge Challenge
- Chess & Strategy
- Football Manager / sports management
- Trading Simulator
- Daily Challenges
- Skill Tournaments
- Virtual Games

### CFG PREDICT
Prediction and scoring products:
- Sports Prediction
- Live Sports Prediction (only where reliable licensed data and timing controls exist)
- Commodity and agriculture price prediction
- Gold and silver market-direction prediction
- Esports prediction
- Prediction League and leaderboards
- Global Prediction Competition (free-to-play scoring; any prize requires separately approved published terms and legal review)

Initial implementation is free-to-play, points-based and demo-only. No entry fee or cash-equivalent prize is enabled by this specification.

### CFG BET
A separately gated product for regulated real-money betting:
- Witiri / Multiplier and Binary / High-Low games
- Crash-style games and Auto-Cashout
- Global Stake Pools and Capacity Rooms
- Daily / Global Jackpot, Triple Accumulator and Rollover Engine
- Sports, virtual sports, esports and horse-racing markets

CFG BET must remain a disabled product shell / simulation only until country-by-country legal review, licensing or approved licensed-partner arrangements, age and identity controls, responsible-gaming controls, payment safeguarding, independent game fairness testing and financial-risk approval are complete. No real-money staking, deposits, withdrawals, cash-equivalent payouts or live betting APIs are in scope now.

## 3. Shared platform services with strict separation

Shared technical services may include authentication, localization, notifications, game catalog, event scheduling, anti-abuse signals and audit logging. Product-specific balances and ledgers must remain separate.

- CFG PLAY: points/XP ledger only; not withdrawable.
- CFG PREDICT: prediction score and demo reward records only; not withdrawable.
- CFG BET: isolated future betting ledger, disabled by default; no connection to investment or reserve ledgers.
- FLEEFUND / ROI Investment 2: remain separate investment products and ledgers. Cashback or game points must not be described as investment returns.
- CFG Wallet/Core/Treasury: no schema or behavior changes in this phase.

## 4. Existing modules to reuse after verification

The current repository already contains a mobile-first dark trading-learning prototype, a browser-based virtual trading flow, demo ROI scenario calculator, commodity/crypto/forex illustrative watchlist, and a youth market-direction challenge with demo XP. Reuse and refactor these only additively:
- Existing practice trading can become a CFG PLAY learning game.
- Existing market-direction challenge can become the first CFG PREDICT demo.
- Existing leaderboard/history patterns can be generalized for points and skill competitions.
- Existing ROI demo remains separate and must not be relabeled as a game or betting return.

Before any source refactor, verify all internal denomination references and replace VPT only in additive/demo contexts with clearly labelled CFG DEMO points. Do not alter historical financial records or approved core accounting.

## 5. Proposed delivery phases

### Phase 0 — Read-only audit
Inventory all routes, UI modules, denomination references, local storage, balances, prediction logic, ROI demo, data sources, authentication and deployment configuration. Record findings and risks. No migrations, production changes or live-money integrations.

### Phase 1 — CFG PLAY demo
Add a Games hub and first free games: Quiz, Daily Challenge, Chess/Strategy placeholder and Trading Simulator entry. Points/XP only; clear demo labels; accessible mobile-first UI.

### Phase 2 — CFG PREDICT demo
Add sports/commodity prediction interfaces using clearly labelled sample data or verified public data where permitted. Use deterministic close times, immutable submitted predictions, transparent scoring rules and audit history. No staking or cash prizes.

### Phase 3 — CFG BET simulation shell
Build non-monetary UI prototypes for Witiri/Multiplier, Binary / High-Low, Crash, Auto-Cashout, Capacity Rooms, Global Pools, Daily / Global Jackpot, Triple Accumulator, Rollover, Sports Betting, Virtual Sports, Esports Betting and Horse Racing using test-only tokens/points. The simulation must not accept deposits or produce withdrawable value. Publish rules and probability disclosures. No live betting or payment rails.

### Phase 4 — Independent gates
Before any regulated product activation: legal review per country, licensing/partner approval, AML/KYC and age verification, responsible-gaming controls, independent RNG/fairness certification, liability and solvency modelling, segregated safeguarding accounts, security audit, incident response and regulator requirements.

## 6. Financial and integrity controls

- Never describe betting as investment or promise ROI.
- Never use new participant deposits to pay prior participants.
- No guaranteed daily yield, synthetic live growth ticker, fake winners, fabricated social proof, or urgency/FOMO prompts.
- Any future pool allocation, platform fee, cashback or rollover must be disclosed before participation and reconciled exactly; no residual pool may silently become company revenue.
- Do not treat company revenue as reserve backing.
- Do not change CFG supply or mint/burn CFG through game logic.
- Use server-authoritative results, cryptographic randomness and independently verifiable fairness for any future chance-based regulated game; Math.random() is not acceptable for real-money outcomes.
- Enforce idempotent settlement, append-only audit events, limits, self-exclusion and cooling-off controls before any real-money release.

## 7. Acceptance criteria for demo phases

- Existing Trading V1 and ROI demo continue to work.
- No VPT internal denomination is displayed in the new CFG experience.
- Demo points cannot be deposited, withdrawn, transferred, sold or converted into CFG.
- PLAY and PREDICT have separate scoring records and transparent rules.
- BET is visibly marked LOCKED / SIMULATION ONLY and has no payment or withdrawable balance path.
- Games Hub links visibly distinguish CFG PLAY, CFG PREDICT and the disabled CFG BET catalogue; Horse Racing and Binary / High-Low appear in the CFG BET catalogue.
- No database migration or production deployment occurs without separate approval.
- Changes are delivered through pull requests; main remains untouched until review and explicit merge approval.
