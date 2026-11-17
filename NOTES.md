# Study, Play, Fun!

## Run it

From this folder, run:

```text
node ai-helper.js
```

Then open http://localhost:3000 in a browser.

## Done in Version 1

- Start screen, one short catch-the-ideas level, score, lives, timer, and Play Again screen.
- Keyboard controls (arrow keys or A/D) and touch/pointer controls for phones.
- AI Coach checkpoint after the player catches enough ideas.
- The browser talks only to the local helper; the helper reads `.env`, sends the full `BRIEF.md` as system instructions, and keeps the key out of the game.
- Safety reminder about private information and medical topics.

## AI model

`gpt-5.6-luna`

## Maybe Later

- Save and tag multiple brainstorming ideas.
- More levels with different study habits.
- Sound, art, accessibility settings, and a progress history.
- A short challenge entry PDF and four-minute demo script.

## Playground Arcade real AI copy

The attached Playground Arcade files are in `Playground-Arcade`. To run its real OpenAI Study Quest locally, use:

```text
node playground-server.js
```

Then open http://localhost:3002/study.html.

You can also double-click `start-playground.bat`. Keep its window open while using the AI Coach.

After each save point, push it to GitHub.

## Vercel online setup

Vercel serves the Arcade files without a build step. The `vercel.json` rewrites the site root to the Arcade homepage and keeps the game files in `Playground-Arcade`.

The online Study Quest Coach uses the small Vercel function in `api/coach.js`. In Vercel Project Settings → Environment Variables, add `OPENAI_API_KEY` for Production (and Preview if desired). No other Vercel setting is required. Never upload `.env` or paste the key into code.

The local `node playground-server.js` helper still works on this computer and continues reading the local `.env` file.
