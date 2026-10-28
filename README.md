# Question Corner

A floating chat widget for students. During class, a student opens the bubble and asks
questions. Each question can get a **hint** or a **short answer** . When they end the session, 
they see a log of every question and can generate a **study guide** from it (generated automatically once the log
has 3 or more questions).


## Run it

Requires [Node.js](https://nodejs.org) 18+ and a [Gemini API key](https://aistudio.google.com/apikey).
There are no packages to install.

1. Copy `.env.example` to `.env` and paste your key after `GEMINI_API_KEY=`.
   `.env` is in `.gitignore`, so the key is never committed.
2. Run `npm start` and open http://localhost:3000.

The server calls the Gemini API with this one key for every request, so students need no
key or login of their own. The key stays on the server and is never sent to the browser.
All usage counts against that key's account.

## What the model does, and what the code checks

**The model's only job:** turn one student question into a hint or a short answer, and turn a
list of questions into a short study guide. Both are plain text.

**The surrounding code (`server.js`) is responsible for:**
- the instructions: hint vs. answer mode, length limits, and marking student text as untrusted (`<question>` / `<log>` tags)
- validating input: non-empty question, mode is `hint` or `answer`, question length and log size caps
- calling the API with a 60 second timeout and an output token cap
- checking the HTTP status, rejecting empty output, and capping output length
- turning every failure into a clear error message in the widget

**Debugging:** if the server console shows `Gemini API returned ...` or `Gemini request
failed`, the key, the network or the API failed (bad key, quota, rate limit, timeout). If
there is no such message and the answer is just bad, the model produced it.

## Settings

| Env var | Default | |
|---|---|---|
| `GEMINI_API_KEY` | none | Required. The shared key used for all users. Set it in `.env` |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model id to use |
| `PORT` | `3000` | |
| `HOST` | all interfaces | Optional. Set `HOST=127.0.0.1` to accept local connections only. Anyone who can reach the server spends your key's quota and there is no rate limit |

These can go in `.env` or be set as real environment variables (real ones win).

## Layout

- `server.js`: static files plus `/api/ask` and `/api/study-guide`
- `.env.example`: template for `.env`, where the API key goes
- `public/`: the widget (`index.html`, `app.js`, `style.css`)
