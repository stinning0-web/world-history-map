/* World History Map – app logic. No build step; plain browser JavaScript. */
(function () {
  "use strict";

  // ---------------------------------------------------------------- settings
  var FIRST_YEAR = 2001;
  var LAST_YEAR = 2026;              // update when a new year starts
  var PARTIAL_YEAR_NOTE = "to date"; // label shown for the current, unfinished year
  var WORLD_CENTER = window.innerWidth < 700 ? [20, 15] : [22, 12];
  // Zoom out a little further on narrow (phone) screens so the whole world fits.
  var WORLD_ZOOM = window.innerWidth < 700 ? 1 : 2;

  var ICONS = {
    war: '<path d="M21 3v5l-11 9l-4 4l-3 -3l4 -4l9 -11z"/><path d="M5 13l6 6"/><path d="M14.32 17.32l3.68 3.68l3 -3l-3.365 -3.365"/><path d="M10 5.5l-2 -2.5h-5v5l3 2.5"/>',
    terror: '<path fill="#fff" stroke="none" d="M12 1.8l2.1 6.1 6.1-2.6-3.6 5.4 5.6 2.4-6.1 1.4 1.7 6.6-5.8-4.2-5.8 4.2 1.7-6.6-6.1-1.4 5.6-2.4-3.6-5.4 6.1 2.6z"/>',
    coup: '<path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z"/>',
    election: '<rect x="3.5" y="11" width="17" height="9.5" rx="1.5"/><path d="M3.5 14.5h17"/><path d="M8.5 11V3.5h7V11"/><path d="M10.3 7.2l1.3 1.3 2.3-2.4"/>',
    treaty: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 17h4.5"/>',
    independence: '<path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z"/><path d="M5 21v-7"/>',
    disaster: '<path d="M12 3.2l9.5 17H2.5z"/><path d="M12 10v4.5"/><path d="M12 17.6v.4"/>',
    economy: '<path d="M3 7l6 6 4-4 8 8"/><path d="M21 10.5V17h-6.5"/>'
  };

  // Order here is the legend order. "core" = military & political.
  var CATEGORIES = [
    { id: "war",          label: "War & military action",          color: "#c62828", core: true },
    { id: "terror",       label: "Terrorist attack & assassination", color: "#263238", core: true },
    { id: "coup",         label: "Coup, revolution & protest",     color: "#e65100", core: true },
    { id: "election",     label: "Election & change of leader",    color: "#1565c0", core: true },
    { id: "treaty",       label: "Treaty, agreement & summit",     color: "#2e7d32", core: true },
    { id: "independence", label: "Independence & territory",       color: "#00838f", core: true },
    { id: "disaster",     label: "Disaster & humanitarian crisis", color: "#6a1b9a", core: false },
    { id: "economy",      label: "Economic crisis",                color: "#795548", core: false }
  ];
  var CAT = {};
  CATEGORIES.forEach(function (c) { CAT[c.id] = c; });

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  // ---------------------------------------------------------------- data
  var events = validate(window.HISTORY_EVENTS || []);

  function validate(list) {
    var ok = [];
    list.forEach(function (e, i) {
      var problems = [];
      ["id", "year", "date", "title", "category", "place", "country", "summary", "source"].forEach(function (k) {
        if (e[k] === undefined || e[k] === null || e[k] === "") problems.push("missing " + k);
      });
      if (!CAT[e.category]) problems.push("unknown category '" + e.category + "'");
      if (typeof e.lat !== "number" || e.lat < -90 || e.lat > 90) problems.push("bad lat");
      if (typeof e.lng !== "number" || e.lng < -180 || e.lng > 180) problems.push("bad lng");
      if (!(e.year >= FIRST_YEAR && e.year <= LAST_YEAR)) problems.push("year out of range");
      if (e.date && String(e.date).slice(0, 4) !== String(e.year)) problems.push("date/year mismatch");
      if (!/^https?:\/\//.test(e.source || "")) problems.push("source must be an http(s) link");
      if (problems.length) {
        console.warn("History map: skipped event #" + i + " (" + (e.id || e.title) + "): " + problems.join(", "));
      } else {
        ok.push(e);
      }
    });
    ok.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return ok;
  }

  function endYearOf(e) {
    if (e.endYear === undefined || e.endYear === null) return null;
    return e.endYear === "present" ? LAST_YEAR : Number(e.endYear);
  }

  function formatDate(d) {
    var p = String(d).split("-");
    if (p.length === 3) return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
    if (p.length === 2) return MONTHS[Number(p[1]) - 1] + " " + p[0];
    return p[0];
  }

  function iconHTML(cat, cls) {
    var c = CAT[cat];
    return '<span class="ic ' + (cls || "") + '" style="background:' + c.color + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[cat] + "</svg></span>";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // ---------------------------------------------------------------- state
  var state = {
    year: FIRST_YEAR,
    active: {},          // category id -> boolean
    showOngoing: true,
    selectedId: null,
    playing: false,
    timer: null
  };
  CATEGORIES.forEach(function (c) { state.active[c.id] = true; });

  // ---------------------------------------------------------------- DOM
  var $ = function (id) { return document.getElementById(id); };
  var slider = $("yearSlider");
  slider.min = FIRST_YEAR;
  slider.max = LAST_YEAR;

  // ---------------------------------------------------------------- map
  var map = L.map("map", {
    center: WORLD_CENTER, zoom: WORLD_ZOOM, minZoom: window.innerWidth < 700 ? 1 : 2, maxZoom: 10,
    worldCopyJump: true, zoomSnap: 0.5,
    maxBounds: [[-85, -400], [85, 400]]
  });

  var simpleLayer = L.geoJSON(window.WORLD_GEOJSON || null, {
    style: { color: "#a9b4c0", weight: 0.8, fillColor: "#fbfaf6", fillOpacity: 1 },
    onEachFeature: function (f, layer) {
      if (f.properties && f.properties.name) layer.bindTooltip(f.properties.name, { sticky: true, direction: "top", opacity: 0.9 });
    }
  });
  simpleLayer.getAttribution = function () { return "Borders: <a href=\"https://www.naturalearthdata.com/\">Natural Earth</a>"; };

  // Labelled online basemap: Esri "World Light Gray Canvas" (base + labels), no API key needed.
  // (CARTO's free tiles started requiring an API key in September 2026.) To use another provider,
  // change the two URLs and the attribution below. If tiles fail to load, the app falls back to
  // the built-in offline map (data/world.js) automatically.
  var ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  var tileBase = L.tileLayer(ESRI + "World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxNativeZoom: 16, maxZoom: 19,
    attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community'
  });
  var tileLabels = L.tileLayer(ESRI + "World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    maxNativeZoom: 16, maxZoom: 19, pane: "overlayPane"
  });
  var tileLayer = L.layerGroup([tileBase, tileLabels]);

  var base = "tiles";
  var tileErrors = 0;
  tileBase.on("tileerror", function () {
    tileErrors++;
    if (tileErrors === 6 && base === "tiles") {
      console.info("History map: online map tiles unavailable, switching to the built-in offline map.");
      setBase("simple");
    }
  });

  function setBase(which) {
    base = which;
    if (which === "tiles") {
      map.removeLayer(simpleLayer);
      tileLayer.addTo(map);
      $("baseToggle").textContent = "Simple map";
      $("map").style.background = "#d4dadc";
    } else {
      map.removeLayer(tileLayer);
      simpleLayer.addTo(map);
      $("baseToggle").textContent = "Labelled map";
      $("map").style.background = "#dcebf5";
    }
  }
  var startBase = /[?&]map=simple/.test(location.search) ? "simple" : "tiles";
  setBase(startBase);

  var markerLayer = L.layerGroup().addTo(map);
  var markersById = {};

  // ---------------------------------------------------------------- rendering
  function visibleEvents(year) {
    var current = [], ongoing = [];
    events.forEach(function (e) {
      if (!state.active[e.category]) return;
      if (e.year === year) current.push(e);
      else if (state.showOngoing) {
        var end = endYearOf(e);
        if (end !== null && e.year < year && year <= end) ongoing.push(e);
      }
    });
    return { current: current, ongoing: ongoing };
  }

  // Spread markers that sit on (nearly) the same spot, using pixel offsets.
  function offsets(list) {
    var groups = {}, out = {};
    list.forEach(function (e) {
      var key = Math.round(e.lat * 2) / 2 + "," + Math.round(e.lng * 2) / 2;
      (groups[key] = groups[key] || []).push(e);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      g.forEach(function (e, i) {
        if (g.length === 1) { out[e.id] = [0, 0]; return; }
        var ang = (2 * Math.PI * i) / g.length - Math.PI / 2;
        var r = 16 + 2 * g.length;
        out[e.id] = [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)];
      });
    });
    return out;
  }

  function makeMarker(e, isOngoing, off, animate) {
    var size = isOngoing ? 28 : 36;
    var html = '<div class="mk ' + (isOngoing ? "ongoing " : "") + (animate ? "mk-appear" : "") +
      '" style="background:' + CAT[e.category].color + '" data-id="' + esc(e.id) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[e.category] + "</svg></div>" +
      (isOngoing && !off[0] && !off[1] ? '<span class="mk-since">since ' + e.year + "</span>" : "");
    var icon = L.divIcon({
      className: "mk-wrap", html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2 - off[0], size / 2 - off[1]]
    });
    var m = L.marker([e.lat, e.lng], {
      icon: icon, riseOnHover: true, zIndexOffset: isOngoing ? -500 : 0,
      keyboard: true, title: e.title, alt: e.title
    });
    m.bindTooltip((isOngoing ? "Ongoing: " + (e.ongoingLabel || e.title) + " (since " + e.year + ")" : e.title), {
      direction: "top", offset: [off[0], off[1] - size / 2], className: "mk-tip"
    });
    m.on("click", function () { select(e.id, false); });
    return m;
  }

  function render(animate) {
    var y = state.year;
    var vis = visibleEvents(y);
    markerLayer.clearLayers();
    markersById = {};
    var off = offsets(vis.current.concat(vis.ongoing));
    vis.ongoing.forEach(function (e) {
      var m = makeMarker(e, true, off[e.id], false);
      markerLayer.addLayer(m); markersById[e.id] = m;
    });
    vis.current.forEach(function (e) {
      var m = makeMarker(e, false, off[e.id], animate);
      markerLayer.addLayer(m); markersById[e.id] = m;
    });

    // Header
    $("yearLabel").textContent = y;
    $("yearNote").textContent = y === LAST_YEAR ? PARTIAL_YEAR_NOTE : "";
    $("panelYear").textContent = y + (y === LAST_YEAR ? " (" + PARTIAL_YEAR_NOTE + ")" : "");
    slider.value = y;
    $("prevYear").disabled = y <= FIRST_YEAR;
    $("nextYear").disabled = y >= LAST_YEAR;
    var total = events.filter(function (e) { return e.year === y; }).length;
    $("panelCount").textContent = vis.current.length === total ?
      total + " event" + (total === 1 ? "" : "s") :
      vis.current.length + " of " + total + " events shown";

    renderLegend(y);
    renderList(vis);

    if (state.selectedId && !markersById[state.selectedId]) closeCard();
    else if (state.selectedId) highlight(state.selectedId);

    if (location.hash !== "#" + y) history.replaceState(null, "", "#" + y);
  }

  function renderLegend(y) {
    var counts = {};
    events.forEach(function (e) { if (e.year === y) counts[e.category] = (counts[e.category] || 0) + 1; });
    var el = $("legend");
    el.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = state.active[c.id] ? "" : "off";
      b.setAttribute("aria-pressed", state.active[c.id] ? "true" : "false");
      b.dataset.cat = c.id;
      b.title = (state.active[c.id] ? "Hide " : "Show ") + c.label.toLowerCase();
      b.innerHTML = iconHTML(c.id) + "<span>" + esc(c.label) + '</span> <span class="cnt">' + (counts[c.id] || 0) + "</span>";
      b.addEventListener("click", function () {
        state.active[c.id] = !state.active[c.id];
        render(false);
      });
      el.appendChild(b);
    });
  }

  function listItem(e, isOngoing) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.id = e.id;
    var meta = isOngoing ? "Ongoing since " + e.year + " · " + e.country : formatDate(e.date) + " · " + e.country;
    b.innerHTML = iconHTML(e.category) + '<span><span class="t">' + esc(isOngoing ? (e.ongoingLabel || e.title) : e.title) +
      '</span><span class="m">' + esc(meta) + "</span></span>";
    b.addEventListener("click", function () { select(e.id, true); });
    li.appendChild(b);
    return li;
  }

  function renderList(vis) {
    var ol = $("eventList");
    ol.innerHTML = "";
    if (!vis.current.length) {
      var li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No events match the selected categories for this year.";
      ol.appendChild(li);
    }
    vis.current.forEach(function (e) { ol.appendChild(listItem(e, false)); });
    var ob = $("ongoingBlock");
    ob.innerHTML = "";
    if (vis.ongoing.length) {
      var h = document.createElement("h3");
      h.textContent = "Ongoing conflicts from earlier years";
      ob.appendChild(h);
      var ol2 = document.createElement("ol");
      ol2.className = "event-list";
      vis.ongoing.forEach(function (e) { ol2.appendChild(listItem(e, true)); });
      ob.appendChild(ol2);
    }
  }

  // ---------------------------------------------------------------- selection / card
  function findEvent(id) {
    for (var i = 0; i < events.length; i++) if (events[i].id === id) return events[i];
    return null;
  }

  function highlight(id) {
    document.querySelectorAll(".mk.active").forEach(function (n) { n.classList.remove("active"); });
    document.querySelectorAll(".event-list button.active").forEach(function (n) { n.classList.remove("active"); });
    var m = markersById[id];
    if (m && m.getElement()) {
      var mk = m.getElement().querySelector(".mk");
      if (mk) mk.classList.add("active");
      m.setZIndexOffset(1000);
    }
    document.querySelectorAll('.event-list button[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]').forEach(function (n) {
      n.classList.add("active");
    });
  }

  function select(id, fly) {
    var e = findEvent(id);
    if (!e) return;
    state.selectedId = id;
    var c = CAT[e.category];
    var card = $("eventCard");
    card.style.borderTopColor = c.color;
    $("cardCat").innerHTML = iconHTML(e.category) + '<span style="color:' + c.color + '">' + esc(c.label) + "</span>";
    $("cardTitle").textContent = e.title;
    $("cardDate").textContent = formatDate(e.date);
    $("cardPlace").textContent = e.place + (e.place.indexOf(e.country) === -1 ? ", " + e.country : "");
    var end = endYearOf(e);
    var og = $("cardOngoing");
    if (end !== null) {
      og.textContent = (e.ongoingLabel || "This conflict") + ": " + e.year + "–" +
        (e.endYear === "present" ? "still ongoing in " + LAST_YEAR : e.endYear) +
        (state.year !== e.year ? ". You are viewing " + state.year + "; this began in " + e.year + "." : "");
      og.classList.remove("hidden");
    } else {
      og.classList.add("hidden");
    }
    $("cardSummary").textContent = e.summary;
    var src = $("cardSource");
    src.href = e.source;
    src.textContent = "Read more: " + (e.sourceName || new URL(e.source).hostname);
    card.classList.remove("hidden");
    highlight(id);
    if (fly) {
      var z = Math.max(map.getZoom(), 4);
      map.flyTo([e.lat, e.lng], z, { duration: 0.8 });
    }
  }

  function closeCard() {
    state.selectedId = null;
    $("eventCard").classList.add("hidden");
    document.querySelectorAll(".mk.active").forEach(function (n) { n.classList.remove("active"); });
    document.querySelectorAll(".event-list button.active").forEach(function (n) { n.classList.remove("active"); });
  }

  // ---------------------------------------------------------------- year changes & play
  function setYear(y, animate) {
    y = Math.max(FIRST_YEAR, Math.min(LAST_YEAR, Number(y)));
    if (y === state.year && !animate) return;
    state.year = y;
    if (state.selectedId) {
      var e = findEvent(state.selectedId);
      var end = e ? endYearOf(e) : null;
      var stillVisible = e && (e.year === y || (state.showOngoing && end !== null && e.year < y && y <= end));
      if (!stillVisible) closeCard();
    }
    render(animate !== false);
  }

  function play() {
    if (state.playing) return stop();
    state.playing = true;
    $("playBtn").classList.add("playing");
    $("playIcon").innerHTML = "&#10074;&#10074;";
    $("playText").textContent = "Pause";
    $("playBtn").setAttribute("aria-label", "Pause");
    closeCard();
    if (state.year >= LAST_YEAR) setYear(FIRST_YEAR, true);
    schedule();
  }
  function schedule() {
    clearTimeout(state.timer);
    state.timer = setTimeout(function () {
      if (!state.playing) return;
      if (state.year >= LAST_YEAR) { stop(); return; }
      setYear(state.year + 1, true);
      schedule();
    }, Number($("speedSelect").value));
  }
  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    $("playBtn").classList.remove("playing");
    $("playIcon").innerHTML = "&#9654;";
    $("playText").textContent = "Play";
    $("playBtn").setAttribute("aria-label", "Play through the years");
  }

  // ---------------------------------------------------------------- ticks
  (function buildTicks() {
    var t = $("ticks");
    for (var y = FIRST_YEAR; y <= LAST_YEAR; y++) {
      var s = document.createElement("span");
      var pct = (y - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR) * 100;
      s.style.left = pct + "%";
      var major = y === FIRST_YEAR || y === LAST_YEAR ||
        (y % 5 === 0 && LAST_YEAR - y >= 3 && y - FIRST_YEAR >= 3);
      s.className = major ? "major" : "dotted";
      s.textContent = major ? y : "";
      s.title = String(y);
      (function (yy) { s.addEventListener("click", function () { stop(); setYear(yy, true); }); })(y);
      t.appendChild(s);
    }
  })();

  // ---------------------------------------------------------------- events
  slider.addEventListener("input", function () { stop(); setYear(slider.value, true); });
  $("prevYear").addEventListener("click", function () { stop(); setYear(state.year - 1, true); });
  $("nextYear").addEventListener("click", function () { stop(); setYear(state.year + 1, true); });
  $("playBtn").addEventListener("click", play);
  $("speedSelect").addEventListener("change", function () { if (state.playing) schedule(); });
  $("cardClose").addEventListener("click", closeCard);
  $("ongoingToggle").addEventListener("change", function (ev) { state.showOngoing = ev.target.checked; render(false); });
  $("allCats").addEventListener("click", function () { CATEGORIES.forEach(function (c) { state.active[c.id] = true; }); render(false); });
  $("milPolCats").addEventListener("click", function () { CATEGORIES.forEach(function (c) { state.active[c.id] = c.core; }); render(false); });
  $("resetView").addEventListener("click", function () { map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.6 }); });
  $("baseToggle").addEventListener("click", function () { setBase(base === "tiles" ? "simple" : "tiles"); });
  map.on("click", closeCard);

  document.addEventListener("keydown", function (ev) {
    var tag = (ev.target && ev.target.tagName) || "";
    if (tag === "SELECT" || tag === "TEXTAREA" || (tag === "INPUT" && ev.target.type !== "checkbox")) {
      if (ev.target === slider && ev.key === " ") { ev.preventDefault(); play(); }
      return; // the slider handles its own arrow keys
    }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); stop(); setYear(state.year - 1, true); }
    else if (ev.key === "ArrowRight") { ev.preventDefault(); stop(); setYear(state.year + 1, true); }
    else if (ev.key === "Home") { ev.preventDefault(); stop(); setYear(FIRST_YEAR, true); }
    else if (ev.key === "End") { ev.preventDefault(); stop(); setYear(LAST_YEAR, true); }
    else if (ev.key === " " && tag !== "BUTTON" && tag !== "A") { ev.preventDefault(); play(); }
    else if (ev.key === "Escape") { closeCard(); }
  });

  window.addEventListener("hashchange", function () {
    var y = parseInt(location.hash.slice(1), 10);
    if (y >= FIRST_YEAR && y <= LAST_YEAR && y !== state.year) setYear(y, true);
  });

  // ---------------------------------------------------------------- start
  var startYear = parseInt(location.hash.slice(1), 10);
  state.year = startYear >= FIRST_YEAR && startYear <= LAST_YEAR ? startYear : FIRST_YEAR;
  render(true);

  // Small hook for automated tests and the browser console.
  window.HistoryMap = {
    setYear: function (y) { stop(); setYear(y, true); },
    select: function (id) { select(id, true); },
    state: state,
    events: events,
    markerCount: function () { return Object.keys(markersById).length; }
  };
})();
