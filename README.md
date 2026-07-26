# Meteogram — 14-day ensemble forecast

Modern, dark, responsive web app that builds a 14-day meteogram for any city by
combining **many official forecast sources** into one view.

![landing](docs/preview.png)

## What it does

- **City autocomplete** — type a city, get valid matches with region + country
  (Open-Meteo geocoding).
- **Ensemble forecast** — pulls the next 14 days from a dozen official numerical
  weather models (each a national/international met service) in a single request.
- **Median + error range** — for each day it computes the **median** across all
  sources (robust to a single outlier model) and shows the **P10–P90 spread** as a
  shaded band. The band naturally widens further out as fewer models reach that
  horizon and they disagree more.
- **Precipitation** — median daily precipitation as bars, with a P90 whisker.
- **Interactive** — hover/tap any day for exact median, spread and how many
  sources contributed.

## Sources

Each source is an independent NWP model exposed via Open-Meteo's `models=`:

| Service | Model | Service | Model |
|---|---|---|---|
| ECMWF (Europe) | IFS | UK Met Office | UM |
| DWD (Germany) | ICON | JMA (Japan) | GSM |
| NOAA (USA) | GFS | BOM (Australia) | ACCESS-G |
| MSC (Canada) | GEM | CMA (China) | GRAPES |
| Météo-France | ARPEGE | KNMI (Netherlands) | HARMONIE |
| DMI (Denmark) | HARMONIE | MET Norway | MEPS |

Add more in [`src/api/sources.ts`](src/api/sources.ts) — fetch, aggregation and
the legend pick them up automatically.

## Stats method

- **Central line:** median across sources (chosen over mean for outlier
  robustness).
- **Error range:** 10th–90th percentile (linear-interpolated) across sources.

See [`src/lib/stats.ts`](src/lib/stats.ts).

## Stack

Vite + React + TypeScript. Custom SVG meteogram (no chart lib). No API keys, no
backend — everything runs client-side against the free Open-Meteo API.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

Data © [Open-Meteo](https://open-meteo.com) (CC-BY 4.0), aggregating the official
models listed above.
