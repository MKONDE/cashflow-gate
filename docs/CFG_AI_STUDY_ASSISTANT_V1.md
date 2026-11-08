# CFG AI Study Assistant V1 — Server-side Integration

## Status
Implementation is additive and isolated to the CFG Quiz Study Assistant. Existing CFG Quiz rules, demo points, CFG Wallet, Treasury, Reserve, Issuance, ROI Investment 2 and other modules are unchanged. No score, CFG balance, payment, ledger or wallet API is exposed to the model.

## Runtime
- Browser calls same-origin `POST /api/cfg-quiz-assistant`.
- Vercel Node serverless function calls the Vercel AI Gateway OpenAI-compatible Chat Completions endpoint.
- Default model: `openai/gpt-5.4-mini`; can be overridden with `CFG_AI_MODEL`.
- Secret `AI_GATEWAY_API_KEY` is read only on the server. Never put it in HTML, JavaScript, Git, or browser storage.
- Inputs are limited to an approved subject, 600 question characters, and two tasks: ask or practice-question generation.
- Output capped at 650 tokens; request timeout 25 seconds; best-effort per-instance limit 8 requests/IP/minute.
- No chat history is persisted or sent; only the selected subject and current prompt are sent.

## Required Vercel configuration
Add `AI_GATEWAY_API_KEY` as a Secret Environment Variable for the CFG project in the Preview environment first. Optionally set `CFG_AI_MODEL` to a model ID available in Vercel AI Gateway. Redeploy the preview after setting variables. Do not paste the secret into chat or commit it.

## Important limitations before production
- The in-memory rate limiter is best-effort only and is not a distributed abuse-control system. Add durable rate limiting, monitoring, and a hard spend budget before broad public release.
- Review Vercel AI Gateway/provider privacy, data-retention, billing and regional terms before using with minors or sensitive student information.
- AI responses can be wrong; teacher review and curriculum-aligned evaluation are required.
- This integration is a preview implementation, not authorization to merge, deploy to production, introduce payments, or change CFG financial logic.
