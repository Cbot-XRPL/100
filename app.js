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
const brandLogoLink = document.getElementById("brandLogoLink");
const brandEmoji = document.getElementById("brandEmoji");
const heroEmoji = document.getElementById("heroEmoji");
const heroName = document.getElementById("heroName");
const heroDesc = document.getElementById("heroDesc");
const brandSub = document.getElementById("brandSub");
const cardHint = document.getElementById("cardHint");
const pillRow = document.getElementById("pillRow");
const ctaRow = document.querySelector(".ctaRow");
const cardRight = document.querySelector(".cardRight");
const statSupply = document.getElementById("statSupply");
const statEmoji = document.getElementById("statEmoji");
const statLedgerCard = document.getElementById("statLedgerCard");
const statLedgerIndex = document.getElementById("statLedgerIndex");
const statVersionCard = document.getElementById("statVersionCard");
const statNodeVersion = document.getElementById("statNodeVersion");
const panelEmojiDecent = document.getElementById("panelEmojiDecent");
const panelEmojiFeed = document.getElementById("panelEmojiFeed");
const panelEmojiRich = document.getElementById("panelEmojiRich");
const whitepaperMeta = document.getElementById("whitepaperMeta");
const whitepaperSummary = document.getElementById("whitepaperSummary");
const btnWhitepaper = document.getElementById("btnWhitepaper");
const btnTokenExplorer = document.getElementById("btnTokenExplorer");

const btnExplorer = document.getElementById("btnExplorer");
const btnTokenDetails = document.getElementById("btnTokenDetails");
const btnTrustline = document.getElementById("btnTrustline");
const btnTrade = document.getElementById("btnTrade");
const btnXahImport = document.getElementById("btnXahImport");
const btnBitrueTrade = document.getElementById("btnBitrueTrade");
const btnXahTeleport = document.getElementById("btnXahTeleport");
const xahToolsRow = document.getElementById("xahToolsRow");
const btnX = document.getElementById("btnX");
const footExplorer = document.getElementById("footExplorer");
const footX = document.getElementById("footX");

const rowsEl = document.getElementById("rows");
const treasuryPane = document.getElementById("treasuryPane");
const treasuryMeta = document.getElementById("treasuryMeta");
const treasuryList = document.getElementById("treasuryList");
const searchEl = document.getElementById("search");
const dataStatusEl = document.getElementById("dataStatus");
const statPriceUsdEl = document.getElementById("statPriceUsd");
const onePercentCountEl = document.getElementById("onePercentCount");
const statClubLabelEl = document.getElementById("statClubLabel");
const marketCapUsdEl = document.getElementById("marketCapUsd");
const refreshBtn = document.getElementById("refreshBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const loadAllBtn = document.getElementById("loadAllBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const xahLoadRichlistBtn = document.getElementById("xahLoadRichlistBtn");
const xahStatsUpdateBtn = document.getElementById("xahStatsUpdateBtn");
const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));

const whaleRow = document.getElementById("whaleRow");
const whaleMeta = document.getElementById("whaleMeta");
const liqMeta = document.getElementById("liqMeta");
const liqScoreEl = document.getElementById("liqScore");
const liqSpreadEl = document.getElementById("liqSpread");
const liqBar = document.getElementById("liqBar");
const liqDepthRow = document.getElementById("liqDepthRow");
const liqNote = document.getElementById("liqNote");
const dexChartMeta = document.getElementById("dexChartMeta");
const dexRange7d = document.getElementById("dexRange7d");
const dexRange30d = document.getElementById("dexRange30d");
const dexRange3m = document.getElementById("dexRange3m");
const dexRange6m = document.getElementById("dexRange6m");
const dexRange1y = document.getElementById("dexRange1y");
const dexChartPair = document.getElementById("dexChartPair");
const dexChartGrid = document.getElementById("dexChartGrid");
const dexChartCandles = document.getElementById("dexChartCandles");
const dexChartAxis = document.getElementById("dexChartAxis");
const dexChartEmpty = document.getElementById("dexChartEmpty");
const dexChartLow = document.getElementById("dexChartLow");
const dexChartHigh = document.getElementById("dexChartHigh");
const dexChartLast = document.getElementById("dexChartLast");
const dexChartChange = document.getElementById("dexChartChange");
const dexChartRange = document.getElementById("dexChartRange");
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
const feedPanel = document.getElementById("feed");
const richlistPanel = document.getElementById("richlist");
const heroGrid = document.querySelector(".heroGrid");
const heroMainCol = heroGrid?.firstElementChild || null;
const supportWalletBtn = document.getElementById("supportWalletBtn");
const supportWalletAddress = document.getElementById("supportWalletAddress");
const SUPPORT_WALLET_FALLBACK = "roNyxrByzJfe7JfhuarRHHDUQsHWZxNAL";

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
function clearEmojiField(){
  if (!emojiField) return;
  emojiField.innerHTML = "";
}
function setEmojiFieldForToken(token){
  const isOneToken = String(token?.id) === "100";
  if (!isOneToken){
    clearEmojiField();
    return;
  }
  if ((emojiField?.children?.length || 0) >= EMOJI_COUNT) return;
  clearEmojiField();
  for (let i=0;i<EMOJI_COUNT;i++) spawnEmoji();
}

const ACCENTS = [ "#ffd54a",];
let accentIndex = 0;
document.documentElement.style.setProperty("--accent", ACCENTS[0]);
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
const ONE_TOKEN = TOKENS.find((t) => String(t?.id) === "100") || null;
const BRAND_LOGO_URL = "./media/onyx-logo.png";
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
const XAH_TEMPLATE_CACHE_KEY = "onyx.xah.template.v2";
let showAllRows = false;
let liquidityReqNonce = 0;
let xahUsdCache = { px: NaN, ts: 0 };
let heroUsdPrice = NaN;
const LIQUIDITY_POLL_MS = 15000;
const LIQUIDITY_MIN_REFRESH_MS = 12000;
const LIQUIDITY_TIER_PCTS = [0.01, 0.02, 0.05, 0.10, 0.20];
const LIQUIDITY_PROFILE_DEFAULTS = {
  commercial: { depthTargetUsd: 10000, spreadGoodBps: 20, spreadBadBps: 250 },
  alt: { depthTargetUsd: 500, spreadGoodBps: 60, spreadBadBps: 600 },
};
const LIQUIDITY_SCORE_SCALES = {
  D: { depthWeight: 0.75, spreadWeight: 0.25 },
  B: { depthWeight: 0.85, spreadWeight: 0.15 },
};
const LIQUIDITY_TIER_TARGET_MULTIPLIERS = new Map([
  [0.01, 0.55],
  [0.02, 0.65],
  [0.05, 0.80],
  [0.10, 0.90],
  [0.20, 1.00],
]);
let liquidityPollTimer = null;
let liquidityBusy = false;
let lastLiquidityRunTs = 0;
let lastLiquidityTokenId = "";
let xahBitrueSnapshotCache = { ts: 0, snap: null };
let hasLiquidityDataRendered = false;
const liquidityFirstLoadShownByToken = new Set();
let dexChartRangeDays = 7;
let dexChartReqNonce = 0;
const dexChartCache = new Map();
const XAH_CHART_STORAGE_KEY = "onyx.dexchart.xah.365d.v1";
const XAH_CHART_TTL_MS = 10 * 60 * 1000;
const COINGECKO_MIN_REQUEST_GAP_MS = 2500;
let coingeckoLastRequestTs = 0;
let coingeckoCooldownUntil = 0;
const loadedRichlistTokenIds = new Set();
let richlistObserver = null;
let renderedHoldersTokenId = null;
let richListLoadNonce = 0;
let xahApproxStatsMode = false;
let xahSupplySnapshot = { circulating: NaN, fullSupply: NaN, accounts: NaN, ts: 0 };
let xahHeroInfoReqNonce = 0;
let xahNetworkInfoCache = { ledgerIndex: NaN, version: "", ts: 0 };
const XAH_FALLBACK_SNAPSHOT = {
  circulating: 489287073.4336,
  fullSupply: 644600076,
  accounts: 186441
};

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
function readXahTemplateCache(){
  try{
    const raw = localStorage.getItem(XAH_TEMPLATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.topHolders)) return null;
    return parsed;
  }catch{
    return null;
  }
}
function writeXahTemplateCache(payload){
  try{
    localStorage.setItem(XAH_TEMPLATE_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      circulating: Number(payload?.circulating) || 0,
      accounts: Number(payload?.accounts) || 0,
      topHolders: Array.isArray(payload?.topHolders) ? payload.topHolders : [],
    }));
  }catch{
    // ignore quota/privacy errors
  }
}
function buildXahApproxHolders({ circulating, fullSupply, accounts, topHolders = [] }){
  const circ = Number(circulating);
  if (!Number.isFinite(circ) || circ <= 0) return [];

  const full = Number(fullSupply);
  const pctBase = Number.isFinite(full) && full > 0 ? full : circ;

  // Targets tuned to live XAH distribution (Top1/3/5/10/25/50).
  const presetTopPercents = [
    3.28,
    2.25, 2.12,
    1.75, 1.63,
    1.10, 1.02, 0.90, 0.86, 0.84,
    0.50, 0.48, 0.47, 0.46, 0.45, 0.44, 0.43, 0.42, 0.41, 0.40,
    0.40, 0.39, 0.38, 0.38, 0.37,
    0.22, 0.21, 0.21, 0.20, 0.20,
    0.20, 0.19, 0.19, 0.18, 0.18,
    0.18, 0.18, 0.18, 0.17, 0.17,
    0.17, 0.17, 0.17, 0.17, 0.17,
    0.17, 0.17, 0.17, 0.17, 0.16
  ];
  const presetTopHolders = presetTopPercents.map((pct, i) => ({
    address: `rXahPresetTop${String(i + 1).padStart(6, "0")}`,
    balance: pctBase * (pct / 100)
  }));

  const sanitizedTop = (Array.isArray(topHolders) ? topHolders : [])
    .map((h, i) => ({
      address: String(h?.address || `rXahTemplateTop${String(i + 1).padStart(6, "0")}`),
      balance: Number(h?.balance) || 0
    }))
    .filter((h) => h.balance > 0);
  const seededTop = sanitizedTop.length ? sanitizedTop : presetTopHolders;

  const holderEstimate = Number.isFinite(Number(accounts)) && Number(accounts) > 0
    ? Math.floor(Number(accounts))
    : 12000;
  const targetCount = Math.max(seededTop.length + 4000, Math.min(30000, holderEstimate));
  const topSum = seededTop.reduce((acc, h) => acc + h.balance, 0);
  const normalizedTop = topSum > circ
    ? seededTop.map((h) => ({ ...h, balance: (h.balance / topSum) * circ }))
    : seededTop;
  const normalizedTopSum = normalizedTop.reduce((acc, h) => acc + h.balance, 0);
  const tailSupply = Math.max(0, circ - normalizedTopSum);
  const tailCount = Math.max(0, targetCount - normalizedTop.length);
  if (!tailCount || tailSupply <= 0) return normalizedTop;

  const out = [...normalizedTop];
  let weightSum = 0;
  for (let i = 0; i < tailCount; i++){
    weightSum += 1 / Math.pow(i + 16, 1.07);
  }
  if (weightSum <= 0) return out;

  for (let i = 0; i < tailCount; i++){
    const weight = 1 / Math.pow(i + 16, 1.07);
    out.push({
      address: `rXahTemplate${String(i + 1).padStart(6, "0")}`,
      balance: (tailSupply * weight) / weightSum
    });
  }
  return out;
}
function buildXahTemplateFromLive(holders, supplyInfo){
  const topHolders = holders
    .slice(0, 600)
    .map((h) => ({ address: h.address, balance: Number(h.balance) || 0 }))
    .filter((h) => h.balance > 0);
  const circulatingLive = holders.reduce((acc, h) => acc + (Number(h.balance) || 0), 0);
  const circulating = Number.isFinite(Number(supplyInfo?.circulating)) && Number(supplyInfo.circulating) > 0
    ? Number(supplyInfo.circulating)
    : circulatingLive;
  const accounts = Number.isFinite(Number(supplyInfo?.accounts)) && Number(supplyInfo.accounts) > 0
    ? Math.floor(Number(supplyInfo.accounts))
    : holders.length;
  return { circulating, accounts, topHolders };
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
function getExcludedWallets(token){
  const wallets = [];
  const seen = new Set();
  const pushWallet = (address, kind) => {
    const addr = String(address || "").trim();
    if (!addr || seen.has(addr)) return;
    seen.add(addr);
    wallets.push({ address: addr, kind });
  };

  if (token?.excludeIssuer && token?.issuer){
    pushWallet(token.issuer, "Issuer");
  }
  for (const addr of (Array.isArray(token?.excludedAddresses) ? token.excludedAddresses : [])){
    pushWallet(addr, "Treasury");
  }
  return wallets;
}
function getTokenCurrency(token){
  if (token?.nativeXah) return "XAH";
  return token?.currency || token?.symbol || "";
}
function isNativeXahToken(token){
  return Boolean(token?.nativeXah || token?.id === "xah" || token?.symbol === "XAH");
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
  if (token?.id !== "100"){
    return [];
  }
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
function setBrandLogo(){
  if (!brandEmoji) return;
  brandEmoji.innerHTML = "";
  const img = document.createElement("img");
  img.className = "brandLogoImg";
  img.src = BRAND_LOGO_URL;
  img.alt = "Onyx logo";
  img.loading = "eager";
  img.decoding = "async";
  img.onerror = () => {
    brandEmoji.innerHTML = "";
    brandEmoji.textContent = "ONYX";
  };
  brandEmoji.appendChild(img);
}
function wireSupportWalletButton(){
  if (!supportWalletBtn) return;
  supportWalletBtn.addEventListener("click", async () => {
    const addr = (
      supportWalletAddress?.textContent ||
      supportWalletBtn?.textContent ||
      SUPPORT_WALLET_FALLBACK
    ).trim();
    let copied = false;
    try{
      await navigator.clipboard.writeText(addr);
      copied = true;
    }catch{
      copied = false;
    }

    const xamanUrl = "https://xumm.app/detect";
    try{
      window.open(xamanUrl, "_blank", "noopener,noreferrer");
    }catch{
      // ignore popup-blocker failures
    }

    showToast(copied ? "Support wallet copied. Opened Xaman." : "Opened Xaman. Support wallet shown in footer.");
  });
}
function hideLegacyPanelIcons(){
  if (panelEmojiDecent) panelEmojiDecent.style.display = "none";
  if (panelEmojiFeed) panelEmojiFeed.style.display = "none";
  if (panelEmojiRich) panelEmojiRich.style.display = "none";
}
function setPanelCornerTokenLogo(token){
  const generatedEmojiLogo =
    token?.logoMode === "emoji-native" && token?.logo
      ? getNativeEmojiLogoUrl(token.logo)
      : "";
  const logoUrl = generatedEmojiLogo || getTokenLogoUrl(token);
  if (logoUrl){
    const safeUrl = String(logoUrl).replace(/"/g, '\\"');
    document.documentElement.style.setProperty("--panel-token-logo", `url("${safeUrl}")`);
    document.documentElement.style.setProperty("--panel-token-logo-visible", "1");
    return;
  }
  document.documentElement.style.setProperty("--panel-token-logo", "none");
  document.documentElement.style.setProperty("--panel-token-logo-visible", "0");
}

/* ===== Utils ===== */
function shortAddr(a){
  if (!a) return "";
  if (a.length <= 14) return a;
  return a.slice(0, 6) + "..." + a.slice(-6);
}
function displayAddr(a){
  if (!a) return "";
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile) return a;
  if (a.length <= 16) return a;
  return a.slice(0, 6) + ".." + a.slice(-6);
}
function fmt(n){
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return isInt ? String(Math.round(n)) : n.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
}
function fmtPrice(n){
  // dynamic-ish but cheap: show up to 6 decimals, trim trailing zeros
  return Number(n).toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
}
function fmtSupplyStat(token, n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return Math.round(v).toLocaleString("en-US");
}
function fmtLedgerIndex(n){
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "-";
  return Math.floor(v).toLocaleString("en-US");
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
function setHeroUsdPrice(valueText){
  if (!statPriceUsdEl) return;
  statPriceUsdEl.textContent = valueText;
  const raw = String(valueText == null ? "" : valueText).trim();
  const parsed = Number(raw.replace(/[^0-9.+-]/g, ""));
  heroUsdPrice = Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
  updateHeroMarketCap(raw);
}
function updateHeroMarketCap(priceText){
  if (!marketCapUsdEl) return;
  if (String(priceText || "").toLowerCase().includes("loading")){
    marketCapUsdEl.textContent = "loading...";
    return;
  }
  const supply = Number(activeToken?.totalSupply);
  if (!Number.isFinite(heroUsdPrice) || heroUsdPrice <= 0 || !Number.isFinite(supply) || supply <= 0){
    marketCapUsdEl.textContent = "-";
    return;
  }
  marketCapUsdEl.textContent = `$${Math.round(heroUsdPrice * supply).toLocaleString("en-US")}`;
}
function setLiquidityMetaText(nextText){
  if (!liqMeta) return;
  const next = String(nextText == null ? "" : nextText);
  if (liqMeta.textContent === next) return;
  liqMeta.textContent = next;
}
function renderLiquiditySkeleton(label){
  renderLiquidityMetrics([
    { k: "Accessible USD (2% slip)", v: label || "$0" },
    { k: "Accessible USD (5% slip)", v: label || "$0" },
    { k: "Accessible USD (10% slip)", v: label || "$0" },
    { k: "Accessible USD (20% slip)", v: label || "$0" }
  ]);
}
function setLiquidityLoading(msg){
  if (liqScoreEl) liqScoreEl.textContent = "0";
  if (liqSpreadEl) liqSpreadEl.textContent = msg || "loading book depth...";
  if (liqBar) liqBar.style.width = "0%";
  setLiquidityMetaText("loading");
  renderLiquiditySkeleton("loading");
}
function resetLiquidityPanel(msg){
  if (liqScoreEl) liqScoreEl.textContent = "0";
  if (liqSpreadEl) liqSpreadEl.textContent = msg || "-";
  if (liqBar) liqBar.style.width = "0%";
  setLiquidityMetaText("-");
  renderLiquiditySkeleton("0");
}
function parseXahAmount(v){
  if (v == null) return NaN;
  if (typeof v === "string"){
    const drops = Number(v);
    return Number.isFinite(drops) ? (drops / 1_000_000) : NaN;
  }
  if (typeof v === "object"){
    const val = Number(v.value);
    return Number.isFinite(val) ? val : NaN;
  }
  return NaN;
}
function parseTokenAmount(v){
  if (v == null) return NaN;
  if (typeof v === "object"){
    const val = Number(v.value);
    return Number.isFinite(val) ? val : NaN;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function calcDepthFromOffers(offers, side){
  const rows = [];
  for (const o of offers || []){
    const gets = o.taker_gets_funded ?? o.TakerGets;
    const pays = o.taker_pays_funded ?? o.TakerPays;
    let tokenAmt = NaN;
    let xahAmt = NaN;

    if (side === "asks"){
      tokenAmt = parseTokenAmount(gets);
      xahAmt = parseXahAmount(pays);
    } else {
      tokenAmt = parseTokenAmount(pays);
      xahAmt = parseXahAmount(gets);
    }

    if (!Number.isFinite(tokenAmt) || !Number.isFinite(xahAmt) || tokenAmt <= 0 || xahAmt <= 0){
      continue;
    }

    rows.push({
      token: tokenAmt,
      xah: xahAmt,
      price: xahAmt / tokenAmt
    });
  }
  return rows;
}
function clamp(n, lo, hi){
  return Math.max(lo, Math.min(hi, n));
}
async function fetchXahUsdPrice(){
  const now = Date.now();
  if (Number.isFinite(xahUsdCache.px) && (now - xahUsdCache.ts) < 120000){
    return xahUsdCache.px;
  }
  // Prefer Bitrue ticker because it is already used elsewhere in-browser and
  // is less likely to be blocked by CORS than CoinGecko simple/price.
  try{
    const bitrue = await fetchBitrueXahTickerOnly();
    const bitruePxCandidates = [bitrue.mid, bitrue.lastPrice, bitrue.bestBid, bitrue.bestAsk];
    const bitruePx = bitruePxCandidates.find((v) => Number.isFinite(v) && Number(v) > 0);
    if (Number.isFinite(bitruePx) && Number(bitruePx) > 0){
      const px = Number(bitruePx);
      xahUsdCache = { px, ts: Date.now() };
      return px;
    }
  }catch{
    // CoinGecko fallback below.
  }

  const url = "https://api.coingecko.com/api/v3/simple/price?ids=xahau&vs_currencies=usd";
  const data = await fetchJsonNoStore(url, 10000);
  const px = Number(data?.xahau?.usd);
  if (!Number.isFinite(px) || px <= 0) throw new Error("xah usd invalid");
  xahUsdCache = { px, ts: Date.now() };
  return px;
}
async function fetchXahSupplyInfo(){
  const url = "https://data.xahau.network/v1/ledgers/supply_info";
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error("xah supply http");
  const data = await resp.json();
  const circulating = Number(data?.xah?.xahInCirculation);
  const accounts = Number(data?.accounts);
  const fullSupply = Number(data?.xahExisting);
  return {
    circulating: Number.isFinite(circulating) ? circulating : NaN,
    fullSupply: Number.isFinite(fullSupply) ? fullSupply : NaN,
    accounts: Number.isFinite(accounts) ? accounts : NaN
  };
}
async function fetchXahNetworkInfo(wsUrl){
  const now = Date.now();
  if (Number.isFinite(xahNetworkInfoCache.ledgerIndex) && (now - xahNetworkInfoCache.ts) < 60000){
    return xahNetworkInfoCache;
  }

  const ws = new WebSocket(wsUrl || "wss://xahau.network");
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("xah info ws connect failed")), { once: true });
  });

  try{
    const result = await wsRequest(ws, { command: "server_info" });
    const info = result?.info || {};
    const ledgerIndex = Number(info?.validated_ledger?.seq);
    const version = String(info?.build_version || info?.server_version || "").trim();
    xahNetworkInfoCache = {
      ledgerIndex: Number.isFinite(ledgerIndex) ? ledgerIndex : NaN,
      version,
      ts: Date.now()
    };
    return xahNetworkInfoCache;
  } finally {
    ws.close();
  }
}
function setXahHeroExtraStatsVisible(isVisible){
  if (statLedgerCard) statLedgerCard.style.display = isVisible ? "" : "none";
  if (statVersionCard) statVersionCard.style.display = isVisible ? "" : "none";
  if (!isVisible){
    if (statLedgerIndex) statLedgerIndex.textContent = "-";
    if (statNodeVersion) statNodeVersion.textContent = "-";
  }
}
async function refreshXahHeroExtraStats(){
  if (!isNativeXahToken(activeToken)){
    setXahHeroExtraStatsVisible(false);
    return;
  }

  setXahHeroExtraStatsVisible(true);
  if (statLedgerIndex) statLedgerIndex.textContent = "loading...";
  if (statNodeVersion) statNodeVersion.textContent = "loading...";

  const reqNonce = ++xahHeroInfoReqNonce;
  try{
    const info = await fetchXahNetworkInfo(activeToken?.ws);
    if (reqNonce !== xahHeroInfoReqNonce || !isNativeXahToken(activeToken)) return;
    if (statLedgerIndex) statLedgerIndex.textContent = fmtLedgerIndex(info?.ledgerIndex);
    if (statNodeVersion) statNodeVersion.textContent = info?.version || "-";
  }catch{
    if (reqNonce !== xahHeroInfoReqNonce || !isNativeXahToken(activeToken)) return;
    if (statLedgerIndex) statLedgerIndex.textContent = "-";
    if (statNodeVersion) statNodeVersion.textContent = "-";
  }
}
function fmtUsd(n){
  if (!Number.isFinite(n) || n <= 0) return "-";
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(7)}`;
}
function chartPairBase(token){
  const c = getTokenCurrency(token);
  if (!token?.issuer || !c) return "";
  return `${token.issuer}_${c}`;
}
function getDexChartCacheKey(token, days){
  const id = String(token?.id || token?.symbol || "token");
  return `${id}:${Number(days) || 0}`;
}
function readDexChartCache(token, days){
  const key = getDexChartCacheKey(token, days);
  const cached = dexChartCache.get(key);
  if (!cached || !Array.isArray(cached.series) || !Number.isFinite(cached.ts)) return null;
  return cached;
}
function writeDexChartCache(token, days, payload){
  if (!payload || !Array.isArray(payload.series) || !payload.series.length) return;
  const key = getDexChartCacheKey(token, days);
  dexChartCache.set(key, {
    series: payload.series,
    alreadyUsd: Boolean(payload.alreadyUsd),
    ts: Date.now()
  });
}
function readStoredXahChart365(){
  try{
    const raw = localStorage.getItem(XAH_CHART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.series) || !Number.isFinite(parsed.ts)) return null;
    return parsed;
  }catch{
    return null;
  }
}
function writeStoredXahChart365(series){
  try{
    localStorage.setItem(XAH_CHART_STORAGE_KEY, JSON.stringify({
      ts: Date.now(),
      series
    }));
  }catch{
    // ignore quota/private mode errors
  }
}
function sliceSeriesByDays(series, days){
  if (!Array.isArray(series) || !series.length) return [];
  const dayCount = Math.max(1, Number(days) || 7);
  const newestTs = Number(series[series.length - 1]?.t);
  if (!Number.isFinite(newestTs)) return [];
  const cutoff = newestTs - (dayCount * 24 * 60 * 60 * 1000);
  const sliced = series.filter((p) => Number.isFinite(p?.t) && Number(p.t) >= cutoff);
  return sliced.length ? sliced : series.slice(-Math.max(1, Math.min(series.length, dayCount)));
}
function buildExactDailySeries(series, days){
  if (!Array.isArray(series) || !series.length) return [];
  const dayMs = 24 * 60 * 60 * 1000;
  const sorted = [...series]
    .filter((p) => Number.isFinite(p?.t) && Number.isFinite(p?.o) && Number.isFinite(p?.h) && Number.isFinite(p?.l) && Number.isFinite(p?.c))
    .sort((a, b) => Number(a.t) - Number(b.t));
  if (!sorted.length) return [];

  const dayBuckets = new Map();
  for (const p of sorted){
    const dayTs = Math.floor(Number(p.t) / dayMs) * dayMs;
    const existing = dayBuckets.get(dayTs);
    if (!existing){
      dayBuckets.set(dayTs, { t: dayTs, o: Number(p.o), h: Number(p.h), l: Number(p.l), c: Number(p.c) });
    } else {
      existing.h = Math.max(existing.h, Number(p.h));
      existing.l = Math.min(existing.l, Number(p.l));
      existing.c = Number(p.c);
    }
  }

  const dayCount = Math.max(1, Number(days) || 7);
  const newestDay = Math.floor(Number(sorted[sorted.length - 1].t) / dayMs) * dayMs;
  const oldestDay = newestDay - ((dayCount - 1) * dayMs);

  let seed = Number(sorted[0].c);
  for (const ts of Array.from(dayBuckets.keys()).sort((a, b) => a - b)){
    if (ts >= oldestDay){
      seed = Number(dayBuckets.get(ts)?.o);
      break;
    }
  }

  const out = [];
  let prevClose = Number.isFinite(seed) ? seed : Number(sorted[0].c);
  for (let ts = oldestDay; ts <= newestDay; ts += dayMs){
    const b = dayBuckets.get(ts);
    if (b){
      out.push({ t: ts, o: b.o, h: b.h, l: b.l, c: b.c });
      prevClose = b.c;
    } else {
      out.push({ t: ts, o: prevClose, h: prevClose, l: prevClose, c: prevClose });
    }
  }
  return out;
}
async function fetchJsonNoStore(url, timeoutMs = 12000){
  const isCoinGecko = /api\.coingecko\.com/i.test(String(url || ""));
  if (isCoinGecko){
    const now = Date.now();
    if (coingeckoCooldownUntil > now){
      throw new Error(`coingecko cooldown ${Math.ceil((coingeckoCooldownUntil - now) / 1000)}s`);
    }
    const waitMs = Math.max(0, (coingeckoLastRequestTs + COINGECKO_MIN_REQUEST_GAP_MS) - now);
    if (waitMs > 0){
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    coingeckoLastRequestTs = Date.now();
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => {
    try{ ctrl.abort(); }catch{}
  }, timeoutMs);
  try{
    const resp = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!resp.ok){
      if (isCoinGecko && resp.status === 429){
        const retryAfterRaw = Number(resp.headers.get("Retry-After"));
        const retryAfterSec = Number.isFinite(retryAfterRaw) && retryAfterRaw > 0 ? retryAfterRaw : 45;
        coingeckoCooldownUntil = Math.max(coingeckoCooldownUntil, Date.now() + (retryAfterSec * 1000));
      }
      throw new Error(`http ${resp.status}`);
    }
    return await resp.json();
  }catch (err){
    if (isCoinGecko){
      // Browser can surface CoinGecko 429 as CORS/network failures; back off anyway.
      coingeckoCooldownUntil = Math.max(coingeckoCooldownUntil, Date.now() + 60000);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
function setDexRangeButtons(){
  if (dexRange7d){
    dexRange7d.classList.toggle("active", dexChartRangeDays === 7);
  }
  if (dexRange30d){
    dexRange30d.classList.toggle("active", dexChartRangeDays === 30);
  }
  if (dexRange3m){
    dexRange3m.classList.toggle("active", dexChartRangeDays === 90);
  }
  if (dexRange6m){
    dexRange6m.classList.toggle("active", dexChartRangeDays === 180);
  }
  if (dexRange1y){
    dexRange1y.classList.toggle("active", dexChartRangeDays === 365);
  }
}
function setDexChartPairLabel(token){
  if (!dexChartPair) return;
  const sym = token?.symbol || "TOKEN";
  dexChartPair.textContent = isNativeXahToken(token) ? "XAH/USD" : `${sym}/XAH`;
}
async function fetchDexChartHistory(token, days){
  if (isNativeXahToken(token)){
    const stored365 = readStoredXahChart365();
    const now = Date.now();
    if (stored365?.series?.length && (now - stored365.ts) < XAH_CHART_TTL_MS){
      return { series: buildExactDailySeries(stored365.series, days), alreadyUsd: true };
    }

    if (coingeckoCooldownUntil > Date.now()){
      if (stored365?.series?.length){
        return { series: buildExactDailySeries(stored365.series, days), alreadyUsd: true };
      }
      const seed = Number.isFinite(xahUsdCache?.px) && xahUsdCache.px > 0 ? Number(xahUsdCache.px) : NaN;
      if (Number.isFinite(seed) && seed > 0){
        const count = Math.max(8, Math.min(60, Number(days) || 30));
        const now = Date.now();
        const stepMs = Math.max(60_000, Math.floor(((Number(days) || 30) * 24 * 60 * 60 * 1000) / count));
        const series = Array.from({ length: count }, (_, i) => {
          const t = now - ((count - 1 - i) * stepMs);
          return { t, o: seed, h: seed, l: seed, c: seed };
        });
        return { series, alreadyUsd: true };
      }
    }

    const dayParam = 365;
    const ohlcUrl = `https://api.coingecko.com/api/v3/coins/xahau/ohlc?vs_currency=usd&days=${dayParam}`;
    try{
      const arr = await fetchJsonNoStore(ohlcUrl, 12000);
      if (!Array.isArray(arr)) return { series: [], alreadyUsd: true };
      const series = arr
        .map((x) => ({
          t: Number(x?.[0]),
          o: Number(x?.[1]),
          h: Number(x?.[2]),
          l: Number(x?.[3]),
          c: Number(x?.[4])
        }))
        .filter((x) =>
          Number.isFinite(x.t) &&
          Number.isFinite(x.o) &&
          Number.isFinite(x.h) &&
          Number.isFinite(x.l) &&
          Number.isFinite(x.c) &&
          x.h > 0 &&
          x.l > 0
        )
        .sort((a, b) => a.t - b.t);
      if (series.length){
        writeStoredXahChart365(series);
        return { series: buildExactDailySeries(series, days), alreadyUsd: true };
      }
    }catch{
      // fallback below
    }

    const marketUrl = `https://api.coingecko.com/api/v3/coins/xahau/market_chart?vs_currency=usd&days=${dayParam}`;
    try{
      const market = await fetchJsonNoStore(marketUrl, 12000);
      const prices = Array.isArray(market?.prices) ? market.prices : [];
      const series = prices
        .map((p) => {
          const t = Number(p?.[0]);
          const px = Number(p?.[1]);
          return { t, o: px, h: px, l: px, c: px };
        })
        .filter((x) => Number.isFinite(x.t) && Number.isFinite(x.c) && x.c > 0)
        .sort((a, b) => a.t - b.t);
      if (series.length){
        writeStoredXahChart365(series);
        return { series: buildExactDailySeries(series, days), alreadyUsd: true };
      }
    }catch{
      // final fallback below
    }

    if (stored365?.series?.length){
      return { series: buildExactDailySeries(stored365.series, days), alreadyUsd: true };
    }

    // Keep XAH chart alive when upstream API is rate-limited/unavailable.
    let seedPrice = (Number.isFinite(xahUsdCache?.px) && xahUsdCache.px > 0)
      ? Number(xahUsdCache.px)
      : NaN;
    if (!Number.isFinite(seedPrice) || seedPrice <= 0){
      try{
        seedPrice = await fetchXahUsdPrice();
      }catch{
        // continue to cache seed fallback below
      }
    }
    if (!Number.isFinite(seedPrice) || seedPrice <= 0){
      for (const [k, v] of dexChartCache.entries()){
        if (!String(k).startsWith("xah:")) continue;
        if (!v || !Array.isArray(v.series) || !v.series.length) continue;
        const c = Number(v.series[v.series.length - 1]?.c);
        if (Number.isFinite(c) && c > 0){
          seedPrice = c;
          break;
        }
      }
    }
    if (Number.isFinite(seedPrice) && seedPrice > 0){
      const count = Math.max(8, Math.min(60, dayParam));
      const now = Date.now();
      const stepMs = Math.max(60_000, Math.floor((dayParam * 24 * 60 * 60 * 1000) / count));
      const series = Array.from({ length: count }, (_, i) => {
        const t = now - ((count - 1 - i) * stepMs);
        return { t, o: seedPrice, h: seedPrice, l: seedPrice, c: seedPrice };
      });
      return { series, alreadyUsd: true };
    }

    return { series: [], alreadyUsd: true };
  }

  const base = chartPairBase(token);
  if (!base) return { series: [], alreadyUsd: false };
  const interval = days > 180 ? "1w" : "1d";
  const limit = days > 180 ? Math.ceil(days / 7) : days;
  const url = `https://data.xahau.network/v1/iou/market_data/${encodeURIComponent(base)}/XAH?interval=${interval}&limit=${Math.max(1, Math.min(400, limit))}&descending=true`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error("chart fetch failed");
  const arr = await resp.json();
  if (!Array.isArray(arr)) return { series: [], alreadyUsd: false };
  const series = arr
    .map((x) => ({
      t: Date.parse(x.timestamp),
      o: Number(x.open),
      h: Number(x.high),
      l: Number(x.low),
      c: Number(x.close)
    }))
    .filter((x) =>
      Number.isFinite(x.t) &&
      Number.isFinite(x.o) &&
      Number.isFinite(x.h) &&
      Number.isFinite(x.l) &&
      Number.isFinite(x.c) &&
      x.h > 0 &&
      x.l > 0
    )
    .sort((a, b) => a.t - b.t);
  return { series, alreadyUsd: false };
}
function fmtPct(n){
  if (!Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
function fmtChartScalar(n, maxDecimals = 5){
  if (!Number.isFinite(n)) return "-";
  const abs = Math.abs(Number(n));
  let decimals = 2;
  if (abs < 1) decimals = 4;
  if (abs < 0.1) decimals = 5;
  if (abs < 0.01) decimals = maxDecimals;
  return Number(n).toFixed(decimals).replace(/0+$/,"").replace(/\.$/,"");
}
function fmtChartPrice(v, { hasUsd, alreadyUsd, xahUsd }){
  if (!Number.isFinite(v)) return "-";
  if (!hasUsd){
    return `${fmtChartScalar(v, 5)} XAH`;
  }
  const usdValue = alreadyUsd ? Number(v) : (Number(v) * Number(xahUsd));
  if (!Number.isFinite(usdValue)) return "-";
  return `$${fmtChartScalar(usdValue, 5)}`;
}
function fmtChartAxisPrice(v, { axisInUsd, alreadyUsd, xahUsd }){
  if (!Number.isFinite(v)) return "-";
  if (axisInUsd){
    const usdValue = alreadyUsd ? Number(v) : (Number(v) * Number(xahUsd));
    if (!Number.isFinite(usdValue)) return "-";
    const absUsd = Math.abs(usdValue);
    const decimals = absUsd >= 1 ? 2 : 4;
    return `${usdValue.toFixed(decimals)} USD`;
  }
  const xahValue = alreadyUsd ? (Number(v) / Number(xahUsd)) : Number(v);
  if (!Number.isFinite(xahValue)) return "-";
  return `${Math.round(xahValue)} XAH`;
}
function renderDexChart(series, xahUsd = NaN, alreadyUsd = false){
  if (!dexChartMeta || !dexChartEmpty || !dexChartLow || !dexChartHigh || !dexChartLast || !dexChartGrid || !dexChartCandles){
    return;
  }
  const hasUsd = alreadyUsd || (Number.isFinite(xahUsd) && xahUsd > 0);
  const toDisplay = (v) => fmtChartPrice(v, { hasUsd, alreadyUsd, xahUsd });

  dexChartGrid.innerHTML = "";
  dexChartCandles.innerHTML = "";
  if (dexChartAxis) dexChartAxis.innerHTML = "";
  if (!series.length){
    dexChartMeta.textContent = "no data";
    dexChartEmpty.style.display = "";
    dexChartEmpty.textContent = "No historical DEX candles found for this pair.";
    dexChartLow.textContent = "-";
    dexChartHigh.textContent = "-";
    dexChartLast.textContent = "-";
    if (dexChartChange) dexChartChange.textContent = "-";
    if (dexChartRange) dexChartRange.textContent = "-";
    return;
  }

  const highs = series.map((p) => p.h);
  const lows = series.map((p) => p.l);
  const minY = Math.min(...lows);
  const maxY = Math.max(...highs);
  const ns = "http://www.w3.org/2000/svg";

  const gridLevels = 4;
  const plotXMin = 0;
  const plotXMax = 100;
  const axisSpanRaw = Math.max(1e-9, maxY - minY);
  const roughStep = axisSpanRaw / Math.max(1, gridLevels - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.max(1e-12, roughStep))));
  const stepFrac = roughStep / pow10;
  const niceFrac = stepFrac <= 1 ? 1 : (stepFrac <= 2 ? 2 : (stepFrac <= 5 ? 5 : 10));
  const axisStepRaw = Math.max(1e-12, niceFrac * pow10);
  let axisTopRaw = Math.ceil(maxY / axisStepRaw) * axisStepRaw;
  let axisBottomRaw = axisTopRaw - axisStepRaw * (gridLevels - 1);
  if (axisBottomRaw > minY){
    axisBottomRaw = Math.floor(minY / axisStepRaw) * axisStepRaw;
    axisTopRaw = axisBottomRaw + axisStepRaw * (gridLevels - 1);
  }
  const axisSpanFinal = Math.max(1e-9, axisTopRaw - axisBottomRaw);
  const yFrom = (v) => 93 - ((v - axisBottomRaw) / axisSpanFinal) * 86;
  const axisInUsd = isNativeXahToken(activeToken);
  for (let i = 0; i < gridLevels; i++){
    const t = i / (gridLevels - 1);
    const y = 7 + (t * 86);
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(plotXMin));
    line.setAttribute("x2", String(plotXMax));
    line.setAttribute("y1", y.toFixed(2));
    line.setAttribute("y2", y.toFixed(2));
    dexChartGrid.appendChild(line);

    if (dexChartAxis){
      const valRaw = axisTopRaw - (axisStepRaw * i);
      const tick = document.createElement("div");
      tick.className = "chartAxisTick";
      tick.style.top = `${y.toFixed(2)}%`;
      tick.textContent = fmtChartAxisPrice(valRaw, { axisInUsd, alreadyUsd, xahUsd });
      dexChartAxis.appendChild(tick);
    }
  }

  const n = series.length;
  const plotW = Math.max(1, plotXMax - plotXMin);
  const step = plotW / n;
  const bodyW = Math.max(0.4, Math.min(1.5, step * 0.34));
  for (let i = 0; i < n; i++){
    const c = series[i];
    const cx = plotXMin + (i + 0.5) * step;
    const yH = yFrom(c.h);
    const yL = yFrom(c.l);
    const yO = yFrom(c.o);
    const yC = yFrom(c.c);
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const bodyH = Math.max(0.65, bot - top);
    const up = c.c >= c.o;

    const wick = document.createElementNS(ns, "line");
    wick.setAttribute("x1", cx.toFixed(2));
    wick.setAttribute("x2", cx.toFixed(2));
    wick.setAttribute("y1", yH.toFixed(2));
    wick.setAttribute("y2", yL.toFixed(2));
    dexChartCandles.appendChild(wick);

    const body = document.createElementNS(ns, "rect");
    body.setAttribute("x", (cx - bodyW / 2).toFixed(2));
    body.setAttribute("y", top.toFixed(2));
    body.setAttribute("width", bodyW.toFixed(2));
    body.setAttribute("height", bodyH.toFixed(2));
    body.setAttribute("rx", "0.25");
    body.setAttribute("class", up ? "candleUp" : "candleDn");
    dexChartCandles.appendChild(body);
  }

  dexChartEmpty.style.display = "none";
  dexChartMeta.textContent = `${dexChartRangeDays}D | ${series.length} candles`;
  const first = series[0].c;
  const last = series[series.length - 1].c;
  const changePct = first > 0 ? ((last - first) / first) * 100 : NaN;
  const rangePct = minY > 0 ? ((maxY - minY) / minY) * 100 : NaN;

  dexChartLow.textContent = toDisplay(minY);
  dexChartHigh.textContent = toDisplay(maxY);
  dexChartLast.textContent = toDisplay(last);
  if (dexChartChange) dexChartChange.textContent = fmtPct(changePct);
  if (dexChartRange) dexChartRange.textContent = fmtPct(rangePct);
}
async function loadDexChartHistory(){
  const reqNonce = ++dexChartReqNonce;
  if (!activeToken){
    renderDexChart([], NaN, false);
    return;
  }
  const tokenAtRequest = activeToken;
  const daysAtRequest = dexChartRangeDays;
  const cached = readDexChartCache(tokenAtRequest, daysAtRequest);
  const chartTaskId = beginLoadBarTask(`Loading ${activeToken.symbol || "token"} chart...`, 12);
  setDexRangeButtons();
  if (!cached){
    if (dexChartMeta) dexChartMeta.textContent = "loading";
    if (dexChartEmpty){
      dexChartEmpty.textContent = "Loading chart...";
      dexChartEmpty.style.display = "";
    }
  } else {
    renderDexChart(cached.series, Number.isFinite(xahUsdCache.px) ? xahUsdCache.px : NaN, Boolean(cached.alreadyUsd));
    if (dexChartMeta){
      const ageSec = Math.max(0, Math.floor((Date.now() - cached.ts) / 1000));
      dexChartMeta.textContent = `${daysAtRequest}D | ${cached.series.length} candles | cached ${ageSec}s`;
    }
  }
  try{
    updateLoadBarTask(chartTaskId, { label: `Loading ${activeToken.symbol || "token"} chart candles...`, target: 40 });
    const xahUsdTask = isNativeXahToken(tokenAtRequest)
      ? Promise.resolve(Number.isFinite(xahUsdCache.px) ? xahUsdCache.px : NaN)
      : (async () => {
          try{
            return await fetchXahUsdPrice();
          }catch{
            return Number.isFinite(xahUsdCache.px) ? xahUsdCache.px : NaN;
          }
        })();
    const [hist, xahUsd] = await Promise.all([
      fetchDexChartHistory(tokenAtRequest, daysAtRequest),
      xahUsdTask
    ]);
    if (reqNonce !== dexChartReqNonce) return;
    updateLoadBarTask(chartTaskId, { label: `Rendering ${activeToken.symbol || "token"} chart...`, target: 86 });
    renderDexChart(hist.series || [], xahUsd, Boolean(hist.alreadyUsd));
    writeDexChartCache(tokenAtRequest, daysAtRequest, hist);
  }catch{
    if (reqNonce !== dexChartReqNonce) return;
    const fallback = readDexChartCache(tokenAtRequest, daysAtRequest);
    if (fallback){
      renderDexChart(
        fallback.series || [],
        Number.isFinite(xahUsdCache.px) ? xahUsdCache.px : NaN,
        Boolean(fallback.alreadyUsd)
      );
      if (dexChartMeta) dexChartMeta.textContent = `${daysAtRequest}D | ${fallback.series.length} candles | showing cached`;
    } else {
      if (dexChartMeta) dexChartMeta.textContent = "api error";
      renderDexChart([], NaN, false);
    }
  } finally {
    endLoadBarTask(chartTaskId, "Chart updated");
  }
}
function stopLiquidityPolling(){
  if (!liquidityPollTimer) return;
  clearInterval(liquidityPollTimer);
  liquidityPollTimer = null;
}
function startLiquidityPolling(){
  stopLiquidityPolling();
  liquidityPollTimer = setInterval(() => {
    if (document.hidden) return;
    refreshLiquidityPanel();
  }, LIQUIDITY_POLL_MS);
}
function getLiquidityProfile(token){
  const raw = String(token?.liquidityProfile || (isNativeXahToken(token) ? "commercial" : "alt")).toLowerCase();
  return raw === "commercial" ? "commercial" : "alt";
}
function getLiquidityScale(token){
  const raw = String(token?.liquidityScoreScale || "D").toUpperCase();
  return LIQUIDITY_SCORE_SCALES[raw] ? raw : "D";
}
function getLiquidityScoreConfig(token){
  const profile = getLiquidityProfile(token);
  const profileDefaults = LIQUIDITY_PROFILE_DEFAULTS[profile];
  const scale = getLiquidityScale(token);
  const scaleConfig = LIQUIDITY_SCORE_SCALES[scale];

  const depthTargetUsd = Number.isFinite(Number(token?.liquidityDepthTargetUsd))
    ? Math.max(1, Number(token.liquidityDepthTargetUsd))
    : profileDefaults.depthTargetUsd;
  const spreadGoodBps = Number.isFinite(Number(token?.liquiditySpreadGoodBps))
    ? Math.max(1, Number(token.liquiditySpreadGoodBps))
    : profileDefaults.spreadGoodBps;
  const spreadBadBps = Number.isFinite(Number(token?.liquiditySpreadBadBps))
    ? Math.max(spreadGoodBps + 1, Number(token.liquiditySpreadBadBps))
    : profileDefaults.spreadBadBps;

  return {
    profile,
    scale,
    depthTargetUsd,
    spreadGoodBps,
    spreadBadBps,
    depthWeight: scaleConfig.depthWeight,
    spreadWeight: scaleConfig.spreadWeight,
  };
}
function getTierByPct(tiers, pct){
  const target = Number(pct);
  return (Array.isArray(tiers) ? tiers : []).find((t) => Math.abs(Number(t?.pct) - target) < 1e-9) || null;
}
function fmtSlipPct(pct){
  const n = Number(pct);
  return Number.isFinite(n) ? `${Math.round(n * 100)}%` : "-";
}
function fmtSpreadPctFromBps(spreadBps){
  if (!Number.isFinite(spreadBps)) return "-";
  return `${(spreadBps / 100).toFixed(2)}%`;
}
function formatLiquidityProfileLabel(profile){
  return profile === "commercial" ? "Commercial" : "Alt";
}
function spreadScoreFromBps(spreadBps, goodBps, badBps){
  if (!Number.isFinite(spreadBps)) return 0;
  if (spreadBps <= goodBps) return 100;
  if (spreadBps >= badBps) return 0;
  const ratio = (spreadBps - goodBps) / (badBps - goodBps);
  return clamp((1 - ratio) * 100, 0, 100);
}
function buildLiquidityScore({ token, tierDepthsUsd, spreadBps, hasTwoSided }){
  const config = getLiquidityScoreConfig(token);
  if (!hasTwoSided){
    return { score: 0, depthScore: 0, spreadScore: 0, config };
  }

  const tierWeights = new Map([
    [0.01, 0.12],
    [0.02, 0.18],
    [0.05, 0.28],
    [0.10, 0.22],
    [0.20, 0.20],
  ]);

  let weightedDepth = 0;
  for (const pct of LIQUIDITY_TIER_PCTS){
    const tier = getTierByPct(tierDepthsUsd, pct);
    const accessibleUsd = Number(tier?.accessibleUsd);
    const tierTarget = config.depthTargetUsd * (LIQUIDITY_TIER_TARGET_MULTIPLIERS.get(pct) || 1);
    const normalized = Number.isFinite(accessibleUsd)
      ? clamp(accessibleUsd / tierTarget, 0, 1)
      : 0;
    weightedDepth += normalized * (tierWeights.get(pct) || 0);
  }

  const depthScore = clamp(weightedDepth * 100, 0, 100);
  const spreadScore = spreadScoreFromBps(spreadBps, config.spreadGoodBps, config.spreadBadBps);
  const score = Math.round(clamp(
    (depthScore * config.depthWeight) + (spreadScore * config.spreadWeight),
    0,
    100
  ));

  return { score, depthScore, spreadScore, config };
}
function depthBySlippage(asks, bids, bestAsk, bestBid, pct){
  const buyMax = bestAsk * (1 + pct);
  const sellMin = bestBid * (1 - pct);
  let buyDepthXah = 0;
  let sellDepthXah = 0;

  for (const a of asks){
    if (a.price <= buyMax) buyDepthXah += a.xah;
  }
  for (const b of bids){
    if (b.price >= sellMin) sellDepthXah += b.xah;
  }

  return {
    pct,
    buyDepthXah,
    sellDepthXah,
    accessibleXah: Math.min(buyDepthXah, sellDepthXah)
  };
}
function renderLiquidityMetrics(items){
  if (!liqDepthRow) return;
  liqDepthRow.innerHTML = "";
  for (const m of items){
    const card = el("div", "metric");
    card.appendChild(el("div", "k", m.k));
    card.appendChild(el("div", "v", m.v));
    liqDepthRow.appendChild(card);
  }
}
async function fetchLiquiditySnapshot(token){
  const tokenCurrency = getTokenCurrency(token);
  if (!token?.ws || !token?.issuer || !tokenCurrency){
    throw new Error("missing token market params");
  }

  const ws = new WebSocket(token.ws);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("liquidity ws connect failed")), { once: true });
  });

  try{
    const tokenAmount = { currency: tokenCurrency, issuer: token.issuer };
    // Xahau book_offers expects native amount in object form (not drops string).
    const xahAmount = { currency: "XAH" };

    const [asksRes, bidsRes] = await Promise.all([
      wsRequest(ws, {
        command: "book_offers",
        ledger_index: "validated",
        taker_gets: tokenAmount,
        taker_pays: xahAmount,
        limit: 120
      }),
      wsRequest(ws, {
        command: "book_offers",
        ledger_index: "validated",
        taker_gets: xahAmount,
        taker_pays: tokenAmount,
        limit: 120
      })
    ]);

    const asks = calcDepthFromOffers(asksRes?.offers || [], "asks");
    const bids = calcDepthFromOffers(bidsRes?.offers || [], "bids");

    const bestAsk = asks.length ? Math.min(...asks.map((x) => x.price)) : NaN;
    const bestBid = bids.length ? Math.max(...bids.map((x) => x.price)) : NaN;
    const hasTwoSided = Number.isFinite(bestAsk) && Number.isFinite(bestBid) && bestAsk > 0 && bestBid > 0;
    const mid = hasTwoSided ? (bestAsk + bestBid) / 2 : NaN;
    const spreadBps = hasTwoSided && mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : NaN;

    const tierDepths = (Number.isFinite(mid) && mid > 0)
      ? LIQUIDITY_TIER_PCTS.map((pct) => depthBySlippage(asks, bids, bestAsk, bestBid, pct))
      : [];
    const tier2 = getTierByPct(tierDepths, 0.02);
    const tier5 = getTierByPct(tierDepths, 0.05);
    const tier10 = getTierByPct(tierDepths, 0.10);
    const tier20 = getTierByPct(tierDepths, 0.20);

    const accessibleXah = hasTwoSided ? Number(tier2?.accessibleXah || 0) : 0;
    const buyDepthXah = Number(tier2?.buyDepthXah || 0);
    const sellDepthXah = Number(tier2?.sellDepthXah || 0);
    const imbalanceRatio = (hasTwoSided && buyDepthXah > 0) ? (sellDepthXah / buyDepthXah) : NaN;

    return {
      asksCount: asks.length,
      bidsCount: bids.length,
      bestAsk,
      bestBid,
      mid,
      spreadBps,
      buyDepthXah,
      sellDepthXah,
      tierDepths,
      tier2,
      tier5,
      tier10,
      tier20,
      imbalanceRatio,
      accessibleXah,
      hasTwoSided
    };
  } finally {
    ws.close();
  }
}
async function fetchBitrueXahLiquiditySnapshot(){
  const now = Date.now();
  if (xahBitrueSnapshotCache.snap && (now - xahBitrueSnapshotCache.ts) < 10000){
    return xahBitrueSnapshotCache.snap;
  }
  const fetchWithTimeout = async (url, timeoutMs = 12000) => {
    const ctrl = new AbortController();
    const fetchPromise = fetch(url, { cache: "no-store", signal: ctrl.signal });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        try{ ctrl.abort(); }catch{}
        reject(new Error("bitrue timeout"));
      }, timeoutMs);
    });
    return await Promise.race([fetchPromise, timeoutPromise]);
  };
  const depthUrl = "https://www.bitrue.com/api/v1/depth?symbol=XAHUSDT&limit=100";
  const tickerUrl = "https://www.bitrue.com/api/v1/ticker/24hr?symbol=XAHUSDT";

  const [depthResp, tickerResp] = await Promise.all([
    fetchWithTimeout(depthUrl),
    fetchWithTimeout(tickerUrl)
  ]);
  if (!depthResp.ok || !tickerResp.ok){
    throw new Error(`bitrue http depth:${depthResp.status} ticker:${tickerResp.status}`);
  }

  const depth = await depthResp.json();
  const tickerRaw = await tickerResp.json();
  const ticker = Array.isArray(tickerRaw) ? (tickerRaw[0] || {}) : (tickerRaw || {});

  const mapBook = (rows) => (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const price = Number(r?.[0]);
      const qty = Number(r?.[1]);
      return {
        price,
        qty,
        usd: price * qty
      };
    })
    .filter((x) => Number.isFinite(x.price) && x.price > 0 && Number.isFinite(x.qty) && x.qty > 0 && Number.isFinite(x.usd) && x.usd > 0);

  const bids = mapBook(depth?.bids);
  const asks = mapBook(depth?.asks);
  const bestBid = bids.length ? Math.max(...bids.map((x) => x.price)) : NaN;
  const bestAsk = asks.length ? Math.min(...asks.map((x) => x.price)) : NaN;
  const hasTwoSided = Number.isFinite(bestAsk) && Number.isFinite(bestBid) && bestAsk > 0 && bestBid > 0;
  const mid = hasTwoSided ? (bestAsk + bestBid) / 2 : NaN;
  const spreadBps = hasTwoSided && mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : NaN;

  const depthByPct = (pct) => {
    if (!hasTwoSided) return { pct, buyDepthUsd: 0, sellDepthUsd: 0, buyDepthXah: 0, sellDepthXah: 0, accessibleUsd: 0, accessibleXah: 0 };
    const buyMax = bestAsk * (1 + pct);
    const sellMin = bestBid * (1 - pct);

    let buyDepthUsd = 0;
    let sellDepthUsd = 0;
    let buyDepthXah = 0;
    let sellDepthXah = 0;

    for (const a of asks){
      if (a.price <= buyMax){
        buyDepthUsd += a.usd;
        buyDepthXah += a.qty;
      }
    }
    for (const b of bids){
      if (b.price >= sellMin){
        sellDepthUsd += b.usd;
        sellDepthXah += b.qty;
      }
    }

    const accessibleUsd = Math.min(buyDepthUsd, sellDepthUsd);
    const refPx = mid > 0 ? mid : bestBid;
    const accessibleXah = refPx > 0 ? (accessibleUsd / refPx) : 0;
    return { pct, buyDepthUsd, sellDepthUsd, buyDepthXah, sellDepthXah, accessibleUsd, accessibleXah };
  };

  const tierDepths = LIQUIDITY_TIER_PCTS.map((pct) => depthByPct(pct));
  const tier2 = getTierByPct(tierDepths, 0.02);
  const tier5 = getTierByPct(tierDepths, 0.05);
  const tier10 = getTierByPct(tierDepths, 0.10);
  const tier20 = getTierByPct(tierDepths, 0.20);

  const accessibleXah = Number(tier2?.accessibleXah || 0);
  const accessibleUsd = Number(tier2?.accessibleUsd || 0);
  const imbalanceRatio = Number(tier2?.buyDepthUsd) > 0 ? (tier2.sellDepthUsd / tier2.buyDepthUsd) : NaN;

  const lastPrice = Number(ticker?.lastPrice);
  const volume24hUsd = Number(ticker?.quoteVolume);

  const snap = {
    bidsCount: bids.length,
    asksCount: asks.length,
    bestBid,
    bestAsk,
    mid,
    spreadBps,
    lastPrice,
    volume24hUsd,
    tierDepths,
    tier2,
    tier5,
    tier10,
    tier20,
    accessibleUsd,
    accessibleXah,
    imbalanceRatio,
    hasTwoSided
  };
  xahBitrueSnapshotCache = { ts: now, snap };
  return snap;
}
async function fetchBitrueXahTickerOnly(){
  const url = "https://www.bitrue.com/api/v1/ticker/24hr?symbol=XAHUSDT";
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error("bitrue ticker http");
  const raw = await resp.json();
  const t = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
  const bestBid = Number(t?.bidPrice);
  const bestAsk = Number(t?.askPrice);
  const lastPrice = Number(t?.lastPrice);
  const volume24hUsd = Number(t?.quoteVolume);
  const hasTwoSided = Number.isFinite(bestBid) && Number.isFinite(bestAsk) && bestBid > 0 && bestAsk > 0;
  const mid = hasTwoSided ? (bestBid + bestAsk) / 2 : (Number.isFinite(lastPrice) && lastPrice > 0 ? lastPrice : NaN);
  const spreadBps = hasTwoSided && mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : NaN;
  return { bestBid, bestAsk, lastPrice, volume24hUsd, mid, spreadBps, hasTwoSided };
}
async function refreshLiquidityPanel(){
  if (liquidityBusy) return;
  const tokenId = String(activeToken?.id || "");
  const now = Date.now();
  if (hasLiquidityDataRendered && tokenId === lastLiquidityTokenId && (now - lastLiquidityRunTs) < LIQUIDITY_MIN_REFRESH_MS){
    return;
  }
  liquidityBusy = true;
  lastLiquidityRunTs = now;
  lastLiquidityTokenId = tokenId;
  const reqNonce = ++liquidityReqNonce;
  const token = activeToken;
  if (!token){
    resetLiquidityPanel("-");
    setHeroUsdPrice("-");
    liquidityBusy = false;
    return;
  }
  const tokenLoadKey = String(token?.id || token?.symbol || "token");
  const shouldShowLiquidityBar = !liquidityFirstLoadShownByToken.has(tokenLoadKey) || !hasLiquidityDataRendered;
  const liquidityTaskId = shouldShowLiquidityBar
    ? beginLoadBarTask(`Loading ${token.symbol || "token"} book depth...`, 12)
    : null;

  if (isNativeXahToken(token)){
    try{
      if (!hasLiquidityDataRendered){
        setLiquidityMetaText("loading XAH/USDT depth...");
      }
      // Keep price responsive even if depth endpoint is slow/unavailable.
      try{
        const xahUsdEarly = await fetchXahUsdPrice();
        if (reqNonce === liquidityReqNonce && token === activeToken && Number.isFinite(xahUsdEarly)){
          setHeroUsdPrice(fmtUsd(xahUsdEarly));
        }
      }catch{
        // keep existing price while depth loads
      }
      updateLoadBarTask(liquidityTaskId, { label: "Loading XAH/USDT depth from Bitrue...", target: 42 });
      const snap = await fetchBitrueXahLiquiditySnapshot();
      if (reqNonce !== liquidityReqNonce || token !== activeToken) return;

      updateLoadBarTask(liquidityTaskId, { label: "Scoring XAH liquidity...", target: 78 });
      const scoreState = buildLiquidityScore({
        token,
        tierDepthsUsd: snap.tierDepths,
        spreadBps: snap.spreadBps,
        hasTwoSided: snap.hasTwoSided
      });
      if (liqScoreEl) liqScoreEl.textContent = String(scoreState.score);
      if (liqBar) liqBar.style.width = `${scoreState.score}%`;
      setLiquidityMetaText(`${snap.bidsCount} bids | ${snap.asksCount} asks | Bitrue XAH/USDT`);

      if (snap.hasTwoSided){
        if (liqSpreadEl) liqSpreadEl.textContent = `${snap.spreadBps.toFixed(1)} bps spread`;
        const t2 = getTierByPct(snap.tierDepths, 0.02);
        const t5 = getTierByPct(snap.tierDepths, 0.05);
        const t10 = getTierByPct(snap.tierDepths, 0.10);
        const t20 = getTierByPct(snap.tierDepths, 0.20);
        renderLiquidityMetrics([
          { k: "Accessible USD (2% slip)", v: Number.isFinite(t2?.accessibleUsd) ? fmtUsd(t2.accessibleUsd) : "-" },
          { k: "Accessible USD (5% slip)", v: Number.isFinite(t5?.accessibleUsd) ? fmtUsd(t5.accessibleUsd) : "-" },
          { k: "Accessible USD (10% slip)", v: Number.isFinite(t10?.accessibleUsd) ? fmtUsd(t10.accessibleUsd) : "-" },
          { k: "Accessible USD (20% slip)", v: Number.isFinite(t20?.accessibleUsd) ? fmtUsd(t20.accessibleUsd) : "-" },
          { k: "Spread %", v: fmtSpreadPctFromBps(snap.spreadBps) },
          { k: "Liquidity Profile", v: `${formatLiquidityProfileLabel(scoreState.config.profile)} (${scoreState.config.scale})` }
        ]);
        setHeroUsdPrice(fmtUsd(snap.mid));
      } else {
        if (liqSpreadEl) liqSpreadEl.textContent = "one-sided or empty book";
        renderLiquidityMetrics([
          { k: "Best Bid", v: Number.isFinite(snap.bestBid) ? fmtUsd(snap.bestBid) : "-" },
          { k: "Best Ask", v: Number.isFinite(snap.bestAsk) ? fmtUsd(snap.bestAsk) : "-" },
          { k: "24h Volume (USDT)", v: Number.isFinite(snap.volume24hUsd) ? fmtUsd(snap.volume24hUsd) : "-" },
          { k: "Last Price", v: Number.isFinite(snap.lastPrice) ? fmtUsd(snap.lastPrice) : "-" },
          { k: "Spread %", v: fmtSpreadPctFromBps(snap.spreadBps) },
          { k: "Liquidity Profile", v: `${formatLiquidityProfileLabel(scoreState.config.profile)} (${scoreState.config.scale})` }
        ]);
        setHeroUsdPrice(Number.isFinite(snap.lastPrice) ? fmtUsd(snap.lastPrice) : "-");
      }

      if (liqNote){
        const tierText = LIQUIDITY_TIER_PCTS
          .map((pct) => {
            const tier = getTierByPct(snap.tierDepths, pct);
            const v = Number.isFinite(tier?.accessibleUsd) ? fmtUsd(tier.accessibleUsd) : "-";
            return `${fmtSlipPct(pct)} ${v}`;
          })
          .join(" | ");
        liqNote.textContent = `Bitrue XAH/USDT depth tiers: ${tierText}. Target ${fmtUsd(scoreState.config.depthTargetUsd)} (${formatLiquidityProfileLabel(scoreState.config.profile)}, scale ${scoreState.config.scale}).`;
      }
      hasLiquidityDataRendered = true;
      liquidityFirstLoadShownByToken.add(tokenLoadKey);
    }catch(err){
      if (reqNonce !== liquidityReqNonce || token !== activeToken) return;
      let usedTickerFallback = false;
      try{
        const tick = await fetchBitrueXahTickerOnly();
        if (reqNonce === liquidityReqNonce && token === activeToken){
          usedTickerFallback = true;
          if (liqScoreEl) liqScoreEl.textContent = "0";
          if (liqBar) liqBar.style.width = "0%";
          setLiquidityMetaText("ticker fallback (depth unavailable)");
          if (liqSpreadEl) liqSpreadEl.textContent = Number.isFinite(tick.spreadBps) ? `${tick.spreadBps.toFixed(1)} bps spread` : "depth unavailable";
          renderLiquidityMetrics([
            { k: "Best Bid", v: Number.isFinite(tick.bestBid) ? fmtUsd(tick.bestBid) : "-" },
            { k: "Best Ask", v: Number.isFinite(tick.bestAsk) ? fmtUsd(tick.bestAsk) : "-" },
            { k: "24h Volume (USDT)", v: Number.isFinite(tick.volume24hUsd) ? fmtUsd(tick.volume24hUsd) : "-" },
            { k: "Last Price", v: Number.isFinite(tick.lastPrice) ? fmtUsd(tick.lastPrice) : "-" },
            { k: "Spread %", v: fmtSpreadPctFromBps(tick.spreadBps) },
            { k: "Liquidity Profile", v: `${formatLiquidityProfileLabel(getLiquidityScoreConfig(token).profile)} (${getLiquidityScoreConfig(token).scale})` }
          ]);
          setHeroUsdPrice(Number.isFinite(tick.lastPrice) ? fmtUsd(tick.lastPrice) : (Number.isFinite(tick.mid) ? fmtUsd(tick.mid) : "-"));
          if (liqNote) liqNote.textContent = "Bitrue depth failed; showing ticker fallback until depth responds.";
          hasLiquidityDataRendered = true;
        }
      }catch{
        usedTickerFallback = false;
      }
      if (!usedTickerFallback){
        if (!hasLiquidityDataRendered){
          resetLiquidityPanel("bitrue unavailable");
          setLiquidityMetaText(`api error: ${String(err?.message || err || "unknown")}`);
          if (liqSpreadEl) liqSpreadEl.textContent = "XAH/USDT book unavailable";
          if (liqNote) liqNote.textContent = "Bitrue API failed. Falling back to USD price only.";
        } else {
          setLiquidityMetaText(`api error (showing last): ${String(err?.message || err || "unknown")}`);
        }
      }
      try{
        const xahUsd = await fetchXahUsdPrice();
        if (reqNonce === liquidityReqNonce && token === activeToken){
          if (!hasLiquidityDataRendered) setHeroUsdPrice(fmtUsd(xahUsd));
        }
      }catch{
        if (reqNonce === liquidityReqNonce && token === activeToken){
          if (!hasLiquidityDataRendered) setHeroUsdPrice("-");
        }
      }
    } finally {
      liquidityBusy = false;
      endLoadBarTask(liquidityTaskId, "Liquidity updated");
    }
    return;
  }

  try{
    updateLoadBarTask(liquidityTaskId, { label: `Loading ${token.symbol || "token"} order book depth...`, target: 42 });
    const snap = await fetchLiquiditySnapshot(token);
    if (reqNonce !== liquidityReqNonce || token !== activeToken) return;

    setLiquidityMetaText(`${snap.bidsCount} bids | ${snap.asksCount} asks`);

    let xahUsd = NaN;
    try{
      xahUsd = await fetchXahUsdPrice();
    }catch{
      xahUsd = Number.isFinite(xahUsdCache.px) ? xahUsdCache.px : NaN;
    }
    updateLoadBarTask(liquidityTaskId, { label: `Scoring ${token.symbol || "token"} liquidity...`, target: 78 });
    const toUsd = (xahAmt) => {
      const n = Number(xahAmt);
      return (Number.isFinite(n) && Number.isFinite(xahUsd) && xahUsd > 0) ? fmtUsd(n * xahUsd) : "-";
    };
    const tierDepthsUsd = (Array.isArray(snap.tierDepths) ? snap.tierDepths : []).map((t) => {
      const accessibleXah = Number(t?.accessibleXah);
      const buyDepthXah = Number(t?.buyDepthXah);
      const sellDepthXah = Number(t?.sellDepthXah);
      const toN = (x) => (Number.isFinite(x) && Number.isFinite(xahUsd) && xahUsd > 0) ? (x * xahUsd) : NaN;
      return {
        pct: Number(t?.pct),
        accessibleUsd: toN(accessibleXah),
        buyDepthUsd: toN(buyDepthXah),
        sellDepthUsd: toN(sellDepthXah),
      };
    });
    const scoreState = buildLiquidityScore({
      token,
      tierDepthsUsd,
      spreadBps: snap.spreadBps,
      hasTwoSided: snap.hasTwoSided
    });
    if (liqScoreEl) liqScoreEl.textContent = String(scoreState.score);
    if (liqBar) liqBar.style.width = `${scoreState.score}%`;

    if (snap.hasTwoSided){
      liqSpreadEl.textContent = `${snap.spreadBps.toFixed(1)} bps spread`;
      const t2 = getTierByPct(snap.tierDepths, 0.02);
      const t5 = getTierByPct(snap.tierDepths, 0.05);
      const t10 = getTierByPct(snap.tierDepths, 0.10);
      const t20 = getTierByPct(snap.tierDepths, 0.20);
      renderLiquidityMetrics([
        { k: "Accessible USD (2% slip)", v: toUsd(t2?.accessibleXah || 0) },
        { k: "Accessible USD (5% slip)", v: toUsd(t5?.accessibleXah || 0) },
        { k: "Accessible USD (10% slip)", v: toUsd(t10?.accessibleXah || 0) },
        { k: "Accessible USD (20% slip)", v: toUsd(t20?.accessibleXah || 0) },
        { k: "Spread %", v: fmtSpreadPctFromBps(snap.spreadBps) },
        { k: "Liquidity Profile", v: `${formatLiquidityProfileLabel(scoreState.config.profile)} (${scoreState.config.scale})` }
      ]);
      if (liqNote){
        const tierText = LIQUIDITY_TIER_PCTS
          .map((pct) => `${fmtSlipPct(pct)} ${toUsd(getTierByPct(snap.tierDepths, pct)?.accessibleXah || 0)}`)
          .join(" | ");
        liqNote.textContent = `CLOB depth only (book_offers). Depth tiers: ${tierText}. Target ${fmtUsd(scoreState.config.depthTargetUsd)} (${formatLiquidityProfileLabel(scoreState.config.profile)}, scale ${scoreState.config.scale}).`;
      }
      if (reqNonce === liquidityReqNonce && token === activeToken){
        setHeroUsdPrice(Number.isFinite(xahUsd) && xahUsd > 0 ? fmtUsd(snap.mid * xahUsd) : "-");
      }
      hasLiquidityDataRendered = true;
      liquidityFirstLoadShownByToken.add(tokenLoadKey);
    } else {
      liqSpreadEl.textContent = "one-sided or empty book";
      renderLiquidityMetrics([
        { k: "Accessible USD (2% slip)", v: "$0" },
        { k: "Best Bid", v: Number.isFinite(snap.bestBid) ? toUsd(snap.bestBid) : "-" },
        { k: "Best Ask", v: Number.isFinite(snap.bestAsk) ? toUsd(snap.bestAsk) : "-" },
        { k: "Book State", v: "needs both sides" },
        { k: "Spread %", v: fmtSpreadPctFromBps(snap.spreadBps) },
        { k: "Liquidity Profile", v: `${formatLiquidityProfileLabel(scoreState.config.profile)} (${scoreState.config.scale})` }
      ]);
      setHeroUsdPrice("-");
      hasLiquidityDataRendered = true;
      liquidityFirstLoadShownByToken.add(tokenLoadKey);
    }
  }catch{
    if (reqNonce !== liquidityReqNonce || token !== activeToken) return;
    if (!hasLiquidityDataRendered){
      resetLiquidityPanel("book depth unavailable");
      setLiquidityMetaText("ws error");
      setHeroUsdPrice("-");
    } else {
      setLiquidityMetaText("ws error (showing last liquidity snapshot)");
    }
  } finally {
    liquidityBusy = false;
    endLoadBarTask(liquidityTaskId, "Liquidity updated");
  }
}
let loadBarTimer = null;
let loadBarProgress = 0;
let loadBarTarget = 0;
const LOAD_BAR_TARGET_MAX = 98;
const loadBarTasks = new Map();
let loadBarTaskSeq = 0;
let richListLoadTaskId = null;

function stopLoadBarTimer(){
  if (!loadBarTimer) return;
  clearInterval(loadBarTimer);
  loadBarTimer = null;
}

function getLoadBarTopTask(){
  let top = null;
  for (const task of loadBarTasks.values()){
    if (!top || task.updatedAt > top.updatedAt){
      top = task;
    }
  }
  return top;
}

function syncLoadBarTargetFromTasks(){
  if (!loadBarTasks.size){
    loadBarTarget = 0;
    return;
  }
  let maxTarget = 6;
  for (const task of loadBarTasks.values()){
    maxTarget = Math.max(maxTarget, Number(task.target) || 0);
  }
  loadBarTarget = Math.max(0, Math.min(LOAD_BAR_TARGET_MAX, maxTarget));
}

function setLoadBarTextValue(text){
  if (!loadBarText) return;
  loadBarText.textContent = text || "Loading...";
}

function setLoadBarTarget(nextTarget, taskId = null){
  const clamped = Math.max(0, Math.min(LOAD_BAR_TARGET_MAX, Number(nextTarget) || 0));
  if (taskId && loadBarTasks.has(taskId)){
    const task = loadBarTasks.get(taskId);
    task.target = Math.max(Number(task.target) || 0, clamped);
    task.updatedAt = Date.now();
    loadBarTasks.set(taskId, task);
    syncLoadBarTargetFromTasks();
    return;
  }
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

function beginLoadBarTask(label, target = 8){
  const id = `task_${++loadBarTaskSeq}`;
  const task = {
    id,
    label: String(label || "Loading..."),
    target: Math.max(0, Math.min(LOAD_BAR_TARGET_MAX, Number(target) || 8)),
    updatedAt: Date.now()
  };
  loadBarTasks.set(id, task);
  syncLoadBarTargetFromTasks();
  if (loadBarWrap){
    loadBarWrap.classList.add("active");
    loadBarWrap.setAttribute("aria-hidden", "false");
  }
  if (!loadBarTimer){
    startLoadBarTimer();
  }
  setLoadBarTextValue(task.label);
  return id;
}

function updateLoadBarTask(id, { label, target } = {}){
  if (!id || !loadBarTasks.has(id)) return;
  const task = loadBarTasks.get(id);
  if (label != null) task.label = String(label);
  if (target != null){
    const clamped = Math.max(0, Math.min(LOAD_BAR_TARGET_MAX, Number(target) || 0));
    task.target = Math.max(Number(task.target) || 0, clamped);
  }
  task.updatedAt = Date.now();
  loadBarTasks.set(id, task);
  syncLoadBarTargetFromTasks();
  const top = getLoadBarTopTask();
  if (top) setLoadBarTextValue(top.label);
}

function endLoadBarTask(id, doneLabel = ""){
  if (!id) return;
  const existed = loadBarTasks.delete(id);
  if (!existed) return;

  if (loadBarTasks.size){
    syncLoadBarTargetFromTasks();
    const top = getLoadBarTopTask();
    if (top) setLoadBarTextValue(top.label);
    return;
  }

  stopLoadBarTimer();
  loadBarTarget = 100;
  if (loadBar) loadBar.style.width = "100%";
  if (doneLabel){
    setLoadBarTextValue(doneLabel);
  }

  setTimeout(() => {
    if (loadBarTasks.size) return;
    if (loadBarWrap){
      loadBarWrap.classList.remove("active");
      loadBarWrap.setAttribute("aria-hidden", "true");
    }
    if (loadBar) loadBar.style.width = "0%";
    setLoadBarTextValue("Loading...");
  }, 280);
}

function cancelRichListLoadUI(){
  richListLoadNonce += 1;
  setRichListLoading(false);
}
function setRichListLoading(isLoading){
  if (xahLoadRichlistBtn && isNativeXahToken(activeToken)){
    xahLoadRichlistBtn.disabled = Boolean(isLoading);
    xahLoadRichlistBtn.textContent = isLoading ? "Loading XAH Rich List..." : "Load XAH Rich List";
  }
  if (isLoading){
    if (!richListLoadTaskId){
      richListLoadTaskId = beginLoadBarTask(`Loading ${activeToken?.symbol || "token"} rich list...`, 10);
    } else {
      updateLoadBarTask(richListLoadTaskId, { label: `Loading ${activeToken?.symbol || "token"} rich list...`, target: 10 });
    }
    return;
  }

  endLoadBarTask(richListLoadTaskId, "Rich list loaded");
  richListLoadTaskId = null;
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
function csvEscape(value){
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)){
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}
function badgeLabelsFor(holder){
  const labels = [];
  const rules = sortBadgesByRequiredQty(
    getBadgeRules(activeToken).filter((r) => r.row !== false)
  );
  for (const rule of rules){
    if (!holderQualifiesBadge(holder, rule)) continue;
    labels.push(rule.rowLabel || rule.title || "Badge");
  }
  return labels;
}
function downloadRichlistCsv(){
  if (!allHolders.length){
    showToast("No rich list data to export");
    return;
  }

  const q = searchEl.value || "";
  const filteredList = filterHolders(allHolders, q, activeFilter);
  if (!filteredList.length){
    showToast("No filtered rows to export");
    return;
  }

  const lastAddress = allHolders[allHolders.length - 1]?.address;
  const header = ["Rank", "Address", "Balance", "PercentSupply", "Badges"];
  const lines = [header.map(csvEscape).join(",")];

  for (const h of filteredList){
    const holder = { ...h, isLast: Boolean(lastAddress && h.address === lastAddress) };
    const badges = badgeLabelsFor(holder).join(" | ");
    const row = [
      holder.rank,
      holder.address,
      Number.isFinite(holder.balance) ? holder.balance : 0,
      Number.isFinite(holder.pct) ? holder.pct.toFixed(6) : "0.000000",
      badges
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const tokenId = String(activeToken?.id || "token");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `richlist-${tokenId}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`CSV downloaded (${filteredList.length} rows)`);
}
function renderTable(){
  if (isNativeXahToken(activeToken) && renderedHoldersTokenId !== activeToken?.id){
    setRichlistIdleMessage("XAH rich list is on-demand. Click Load XAH Rich List to fetch wallet balances.");
    return;
  }

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
    const code = el("code", null, displayAddr(holder.address));
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

function renderTreasuryWallets(){
  if (!treasuryPane || !treasuryList || !treasuryMeta){
    return;
  }

  const wallets = getExcludedWallets(activeToken);
  treasuryList.innerHTML = "";

  if (!wallets.length){
    treasuryPane.style.display = "none";
    treasuryMeta.textContent = "";
    return;
  }

  treasuryPane.style.display = "block";
  treasuryMeta.textContent = `${wallets.length} ignored wallet${wallets.length === 1 ? "" : "s"}`;

  for (const wallet of wallets){
    const item = el("div", "treasuryItem");
    const code = el("code", null, displayAddr(wallet.address));
    code.title = wallet.address;

    const typeClass = wallet.kind === "Treasury" ? "treasuryType treasuryTypeGold" : "treasuryType";
    const type = el("span", typeClass, wallet.kind);

    const link = document.createElement("a");
    link.className = "copy";
    link.textContent = "Explorer";
    link.href = buildAccountExplorerUrl(wallet.address);
    link.target = "_blank";
    link.rel = "noreferrer";

    item.appendChild(code);
    item.appendChild(type);
    item.appendChild(link);
    treasuryList.appendChild(item);
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

  updateHeroMarketCap(statPriceUsdEl?.textContent || "");

  // Whale dominance
  whaleRow.innerHTML = "";
  const ns = (activeToken.whaleTopN || [1,3,5,10,25,50]).filter(x => x > 0);
  for (const n of ns){
    const m = el("div","metric");
    m.appendChild(el("div","k",`Top ${n}`));
    const v = el("div","v", holders.length ? `${computeTopN(holders, n).toFixed(2)}%` : "-");
    m.appendChild(v);
    whaleRow.appendChild(m);
  }
  whaleMeta.textContent = holders.length ? `${holders.length} holders` : "-";
  if (isNativeXahToken(activeToken) && xahApproxStatsMode){
    if (Number.isFinite(xahSupplySnapshot.accounts) && onePercentCountEl){
      onePercentCountEl.textContent = String(Math.floor(xahSupplySnapshot.accounts));
    }
    if (Number.isFinite(xahSupplySnapshot.accounts)) {
      whaleMeta.textContent = `${Math.floor(xahSupplySnapshot.accounts)} wallets (api est)`;
    }
  }

  // Decentralization score (simple Onyx metric)
  const top3 = holders.length ? computeTopN(holders, 3) : 0;
  const top10 = holders.length ? computeTopN(holders, 10) : 0;
  let score = 100 - (top3 + (top10/2));
  score = Math.max(0, Math.min(100, score));

  decentScoreEl.textContent = holders.length ? String(Math.round(score)) : "-";
  decentExplainEl.textContent = holders.length ? `Top3 ${top3.toFixed(1)}% | Top10 ${top10.toFixed(1)}%` : "-";
  decentBar.style.width = holders.length ? `${score}%` : "0%";

  // Supply breakdown
  const circulatingRaw = holders.reduce((acc, h) => acc + h.balance, 0);
  const circulating = (isNativeXahToken(activeToken) && Number.isFinite(xahSupplySnapshot.circulating) && xahSupplySnapshot.circulating > 0)
    ? xahSupplySnapshot.circulating
    : circulatingRaw;
  supplyMeta.textContent = holders.length ? `${fmt(circulating)} / ${fmt(activeToken.totalSupply)} circulating` : "-";

  const whaleThreshold = activeToken.totalSupply * 0.01;    // >= 1% of total supply
  const smallThreshold = activeToken.totalSupply * 0.001;   // < 0.1% of total supply

  const whaleSum = holders.reduce((acc, h) => h.balance >= whaleThreshold ? acc + h.balance : acc, 0);
  const smallSum = holders.reduce((acc, h) => h.balance < smallThreshold ? acc + h.balance : acc, 0);
  const whaleCount = holders.filter((h) => h.balance >= whaleThreshold).length;
  const smallCount = holders.filter((h) => h.balance < smallThreshold).length;

  const totals = [
    { name: "Circulating Supply", sum: circulating, extra: `${holders.length} holders` },
    { name: "Large Whale Holders", sum: whaleSum, extra: `${whaleCount} wallets (>=1%)` },
    { name: "Small Holders", sum: smallSum, extra: `${smallCount} wallets (<0.1%)` },
  ];

  bucketList.innerHTML = "";
  for (const b of totals){
    const pct = activeToken.totalSupply ? (b.sum / activeToken.totalSupply) * 100 : 0;
    const card = el("div","bucket");
    const top = el("div","bucketTop");
    top.appendChild(el("div","bucketName", b.name));
    top.appendChild(el("div","bucketVal", `${fmt(b.sum)} (${pct.toFixed(1)}%)`));
    card.appendChild(top);
    card.appendChild(el("div","miniNote", b.extra || ""));

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

async function fetchNativeXahHoldersFromWS({ wsUrl, excludedAddresses, limitPerPage=400, onProgress }){
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once:true });
    ws.addEventListener("error", () => reject(new Error("WebSocket failed to connect")), { once:true });
  });

  try{
    let marker = undefined;
    const holders = [];
    let page = 0;

    while (true){
      const req = {
        command: "ledger_data",
        ledger_index: "validated",
        type: "account",
        binary: false,
        limit: limitPerPage,
      };
      if (marker) req.marker = marker;

      const result = await wsRequest(ws, req);
      page += 1;

      const state = Array.isArray(result?.state) ? result.state : [];
      for (const entry of state){
        if (entry?.LedgerEntryType !== "AccountRoot") continue;
        const address = String(entry.Account || "").trim();
        if (!address) continue;
        if (excludedAddresses?.has(address)) continue;

        const drops = Number(entry.Balance);
        if (!Number.isFinite(drops) || drops <= 0) continue;

        holders.push({ address, balance: drops / 1_000_000 });
      }

      marker = result?.marker;
      onProgress?.({ page, count: holders.length, hasMore: Boolean(marker) });
      if (!marker) break;
    }

    holders.sort((a,b) => b.balance - a.balance);
    return holders;
  } finally {
    ws.close();
  }
}
/* ===== Load holders ===== */
async function loadHolders({ forceNetwork = false } = {}){
  const tokenAtRequest = activeToken;
  const reqNonce = ++richListLoadNonce;
  const isStale = () => reqNonce !== richListLoadNonce || tokenAtRequest !== activeToken;
  const finishIfFresh = () => {
    if (isStale()) return;
    renderTable();
    computeStats();
    setRichListLoading(false);
    refreshLiquidityPanel();
  };

  if (isNativeXahToken(tokenAtRequest)){
    xahApproxStatsMode = false;
    const ttlMs = getRichlistCacheTtlMs(tokenAtRequest);
    const cached = readRichlistCache(tokenAtRequest);
    const now = Date.now();
    const hasCached = Boolean(cached?.holders?.length);
    const cachedAgeMs = cached ? Math.max(0, now - cached.ts) : 0;
    const cacheFresh = !forceNetwork && cached && cachedAgeMs <= ttlMs;

    if (hasCached){
      allHolders = normalizeHolders(cached.holders);
      if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;
      renderTable();
      computeStats();
      const ageSec = Math.floor(cachedAgeMs / 1000);
      if (cacheFresh){
        setStatus(true, `cached (${ageSec}s old)`);
        finishIfFresh();
        return;
      }
      setStatus(true, `cached (${ageSec}s old), refreshing...`);
    } else {
      setStatus(true, "loading native wallets...");
      rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">Loading wallet balances...</td></tr>`;
    }

    setRichListLoading(true);

    try{
      const excludedAddresses = getExcludedAddressSet(tokenAtRequest);
      const info = await fetchXahSupplyInfo();
      if (isStale()) return;

      const circulating = Number.isFinite(info.circulating) && info.circulating > 0 ? info.circulating : NaN;
      const fullSupply = Number.isFinite(info.fullSupply) && info.fullSupply > 0 ? info.fullSupply : NaN;
      if (Number.isFinite(circulating) && Number.isFinite(fullSupply)){
        tokenAtRequest.totalSupply = fullSupply;
        if (statSupply) statSupply.textContent = fmtSupplyStat(activeToken, fullSupply);
        if (supplyMeta) supplyMeta.textContent = `${fmt(circulating)} / ${fmt(fullSupply)} circulating`;
      } else if (Number.isFinite(circulating)){
        tokenAtRequest.totalSupply = circulating;
        if (statSupply) statSupply.textContent = fmtSupplyStat(activeToken, circulating);
      }
      if (Number.isFinite(info.accounts) && onePercentCountEl){
        onePercentCountEl.textContent = String(Math.floor(info.accounts));
      }

      if (!hasCached){
        const tpl = readXahTemplateCache();
        const approx = buildXahApproxHolders({
          circulating: Number.isFinite(info.circulating) && info.circulating > 0 ? info.circulating : tpl?.circulating,
          fullSupply: Number.isFinite(info.fullSupply) && info.fullSupply > 0 ? info.fullSupply : activeToken?.totalSupply,
          accounts: Number.isFinite(info.accounts) && info.accounts > 0 ? info.accounts : tpl?.accounts,
          topHolders: Array.isArray(tpl?.topHolders) ? tpl.topHolders : []
        });

        if (approx.length){
          allHolders = normalizeHolders(approx);
          if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;
          renderTable();
          computeStats();
          if (Number.isFinite(info.accounts) && onePercentCountEl){
            onePercentCountEl.textContent = String(Math.floor(info.accounts));
          }
          setStatus(true, `template loaded (${allHolders.length} est), scanning live wallets...`);
        }
      }

      const holders = await fetchNativeXahHoldersFromWS({
        wsUrl: tokenAtRequest.ws,
        excludedAddresses,
        limitPerPage: 400,
        onProgress: ({ page, count, hasMore }) => {
          if (isStale()) return;
          const pageBasedPct = 14 + (1 - Math.exp(-page * 0.065)) * 82;
          setLoadBarTarget(hasMore ? pageBasedPct : 96, richListLoadTaskId);
          updateLoadBarTask(richListLoadTaskId, {
            label: `Loading ${tokenAtRequest.symbol} rich list... page ${page} (${count} accounts)`,
            target: hasMore ? pageBasedPct : 96
          });
          setStatus(true, `scanning wallets: ${page} pages | ${count} accounts`);
        },
      });

      if (isStale()) return;
      writeRichlistCache(tokenAtRequest, holders);
      writeXahTemplateCache(buildXahTemplateFromLive(holders, info));
      allHolders = normalizeHolders(holders);
      if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;

      setStatus(true, `live wallets (${holders.length})`);
    }catch{
      if (isStale()) return;
      if (!hasCached){
        allHolders = normalizeHolders([]);
        setStatus(false, "native wallet scan failed");
      } else {
        setStatus(false, "refresh failed, showing cached");
      }
    } finally {
      finishIfFresh();
    }
    return;
  }

  const ttlMs = getRichlistCacheTtlMs(tokenAtRequest);
  const cached = readRichlistCache(tokenAtRequest);
  const now = Date.now();
  const hasCached = Boolean(cached?.holders?.length);
  const cachedAgeMs = cached ? Math.max(0, now - cached.ts) : 0;
  const cacheFresh = !forceNetwork && cached && cachedAgeMs <= ttlMs;

  if (hasCached){
    allHolders = normalizeHolders(cached.holders);
    if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;
    renderTable();
    computeStats();
    const ageSec = Math.floor(cachedAgeMs / 1000);
    if (cacheFresh){
      setStatus(true, `cached (${ageSec}s old)`);
      finishIfFresh();
      return;
    }
    setStatus(true, `cached (${ageSec}s old), refreshing...`);
  } else {
    setStatus(true, "loading...");
    rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">Loading rich list...</td></tr>`;
  }

  setRichListLoading(true);

  try{
    const excludedAddresses = getExcludedAddressSet(tokenAtRequest);
    const holders = await fetchHoldersFromWS({
      wsUrl: tokenAtRequest.ws,
      issuer: tokenAtRequest.issuer,
      currency: getTokenCurrency(tokenAtRequest),
      excludedAddresses,
      limitPerPage: 400,
      onProgress: ({ page, hasMore }) => {
        if (isStale()) return;
        const pageBasedPct = 18 + (1 - Math.exp(-page * 0.38)) * 70;
        setLoadBarTarget(hasMore ? pageBasedPct : 96, richListLoadTaskId);
        updateLoadBarTask(richListLoadTaskId, {
          label: `Loading ${tokenAtRequest.symbol} rich list... page ${page}`,
          target: hasMore ? pageBasedPct : 96
        });
      },
    });

    if (isStale()) return;
    writeRichlistCache(tokenAtRequest, holders);
    allHolders = normalizeHolders(holders);
    if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;

    setStatus(true, "live data (ledger)");
  }catch{
    if (isStale()) return;
    if (!hasCached){
      allHolders = normalizeHolders([]);
      setStatus(false, "failed (ws)");
    } else {
      setStatus(false, "refresh failed, showing cached");
    }
  } finally {
    finishIfFresh();
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
  if (isNativeXahToken(activeToken)){
    stopFeed();
    feedEvents = [];
    renderFeed();
    setFeedStatus(false, "native feed disabled");
    return;
  }
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
  if (isNativeXahToken(token)) return "#";

  return `https://xahau.services/?issuer=${encodeURIComponent(token.issuer || "")}&currency=${encodeURIComponent(getTokenCurrency(token))}&limit=${encodeURIComponent(String(token.totalSupply || ""))}`;
}

function buildTradeUrl(token){
  if (isNativeXahToken(token)) return "#";
  const currency = encodeURIComponent(getTokenCurrency(token));
  const issuer = encodeURIComponent(token.issuer || "");
  return `https://xmagnetic.org/tokens/${currency}+${issuer}?network=xahau`;

}

/* ===== Token UI wiring ===== */
function setPills(){
  pillRow.innerHTML = "";
  const pills = [
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


function setRichlistIdleMessage(msg){
  rowsEl.innerHTML = `<tr><td colspan="5" style="padding:16px 8px; color:rgba(255,255,255,.70)">${msg}</td></tr>`;
  if (loadAllBtn){
    loadAllBtn.textContent = "Load All";
    loadAllBtn.disabled = true;
  }
}

async function primeXahSupplyFromApi({ refreshApprox = true } = {}){
  if (!isNativeXahToken(activeToken)) return;
  const supplyTaskId = beginLoadBarTask("Loading XAH supply snapshot...", 16);
  let supplyDoneLabel = "";

  try{
    let info = null;
    try{
      updateLoadBarTask(supplyTaskId, { label: "Fetching XAH supply and wallet counts...", target: 46 });
      info = await fetchXahSupplyInfo();
    }catch{
      info = null;
    }
    if (!isNativeXahToken(activeToken)) return;

    const circulating = Number.isFinite(Number(info?.circulating)) && Number(info.circulating) > 0
      ? Number(info.circulating)
      : (Number.isFinite(xahSupplySnapshot.circulating) && xahSupplySnapshot.circulating > 0
        ? xahSupplySnapshot.circulating
        : XAH_FALLBACK_SNAPSHOT.circulating);

    const fullSupply = Number.isFinite(Number(info?.fullSupply)) && Number(info.fullSupply) > 0
      ? Number(info.fullSupply)
      : (Number.isFinite(xahSupplySnapshot.fullSupply) && xahSupplySnapshot.fullSupply > 0
        ? xahSupplySnapshot.fullSupply
        : XAH_FALLBACK_SNAPSHOT.fullSupply);

    const accounts = Number.isFinite(Number(info?.accounts)) && Number(info.accounts) > 0
      ? Math.floor(Number(info.accounts))
      : (Number.isFinite(xahSupplySnapshot.accounts) && xahSupplySnapshot.accounts > 0
        ? Math.floor(xahSupplySnapshot.accounts)
        : XAH_FALLBACK_SNAPSHOT.accounts);

    xahSupplySnapshot = { circulating, fullSupply, accounts, ts: Date.now() };

    activeToken.totalSupply = fullSupply;
    if (statSupply) statSupply.textContent = fmtSupplyStat(activeToken, fullSupply);
    if (supplyMeta) supplyMeta.textContent = `${fmt(circulating)} / ${fmt(fullSupply)} circulating`;
    if (Number.isFinite(accounts) && onePercentCountEl){
      onePercentCountEl.textContent = String(accounts);
    }

    if (refreshApprox){
      updateLoadBarTask(supplyTaskId, { label: "Building XAH approximate distribution...", target: 74 });
      const tpl = readXahTemplateCache();
      const approx = buildXahApproxHolders({
        circulating,
        fullSupply,
        accounts,
        topHolders: Array.isArray(tpl?.topHolders) ? tpl.topHolders : []
      });

      if (approx.length){
        allHolders = normalizeHolders(approx);
        if (allHolders.length) allHolders[allHolders.length - 1].isLast = true;
        xahApproxStatsMode = true;
        computeStats();
        setStatus(true, info ? `approx stats loaded (${allHolders.length} model wallets)` : `fallback approx loaded (${allHolders.length} model wallets)`);
      }
    }

    setPills();
    supplyDoneLabel = "XAH snapshot updated";
  } finally {
    endLoadBarTask(supplyTaskId, supplyDoneLabel);
  }
}

async function ensureRichlistLoadedForActiveToken({ forceNetwork = false, reason = "manual" } = {}){
  if (!activeToken) return;
  const tokenId = activeToken.id;

  if (!forceNetwork && loadedRichlistTokenIds.has(tokenId) && renderedHoldersTokenId === tokenId) return;

  loadedRichlistTokenIds.add(tokenId);
  renderedHoldersTokenId = tokenId;
  xahApproxStatsMode = false;
  await loadHolders({ forceNetwork });

  // For XAH keep it on-demand unless user explicitly opened richlist.
  if (isNativeXahToken(activeToken) && reason === "boot"){
    loadedRichlistTokenIds.delete(tokenId);
  }
}

function wireRichlistLazyLoad(){
  if (xahLoadRichlistBtn){
    xahLoadRichlistBtn.addEventListener("click", async () => {
      await ensureRichlistLoadedForActiveToken({ reason: "xah-load-click" });
    });
  }
  if (xahStatsUpdateBtn){
    xahStatsUpdateBtn.addEventListener("click", async () => {
      if (!isNativeXahToken(activeToken)) return;
      setStatus(true, "updating XAH stats...");
      await primeXahSupplyFromApi({ refreshApprox: true });
      await ensureRichlistLoadedForActiveToken({ forceNetwork: true, reason: "xah-stats-update" });
      refreshLiquidityPanel();
      loadDexChartHistory();
    });
  }
}
function applyTokenToUI(){
  if (!activeToken) return;
  setEmojiFieldForToken(activeToken);
  const heroLogoToken = activeToken?.heroLogoUrl
    ? { ...activeToken, logoUrl: activeToken.heroLogoUrl }
    : activeToken;

  document.title = `One Xahau - ${activeToken?.symbol || activeToken?.name || "100"}`;
  setBrandLogo();
  setTokenLogo(heroEmoji, heroLogoToken, activeToken.logo || "\u{1F5A4}");
  setTokenLogo(statEmoji, heroLogoToken, activeToken.logo || "\u{1F5A4}");
  hideLegacyPanelIcons();
  setPanelCornerTokenLogo(activeToken);

  const isOneToken = String(activeToken?.id) === "100";
  heroName.textContent = isNativeXahToken(activeToken)
    ? (activeToken.name || "Xahau")
    : (activeToken.symbol || activeToken.name || activeToken.id);
  if (isOneToken){
    const soon = document.createElement("span");
    soon.className = "heroSoon";
    soon.textContent = "coming soon!";
    heroName.appendChild(soon);
  }



  brandSub.textContent = "Educational tools + DEX Culture on XAHAU";


  heroDesc.textContent = activeToken.description || "Onyx token.";
  if (cardHint){
    const hintItems = sortBadgesByRequiredQty(
      getBadgeRules(activeToken).filter((r) => r.panel !== false)
    )
      .map((r) => `${r.icon || ""} ${r.title || "Badge"}`.trim());
    if (hintItems.length){
      cardHint.innerHTML = `<b>Badges:</b> ${hintItems.join(", ")}.`;
      cardHint.style.display = "";
    } else {
      cardHint.innerHTML = "";
      cardHint.style.display = "none";
    }
  }

  if (statSupply) statSupply.textContent = fmtSupplyStat(activeToken, activeToken.totalSupply);
  if (statClubLabelEl){
    statClubLabelEl.textContent = isNativeXahToken(activeToken) ? "Wallet Count" : "1% Club";
  }

  btnExplorer.href = "#";
  btnExplorer.removeAttribute("target");
  btnExplorer.removeAttribute("rel");
  btnExplorer.innerHTML = '<span class="dot"></span> ONE';
  btnTokenDetails.href = "#whitepaperPanel";
  btnTrustline.href = buildTrustlineUrl(activeToken) || "#";
  btnTrade.href = buildTradeUrl(activeToken) || "#";
  if (btnXahImport){
    btnXahImport.href = activeToken.xahImportUrl || "https://xumm.app/detect/xapp:nixer.xahauimport";
  }
  if (btnBitrueTrade){
    btnBitrueTrade.href = activeToken.bitrueTradeUrl || "https://www.bitrue.com/trade/xah_usdt";
  }
  if (btnXahTeleport){
    btnXahTeleport.href = activeToken.xahTeleportUrl || "https://xumm.app/detect/xapp:xahau.teleport";
  }
  btnX.href = ONE_TOKEN?.xUrl || activeToken.xUrl || "#";
  footExplorer.href = activeToken.explorerUrl || "#";
  footX.href = activeToken.xUrl || "#";
  footExplorer.textContent = "xahauexplorer";
  footX.textContent = "x.com";

  const nativeXah = isNativeXahToken(activeToken);
  document.body.classList.toggle("token-xah", nativeXah);
  document.body.classList.toggle("token-alt", !nativeXah);
  btnTrustline.style.display = nativeXah ? "none" : "inline-flex";
  btnTrade.style.display = nativeXah ? "none" : "inline-flex";
  if (btnXahImport){
    btnXahImport.style.display = nativeXah ? "inline-flex" : "none";
  }
  if (btnBitrueTrade){
    btnBitrueTrade.style.display = nativeXah ? "inline-flex" : "none";
  }
  if (btnXahTeleport){
    btnXahTeleport.style.display = nativeXah ? "inline-flex" : "none";
  }
  if (xahToolsRow){
    xahToolsRow.style.display = nativeXah ? "grid" : "none";
  }
  if (feedPanel){
    feedPanel.style.display = nativeXah ? "none" : "";
  }
  if (xahLoadRichlistBtn){
    xahLoadRichlistBtn.style.display = nativeXah ? "inline-flex" : "none";
    xahLoadRichlistBtn.disabled = false;
    xahLoadRichlistBtn.textContent = "Load XAH Rich List";
  }
  if (xahStatsUpdateBtn){
    xahStatsUpdateBtn.style.display = nativeXah ? "inline-flex" : "none";
  }

  if (nativeXah){
    setStatus(true, "rich list idle (click Load XAH Rich List)");
    setRichListLoading(false);
    allHolders = [];
    renderedHoldersTokenId = null;
    setRichlistIdleMessage("XAH rich list is on-demand. Click Load XAH Rich List to fetch wallet balances.");
    primeXahSupplyFromApi({ refreshApprox: true });
    refreshXahHeroExtraStats();
  } else {
    setXahHeroExtraStatsVisible(false);
  }

  renderTreasuryWallets();

  if (whitepaperSummary){
    whitepaperSummary.textContent = activeToken.whitepaper || "White paper text coming soon.";
  }
  if (whitepaperMeta){
    if (String(activeToken.id) === "100"){
      whitepaperMeta.textContent = "coming soon";
    } else {
      whitepaperMeta.textContent = (activeToken.whitepaper || activeToken.whitepaperHtml) ? "live" : "pending";
    }
  }
  if (btnTokenExplorer){
    const hasExplorer = Boolean(activeToken.explorerUrl);
    btnTokenExplorer.href = hasExplorer ? activeToken.explorerUrl : "#";
    btnTokenExplorer.style.display = hasExplorer ? "inline-flex" : "none";
  }
  if (btnWhitepaper){
    const hasRemoteWhitepaper = Boolean(activeToken.whitepaperHtml);
    btnWhitepaper.href = hasRemoteWhitepaper ? activeToken.whitepaperHtml : "#";
    btnWhitepaper.style.display = hasRemoteWhitepaper ? "inline-flex" : "none";
  }

  setPills();
  hasLiquidityDataRendered = false;
  resetLiquidityPanel("loading book depth...");
  setHeroUsdPrice("loading...");
  setDexChartPairLabel(activeToken);
  loadDexChartHistory();
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
    cancelRichListLoadUI();
    activeToken = next;
    showAllRows = false;

    applyTokenToUI();
    if (!isNativeXahToken(activeToken)){
      await ensureRichlistLoadedForActiveToken({ reason: "token-change" });
    }
    startFeed();
    refreshLiquidityPanel();
    startLiquidityPolling();
  });
}

function wireHeaderOneShortcut(){
  const jumpToOne = (ev) => {
    ev.preventDefault();
    if (!ONE_TOKEN || !tokenSelect) return;
    if (String(activeToken?.id) === String(ONE_TOKEN.id)) return;
    tokenSelect.value = ONE_TOKEN.id;
    tokenSelect.dispatchEvent(new Event("change"));
  };
  if (btnExplorer){
    btnExplorer.addEventListener("click", jumpToOne);
  }
  if (brandLogoLink){
    brandLogoLink.addEventListener("click", jumpToOne);
  }
}

function syncHeroStatsPlacement(){
  if (!heroGrid || !heroMainCol || !cardRight || !ctaRow) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile){
    if (cardRight.parentElement !== heroGrid){
      heroGrid.appendChild(cardRight);
    }
    return;
  }
  if (cardRight.parentElement !== heroGrid){
    heroGrid.appendChild(cardRight);
  }
}

/* ===== UI events ===== */
searchEl.addEventListener("input", () => renderTable());
window.addEventListener("resize", () => {
  syncHeroStatsPlacement();
  renderTable();
});

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    showAllRows = false;
    renderTable();
  });
});

refreshBtn.addEventListener("click", () => ensureRichlistLoadedForActiveToken({ forceNetwork: true, reason: "manual-refresh" }));
if (clearCacheBtn){
  clearCacheBtn.addEventListener("click", async () => {
    const ok = clearRichlistCache(activeToken);
    loadedRichlistTokenIds.delete(activeToken.id);
    showToast(ok ? "Cache cleared" : "Cache clear failed");
    await ensureRichlistLoadedForActiveToken({ forceNetwork: true, reason: "manual-clear-cache" });
  });
}
if (loadAllBtn){
  loadAllBtn.addEventListener("click", () => {
    showAllRows = !showAllRows;
    renderTable();
  });
}
if (downloadCsvBtn){
  downloadCsvBtn.addEventListener("click", () => downloadRichlistCsv());
}
feedReconnect.addEventListener("click", () => startFeed());
if (dexRange7d){
  dexRange7d.addEventListener("click", () => {
    if (dexChartRangeDays === 7) return;
    dexChartRangeDays = 7;
    loadDexChartHistory();
  });
}
if (dexRange30d){
  dexRange30d.addEventListener("click", () => {
    if (dexChartRangeDays === 30) return;
    dexChartRangeDays = 30;
    loadDexChartHistory();
  });
}
if (dexRange3m){
  dexRange3m.addEventListener("click", () => {
    if (dexChartRangeDays === 90) return;
    dexChartRangeDays = 90;
    loadDexChartHistory();
  });
}
if (dexRange6m){
  dexRange6m.addEventListener("click", () => {
    if (dexChartRangeDays === 180) return;
    dexChartRangeDays = 180;
    loadDexChartHistory();
  });
}
if (dexRange1y){
  dexRange1y.addEventListener("click", () => {
    if (dexChartRangeDays === 365) return;
    dexChartRangeDays = 365;
    loadDexChartHistory();
  });
}

/* ===== Boot ===== */
(function boot(){
  if (!TOKENS.length){
    console.error("No tokens found in tokens.js (window.ONYX_TOKENS).");
    return;
  }
  const defaultTokenId = String(window.ONYX_DEFAULT_TOKEN_ID || "").trim();
  activeToken = TOKENS.find((t) => String(t.id) === defaultTokenId) || TOKENS[0];
  initTokenSelector();
  wireHeaderOneShortcut();
  wireSupportWalletButton();
  tokenSelect.value = activeToken.id;

  applyTokenToUI();
  syncHeroStatsPlacement();
  wireRichlistLazyLoad();
  if (!isNativeXahToken(activeToken)){
    ensureRichlistLoadedForActiveToken({ reason: "boot" });
  }
  startFeed();
  refreshLiquidityPanel();
  startLiquidityPolling();
})();

