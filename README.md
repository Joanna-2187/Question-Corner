# Question Corner

A floating chat widget for students. During class, a student opens the bubble and asks
questions. Each question can get a **hint** or a **short answer** . When they end the session, 
they see a log of every question and can generate a **study guide** from it (generated automatically once the log
has 3 or more questions).


## Run it

Requires [Node.js](https://nodejs.org) 18+ and [Claude Code](https://claude.com/claude-code)
installed and logged in on the same machine (run `claude` once to check). There are no
packages to install and no API key.

```
npm start
```

Open http://localhost:3000.

The server runs Claude Code headless (`claude -p`) for each request, so it uses your Claude
Code access instead of the paid API. That means it works on the machine where Claude Code
is logged in, not on students' own devices.

## What the model does, and what the code checks

**The model's only job:** turn one student question into a hint or a short answer, and turn a
list of questions into a short study guide. Both are plain text.

**The surrounding code (`server.js`) is responsible for:**
- the instructions: hint vs. answer mode, length limits, and marking student text as untrusted (`<question>` / `<log>` tags)
- validating input: non-empty question, mode is `hint` or `answer`, question length and log size caps
- running `claude -p` from the temp folder, with a 60 second timeout
- checking the exit code, rejecting empty output, and capping output length
- turning every failure into a clear error message in the widget

**Debugging:** if the server console shows `claude exited with code ...`, or the widget says
it could not run Claude Code, the CLI or the code failed (not installed, not logged in,
timeout). If there is no such message and the answer is just bad, the model produced it.

## Settings

| Env var | Default | |
|---|---|---|
| `PORT` | `3000` | |
| `HOST` | `127.0.0.1` | Leave it on localhost: the server uses your Claude login for anyone who can reach it |
| `CLAUDE_BIN` | `claude` | Path to the Claude Code command if it isn't on your PATH |

## Layout

- `server.js`: static files plus `/api/ask` and `/api/study-guide`
- `public/`: the widget (`index.html`, `app.js`, `style.css`)
