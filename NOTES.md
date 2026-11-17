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
