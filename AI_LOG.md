# AI Log

Record of changes made with Claude Code.

## 1. Refactor: Java socket app to student-only web widget

- Removed the Java code (socket server, Swing GUI, Gemini and `claude -p` helpers, professor forwarding). The old Gemini key is still in git history and must be revoked.
- Added `server.js`, a dependency-free Node server with `/api/ask` (mode `hint` or `answer`) and `/api/study-guide`.
- Added `public/` with the floating widget: question form with hint and short answer buttons, an end-of-session log, and a study guide (auto-generated at 3+ questions, otherwise on a button).

## 2. Switch from the paid API to Claude Code headless

The first version called the Anthropic API with a key each student pasted in. The class access doesn't cover the paid API, so the model call now runs `claude -p`. The API-key login screen was removed.

- Model's job and the code's checks are written down in README.md.
- Tested with a stand-in `claude` command: ask, study guide, invalid mode (400) and missing CLI (502) all behave as expected. The widget UI and the real `claude -p` call have not been tested yet.
