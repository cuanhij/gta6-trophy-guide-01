# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide — make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/cuanhij/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/cuanhij/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI
(1 platinum, 2 gold, 6 silver, 46 bronze) — built for the
[make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **Checklist** — every trophy with its official name, description and grade, ticked off
  as you earn it. Progress is saved in the browser (localStorage) and can be
  **exported to a file and imported back**.
- **Filters** — by kind (story, missable, collectibles, activities, online), by grade,
  by earned / still to earn, and by search.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Roadmap to the platinum** — six stages in the order to earn them, built from the
  official descriptions: which story chapters and missions, which collectibles and counts.
- **Missables** — the 13 trophies to watch while you play, flagged from the official
  descriptions, plus the one the guides flag as genuinely missable
  (**Positive Mental Attitude** — meditate at Lucia's balcony before Chapter 1 ends).
- **A guide for every trophy, in our own words** — what to do, where and how, when it can
  be missed — each citing its sources by name and link. Where a step follows only from
  the official description, the guide says so; where the description gives no step, it
  says that too instead of inventing one.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: static files under `app/` only. Take the screenshots with:

```sh
node scripts/shots.mjs
```

Hand the entry in (writes `dossier.json` beside `app/` and `screenshots/`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Trophy names, descriptions and grades: PlayStation's official list, as carried by
  [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and
  [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi), who agree on
  every name, description and grade; the same 55 appear on
  [TrueAchievements](https://www.trueachievements.com/game/Grand-Theft-Auto-VI/achievements).
- Counts PSN tracks (42 Shooting Range challenges, 18 meditation spots, 52 areas, …):
  PSNProfiles.
- The missable warning and the no-mission-replay note:
  [KeenGamer](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/),
  [GTA Zone](https://gta-zone.com/news/gta-6-trophies-achievements/) (PowerPyx) and
  [Output Lag](https://outputlag.com/guides/gta-6-trophy-list/).

## Notes

- Unofficial fan guide, not affiliated with Rockstar Games, Sony or PlayStation. No
  Rockstar logo, official artwork or game screenshots are used anywhere; the look is our own.
- All 55 trophies are single-player — there are no online trophies in this list, so the
  Online filter is empty on purpose.
- License: MIT (see `LICENSE`).
