# World History Map, 2001 to today

An interactive world map for teaching significant world events, especially military and
political ones. Drag the year slider (one step = one year, 2001 to 2026) and icons appear
on the map for that year's events. Click an icon, or an event in the side list, to see a
short classroom-friendly summary with a link to read more.

## Features

- **Year slider** from 2001 to 2026 (2026 is marked "to date"), a big year label,
  ◀ ▶ buttons and keyboard control: ← → change the year, Home/End jump to the first or last year,
  Space plays or pauses, Esc closes the event card. You can link to a year directly, e.g. `index.html#2014`.
- **Play** steps through the years automatically. Speed options are slow (8 s), normal (4 s),
  fast (2 s) and very fast (1 s) per year.
- **Category icons and colours**:
  | Icon colour | Category (`category` value) |
  |---|---|
  | Red, crossed swords | War & military action (`war`) |
  | Charcoal, burst | Terrorist attack & assassination (`terror`) |
  | Orange, flame | Coup, revolution & protest (`coup`) |
  | Blue, ballot box | Election & change of leader (`election`) |
  | Green, document | Treaty, agreement & summit (`treaty`) |
  | Teal, flag | Independence & territory (`independence`) |
  | Purple, warning triangle | Disaster & humanitarian crisis (`disaster`) |
  | Brown, falling chart | Economic crisis (`economy`) |
- **Legend that doubles as a filter.** Click a category to hide or show it. "Show all" and
  "Military & political only" switch everything at once. Each category shows how many events it has that year.
- **Event card** shows the title, date, place and country, category, a 2–3 sentence summary and a source link.
- **Side panel** lists the year's events in date order. Clicking one flies the map to it.
- **Ongoing conflicts** (on by default, with a tick box to turn it off): long wars such as
  Afghanistan 2001–2021 or the Russia–Ukraine war since 2022 stay on the map in later years
  as faded, dashed icons marked "since YYYY", and are listed under the year's events.
- **Two map styles.** The labelled online map (Esri World Light Gray) is the default. "Simple map"
  switches to a built-in offline map of country borders (Natural Earth) that needs no internet.
  If the online tiles fail to load, the app switches to the simple map on its own. You can open
  it in simple mode directly with `index.html?map=simple`.
- Works on phones and tablets: the map sits on top and the list goes below it.

## Running it

No build step and nothing to install. Any of these work:

1. **Just open `index.html`** in a browser (double-click it). Everything loads from local files.
   The labelled map tiles still need internet; the simple map doesn't.
2. **Local web server:** in this folder run `python3 -m http.server 8001`, then open
   <http://localhost:8001/>.
3. **Publish it online (free):**
   - *GitHub Pages:* put these files in a GitHub repository, then go to Settings → Pages →
     "Deploy from a branch", choose `main` / root. The site appears at `https://<user>.github.io/<repo>/`.
   - *Netlify:* drag the folder onto <https://app.netlify.com/drop>.

## Files

```
index.html            page layout
css/style.css         styling
js/app.js             map, slider, filters, cards (settings at the top: years, map centre)
data/events.js        ★ THE EVENT DATA – edit this to add/change events
data/world.js         country borders for the offline "simple map" (Natural Earth 1:50m)
vendor/leaflet.*      Leaflet 1.9.4 map library (bundled so no CDN is needed)
favicon.svg           browser tab icon
tools/                optional maintainer scripts (see below); not needed by the website
```

## Adding or editing events

Open `data/events.js` in any text editor. Each event is one `{ ... }` block:

```js
{
  "id": "2011-05-02-osama-bin-laden-killed",   // unique; date + short title is a good pattern
  "year": 2011,                                // which slider step it appears on (2001–2026)
  "date": "2011-05-02",                        // YYYY-MM-DD, or YYYY-MM / YYYY if the exact day is unknown
  "title": "Osama bin Laden killed",
  "category": "war",                           // war | terror | coup | election | treaty | independence | disaster | economy
  "place": "Abbottabad",
  "country": "Pakistan",
  "lat": 34.1693, "lng": 73.2425,              // decimal degrees (right-click in Google Maps to copy them)
  "summary": "Two or three neutral sentences...",
  "source": "https://en.wikipedia.org/wiki/Killing_of_Osama_bin_Laden",
  "sourceName": "Wikipedia",                   // optional: text shown on the link
  "endYear": 2021,                             // optional: keeps it on the map as "ongoing" until this year, or "present"
  "ongoingLabel": "War in Afghanistan"         // optional: name used for it in later years
}
```

Rules: keep the quotes and the commas between blocks, and use straight double quotes `"`.
For national political events (elections, new leaders) the convention is to use the capital city's coordinates.
After editing, run `python3 tools/check_events.py` to catch mistakes, or just reload the page.
Invalid events are skipped and a warning appears in the browser console (F12).

**Moving to a new year (e.g. 2027):** in `js/app.js` change `LAST_YEAR = 2026` to `2027`, change
`max="2026"` on the slider in `index.html`, and add events with `"year": 2027`. Change
`"present"` endYears only if a conflict has ended.

### Maintainer tools (optional, need Python 3)

- `tools/check_events.py`: offline check of every event (required fields, categories, dates, coordinates,
  http(s) sources, unique ids). It prints counts per year and per category.
- `tools/build_events.py`: regenerates `data/events.js` from the compact text files `tools/events_src_*.txt`,
  which is how the original data set was written. **Warning:** if you edit `data/events.js` by hand and later
  run this script, your hand edits are overwritten. Pick one method and stick to it.
- `tools/verify_sources_online.py`: checks online that every Wikipedia source page exists, isn't a
  disambiguation page, and that its coordinates are near ours.
- `tools/test_site.py`: headless-browser test (needs `pip install playwright` and Chrome/Chromium). It also
  re-creates the screenshots.

## About the data

366 events, about 12–22 per year, chosen to give a global spread with an emphasis on military and
political history. Each summary was written to be neutral and suitable for the classroom and links
to a Wikipedia article. Every source link was checked automatically to make sure the page exists.
Death tolls and figures are deliberately rounded or given as "more than…/at least…", because exact
figures are often disputed. Events for 2026 run up to early October 2026. As always with very recent
events, check the details against current news before teaching them.

## Credits

- Map library: [Leaflet](https://leafletjs.com/) (BSD-2).
- Labelled basemap: Esri World Light Gray Canvas (© Esri, HERE, Garmin, © OpenStreetMap contributors).
  (CARTO's free basemaps started requiring an API key in September 2026. To use CARTO, OpenStreetMap or
  another provider, change the tile URLs and attribution near the top of the map section in `js/app.js`.)
- Offline borders: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- Event summaries are original. Sources: [Wikipedia](https://en.wikipedia.org/) (CC BY-SA) articles linked from each event.
