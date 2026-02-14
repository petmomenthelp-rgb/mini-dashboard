// Mini Dashboard – bewusst ohne Frameworks, damit GitHub-Lernen im Fokus bleibt.

const CATEGORIES = [
  { key: "betreuung", label: "Betreuungsangebote" },
  { key: "haushalt", label: "Entlastung im Alltag" },
  { key: "verhinderung", label: "Verhinderungspflege" },
  { key: "zusatz", label: "Zusatzleistungen" },
];

const SERVICES = [
  "Begleitung bei Spaziergängen",
  "Begleitung zu Einkäufen",
  "Reinigung des Lebensbereiches",
  "Wechsel der Bettwäsche",
  "Einkaufsplanung & Einkauf",
  "Wäsche sortieren/waschen/glätten",
  "Gartenarbeiten (leicht)",
  "Leichte Hausmeistertätigkeiten",
];

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateYearData() {
  // year[monthIndex] = { visits, minutesByCategory }
  return Array.from({ length: 12 }, () => {
    const visits = rand(2, 10);
    const minutesByCategory = Object.fromEntries(CATEGORIES.map(c => [c.key, rand(30, 240)]));
    // mehr Einsätze => tendenziell mehr Minuten
    Object.keys(minutesByCategory).forEach(k => minutesByCategory[k] *= rand(1, 3));
    return { visits, minutesByCategory };
  });
}

function minutesToHours(min) {
  return Math.round((min / 60) * 10) / 10;
}

function sumMinutes(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

function getMonthTotals(yearData, monthIndex) {
  const m = yearData[monthIndex];
  const monthMinutes = sumMinutes(m.minutesByCategory);
  return {
    visits: m.visits,
    hours: minutesToHours(monthMinutes),
    minutesByCategory: m.minutesByCategory,
  };
}

function getYearTotals(yearData) {
  let visits = 0;
  let minutes = 0;
  yearData.forEach(m => {
    visits += m.visits;
    minutes += sumMinutes(m.minutesByCategory);
  });
  return { visits, hours: minutesToHours(minutes) };
}

// Simple drawing helpers
function drawDonut(canvas, series) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.32;
  const cy = h * 0.52;
  const rOuter = Math.min(w, h) * 0.32;
  const rInner = rOuter * 0.62;

  const total = series.reduce((a, s) => a + s.value, 0) || 1;
  let angle = -Math.PI / 2;

  series.forEach((s) => {
    const slice = (s.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.fillStyle = s.color;
    ctx.arc(cx, cy, rOuter, angle, angle + slice);
    ctx.closePath();
    ctx.fill();

    angle += slice;
  });

  // hole
  ctx.beginPath();
  ctx.fillStyle = "#0b1220";
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fill();

  // center text
  ctx.fillStyle = "rgba(234,240,255,.92)";
  ctx.font = "bold 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Monat", cx, cy - 4);
  ctx.font = "12px system-ui";
  ctx.fillStyle = "rgba(169,182,214,.92)";
  ctx.fillText("Verteilung", cx, cy + 16);
}

function drawBars(canvas, monthlyHours) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = 28;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  const maxVal = Math.max(...monthlyHours, 1);
  const barW = chartW / monthlyHours.length - 10;

  // axes line
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  monthlyHours.forEach((val, i) => {
    const x = pad + i * (barW + 10) + 6;
    const barH = (val / maxVal) * (chartH - 18);
    const y = h - pad - barH;

    // bar
    ctx.fillStyle = "rgba(106,169,255,.55)";
    ctx.fillRect(x, y, barW, barH);

    // label
    ctx.fillStyle = "rgba(169,182,214,.9)";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(MONTHS[i], x + barW / 2, h - pad + 14);
  });
}

function colorPalette(n) {
  const base = [
    "rgba(106,169,255,.75)",
    "rgba(128,255,212,.65)",
    "rgba(255,204,102,.65)",
    "rgba(255,140,140,.65)",
  ];
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

// DOM init
const els = {
  kpiMonthHours: document.getElementById("kpiMonthHours"),
  kpiYearHours: document.getElementById("kpiYearHours"),
  kpiMonthVisits: document.getElementById("kpiMonthVisits"),
  monthSelect: document.getElementById("monthSelect"),
  donut: document.getElementById("donut"),
  bars: document.getElementById("bars"),
  legend: document.getElementById("legend"),
  chips: document.getElementById("chips"),
  randomize: document.getElementById("randomize"),
};

let yearData = generateYearData();
let currentMonth = new Date().getMonth();

function renderServices() {
  els.chips.innerHTML = SERVICES.map(s => `<span class="chip">${s}</span>`).join("");
}

function renderMonthOptions() {
  els.monthSelect.innerHTML = MONTHS.map((m, i) => {
    const sel = i === currentMonth ? "selected" : "";
    return `<option value="${i}" ${sel}>${m}</option>`;
  }).join("");
}

function render() {
  const monthTotals = getMonthTotals(yearData, currentMonth);
  const yearTotals = getYearTotals(yearData);

  els.kpiMonthHours.textContent = `${monthTotals.hours} h`;
  els.kpiYearHours.textContent = `${yearTotals.hours} h`;
  els.kpiMonthVisits.textContent = `${monthTotals.visits}`;

  const colors = colorPalette(CATEGORIES.length);
  const series = CATEGORIES.map((c, i) => ({
    label: c.label,
    value: monthTotals.minutesByCategory[c.key],
    color: colors[i],
  }));

  drawDonut(els.donut, series);

  els.legend.innerHTML = series.map(s => `
    <div class="legend-item">
      <span class="dot" style="background:${s.color}"></span>
      <span>${s.label}: ${minutesToHours(s.value)} h</span>
    </div>
  `).join("");

  const monthlyHours = yearData.map(m => minutesToHours(sumMinutes(m.minutesByCategory)));
  drawBars(els.bars, monthlyHours);
}

els.monthSelect.addEventListener("change", (e) => {
  currentMonth = Number(e.target.value);
  render();
});

els.randomize.addEventListener("click", () => {
  yearData = generateYearData();
  render();
});

renderServices();
renderMonthOptions();
render();
