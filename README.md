# Online Quiz App

A simple multiple-choice quiz built with plain HTML, CSS and JavaScript (no dependencies).

## Features

- Multiple-choice questions, shuffled on every attempt
- 20-second timer per question (auto-marks as unanswered when time runs out)
- Automatic scoring with a result summary and answer review
- Best score saved in the browser (`localStorage`)
- Keyboard support: press `1`-`4` to answer
- Responsive layout

## Run locally

Open `index.html` in any browser. No build step or server needed.

## Customise

- Edit the `QUESTIONS` array at the top of `script.js` to add or change questions.
- Change `SECONDS_PER_QUESTION` in `script.js` to adjust the timer.

## Project structure

```
online-quiz-app/
├── index.html   # page structure
├── style.css    # styling
├── script.js    # quiz logic, timer, scoring
└── README.md
```

## Deploy with GitHub Pages

Repo **Settings → Pages → Deploy from a branch → `main` / root**. The site will be available at
`https://<your-username>.github.io/online-quiz-app/`.
