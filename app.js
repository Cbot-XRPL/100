/******************************************************************
 * CONFIG
 ******************************************************************/
const TOKEN_NAME = "100";
const TOTAL_SUPPLY = 100;

// If you find a real holders JSON endpoint that supports CORS, put it here.
// Expected shape: { holders: [ { address: "r..", balance: 12.34 }, ... ] }
const HOLDERS_ENDPOINT = ""; // <- set this when ready

/******************************************************************
 * FUN: Emoji field generation
 ******************************************************************/
const emojiField = document.getElementById("emojiField");
const EMOJI_COUNT = 42;

function rand(min, max){ return Math.random() * (max - min) + min; }

function spawnEmoji(){
  const el = document.createElement("div");
  el.className = "emoji";
  el.textContent = "💯";
  el.style.left = rand(0, 100) + "vw";
  el.style.top = rand(30, 120) + "vh";
  el.style.fontSize = rand(14, 28) + "px";
  el.style.animationDuration = rand(10, 26) + "s";
  el.style.animationDelay = (-rand(0, 18)) + "s";
  el.style.opacity = rand(0.06, 0.16);
  emojiField.appendChild(el);
}
for (let i=0;i<EMOJI_COUNT;i++) spawnEmoji();

// Accent hue shifts on hover anywhere (subtle, fun)
const ACCENTS = ["#ff2d2d", "#ffd54a", "#3aa0ff", "#43ff9a", "#c26bff"];
let accentIndex = 0;

document.addEventListener("mouseover", (e) => {
  const t = e.target;
  if (!t) return;

  if (t.classList && (
    t.classList.contains("hoverable") ||
    t.classList.contains("emojiBig") ||
    t.classList.contains("btn") ||
    t.classList.contains("chip")
  )){
    accentIndex = (accentIndex + 1) % ACCENTS.length;
    document.documentElement.style.setProperty("--accent", ACCENTS[accentIndex]);
  }
});

/******************************************************************
 * Rich list logic + badging
 ******************************************************************/
const rowsEl = document.getElementById("rows");
const searchEl = document.getElementById("search");
const dataStatusEl = document.getElementById("dataStatus");
const lastUpdateEl = document.getElementById("lastUpdate");
const onePercentCountEl = document.getElementById("onePercentCount");
const topHolderPctEl = document.getElementById("topHolderPct");
const refreshBtn = document.getElementById("refreshBtn");
const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));

let activeFilter = "all";
let allHolders = [];

function shortAddr(a){
  if (!a) return "";
  if (a.length <= 14) return a;
  return a.slice(0, 6) + "…" + a.slice(-6);
}

function fmt(n){
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return isInt ? String(Math.round(n)) : n.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
}

function pctOfSupply(balance){
  return (balance / TOTAL_SUPPLY) * 100;
}

function makeBadge(label, klass, icon){
  const span = document.createElement("span");
  span.className = "badge " + (klass || "");
  span.textContent = (icon ? (icon + " ") : "") + label;
  return span;
}

function badgesFor(holder){
  const b = [];
  if (holder.rank === 1) b.push(makeBadge("Top Holder", "gold", "🥇"));
  if (holder.rank === 2) b.push(makeBadge("Runner Up", "silver", "🥈"));
  if (holder.rank === 3) b.push(makeBadge("Third Place", "bronze", "🥉"));
  if (holder.isLast) b.push(makeBadge("#100 Holder", "red", "❤️"));
  if (holder.balance >= 1) b.push(makeBadge("1% Club", "club", "🟢"));
  if (holder.balance > 0) b.push(makeBadge("DEX Culture", "education", "🔵"));
  return b;
}

function applyRowGlow(tr, holder){
  tr.classList.remove("rowGlowTop1","rowGlowTop2","rowGlowTop3","rowGlowLast");
  if (holder.rank === 1) tr.classList.add("rowGlowTop1");
  if (holder.rank === 2) tr.classList.add("rowGlowTop2");
  if (holder.rank === 3) tr.classList.add("rowGlowTop3");
  if (holder.isLast) tr.classList.add("rowGlowLast");
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1200);
}

function setStatus(ok, msg){
  dataStatusEl.textContent = msg;
  dataStatusEl.style.color = ok ? "rgba(255,255,255,.75)" : "rgba(255,213,74,.85)";
}

function computeStats(holders){
  const clubCount = holders.filter(h => h.balance >= 1).length;
  onePercentCountEl.textContent = clubCount;

  if (holders.length){
    const topPct = pctOfSupply(holders[0].balance);
    topHolderPctEl.textContent = topPct.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  } else {
    topHolderPctEl.textContent = "—";
  }

  const now = new Date();
  lastUpdateEl.textContent = now.toLocaleString();
}

function normalizeHolders(list){
  const sorted = [...list].sort((a,b) => (b.balance - a.balance));
  return sorted.map((h, idx) => {
    const balance = Number(h.balance) || 0;
    return {
      address: h.address,
      balance,
      rank: idx + 1,
      pct: pctOfSupply(balance),
      isLast: false
    };
  });
}

function filterHolders(list, q, filter){
  let out = list;

  if (q){
    const s = q.trim().toLowerCase();
    out = out.filter(h => h.address.toLowerCase().includes(s));
  }

  if (filter === "club"){
    out = out.filter(h => h.balance >= 1);
  } else if (filter === "top3"){
    out = out.filter(h => h.rank <= 3);
  } else if (filter === "last"){
    const last = list[list.length - 1];
    out = last ? [last] : [];
  }

  return out;
}

function renderTable(){
  const q = searchEl.value || "";
  const displayList = filterHolders(allHolders, q, activeFilter);

  const lastRank = allHolders.length;
  const lastAddress = allHolders[lastRank - 1]?.address;
  const lastSet = new Set(lastAddress ? [lastAddress] : []);

  rowsEl.innerHTML = "";

  displayList.forEach(h => {
    const holder = { ...h, isLast: lastSet.has(h.address) };

    const tr = document.createElement("tr");
    applyRowGlow(tr, holder);

    const tdRank = document.createElement("td");
    tdRank.innerHTML = `<span class="rank">#${holder.rank}</span>`;
    tr.appendChild(tdRank);

    const tdAddr = document.createElement("td");
    const addrWrap = document.createElement("div");
    addrWrap.className = "addr";

    const code = document.createElement("code");
    code.title = holder.address;
    code.textContent = shortAddr(holder.address);

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy";
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(holder.address);
        showToast("Copied address");
      }catch(e){
        showToast("Copy blocked");
      }
    });

    addrWrap.appendChild(code);
    addrWrap.appendChild(copyBtn);
    tdAddr.appendChild(addrWrap);
    tr.appendChild(tdAddr);

    const tdBal = document.createElement("td");
    tdBal.innerHTML = `<span class="bal">${fmt(holder.balance)}</span>`;
    tr.appendChild(tdBal);

    const tdPct = document.createElement("td");
    tdPct.innerHTML = `<span class="pct">${holder.pct.toFixed(2)}%</span>`;
    tr.appendChild(tdPct);

    const tdBadges = document.createElement("td");
    const br = document.createElement("div");
    br.className = "badgeRow";
    badgesFor(holder).forEach(b => br.appendChild(b));
    tdBadges.appendChild(br);
    tr.appendChild(tdBadges);

    rowsEl.appendChild(tr);
  });

  if (!displayList.length){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.style.color = "rgba(255,255,255,.70)";
    td.style.padding = "16px 8px";
    td.textContent = "No matches.";
    tr.appendChild(td);
    rowsEl.appendChild(tr);
  }
}

/******************************************************************
 * Data fetching
 ******************************************************************/
function mockHolders(){
  return [
    { address: "rOnyx111111111111111111111111111111", balance: 12.34 },
    { address: "rOnyx222222222222222222222222222222", balance: 8.00 },
    { address: "rOnyx333333333333333333333333333333", balance: 6.50 },
    { address: "rOnyx444444444444444444444444444444", balance: 5.00 },
    { address: "rOnyx555555555555555555555555555555", balance: 3.25 },
    { address: "rOnyx666666666666666666666666666666", balance: 2.10 },
    { address: "rOnyx777777777777777777777777777777", balance: 1.00 },
    { address: "rOnyx888888888888888888888888888888", balance: 0.75 },
    { address: "rOnyx999999999999999999999999999999", balance: 0.50 },
    { address: "rOnyxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", balance: 0.01 }
  ];
}

async function loadHolders(){
  setStatus(true, "loading…");
  rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">Loading rich list…</td></tr>`;

  try{
    if (!HOLDERS_ENDPOINT){
      throw new Error("No endpoint set (using mock data).");
    }
    const r = await fetch(HOLDERS_ENDPOINT, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const json = await r.json();
    if (!json || !Array.isArray(json.holders)) throw new Error("Unexpected JSON shape.");

    allHolders = normalizeHolders(json.holders);
    setStatus(true, "live data");
  }catch(err){
    allHolders = normalizeHolders(mockHolders());
    setStatus(false, "mock data (set endpoint for live)");
  }

  if (allHolders.length){
    allHolders[allHolders.length - 1].isLast = true;
  }

  computeStats(allHolders);
  renderTable();
}

/******************************************************************
 * UI events
 ******************************************************************/
searchEl.addEventListener("input", () => renderTable());

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    renderTable();
  });
});

refreshBtn.addEventListener("click", () => loadHolders());

// start
loadHolders();
