// Currency Exchange V11 — Master Pack (Pure HTML/CSS/JS)
// XE-style converter perfection, trust surface 2.0, providers live re-rank,
// quick chips, scenario slider, sparkline + fair meter, tabs (providers/tools/guidance),
// shareable URLs, copy result/link/embed, embed mode, local defaults, corridor SEO, alerts placeholder.

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const amountEl = document.getElementById("amount");
  const amountSlider = document.getElementById("amountSlider");
  const chips = [...document.querySelectorAll(".chip-btn:not(.pair)")];
  const pairChips = [...document.querySelectorAll(".chip-btn.pair")];

  const fromEl = document.getElementById("from");
  const toEl   = document.getElementById("to");
  const swapBtn = document.getElementById("swap");
  const convertBtn = document.getElementById("convert");

  const titleEl = document.getElementById("title");
  const headlineEl = document.getElementById("headline");
  const lineA = document.getElementById("lineA");
  const lineB = document.getElementById("lineB");
  const interbankEl = document.getElementById("interbank");
  const brokerEl = document.getElementById("broker");
  const spreadEl = document.getElementById("spread");
  const precEl = document.getElementById("prec");
  const timeEl = document.getElementById("time");
  const rateTypeEl = document.getElementById("rateType");

  const copyResultBtn = document.getElementById("copyResult");
  const copyLinkBtn = document.getElementById("copyLink");
  const copyEmbedBtn = document.getElementById("copyEmbed");

  // Sparkline & fair meter
  const spark = document.getElementById("spark");
  const fairBadge = document.getElementById("fair");

  // Tabs
  const tabButtons = [...document.querySelectorAll(".tab")];
  const tabPanels  = [...document.querySelectorAll(".tab-panel")];

  // Providers
  const speedFilter = document.getElementById("speedFilter");
  const providerIds = ["wise","revolut","western","moneygram","remitly","xoom","ofx","worldremit"];
  const rows = Object.fromEntries(providerIds.map(id => [id, document.getElementById(id)]));

  // Alerts
  const alertEmail = document.getElementById("alertEmail");
  const alertThreshold = document.getElementById("alertThreshold");
  const saveAlert = document.getElementById("saveAlert");
  const alertNote = document.getElementById("alertNote");

  // Mock mid rates (symmetric-ish). Replace with live API later.
  const MID = {
    EUR: { USD: 1.0728, GBP: 0.8550, JPY: 162.50, CAD: 1.4600 },
    USD: { EUR: 0.9321, GBP: 0.7970, JPY: 151.70, CAD: 1.3600 },
    GBP: { EUR: 1.1696, USD: 1.2550, JPY: 191.30, CAD: 1.7200 },
    JPY: { EUR: 0.00615, USD: 0.00659, GBP: 0.00523, CAD: 0.01100 },
    CAD: { EUR: 0.6849, USD: 0.7350, GBP: 0.5814, JPY: 90.91 }
  };

  // Providers (margin vs mid + flat fee in base + ETA class)
  const PROVIDERS = [
    { id:"wise",       name:"Wise",          marginPct:0.10, fee:0.99, eta:"Same-day",  cls:"instant" },
    { id:"revolut",    name:"Revolut",       marginPct:0.20, fee:0.00, eta:"Instant",   cls:"instant" },
    { id:"western",    name:"Western Union", marginPct:1.80, fee:2.90, eta:"Min–Hours", cls:"instant" },
    { id:"moneygram",  name:"MoneyGram",     marginPct:1.50, fee:1.99, eta:"Min–Hours", cls:"instant" },
    { id:"remitly",    name:"Remitly",       marginPct:1.20, fee:1.99, eta:"Hours–1d",  cls:"oneday"  },
    { id:"xoom",       name:"Xoom (PayPal)", marginPct:1.60, fee:2.99, eta:"Hours–1d",  cls:"oneday"  },
    { id:"ofx",        name:"OFX",           marginPct:0.35, fee:0.00, eta:"1–2d",      cls:"oneday"  },
    { id:"worldremit", name:"WorldRemit",    marginPct:1.10, fee:2.49, eta:"Hours–1d",  cls:"oneday"  }
  ];

  // Helpers
  const nowGMT = () => new Date().toUTCString().split(" ")[4];
  const fmt = (n, d=4) => Number(n).toFixed(d);
  const fmtBig = (n, c) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n) + " " + c;

  function getMid(base, quote) {
    const m = MID?.[base]?.[quote];
    if (!m) return null;
    const jitter = 1 + (Math.random() - 0.5) * 0.001; // ±0.05% to feel live
    return +(m * jitter).toFixed(6);
  }

  function updateURL(amt, base, quote, embed=false) {
    const url = new URL(window.location.href);
    url.searchParams.set("amount", String(amt));
    url.searchParams.set("from", base);
    url.searchParams.set("to", quote);
    if (embed) url.searchParams.set("embed","1"); else url.searchParams.delete("embed");
    window.history.replaceState({}, "", url.toString());
    return url.toString();
  }

  function readURL() {
    const url = new URL(window.location.href);
    const qAmt = parseFloat(url.searchParams.get("amount") || "100");
    const qFrom = (url.searchParams.get("from") || "").toUpperCase();
    const qTo   = (url.searchParams.get("to")   || "").toUpperCase();
    const embed = url.searchParams.get("embed")==="1";

    if (!isNaN(qAmt)) { amountEl.value = String(qAmt); amountSlider.value = String(Math.min(Math.max(qAmt,10),50000)); }
    if (["EUR","USD","GBP","JPY","CAD"].includes(qFrom)) fromEl.value = qFrom;
    if (["EUR","USD","GBP","JPY","CAD"].includes(qTo))   toEl.value   = qTo;
    if (embed) document.body.classList.add("embed");
  }

  function softLocalDefault() {
    const url = new URL(location.href);
    if (url.searchParams.get("from") && url.searchParams.get("to")) return;
    try {
      const lang = (navigator.language || "").toLowerCase();
      if (lang.startsWith("en-gb")) { fromEl.value="GBP"; toEl.value="USD"; }
      else if (lang.startsWith("en-ca") || lang.startsWith("fr-ca")) { fromEl.value="CAD"; toEl.value="USD"; }
      else if (lang.startsWith("ja")) { fromEl.value="JPY"; toEl.value="USD"; }
      else { fromEl.value="EUR"; toEl.value="USD"; }
    } catch {}
  }

  function codeToName(c){
    switch(c){
      case "EUR": return "Euros";
      case "USD": return "US Dollars";
      case "GBP": return "British Pounds";
      case "JPY": return "Japanese Yen";
      case "CAD": return "Canadian Dollars";
      default: return c;
    }
  }

  // Corridor SEO updates (title/meta/canonical/JSON-LD)
  function updateSEO(base, quote) {
    const title = `${base} to ${quote} — Convert ${codeToName(base)} to ${codeToName(quote)} | Prime Exchange`;
    const desc  = `Convert ${base} to ${quote} with mid-market and provider rates. See the true all-in amount and compare providers. Share or embed any result.`;
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);

    const canon = document.getElementById("canonical");
    const url = new URL(location.href);
    const pairSlug = `${base.toLowerCase()}-to-${quote.toLowerCase()}`;
    canon.href = `${url.origin}/${pairSlug}`;

    const ld = {
      "@context":"https://schema.org",
      "@type":"FinancialService",
      "name":"Prime Exchange",
      "url": url.origin,
      "description": desc,
      "areaServed":"Worldwide",
      "serviceType":"Currency conversion",
      "offers":{
        "@type":"Offer",
        "name": `${base} to ${quote} conversion`,
        "url": url.toString()
      }
    };
    document.getElementById("ldjson").textContent = JSON.stringify(ld);
  }

  // Providers
  function providerListFiltered() {
    const f = speedFilter?.value || "any";
    if (f === "any") return PROVIDERS;
    if (f === "instant") return PROVIDERS.filter(p => p.cls === "instant");
    if (f === "oneday")  return PROVIDERS.filter(p => p.cls === "oneday");
    return PROVIDERS;
  }

  function updateProviders(midRate, amount, base, quote) {
    let best = null; let bestVal = -Infinity;
    providerListFiltered().forEach(p => {
      const rate = midRate * (1 - p.marginPct/100);
      const received = amount * rate - p.fee;
      if (received > bestVal) { bestVal = received; best = p.id; }

      const row = rows[p.id];
      if (!row) return;
      row.children[0].textContent = p.name;
      row.children[1].textContent = fmt(rate);
      row.children[2].textContent = `${fmt(p.fee,2)} ${base}`;
      row.children[3].textContent = `${fmt(received,2)} ${quote}`;
      row.children[4].textContent = p.eta;
      row.classList.remove("highlight");
    });
    if (best && rows[best]) rows[best].classList.add("highlight");
  }

  // Synthetic 30-day series for sparkline & fair meter
  function genSeries(midToday){
    const n=30, s=[]; let v = midToday/(1 + (Math.random()-0.5)*0.02);
    for(let i=0;i<n;i++){ v *= (1 + (Math.random()-0.5)*0.01); s.push(v); }
    return s;
  }
  function drawSpark(canvas, series){
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    const min = Math.min(...series), max = Math.max(...series);
    const xStep = w/Math.max(1,(series.length-1));
    ctx.lineWidth = 2; ctx.strokeStyle = "#0f62fe";
    ctx.beginPath();
    series.forEach((v,i)=>{
      const x = i*xStep;
      const y = h - ((v-min)/(max-min || 1))*h;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }
  function updateFairBadge(today, series){
    const avg = series.reduce((a,b)=>a+b,0)/series.length;
    const diff = (today-avg)/avg*100;
    fairBadge.classList.remove("fair-good","fair-amber","fair-bad");
    if (Math.abs(diff) < 0.3){ fairBadge.textContent = "Fair? ✓ Near 30-day avg"; fairBadge.classList.add("fair-good"); }
    else if (diff > 0.3){ fairBadge.textContent = "Fair? ↑ Above avg (costlier)"; fairBadge.classList.add("fair-amber"); }
    else { fairBadge.textContent = "Fair? ↓ Below avg (better)"; fairBadge.classList.add("fair-good"); }
  }

  function compute() {
    const amt = Math.max(0, parseFloat(amountEl.value || "0"));
    const base = fromEl.value;
    const quote = toEl.value;

    // Heading
    titleEl.textContent = `${base} to ${quote} — Convert ${codeToName(base)} to ${codeToName(quote)}`;

    const m = getMid(base, quote);
    if (!m) { alert("Pair not available in demo."); return; }

    const brokerRate = m * (1 - 0.004);
    const spreadPct = ((m - brokerRate)/m)*100;

    headlineEl.textContent = `${fmtBig(amt*m, quote)} (for ${fmtBig(amt, base)})`;
    lineA.textContent = `1 ${base} = ${fmt(m)} ${quote}`;
    lineB.textContent = `1 ${quote} = ${fmt(1/m)} ${base}`;
    interbankEl.textContent = fmt(m);
    brokerEl.textContent = fmt(brokerRate);
    spreadEl.textContent = fmt(spreadPct,2) + "%";
    precEl.textContent = "4 dp";
    timeEl.textContent = nowGMT();
    rateTypeEl.textContent = "Rate type: Interbank (mid)";

    // Providers
    updateProviders(m, amt, base, quote);

    // Sparkline + fair meter
    const series = genSeries(m);
    drawSpark(spark, series);
    updateFairBadge(m, series);

    // URL + SEO
    const embed = document.body.classList.contains("embed");
    const currentURL = updateURL(amt, base, quote, embed);
    updateSEO(base, quote);

    // Share
    const resultText = `${fmt(amt,2)} ${base} = ${fmt(amt*m,2)} ${quote} (mid)`;
    copyResultBtn.onclick = () => shareOrCopy(resultText);
    copyLinkBtn.onclick   = () => shareOrCopy(currentURL);
    copyEmbedBtn.onclick  = () => {
      const iframe = `<iframe src="${currentURL.includes("?")?currentURL+"&embed=1":currentURL+"?embed=1"}" width="420" height="520" style="border:1px solid #e6ecf5;border-radius:12px" loading="lazy"></iframe>`;
      shareOrCopy(iframe);
    };
  }

  function shareOrCopy(text){
    if (navigator.share && text.length < 2000) {
      navigator.share({ text }).catch(()=>fallbackCopy(text));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(()=>alert("Copied")).catch(()=>fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text){
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch(e){}
    document.body.removeChild(ta);
    alert("Copied");
  }

  // Tools
  const tripBtn = document.getElementById("calcTrip");
  const tripOut = document.getElementById("tripOut");
  if (tripBtn){
    tripBtn.addEventListener("click", ()=>{
      const days = Math.max(1, parseInt(document.getElementById("days").value||"0",10));
      const daily = Math.max(0, parseFloat(document.getElementById("daily").value||"0"));
      tripOut.textContent = `Estimated total: ${(days*daily).toFixed(2)}`;
    });
  }
  const hopBtn = document.getElementById("calcHop");
  const hopOut = document.getElementById("hopOut");
  if (hopBtn){
    hopBtn.addEventListener("click", ()=>{
      hopOut.textContent = "Penalty: ~0.6% vs direct (illustrative)";
    });
  }

  // Providers: filter by speed
  if (speedFilter){
    speedFilter.addEventListener("change", compute);
  }

  // Tabs
  const activateTab = (btn)=>{
    tabButtons.forEach(b=>b.classList.remove("active"));
    tabPanels.forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.getAttribute("aria-controls")).classList.add("active");
  };
  tabButtons.forEach(btn=>btn.addEventListener("click", ()=>activateTab(btn)));

  // Chips (amount & pair)
  chips.forEach(b=>{
    b.addEventListener("click", ()=>{
      const inc = parseFloat(b.dataset.amt||"0");
      const cur = parseFloat(amountEl.value||"0");
      const next = Math.max(0, cur + inc);
      amountEl.value = String(next);
      amountSlider.value = String(Math.min(Math.max(next,10),50000));
      compute();
    });
  });
  pairChips.forEach(b=>{
    b.addEventListener("click", ()=>{
      fromEl.value = b.dataset.from;
      toEl.value   = b.dataset.to;
      compute();
    });
  });

  // Alerts (local placeholder)
  if (saveAlert){
    saveAlert.addEventListener("click", () => {
      const email = (alertEmail.value || "").trim();
      const thr = parseFloat(alertThreshold.value || "0");
      const base = fromEl.value, quote = toEl.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alertNote.textContent = "Enter a valid email."; return; }
      if (!(thr>0)) { alertNote.textContent = "Enter a valid threshold (e.g., 1.10)."; return; }
      const key = "prime-exchange-alerts";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push({ email, base, quote, thr, at: Date.now() });
      localStorage.setItem(key, JSON.stringify(arr));
      alertNote.textContent = "Saved locally. Backend hook can process this later.";
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Enter") { e.preventDefault(); compute(); }
    if (e.key.toLowerCase() === "s") { e.preventDefault(); const t=fromEl.value; fromEl.value=toEl.value; toEl.value=t; compute(); }
  });

  // Wiring & init
  amountSlider.addEventListener("input", () => { amountEl.value = amountSlider.value; compute(); });
  amountEl.addEventListener("input",  () => { amountSlider.value = String(Math.min(Math.max(parseFloat(amountEl.value||"0"),10),50000)); });
  convertBtn.addEventListener("click", compute);
  swapBtn.addEventListener("click", () => { const t=fromEl.value; fromEl.value=toEl.value; toEl.value=t; compute(); });

  readURL();
  softLocalDefault();
  compute();
  setInterval(compute, 60000);
});