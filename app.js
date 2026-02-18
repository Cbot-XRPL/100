/******************************************************************
 * ONYX HUB — Multi-token (no backend)
 * - Rich list: account_lines (issuer) via WebSocket
 * - Live feed: subscribe stream via WebSocket
 * - BUY/SELL: computed from trustline deltas in transaction meta (RippleState)
 * - Price (XAH): computed from AccountRoot balance deltas in meta (drops → XAH)
 *
 * Lightweight:
 * - No extra network calls
 * - Feed capped + only processes tx that touch your token
 ******************************************************************/

/* ===== DOM ===== */
const emojiField = document.getElementById("emojiField");

const tokenSelect = document.getElementById("tokenSelect");
const brandEmoji = document.getElementById("brandEmoji");
const heroEmoji = document.getElementById("heroEmoji");
const heroName = document.getElementById("heroName");
const heroDesc = document.getElementById("heroDesc");
const brandSub = document.getElementById("brandSub");
const pillRow = document.getElementById("pillRow");
const statSupply = document.getElementById("statSupply");
const statEmoji = document.getElementById("statEmoji");

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
  el.textContent = "💯"; // brand vibe (leave as 💯 even for later tokens)
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
  if (holder.rank === 1) b.push(makeBadge("Top Holder", "gold", "🥇"));
  if (holder.rank === 2) b.push(makeBadge("Runner Up", "silver", "🥈"));
  if (holder.rank === 3) b.push(makeBadge("Third Place", "bronze", "🥉"));
  if (holder.isLast) b.push(makeBadge("Last Holder", "red", "❤️"));

  for (const tier of (activeToken.clubTiers || [])){
    if (holder.balance >= tier.min) b.push(makeBadge(tier.name, tier.min >= 10 ? "dark" : "club", tier.icon));
  }

  if (holder.balance > 0) b.push(makeBadge("DEX Culture", "education", "🔵"));
  if (Math.abs(holder.balance - 1) < 1e-9) b.push(makeBadge("Exact One", "club", "🎯"));
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
  const displayList = filterHolders(allHolders, q, activeFilter);

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
    const code = el("code", null, shortAddr(holder.address));
    code.title = holder.address;

    const copyBtn = el("button","copy","Copy");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", async () => {
      try{ await navigator.clipboard.writeText(holder.address); showToast("Copied address"); }
      catch{ showToast("Copy blocked"); }
    });

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
    topHolderPctEl.textContent = "—";
  }

  lastUpdateEl.textContent = new Date().toLocaleString();

  // Whale dominance
  whaleRow.innerHTML = "";
  const ns = (activeToken.whaleTopN || [1,3,5,10]).filter(x => x > 0);
  for (const n of ns){
    const m = el("div","metric");
    m.appendChild(el("div","k",`Top ${n}`));
    const v = el("div","v", holders.length ? `${computeTopN(holders, n).toFixed(2)}%` : "—");
    m.appendChild(v);
    whaleRow.appendChild(m);
  }
  whaleMeta.textContent = holders.length ? `${holders.length} holders` : "—";

  // Decentralization score (simple Onyx metric)
  const top3 = holders.length ? computeTopN(holders, 3) : 0;
  const top10 = holders.length ? computeTopN(holders, 10) : 0;
  let score = 100 - (top3 + (top10/2));
  score = Math.max(0, Math.min(100, score));

  decentScoreEl.textContent = holders.length ? String(Math.round(score)) : "—";
  decentExplainEl.textContent = holders.length ? `Top3 ${top3.toFixed(1)}% • Top10 ${top10.toFixed(1)}%` : "—";
  decentBar.style.width = holders.length ? `${score}%` : "0%";

  // Supply buckets
  const buckets = [
    { name: "10+ tokens", min: 10, max: Infinity },
    { name: "5–9.99", min: 5, max: 9.999999 },
    { name: "1–4.99", min: 1, max: 4.999999 },
    { name: "0.1–0.99", min: 0.1, max: 0.999999 },
    { name: "< 0.1", min: 0.000000001, max: 0.099999 },
  ];

  const totals = buckets.map(b => {
    const sum = holders.reduce((acc, h) => (h.balance >= b.min && h.balance <= b.max) ? acc + h.balance : acc, 0);
    return { ...b, sum };
  });

  const circulating = holders.reduce((acc, h) => acc + h.balance, 0);
  supplyMeta.textContent = holders.length ? `${fmt(circulating)} / ${fmt(activeToken.totalSupply)} circulating` : "—";

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
  const rules = [
    { title: "Genesis Member", icon: "🟢", rule: `Hold ≥ 1 ${activeToken.symbol}`, qualifies: holders.filter(h => h.balance >= 1).length },
    { title: "Exact One", icon: "🎯", rule: `Hold exactly 1.0000`, qualifies: holders.filter(h => Math.abs(h.balance - 1) < 1e-9).length },
    { title: "Top 3", icon: "🥇", rule: `Be in the top 3 wallets`, qualifies: Math.min(3, holders.length) },
    { title: "Bottom Guardian", icon: "❤️", rule: `Hold the last rank`, qualifies: holders.length ? 1 : 0 },
    { title: "Council", icon: "🖤", rule: `Hold ≥ 10`, qualifies: holders.filter(h => h.balance >= 10).length },
    { title: "Whale", icon: "🐋", rule: `Hold ≥ 5`, qualifies: holders.filter(h => h.balance >= 5).length },
  ];

  badgeMeta.textContent = holders.length ? `${rules.length} badges live` : "—";
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
async function fetchHoldersFromWS({ wsUrl, issuer, currency, limitPerPage=400 }){
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once:true });
    ws.addEventListener("error", () => reject(new Error("WebSocket failed to connect")), { once:true });
  });

  try{
    let marker = undefined;
    const holdersMap = new Map();

    while (true){
      const req = {
        command: "account_lines",
        account: issuer,
        ledger_index: "validated",
        limit: limitPerPage,
      };
      if (marker) req.marker = marker;

      const result = await wsRequest(ws, req);
      const lines = result.lines || [];

      for (const line of lines){
        if (line.currency !== currency) continue;

        const holder = line.account;
        const issuerPerspectiveBal = Number(line.balance);

        // issuer view is usually negative when others hold the token
        const holderBal = Math.max(0, -issuerPerspectiveBal);

        if (holder && holderBal > 0){
          holdersMap.set(holder, (holdersMap.get(holder) || 0) + holderBal);
        }
      }

      marker = result.marker;
      if (!marker) break;
    }

    const holders = Array.from(holdersMap.entries()).map(([address, balance]) => ({ address, balance }));
    holders.sort((a,b) => b.balance - a.balance);
    return holders;
  } finally {
    ws.close();
  }
}

/* ===== Load holders ===== */
async function loadHolders(){
  setStatus(true, "loading…");
  rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">Loading rich list…</td></tr>`;

  try{
    const holders = await fetchHoldersFromWS({
      wsUrl: activeToken.ws,
      issuer: activeToken.issuer,
      currency: activeToken.symbol,
      limitPerPage: 400,
    });

    allHolders = normalizeHolders(holders);
    if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;

    setStatus(true, "live data (ledger)");
  }catch{
    allHolders = normalizeHolders([]);
    setStatus(false, "failed (ws)");
  }

  renderTable();
  computeStats();
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

    if (finBalObj.currency !== token.symbol || finBalObj.issuer !== token.issuer) continue;

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
      priceStr = ` • @ ${fmtPrice(px)} XAH`;
    }
  }

  return {
    type: dir,
    time: when,
    account: main.account,
    text: `${dir} ${fmt(tokenAmt)} ${token.symbol}${priceStr}  •  ${tt}`,
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
      ? ` • XAH Δ: ${fmt(e.xahDelta)}`
      : "";
    body.innerHTML = `Acct: <span class="feedAddr">${shortAddr(e.account)}</span>${e.hash ? ` • Hash: ${shortAddr(e.hash)}` : ""}${xahHint}`;
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

  setFeedStatus(true, "connecting…");
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
  if (token.trustlineUrl) return token.trustlineUrl;
  return `https://xmagnetic.org/trustline?issuer=${encodeURIComponent(token.issuer || "")}&currency=${encodeURIComponent(token.symbol || "")}`;
}

function buildTradeUrl(token){
  if (token.tradeUrl) return token.tradeUrl;
  return `https://xmagnetic.org/trade?issuer=${encodeURIComponent(token.issuer || "")}&currency=${encodeURIComponent(token.symbol || "")}`;
}

/* ===== Token UI wiring ===== */
function setPills(){
  pillRow.innerHTML = "";
  const pills = [
    { k:"Network", v: "Xahau" },
    { k:"Mode", v: "Experimental" },
    { k:"Genesis gate", v: "Hold ≥ 1" },
    { k:"Supply", v: String(activeToken.totalSupply) }
  ];
  for (const p of pills){
    const d = el("div","pill");
    d.innerHTML = `${p.k}: <b>${p.v}</b>`;
    pillRow.appendChild(d);
  }
}

function applyTokenToUI(){
  if (!activeToken) return;

  document.title = `Onyx — ${activeToken.name}`;
  brandEmoji.textContent = activeToken.logo || "🖤";
  heroEmoji.textContent = activeToken.logo || "🖤";
  statEmoji.textContent = activeToken.logo || "🖤";

  heroName.textContent = activeToken.name || activeToken.id;


  brandSub.textContent = "Live rich lists + DEX culture experiments on Xahau.";

  heroDesc.textContent = activeToken.description || "Onyx token.";

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

  setPills();
}

/* ===== Token selector ===== */
function initTokenSelector(){
  tokenSelect.innerHTML = "";
  for (const t of TOKENS){
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.logo || "🖤"} ${t.name} (${t.symbol})`;
    tokenSelect.appendChild(opt);
  }

  tokenSelect.addEventListener("change", async () => {
    const id = tokenSelect.value;
    const next = TOKENS.find(t => t.id === id) || TOKENS[0];
    activeToken = next;

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
    renderTable();
  });
});

refreshBtn.addEventListener("click", () => loadHolders());
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
