/******************************************************************
 * ONYX HUB - Multi-token (no backend)
 * - Rich list: account_lines (issuer) via WebSocket
 * - Live feed: subscribe stream via WebSocket
 * - BUY/SELL: computed from trustline deltas in transaction meta (RippleState)
 * - Price (XAH): computed from AccountRoot balance deltas in meta (drops -> XAH)
 *
 * Lightweight:
 * - No extra network calls
 * - Feed capped + only processes tx that touch your token
 ******************************************************************/

/* ===== DOM ===== */
const emojiField = document.getElementById("emojiField");
const loadBarWrap = document.getElementById("loadBarWrap");
const loadBar = document.getElementById("loadBar");
const loadBarText = document.getElementById("loadBarText");

const tokenSelect = document.getElementById("tokenSelect");
const brandEmoji = document.getElementById("brandEmoji");
const heroEmoji = document.getElementById("heroEmoji");
const heroName = document.getElementById("heroName");
const heroDesc = document.getElementById("heroDesc");
const brandSub = document.getElementById("brandSub");
const cardHint = document.getElementById("cardHint");
const pillRow = document.getElementById("pillRow");
const statSupply = document.getElementById("statSupply");
const statEmoji = document.getElementById("statEmoji");
const panelEmojiDecent = document.getElementById("panelEmojiDecent");
const panelEmojiFeed = document.getElementById("panelEmojiFeed");
const panelEmojiRich = document.getElementById("panelEmojiRich");
const whitepaperMeta = document.getElementById("whitepaperMeta");
const whitepaperSummary = document.getElementById("whitepaperSummary");
const btnWhitepaper = document.getElementById("btnWhitepaper");

const btnExplorer = document.getElementById("btnExplorer");
const btnTokenDetails = document.getElementById("btnTokenDetails");
const btnTrustline = document.getElementById("btnTrustline");
const btnTrade = document.getElementById("btnTrade");
const btnX = document.getElementById("btnX");
const footExplorer = document.getElementById("footExplorer");
const footX = document.getElementById("footX");

const rowsEl = document.getElementById("rows");
const searchEl = document.getElementById("search");
const dataStatusEl = document.getElementById("dataStatus");
const lastUpdateEl = document.getElementById("lastUpdate");
const onePercentCountEl = document.getElementById("onePercentCount");
const topHolderPctEl = document.getElementById("topHolderPct");
const refreshBtn = document.getElementById("refreshBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const loadAllBtn = document.getElementById("loadAllBtn");
const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));

const whaleRow = document.getElementById("whaleRow");
const whaleMeta = document.getElementById("whaleMeta");
const decentScoreEl = document.getElementById("decentScore");
const decentExplainEl = document.getElementById("decentExplain");
const decentBar = document.getElementById("decentBar");

const bucketList = document.getElementById("bucketList");
const supplyMeta = document.getElementById("supplyMeta");

const badgeCards = document.getElementById("badgeCards");
const badgeMeta = document.getElementById("badgeMeta");

const feedStatus = document.getElementById("feedStatus");
const feedList = document.getElementById("feedList");
const feedReconnect = document.getElementById("feedReconnect");

/* ===== FUN: emoji field ===== */
const EMOJI_COUNT = 42;
function rand(min, max){ return Math.random() * (max - min) + min; }
function spawnEmoji(){
  const el = document.createElement("div");
  el.className = "emoji";
  el.textContent = "\u{1F4AF}";
  el.style.left = rand(0, 100) + "vw";
  el.style.top = rand(30, 120) + "vh";
  el.style.fontSize = rand(14, 28) + "px";
  el.style.animationDuration = rand(10, 26) + "s";
  el.style.animationDelay = (-rand(0, 18)) + "s";
  el.style.opacity = rand(0.06, 0.16);
  emojiField.appendChild(el);
}
for (let i=0;i<EMOJI_COUNT;i++) spawnEmoji();

const ACCENTS = [ "#ffd54a",];
let accentIndex = 0;
document.addEventListener("mouseover", (e) => {
  const t = e.target;
  if (!t?.classList) return;
  if (t.classList.contains("hoverable") || t.classList.contains("emojiBig") || t.classList.contains("btn") || t.classList.contains("chip")) {
    accentIndex = (accentIndex + 1) % ACCENTS.length;
    document.documentElement.style.setProperty("--accent", ACCENTS[accentIndex]);
  }
});

/* ===== State ===== */
const TOKENS = Array.isArray(window.ONYX_TOKENS) ? window.ONYX_TOKENS : [];
let activeToken = TOKENS[0] || null;

let activeFilter = "all";
let allHolders = [];

// Feed WS state
let feedWS = null;
let feedEvents = []; // newest first

// Feed limits (keep mobile light)
const FEED_RENDER_LIMIT = 20;
const FEED_STORE_LIMIT = 60;
const DEFAULT_TABLE_RENDER_LIMIT = 100;
const DEFAULT_RICHLIST_CACHE_TTL_MS = 120000;
let showAllRows = false;

function getTableRenderLimit(){
  const n = Number(activeToken?.renderLimit);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_TABLE_RENDER_LIMIT;
}
function getRichlistCacheTtlMs(token){
  const sec = Number(token?.cacheTtlSec);
  return Number.isFinite(sec) && sec > 0 ? Math.floor(sec * 1000) : DEFAULT_RICHLIST_CACHE_TTL_MS;
}
function getRichlistCacheKey(token){
  const id = token?.id || `${token?.issuer || "issuer"}:${token?.symbol || "token"}`;
  return `onyx.richlist.${id}`;
}
function readRichlistCache(token){
  try{
    const raw = localStorage.getItem(getRichlistCacheKey(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.holders) || !Number.isFinite(parsed.ts)) return null;
    return parsed;
  }catch{
    return null;
  }
}
function writeRichlistCache(token, holders){
  try{
    localStorage.setItem(getRichlistCacheKey(token), JSON.stringify({
      ts: Date.now(),
      holders
    }));
  }catch{
    // ignore storage quota / privacy mode errors
  }
}
function clearRichlistCache(token){
  try{
    localStorage.removeItem(getRichlistCacheKey(token));
    return true;
  }catch{
    return false;
  }
}
function getExcludedAddressSet(token){
  const set = new Set();
  const list = Array.isArray(token?.excludedAddresses) ? token.excludedAddresses : [];
  for (const addr of list){
    const v = String(addr || "").trim();
    if (v) set.add(v);
  }
  if (token?.excludeIssuer && token?.issuer){
    set.add(String(token.issuer).trim());
  }
  return set;
}
function getTokenCurrency(token){
  return token?.currency || token?.symbol || "";
}
const DEFAULT_BADGE_RULES = [
  { id: "top1", title: "Top Holder", icon: "\u{1F947}", className: "gold", type: "rank", rank: 1, rule: "Rank #1 wallet" },
  { id: "top2", title: "Runner Up", icon: "\u{1F948}", className: "silver", type: "rank", rank: 2, rule: "Rank #2 wallet" },
  { id: "top3", title: "Third Place", icon: "\u{1F949}", className: "bronze", type: "rank", rank: 3, rule: "Rank #3 wallet" },
  { id: "last", title: "Last Holder", icon: "\u{2764}\u{FE0F}", className: "red", type: "last", rule: "Hold the last rank" },
  { id: "genesis", title: "Genesis Member", icon: "\u{1F7E2}", className: "club", type: "threshold", min: 1, rule: "Hold >= 1 {symbol}" },
  { id: "whale", title: "Whale", icon: "\u{1F40B}", className: "club", type: "threshold", min: 5, rule: "Hold >= 5" },
  { id: "council", title: "Council", icon: "\u{1F5A4}", className: "dark", type: "threshold", min: 10, rule: "Hold >= 10" },
  { id: "dex", title: "DEX Culture", icon: "\u{1F535}", className: "education", type: "any", rule: "Hold any amount (> 0)" },
  { id: "exact1", title: "Exact One", icon: "\u{1F3AF}", className: "club", type: "exact", value: 1, epsilon: 1e-9, rule: "Hold exactly 1.0000" },
];
function getBadgeRules(token){
  const list = Array.isArray(token?.badgeRules) && token.badgeRules.length
    ? token.badgeRules
    : DEFAULT_BADGE_RULES;
  return list.filter(Boolean);
}
function badgeRequiredQty(badge){
  const type = badge?.type || "threshold";
  if (type === "threshold") return Number(badge.min || 0);
  if (type === "exact") return Number(badge.value || 0);
  if (type === "any") return 0.000000001;
  return Number.POSITIVE_INFINITY; // rank/last/top aren't quantity-based
}
function sortBadgesByRequiredQty(rules){
  return [...rules].sort((a, b) => {
    const aType = a?.type || "threshold";
    const bType = b?.type || "threshold";

    const group = (t) => {
      if (t === "rank") return 0;       // Top Holder, Runner Up, Third Place
      if (t === "top") return 1;
      if (t === "threshold" || t === "exact" || t === "any") return 2; // quantity-based
      if (t === "last") return 3;       // near bottom
      return 4;
    };

    const ag = group(aType);
    const bg = group(bType);
    if (ag !== bg) return ag - bg;

    if (aType === "rank" && bType === "rank"){
      return (Number(a?.rank || 999) - Number(b?.rank || 999));
    }

    if (ag === 2){
      const aq = badgeRequiredQty(a);
      const bq = badgeRequiredQty(b);
      if (aq !== bq) return bq - aq; // high -> low for quantity badges
    }

    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}
function holderQualifiesBadge(holder, badge){
  const type = badge?.type || "threshold";
  if (type === "threshold"){
    return holder.balance >= Number(badge.min || 0);
  }
  if (type === "exact"){
    const value = Number.isFinite(Number(badge.value)) ? Number(badge.value) : 1;
    const epsilon = Number.isFinite(Number(badge.epsilon)) ? Number(badge.epsilon) : 1e-9;
    return Math.abs(holder.balance - value) < epsilon;
  }
  if (type === "rank"){
    return holder.rank === Math.floor(Number(badge.rank || 0));
  }
  if (type === "top"){
    return holder.rank <= Math.max(0, Math.floor(Number(badge.top || 0)));
  }
  if (type === "last"){
    return Boolean(holder.isLast);
  }
  if (type === "any"){
    return holder.balance > 0;
  }
  return false;
}
function badgeQualifyCount(holders, badge){
  const type = badge?.type || "threshold";
  if (type === "threshold"){
    const min = Number.isFinite(Number(badge.min)) ? Number(badge.min) : 0;
    return holders.filter((h) => h.balance >= min).length;
  }
  if (type === "exact"){
    const value = Number.isFinite(Number(badge.value)) ? Number(badge.value) : 1;
    const epsilon = Number.isFinite(Number(badge.epsilon)) ? Number(badge.epsilon) : 1e-9;
    return holders.filter((h) => Math.abs(h.balance - value) < epsilon).length;
  }
  if (type === "rank"){
    const rank = Math.max(1, Math.floor(Number(badge.rank) || 1));
    return holders.length >= rank ? 1 : 0;
  }
  if (type === "top"){
    const top = Math.max(0, Math.floor(Number(badge.top) || 0));
    return Math.min(top, holders.length);
  }
  if (type === "last"){
    return holders.length ? 1 : 0;
  }
  if (type === "any"){
    return holders.filter((h) => h.balance > 0).length;
  }
  return 0;
}
function badgeRuleText(rule){
  return String(rule || "").replace(/\{symbol\}/g, activeToken?.symbol || "TOKEN");
}
const emojiLogoCache = new Map();
function getNativeEmojiLogoUrl(emoji){
  const key = `native:${emoji}`;
  if (emojiLogoCache.has(key)) return emojiLogoCache.get(key);
  try{
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.clearRect(0, 0, size, size);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Render the exact platform emoji glyph shape.
    ctx.font = "900 192px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji'";
    ctx.fillText(String(emoji || ""), size / 2, size / 2 + 10);
    const url = canvas.toDataURL("image/png");
    emojiLogoCache.set(key, url);
    return url;
  }catch{
    return "";
  }
}
function getTokenLogoUrl(token){
  if (token?.logoUrl) return token.logoUrl;
  if (token?.useIssuerAvatar === false) return "";
  if (token?.issuer) return `https://cdn.bithomp.com/avatar/${encodeURIComponent(token.issuer)}`;
  return "";
}
function setTokenLogo(elm, token, fallbackText){
  if (!elm) return;
  const generatedEmojiLogo =
    token?.logoMode === "emoji-native" && token?.logo
      ? getNativeEmojiLogoUrl(token.logo)
      : "";
  const logoUrl = generatedEmojiLogo || getTokenLogoUrl(token);
  elm.style.filter = "";
  if (!logoUrl){
    elm.textContent = fallbackText;
    if (token?.logoFilter) elm.style.filter = token.logoFilter;
    return;
  }
  elm.innerHTML = "";
  const img = document.createElement("img");
  img.className = "tokenLogoImg";
  img.src = logoUrl;
  img.alt = `${token?.name || token?.symbol || "Token"} logo`;
  img.loading = "lazy";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.style.borderRadius = token?.logoRounded === false ? "0" : "50%";
  if (token?.logoFilter) img.style.filter = token.logoFilter;
  img.onerror = () => {
    elm.innerHTML = "";
    elm.textContent = fallbackText;
  };
  elm.appendChild(img);
}

/* ===== Utils ===== */
function shortAddr(a){
  if (!a) return "";
  if (a.length <= 14) return a;
  return a.slice(0, 6) + "…" + a.slice(-6);
}
function fmt(n){
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return isInt ? String(Math.round(n)) : n.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
}
function fmtPrice(n){
  // dynamic-ish but cheap: show up to 6 decimals, trim trailing zeros
  return Number(n).toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
}
function pctOfSupply(balance){
  return (balance / activeToken.totalSupply) * 100;
}
function buildAccountExplorerUrl(address){
  return `https://xahauexplorer.com/en/account/${encodeURIComponent(address || "")}`;
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
function setFeedStatus(ok, msg){
  feedStatus.textContent = msg;
  feedStatus.style.color = ok ? "rgba(255,255,255,.75)" : "rgba(255,213,74,.85)";
}
let loadBarTimer = null;
let loadBarProgress = 0;
let loadBarTarget = 0;
const LOAD_BAR_TARGET_MAX = 98;

function stopLoadBarTimer(){
  if (!loadBarTimer) return;
  clearInterval(loadBarTimer);
  loadBarTimer = null;
}

function setLoadBarTarget(nextTarget){
  const clamped = Math.max(0, Math.min(LOAD_BAR_TARGET_MAX, Number(nextTarget) || 0));
  loadBarTarget = Math.max(loadBarTarget, clamped);
}

function startLoadBarTimer(){
  stopLoadBarTimer();
  loadBarProgress = 0;
  loadBarTarget = 6;
  if (loadBar) loadBar.style.width = `${loadBarProgress}%`;
  loadBarTimer = setInterval(() => {
    // Move toward server-informed target, but never stop moving.
    if (loadBarProgress < loadBarTarget){
      loadBarProgress += Math.max(0.28, (loadBarTarget - loadBarProgress) * 0.05);
    } else {
      loadBarProgress += 0.12 + Math.random() * 0.07;
    }

    // Full cycle behavior: fill completely, then restart from empty.
    if (loadBarProgress >= 100){
      loadBarProgress = 0;
    }
    if (loadBar) loadBar.style.width = `${loadBarProgress}%`;
  }, 120);
}

function setRichListLoading(isLoading){
  if (!loadBarWrap) return;
  if (isLoading){
    loadBarWrap.classList.add("active");
    loadBarWrap.setAttribute("aria-hidden", "false");
    startLoadBarTimer();
    if (loadBarText){
      loadBarText.textContent = `Loading ${activeToken?.symbol || "token"} rich list...`;
    }
    return;
  }

  stopLoadBarTimer();
  loadBarTarget = 100;
  if (loadBar) loadBar.style.width = "100%";
  if (loadBarText) loadBarText.textContent = "Rich list loaded";

  setTimeout(() => {
    loadBarWrap.classList.remove("active");
    loadBarWrap.setAttribute("aria-hidden", "true");
    if (loadBar) loadBar.style.width = "0%";
    if (loadBarText) loadBarText.textContent = "Loading rich list...";
  }, 280);
}
function el(tag, cls, text){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* ===== Holder Badges (richlist row) ===== */
function makeBadge(label, klass, icon){
  const span = document.createElement("span");
  span.className = "badge " + (klass || "");
  span.textContent = (icon ? (icon + " ") : "") + label;
  return span;
}
function badgesFor(holder){
  const b = [];
  const rules = sortBadgesByRequiredQty(
    getBadgeRules(activeToken).filter((r) => r.row !== false)
  );
  for (const rule of rules){
    if (!holderQualifiesBadge(holder, rule)) continue;
    b.push(makeBadge(rule.rowLabel || rule.title || "Badge", rule.className || "", rule.icon || ""));
  }
  return b;
}
function applyRowGlow(tr, holder){
  tr.classList.remove("rowGlowTop1","rowGlowTop2","rowGlowTop3","rowGlowLast");
  if (holder.rank === 1) tr.classList.add("rowGlowTop1");
  if (holder.rank === 2) tr.classList.add("rowGlowTop2");
  if (holder.rank === 3) tr.classList.add("rowGlowTop3");
  if (holder.isLast) tr.classList.add("rowGlowLast");
}

/* ===== Richlist rendering ===== */
function normalizeHolders(list){
  const sorted = [...list].sort((a,b) => b.balance - a.balance);
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
  const tableRenderLimit = getTableRenderLimit();
  const filteredList = filterHolders(allHolders, q, activeFilter);
  const displayList = showAllRows ? filteredList : filteredList.slice(0, tableRenderLimit);

  const lastAddress = allHolders[allHolders.length - 1]?.address;
  const lastSet = new Set(lastAddress ? [lastAddress] : []);

  rowsEl.innerHTML = "";

  displayList.forEach(h => {
    const holder = { ...h, isLast: lastSet.has(h.address) };
    const tr = document.createElement("tr");
    applyRowGlow(tr, holder);

    const tdRank = el("td");
    tdRank.innerHTML = `<span class="rank">#${holder.rank}</span>`;
    tr.appendChild(tdRank);

    const tdAddr = el("td");
    const addrWrap = el("div","addr");
    const code = el("code", null, holder.address);
    code.title = holder.address;

    const copyBtn = document.createElement("a");
    copyBtn.className = "copy";
    copyBtn.textContent = "Explorer";
    copyBtn.href = buildAccountExplorerUrl(holder.address);
    copyBtn.target = "_blank";
    copyBtn.rel = "noreferrer";

    addrWrap.appendChild(code);
    addrWrap.appendChild(copyBtn);
    tdAddr.appendChild(addrWrap);
    tr.appendChild(tdAddr);

    const tdBal = el("td");
    tdBal.innerHTML = `<span class="bal">${fmt(holder.balance)}</span>`;
    tr.appendChild(tdBal);

    const tdPct = el("td");
    tdPct.innerHTML = `<span class="pct">${holder.pct.toFixed(2)}%</span>`;
    tr.appendChild(tdPct);

    const tdBadges = el("td");
    const br = el("div","badgeRow");
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
  } else if (!showAllRows && filteredList.length > tableRenderLimit){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.style.color = "rgba(255,255,255,.70)";
    td.style.padding = "16px 8px";
    td.textContent = `Showing first ${tableRenderLimit} of ${filteredList.length} holders. Click Load All to render everything.`;
    tr.appendChild(td);
    rowsEl.appendChild(tr);
  }

  if (loadAllBtn){
    if (showAllRows){
      loadAllBtn.textContent = `Show Top ${tableRenderLimit}`;
      loadAllBtn.disabled = false;
    } else if (filteredList.length > tableRenderLimit){
      loadAllBtn.textContent = `Load All (${filteredList.length})`;
      loadAllBtn.disabled = false;
    } else {
      loadAllBtn.textContent = "All Loaded";
      loadAllBtn.disabled = true;
    }
  }
}

/* ===== Stats + Experiment panels ===== */
function computeTopN(holders, n){
  const top = holders.slice(0, n);
  const sum = top.reduce((acc, h) => acc + h.balance, 0);
  return pctOfSupply(sum);
}
function computeStats(){
  const holders = allHolders;

  const clubCount = holders.filter(h => h.balance >= 1).length;
  onePercentCountEl.textContent = clubCount;

  if (holders.length){
    topHolderPctEl.textContent = pctOfSupply(holders[0].balance).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  } else {
    topHolderPctEl.textContent = "-";
  }

  lastUpdateEl.textContent = new Date().toLocaleString();

  // Whale dominance
  whaleRow.innerHTML = "";
  const ns = (activeToken.whaleTopN || [1,3,5,10]).filter(x => x > 0);
  for (const n of ns){
    const m = el("div","metric");
    m.appendChild(el("div","k",`Top ${n}`));
    const v = el("div","v", holders.length ? `${computeTopN(holders, n).toFixed(2)}%` : "-");
    m.appendChild(v);
    whaleRow.appendChild(m);
  }
  whaleMeta.textContent = holders.length ? `${holders.length} holders` : "-";

  // Decentralization score (simple Onyx metric)
  const top3 = holders.length ? computeTopN(holders, 3) : 0;
  const top10 = holders.length ? computeTopN(holders, 10) : 0;
  let score = 100 - (top3 + (top10/2));
  score = Math.max(0, Math.min(100, score));

  decentScoreEl.textContent = holders.length ? String(Math.round(score)) : "-";
  decentExplainEl.textContent = holders.length ? `Top3 ${top3.toFixed(1)}% | Top10 ${top10.toFixed(1)}%` : "-";
  decentBar.style.width = holders.length ? `${score}%` : "0%";

  // Supply buckets
  const buckets = [
    { name: "10+ tokens", min: 10, max: Infinity },
    { name: "5-9.99", min: 5, max: 9.999999 },
    { name: "1-4.99", min: 1, max: 4.999999 },
    { name: "0.1-0.99", min: 0.1, max: 0.999999 },
    { name: "< 0.1", min: 0.000000001, max: 0.099999 },
  ];

  const totals = buckets.map(b => {
    const sum = holders.reduce((acc, h) => (h.balance >= b.min && h.balance <= b.max) ? acc + h.balance : acc, 0);
    return { ...b, sum };
  });

  const circulating = holders.reduce((acc, h) => acc + h.balance, 0);
  supplyMeta.textContent = holders.length ? `${fmt(circulating)} / ${fmt(activeToken.totalSupply)} circulating` : "-";

  bucketList.innerHTML = "";
  for (const b of totals){
    const pct = activeToken.totalSupply ? (b.sum / activeToken.totalSupply) * 100 : 0;
    const card = el("div","bucket");
    const top = el("div","bucketTop");
    top.appendChild(el("div","bucketName", b.name));
    top.appendChild(el("div","bucketVal", `${fmt(b.sum)} (${pct.toFixed(1)}%)`));
    card.appendChild(top);

    const barWrap = el("div","bucketBarWrap");
    const bar = el("div","bucketBar");
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    barWrap.appendChild(bar);
    card.appendChild(barWrap);

    bucketList.appendChild(card);
  }

  renderBadgeCards(holders);
}

function renderBadgeCards(holders){
  const rules = sortBadgesByRequiredQty(
    getBadgeRules(activeToken).filter((r) => r.panel !== false)
  )
    .map((r) => ({
      title: r.title || "Badge",
      icon: r.icon || "\u{1F3F7}\u{FE0F}",
      rule: badgeRuleText(r.rule || ""),
      qualifies: badgeQualifyCount(holders, r)
    }));

  badgeMeta.textContent = holders.length ? `${rules.length} badges live` : "-";
  badgeCards.innerHTML = "";

  for (const r of rules){
    const card = el("div","badgeCard");
    const top = el("div","badgeCardTop");
    top.appendChild(el("div","badgeTitle", `${r.icon} ${r.title}`));
    top.appendChild(el("div","badgeCount", `${r.qualifies}`));
    card.appendChild(top);
    card.appendChild(el("div","badgeRule", r.rule));
    badgeCards.appendChild(card);
  }
}

/* ===== WebSocket helpers (rippled) ===== */
function wsRequest(ws, payload){
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(16).slice(2);
    payload.id = id;

    const onMessage = (ev) => {
      try{
        const msg = JSON.parse(ev.data);
        if (msg?.id !== id) return;
        ws.removeEventListener("message", onMessage);
        if (msg.status && msg.status !== "success"){
          reject(new Error(msg?.error_message || msg?.error || "WS request failed"));
          return;
        }
        resolve(msg.result || msg);
      }catch(e){
        reject(e);
      }
    };

    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify(payload));
  });
}

/* ===== Rich list via account_lines ===== */
async function fetchHoldersFromWS({ wsUrl, issuer, currency, excludedAddresses, limitPerPage=400, onProgress }){
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once:true });
    ws.addEventListener("error", () => reject(new Error("WebSocket failed to connect")), { once:true });
  });

  try{
    let marker = undefined;
    const holdersMap = new Map();
    let page = 0;

    while (true){
      const req = {
        command: "account_lines",
        account: issuer,
        ledger_index: "validated",
        limit: limitPerPage,
      };
      if (marker) req.marker = marker;

      const result = await wsRequest(ws, req);
      page += 1;
      onProgress?.({ page, hasMore: Boolean(result.marker) });
      const lines = result.lines || [];

      for (const line of lines){
        if (line.currency !== currency) continue;

        const holder = line.account;
        const issuerPerspectiveBal = Number(line.balance);

        // issuer view is usually negative when others hold the token
        const holderBal = Math.max(0, -issuerPerspectiveBal);

        if (holder && holderBal > 0 && !excludedAddresses?.has(holder)){
          holdersMap.set(holder, (holdersMap.get(holder) || 0) + holderBal);
        }
      }

      marker = result.marker;
      if (!marker) break;
    }

    const holders = Array.from(holdersMap.entries())
      .filter(([address]) => !excludedAddresses?.has(address))
      .map(([address, balance]) => ({ address, balance }));
    holders.sort((a,b) => b.balance - a.balance);
    return holders;
  } finally {
    ws.close();
  }
}

/* ===== Load holders ===== */
async function loadHolders({ forceNetwork = false } = {}){
  const ttlMs = getRichlistCacheTtlMs(activeToken);
  const cached = forceNetwork ? null : readRichlistCache(activeToken);
  const now = Date.now();
  const hasCached = Boolean(cached?.holders?.length);
  const cachedAgeMs = cached ? Math.max(0, now - cached.ts) : 0;
  const cacheFresh = cached && cachedAgeMs <= ttlMs;

  if (hasCached){
    allHolders = normalizeHolders(cached.holders);
    if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;
    renderTable();
    computeStats();
    const ageSec = Math.floor(cachedAgeMs / 1000);
    if (cacheFresh){
      setStatus(true, `cached (${ageSec}s old)`);
      setRichListLoading(false);
      return;
    }
    setStatus(true, `cached (${ageSec}s old), refreshing...`);
  } else {
    setStatus(true, "loading...");
    rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">Loading rich list...</td></tr>`;
  }

  setRichListLoading(true);

  try{
    const excludedAddresses = getExcludedAddressSet(activeToken);
    const holders = await fetchHoldersFromWS({
      wsUrl: activeToken.ws,
      issuer: activeToken.issuer,
      currency: getTokenCurrency(activeToken),
      excludedAddresses,
      limitPerPage: 400,
      onProgress: ({ page, hasMore }) => {
        const pageBasedPct = 18 + (1 - Math.exp(-page * 0.38)) * 70;
        setLoadBarTarget(hasMore ? pageBasedPct : 96);
      },
    });

    writeRichlistCache(activeToken, holders);
    allHolders = normalizeHolders(holders);
    if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;

    setStatus(true, "live data (ledger)");
  }catch{
    if (!hasCached){
      allHolders = normalizeHolders([]);
      setStatus(false, "failed (ws)");
    } else {
      setStatus(false, "refresh failed, showing cached");
    }
  } finally {
    renderTable();
    computeStats();
    setRichListLoading(false);
  }
}

/* ===== BUY/SELL + Price feed via meta deltas ===== */
function getMeta(msg){ return msg?.meta || msg?.metaData || msg?.result?.meta || null; }
function getTx(msg){ return msg?.transaction || msg?.tx || msg?.result?.transaction || msg; }

/**
 * Token deltas from RippleState entries.
 * Returns [{account, delta}] where delta is holder-token change.
 *
 * RippleState rules:
 * - Balance is from LOW node perspective.
 * - If holder is LowLimit.issuer => holding = Balance.value
 * - If holder is HighLimit.issuer => holding = -Balance.value
 */
function extractTokenDeltasFromMeta(msg, token){
  const meta = getMeta(msg);
  if (!meta?.AffectedNodes) return [];

  const out = new Map();
  const addDelta = (account, delta) => {
    if (!account || !Number.isFinite(delta) || Math.abs(delta) < 1e-12) return;
    out.set(account, (out.get(account) || 0) + delta);
  };

  for (const wrap of meta.AffectedNodes){
    const node = wrap.ModifiedNode || wrap.CreatedNode || wrap.DeletedNode || null;
    if (!node) continue;
    if (node.LedgerEntryType !== "RippleState") continue;

    const prev = node.PreviousFields || {};
    const fin = node.FinalFields || node.NewFields || {};

    const prevBalObj = prev.Balance;
    const finBalObj = fin.Balance;
    if (!prevBalObj || !finBalObj) continue;

    if (finBalObj.currency !== getTokenCurrency(token) || finBalObj.issuer !== token.issuer) continue;

    const low = fin?.LowLimit?.issuer;
    const high = fin?.HighLimit?.issuer;
    if (!low || !high) continue;

    const issuer = token.issuer;
    if (!(low === issuer || high === issuer)) continue;

    const prevBal = Number(prevBalObj.value);
    const finBal = Number(finBalObj.value);
    if (!Number.isFinite(prevBal) || !Number.isFinite(finBal)) continue;

    const holder = (low === issuer) ? high : low;
    if (!holder || holder === issuer) continue;

    const holderWasLow = (holder === low);
    const prevHolding = holderWasLow ? prevBal : -prevBal;
    const finHolding = holderWasLow ? finBal : -finBal;

    addDelta(holder, finHolding - prevHolding);
  }

  return Array.from(out.entries()).map(([account, delta]) => ({ account, delta }));
}

/**
 * Native deltas (XAH) from AccountRoot balance change.
 * Returns [{account, deltaXah}] where deltaXah is in XAH.
 */
function extractNativeDeltasFromMeta(msg){
  const meta = getMeta(msg);
  if (!meta?.AffectedNodes) return [];

  const out = new Map();
  const add = (acct, delta) => {
    if (!acct || !Number.isFinite(delta) || Math.abs(delta) < 1e-12) return;
    out.set(acct, (out.get(acct) || 0) + delta);
  };

  for (const wrap of meta.AffectedNodes){
    const node = wrap.ModifiedNode || wrap.CreatedNode || wrap.DeletedNode || null;
    if (!node) continue;
    if (node.LedgerEntryType !== "AccountRoot") continue;

    const prev = node.PreviousFields || {};
    const fin = node.FinalFields || node.NewFields || {};

    if (prev.Balance == null || fin.Balance == null) continue;

    const acct = fin.Account;
    const prevDrops = Number(prev.Balance);
    const finDrops = Number(fin.Balance);
    if (!Number.isFinite(prevDrops) || !Number.isFinite(finDrops)) continue;

    const deltaXah = (finDrops - prevDrops) / 1_000_000;
    add(acct, deltaXah);
  }

  return Array.from(out.entries()).map(([account, deltaXah]) => ({ account, deltaXah }));
}

function involvesTokenInMsg(msg, token){
  return extractTokenDeltasFromMeta(msg, token).length > 0;
}

/**
 * Build a feed line:
 * - BUY/SELL for offer-related activity
 * - RECEIVE/SEND for payments
 * - Adds implied price @ XAH when possible (light + honest)
 */
function summarizeBuySellWithPrice(msg, token){
  const tx = getTx(msg);
  const tt = tx?.TransactionType || "Unknown";
  const hash = tx?.hash || msg?.hash || "";
  const when = new Date().toLocaleTimeString();

  const deltas = extractTokenDeltasFromMeta(msg, token);
  if (!deltas.length) return null;

  // Main event = biggest abs delta
  deltas.sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));
  const main = deltas[0];

  const tokenAmt = Math.abs(main.delta);

  const dir =
    main.delta > 0
      ? (tt === "Payment" ? "RECEIVE" : "BUY")
      : (tt === "Payment" ? "SEND" : "SELL");

  // Try compute price using XAH delta for same account
  let priceStr = "";
  const native = extractNativeDeltasFromMeta(msg);
  const nativeMap = new Map(native.map(x => [x.account, x.deltaXah]));
  const xahDelta = nativeMap.get(main.account);

  // Only attempt price when this looks like DEX-related activity
  // (Payment transfers can move tokens w/out market price)
  if (Number.isFinite(xahDelta) && tokenAmt > 0 && (tt === "OfferCreate" || tt === "OfferCancel")){
    const xahAbs = Math.abs(xahDelta);
    const px = xahAbs / tokenAmt;
    if (Number.isFinite(px) && px > 0){
      priceStr = ` | @ ${fmtPrice(px)} XAH`;
    }
  }

  return {
    type: dir,
    time: when,
    account: main.account,
    text: `${dir} ${fmt(tokenAmt)} ${token.symbol}${priceStr} | ${tt}`,
    hash,
    amount: tokenAmt,
    delta: main.delta,
    xahDelta: Number.isFinite(xahDelta) ? xahDelta : null
  };
}

/* ===== Feed rendering ===== */
function renderFeed(){
  feedList.innerHTML = "";
  const list = feedEvents.slice(0, FEED_RENDER_LIMIT);

  if (!list.length){
    const empty = el("div","feedItem");
    empty.appendChild(el("div","feedTop"));
    empty.appendChild(el("div","feedBody","No token activity captured yet. Leave this tab open and it will fill."));
    feedList.appendChild(empty);
    return;
  }

  for (const e of list){
    const item = el("div","feedItem");
    const top = el("div","feedTop");
    top.appendChild(el("div","feedType", e.text));
    top.appendChild(el("div","feedTime", e.time));
    item.appendChild(top);

    const body = el("div","feedBody");
    const xahHint = Number.isFinite(e.xahDelta)
      ? ` | XAH delta: ${fmt(e.xahDelta)}`
      : "";
    body.innerHTML = `Acct: <span class="feedAddr">${shortAddr(e.account)}</span>${e.hash ? ` | Hash: ${shortAddr(e.hash)}` : ""}${xahHint}`;
    item.appendChild(body);

    feedList.appendChild(item);
  }
}

function stopFeed(){
  try{ feedWS?.close(); }catch{}
  feedWS = null;
  setFeedStatus(false, "disconnected");
}

function startFeed(){
  stopFeed();
  feedEvents = [];
  renderFeed();

  setFeedStatus(true, "connecting...");
  const ws = new WebSocket(activeToken.ws);
  feedWS = ws;

  ws.addEventListener("open", () => {
    setFeedStatus(true, "subscribed");
    ws.send(JSON.stringify({
      command: "subscribe",
      streams: ["transactions"]
    }));
  });

  ws.addEventListener("message", (ev) => {
    try{
      const msg = JSON.parse(ev.data);
      if (msg?.type !== "transaction") return;

      // Filter quickly: only process tx that actually changes token trustlines
      if (!involvesTokenInMsg(msg, activeToken)) return;

      const summary = summarizeBuySellWithPrice(msg, activeToken);
      if (!summary) return;

      feedEvents.unshift(summary);
      if (feedEvents.length > FEED_STORE_LIMIT) feedEvents.length = FEED_STORE_LIMIT;
      renderFeed();
    }catch{
      // ignore
    }
  });

  ws.addEventListener("close", () => setFeedStatus(false, "disconnected"));
  ws.addEventListener("error", () => setFeedStatus(false, "ws error"));
}


function buildTrustlineUrl(token){

  return `https://xahau.services/?issuer=${encodeURIComponent(token.issuer || "")}&currency=${encodeURIComponent(getTokenCurrency(token))}&limit=${encodeURIComponent(String(token.totalSupply || ""))}`;
}

function buildTradeUrl(token){
  return `https://xmagnetic.org/trade?issuer=${encodeURIComponent(token.issuer || "")}&currency=${encodeURIComponent(getTokenCurrency(token))}&limit=${encodeURIComponent(String(token.totalSupply || ""))}`;

}

/* ===== Token UI wiring ===== */
function setPills(){
  pillRow.innerHTML = "";
  const pills = [
    { k:"Network", v: "Xahau" },
    { k:"Genesis gate", v: "Hold = 1" },
    { k:"Supply", v: String(activeToken.totalSupply) },
    { k:"Social", v: "Twitter", href: activeToken.xUrl || "#" }
  ];
  for (const p of pills){
    if (p.href){
      const a = document.createElement("a");
      a.className = "pill pillLink";
      a.href = p.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.innerHTML = `${p.k}: <b>${p.v}</b>`;
      pillRow.appendChild(a);
    } else {
      const d = el("div","pill");
      d.innerHTML = `${p.k}: <b>${p.v}</b>`;
      pillRow.appendChild(d);
    }
  }
}

function applyTokenToUI(){
  if (!activeToken) return;

  document.title = `Onyx Hub — ${activeToken?.symbol || activeToken?.name || "100"}`;
  setTokenLogo(brandEmoji, activeToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(heroEmoji, activeToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(statEmoji, activeToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(panelEmojiDecent, activeToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(panelEmojiFeed, activeToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(panelEmojiRich, activeToken, activeToken.logo || "\u{1F5A4}");

  heroName.textContent = activeToken.name || activeToken.id;



  brandSub.textContent = "Live rich lists + DEX culture experiments on Xahau.";


  heroDesc.textContent = activeToken.description || "Onyx token.";
  if (cardHint){
    const hintItems = sortBadgesByRequiredQty(
      getBadgeRules(activeToken).filter((r) => r.panel !== false)
    )
      .map((r) => `${r.icon || ""} ${r.title || "Badge"}`.trim());
    cardHint.innerHTML = `<b>Badges:</b> ${hintItems.join(", ")}.`;
  }

  statSupply.textContent = String(activeToken.totalSupply);

  btnExplorer.href = activeToken.explorerUrl || "#";
  btnTokenDetails.href = activeToken.explorerUrl || "#";
  btnTrustline.href = buildTrustlineUrl(activeToken) || "#";
  btnTrade.href = buildTradeUrl(activeToken) || "#";
  btnX.href = activeToken.xUrl || "#";
  footExplorer.href = activeToken.explorerUrl || "#";
  footX.href = activeToken.xUrl || "#";
  footExplorer.textContent = "xahauexplorer";
  footX.textContent = "x.com";

  if (whitepaperSummary){
    whitepaperSummary.textContent = activeToken.whitepaper || "White paper text coming soon.";
  }
  if (whitepaperMeta){
    whitepaperMeta.textContent = (activeToken.whitepaper || activeToken.whitepaperHtml) ? "live" : "pending";
  }
  if (btnWhitepaper){
    const hasRemoteWhitepaper = Boolean(activeToken.whitepaperHtml);
    btnWhitepaper.href = hasRemoteWhitepaper ? activeToken.whitepaperHtml : "#";
    btnWhitepaper.style.display = hasRemoteWhitepaper ? "inline-flex" : "none";
  }

  setPills();
}

/* ===== Token selector ===== */
function initTokenSelector(){
  tokenSelect.innerHTML = "";
  for (const t of TOKENS){
    const opt = document.createElement("option");
    opt.value = t.id;
    const labelIcon = t.id === "100" ? "" : (t.logo || "");
    opt.textContent = `${labelIcon ? (labelIcon + " ") : ""}${t.name} (${t.symbol})`;
    tokenSelect.appendChild(opt);
  }

  tokenSelect.addEventListener("change", async () => {
    const id = tokenSelect.value;
    const next = TOKENS.find(t => t.id === id) || TOKENS[0];
    activeToken = next;
    showAllRows = false;

    applyTokenToUI();
    await loadHolders();
    startFeed();
  });
}

/* ===== UI events ===== */
searchEl.addEventListener("input", () => renderTable());

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    showAllRows = false;
    renderTable();
  });
});

refreshBtn.addEventListener("click", () => loadHolders({ forceNetwork: true }));
if (clearCacheBtn){
  clearCacheBtn.addEventListener("click", async () => {
    const ok = clearRichlistCache(activeToken);
    showToast(ok ? "Cache cleared" : "Cache clear failed");
    await loadHolders({ forceNetwork: true });
  });
}
if (loadAllBtn){
  loadAllBtn.addEventListener("click", () => {
    showAllRows = !showAllRows;
    renderTable();
  });
}
feedReconnect.addEventListener("click", () => startFeed());

/* ===== Boot ===== */
(function boot(){
  if (!TOKENS.length){
    console.error("No tokens found in tokens.js (window.ONYX_TOKENS).");
    return;
  }
  activeToken = TOKENS[0];
  initTokenSelector();
  tokenSelect.value = activeToken.id;

  applyTokenToUI();
  loadHolders();
  startFeed();
})();

