# Credora — HTML + CSS + JavaScript + Node.js Backend

This version is deliberately **NOT React** and has **NO LOGIN/SIGNUP**.

## Stack
- HTML
- CSS
- Vanilla JavaScript
- Node.js (built-in HTTP server; no backend package required)
- JSON card database

## Run

Open terminal in this folder:

```bash
npm start
```

Then open:

http://localhost:5000

## Features

- Responsive PC/laptop/tablet/mobile UI
- Credora logo
- Intro page (`index.html`) → full website (`main.html`)
- Dedicated `finder.html` page for the survey/recommendation flow
- Intro page (`index.html`) → full website (`main.html`) does not contain the survey form
- Travel / Shopping / Bills & Utility / Dining / Fuel / UPI requirements
- 8-step survey
- Recommendation scoring API
- Top 3 card recommendations
- Estimated annual reward calculation
- Card catalogue
- Search
- Category filtering
- Card detail modal
- Compare up to 3 cards
- No login
- No signup
- No database server required for this version

## Backend API

GET `/api/health`

GET `/api/cards`

GET `/api/cards/:id`

POST `/api/recommend`

The frontend and backend are served from the same Node server, so there is no CORS dependency.

## Important

`data/cards.json` contains project/demo reference data. Credit-card fees, rewards, exclusions, eligibility and benefits change. Verify current official issuer terms before publishing current claims or application links.

## Why there is no `npm install` dependency
The backend uses Node's built-in `http`, `fs`, `path` and `url` modules, so you can run it without Express/CORS installation problems.

## Page flow
`index.html` is the first screen. Clicking **Get Your Card →** opens `main.html`, which contains the full Credora website. The recommendation survey is on `finder.html`.


## Catalogue display
The Browse Cards section initially shows 6 cards to keep the home page compact. Use **Show More** to reveal the remaining cards and **Show Less** to collapse them again. Search and category filtering reset the catalogue to the compact 6-card view.

The Compare section includes **Clear Choices** to remove all selected comparison cards at once.


## Dedicated pages
- `main.html` — clean home/landing page.
- `browse.html` — full card catalogue with search, filters and Show More.
- `compare.html` — dedicated side-by-side comparison page.
- Compare selections are kept in browser localStorage.
