/* PaisaYug — page logic. Settings config.js mein hain; yeh file edit karne ki zaroorat nahi. */
(function () {
  "use strict";
  var C = window.PAISAYUG_CONFIG || {};
  var PRICE = Number(C.PRICE) || 99;
  var MRP = Number(C.MRP) || 999;
  var NAME = C.COURSE_NAME || "PaisaYug";
  var UPI = (C.UPI_ID || "").trim();
  var WA = String(C.WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
  var MINUTES = Number(C.TIMER_MINUTES) || 15;
  var UPI_PLACEHOLDER = !UPI || UPI === "yourupi@upi";

  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setAll(sel, val) { $all(sel).forEach(function (el) { el.textContent = val; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---- fill config values ---- */
  setAll(".js-price", PRICE);
  setAll(".js-mrp", MRP);
  setAll(".js-sticky-old", MRP);
  setAll(".js-save", MRP - PRICE);
  setAll(".js-off", Math.max(0, Math.round((1 - PRICE / MRP) * 100)));
  setAll(".js-name", NAME);
  $all(".js-upi").forEach(function (el) { el.innerHTML = UPI ? esc(UPI).replace("@", "<wbr>@") : "—"; });
  setAll(".js-year", new Date().getFullYear());
  if (C.SEATS_LEFT) setAll(".js-seats", C.SEATS_LEFT);
  if (C.HEADLINE) setAll(".js-headline", C.HEADLINE);
  if (C.SUBHEADLINE) setAll(".js-subheadline", C.SUBHEADLINE);
  document.title = NAME + " — " + (C.TAGLINE || "Ghar Baithe Paise Kaise Kamaye") + ", Sirf ₹" + PRICE;
  $all(".js-wa-link").forEach(function (a) { a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi, " + NAME + " course ke baare mein jaanna hai."); });

  var mods = document.querySelector(".js-modules");
  if (mods && C.MODULES) mods.innerHTML = C.MODULES.map(function (m, i) {
    return "<li><span class=\"mod-label\">Module " + (i + 1) + "</span><h3>" + esc(m.title) + "</h3><p>" + esc(m.desc || "") + "</p></li>";
  }).join("");
  var get = document.querySelector(".js-get");
  if (get && C.YOU_GET) get.innerHTML = C.YOU_GET.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("");
  var faq = document.querySelector(".js-faq");
  if (faq && C.FAQ) faq.innerHTML = C.FAQ.map(function (f) {
    return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
  }).join("");

  /* ---- evergreen countdown (localStorage, restarts when it ends) ---- */
  var KEY = "paisayug_deadline_v1";
  function newDeadline() { var d = Date.now() + MINUTES * 60000; try { localStorage.setItem(KEY, String(d)); } catch (e) {} return d; }
  var deadline;
  try { deadline = Number(localStorage.getItem(KEY)); } catch (e) { deadline = 0; }
  if (!deadline || deadline < Date.now() || deadline - Date.now() > MINUTES * 60000 + 5000) deadline = newDeadline();
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var left = deadline - Date.now();
    if (left <= 0) { deadline = newDeadline(); left = deadline - Date.now(); }
    var s = Math.floor(left / 1000), mm = pad(Math.floor(s / 60)), ss = pad(s % 60);
    setAll(".js-timer", mm + ":" + ss);
    setAll(".js-mm", mm);
    setAll(".js-ss", ss);
  }
  tick();
  setInterval(tick, 1000);

  /* ---- UPI QR + deep link (amount = final price after coupon) ---- */
  var FINAL = PRICE;           // jo customer actually pay karega
  var APPLIED = null;          // { code, saved } jab coupon laga ho
  function upiUrlFor(amount) {
    return "upi://pay?pa=" + UPI.replace(/[^A-Za-z0-9@._-]/g, "") + "&pn=" + encodeURIComponent(C.UPI_PAYEE_NAME || NAME) +
      "&am=" + Number(amount).toFixed(2) + "&cu=INR&tn=" + encodeURIComponent(NAME + " Course" + (APPLIED ? " " + APPLIED.code : ""));
  }
  function payVisible() { var st = document.querySelector(".js-st-pay"), md = document.getElementById("pay"); return md && !md.hidden && st && !st.hidden; }
  function drawQR() {
    var box = document.querySelector(".js-qr");
    if (!box || typeof qrcode !== "function") return;
    var url = upiUrlFor(FINAL);
    if (box.dataset.url === url) return;
    var qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    box.dataset.url = url;
    box.dataset.amount = String(FINAL);
  }
  function refreshPay() {
    setAll(".js-final", FINAL);
    var url = upiUrlFor(FINAL);
    $all(".js-upi-link").forEach(function (a) { a.href = url; });
    $all(".js-amount-old").forEach(function (el) { el.hidden = !APPLIED; });
    setAll(".js-coupon-tag", APPLIED ? " · " + APPLIED.code : "");
    $all(".js-sum-coupon").forEach(function (el) { el.hidden = !APPLIED; });
    setAll(".js-sum-code", APPLIED ? APPLIED.code : "");
    setAll(".js-sum-disc", APPLIED ? APPLIED.saved : 0);
    setAll(".js-total-save", Math.max(0, MRP - FINAL));
    $all(".js-sum-total").forEach(function (el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); });
    if (payVisible()) drawQR();
    else { var b = document.querySelector(".js-qr"); if (b) b.dataset.url = ""; }
  }

  /* ---- COUPONS ---- */
  var COUPONS = Array.isArray(C.COUPONS) ? C.COUPONS : [];
  // Coupon page reload/band karke kholne pe yaad NAHI rehta — har baar full price se shuru.
  // One-time: jo coupon is phone pe payment message tak use ho gaya, woh yahan yaad rehta hai.
  var ONE_TIME = C.COUPON_ONE_TIME !== false;
  var UKEY = "py_used_coupons_v1";
  try { localStorage.removeItem("py_coupon_v1"); } catch (e) {}   // purana 24h wala yaad hataya
  function usedList() {
    try { var a = JSON.parse(localStorage.getItem(UKEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function isUsed(code) { return ONE_TIME && usedList().indexOf(code) !== -1; }
  function markUsed(code) {
    if (!ONE_TIME || !code) return;
    var a = usedList();
    if (a.indexOf(code) === -1) a.push(code);
    try { localStorage.setItem(UKEY, JSON.stringify(a)); } catch (e) {}
  }
  function norm(c) { return String(c || "").replace(/\s+/g, "").toUpperCase(); }
  function expiryMs(str) {        // "YYYY-MM-DD" -> us din 23:59:59 IST
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || "").trim());
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999) - 5.5 * 3600 * 1000;
  }
  function niceDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || "").trim());
    if (!m) return str;
    return (+m[3]) + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m[2] - 1] + " " + m[1];
  }
  function priceAfter(cp) {
    var v = Number(cp.value) || 0, f;
    if (String(cp.type).toLowerCase() === "flat") f = PRICE - v;
    else f = PRICE * (1 - v / 100);
    return Math.max(1, Math.round(f));
  }
  // returns { ok:true, coupon, final } ya { ok:false, msg }
  function checkCoupon(raw) {
    var code = norm(raw);
    if (!code) return { ok: false, msg: "Pehle coupon code daalo 🙂" };
    var cp = null;
    for (var i = 0; i < COUPONS.length; i++) if (COUPONS[i] && norm(COUPONS[i].code) === code) { cp = COUPONS[i]; break; }
    if (!cp) return { ok: false, msg: "❌ \"" + code + "\" galat coupon code hai. Spelling check karke dobara try karo." };
    if (isUsed(code)) return { ok: false, msg: "❌ Ye coupon aap pehle hi use kar chuke ho." };
    if (cp.active === false) return { ok: false, msg: "❌ " + code + " coupon abhi band hai." };
    var exp = expiryMs(cp.expires);
    if (cp.expires && exp === null) return { ok: false, msg: "❌ " + code + " coupon abhi kaam nahi kar raha. WhatsApp pe batao." };
    if (exp !== null && Date.now() > exp) return { ok: false, msg: "⌛ " + code + " coupon " + niceDate(cp.expires) + " ko expire ho gaya." };
    if (cp.minPrice && PRICE < Number(cp.minPrice)) return { ok: false, msg: "❌ " + code + " sirf ₹" + Number(cp.minPrice) + " ya usse zyada ke order pe chalta hai." };
    var fin = priceAfter(cp);
    if (fin >= PRICE) return { ok: false, msg: "❌ " + code + " se is price pe koi discount nahi banta." };
    return { ok: true, code: code, final: fin };
  }
  var cBox = document.querySelector(".js-coupon");
  var cForm = document.querySelector(".js-coupon-form");
  var cInput = document.querySelector(".js-coupon-input");
  var cOk = document.querySelector(".js-coupon-ok");
  var cMsg = document.querySelector(".js-coupon-msg");
  var cErr = document.querySelector(".js-coupon-err");
  function setErr(t) { if (cErr) cErr.textContent = t || ""; if (cInput) cInput.classList.toggle("bad", !!t); }
  function applyRes(r) {
    APPLIED = { code: r.code, saved: PRICE - r.final };
    FINAL = r.final;
    if (cMsg) cMsg.textContent = "✅ " + r.code + " applied — ₹" + APPLIED.saved + " bachaye";
    if (cForm) cForm.hidden = true;
    if (cOk) cOk.hidden = false;
    setErr("");
    refreshPay();
  }
  function removeCoupon(errText) {
    APPLIED = null;
    FINAL = PRICE;
    if (cForm) cForm.hidden = false;
    if (cOk) cOk.hidden = true;
    if (cInput) cInput.value = "";
    setErr(errText || "");
    refreshPay();
  }
  if (cBox && COUPONS.length) {
    cBox.hidden = false;
    $all(".js-coupon-open").forEach(function (b) { b.hidden = C.COUPON_LINK_ON === false; });
    cForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = checkCoupon(cInput.value);
      if (r.ok) applyRes(r); else { setErr(r.msg); cInput.focus(); }
    });
    cInput.addEventListener("input", function () { if (cErr.textContent) setErr(""); });
    document.querySelector(".js-coupon-remove").addEventListener("click", function () { removeCoupon(""); cInput.focus(); });
    // link mein ?coupon=CODE ho toh sirf isi visit ke liye lagao (save nahi hota)
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get("coupon"); } catch (e) {}
    if (fromUrl) {
      var ru = checkCoupon(fromUrl);
      if (ru.ok) applyRes(ru); else { cInput.value = norm(fromUrl); setErr(ru.msg); }
    }
  } else $all(".js-no-coupon").forEach(function (el) { el.hidden = false; });
  refreshPay();
  $all(".js-upi-warn").forEach(function (el) { el.hidden = !UPI_PLACEHOLDER; });

  /* ================= CHECKOUT (Buy Now) =================
     Steps: Details + Coupon + Summary  →  QR + mascot  →  UTR  →  Invoice. */
  var modal = document.getElementById("pay");
  var sheet = modal.querySelector(".co-sheet");
  var body = modal.querySelector(".js-co-body");
  var stD = modal.querySelector(".js-st-details"), stP = modal.querySelector(".js-st-pay"), stI = modal.querySelector(".js-st-invoice");
  var stepsEl = Array.prototype.slice.call(modal.querySelectorAll(".js-co-steps li"));
  var dForm = modal.querySelector(".js-co-form");
  var uForm = modal.querySelector(".js-utr-form");
  var stage = stD, lastFocus = null, histPushed = false, BUYER = null, INVOICE = null;

  if (window.PAISAYUG_BOOK) window.PAISAYUG_BOOK.mount(modal.querySelector(".js-co-book"));
  if (C.CHECKOUT_DESC) setAll(".js-co-desc", fill(C.CHECKOUT_DESC));
  setAll(".js-mod-count", (C.MODULES || []).length || 8);

  function show(st, noFocus) {
    [stD, stP, stI].forEach(function (s) { s.hidden = s !== st; s.classList.remove("co-in"); });
    stage = st;
    var idx = st === stD ? 0 : st === stP ? 1 : 2;
    stepsEl.forEach(function (li, i) { li.classList.toggle("on", i === idx); li.classList.toggle("done", i < idx); });
    void st.offsetWidth; st.classList.add("co-in");
    body.scrollTop = 0;
    if (st === stP) startPay(); else stopBuddy();
    if (!noFocus) { var f = st.querySelector("input, .btn"); if (f && st !== stP && st !== stI) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 380); }
  }
  function open(focusCoupon) {
    lastFocus = document.activeElement;
    if (INVOICE) resetAfterInvoice();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    if (!histPushed) { try { history.pushState({ pyco: 1 }, ""); histPushed = true; } catch (e) {} }
    show(stD, true);
    setTimeout(function () {
      var t = focusCoupon && !APPLIED ? modal.querySelector(".js-coupon-input") : null;
      if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ block: "center" }); }
    }, 420);
  }
  function doClose() {
    if (modal.hidden) return;
    stopBuddy();
    modal.classList.add("closing");
    setTimeout(function () {
      modal.classList.remove("closing");
      modal.hidden = true;
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
      if (INVOICE) resetAfterInvoice();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 260);
  }
  function close() { if (histPushed) { histPushed = false; try { history.back(); return; } catch (e) {} } doClose(); }
  window.addEventListener("popstate", function () { if (!modal.hidden) { histPushed = false; doClose(); } });
  function resetAfterInvoice() {   // invoice ke baad naya order fresh shuru ho
    INVOICE = null;
    if (APPLIED) removeCoupon("");
    uForm.elements.utr.value = "";
    show(stD, true);
  }
  $all(".js-buy").forEach(function (b) { b.addEventListener("click", function () { open(false); }); });
  $all(".js-coupon-open").forEach(function (b) { b.addEventListener("click", function () { open(true); }); });
  $all(".js-close").forEach(function (b) { b.addEventListener("click", close); });
  modal.querySelector(".js-co-back").addEventListener("click", function () { if (stage === stP) show(stD); else close(); });
  modal.querySelector(".js-edit").addEventListener("click", function () { show(stD); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });

  /* ---- details validation ---- */
  function cleanPhone(p) {
    var d = String(p || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }
  function fieldErr(inp, msg) {
    var fld = inp.closest(".fld");
    fld.classList.toggle("bad", !!msg);
    fld.querySelector(".fld-e").textContent = msg || "";
    if (msg) { fld.classList.remove("shake"); void fld.offsetWidth; fld.classList.add("shake"); }
  }
  function readDetails(showErrs) {
    var f = dForm.elements;
    var v = { name: f.name.value.replace(/\s+/g, " ").trim(), phone: cleanPhone(f.phone.value), email: f.email.value.trim() };
    var errs = [];
    if (v.name.length < 2 || !/[A-Za-z\u0900-\u097F]/.test(v.name)) errs.push([f.name, "Apna naam likho"]);
    if (!/^[6-9]\d{9}$/.test(v.phone)) errs.push([f.phone, "Sahi 10 digit WhatsApp number likho"]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errs.push([f.email, "Sahi email likho (jaise aap@gmail.com)"]);
    if (showErrs) {
      [f.name, f.phone, f.email].forEach(function (i) { fieldErr(i, ""); });
      errs.forEach(function (e) { fieldErr(e[0], e[1]); });
      if (errs.length) { errs[0][0].focus({ preventScroll: true }); errs[0][0].scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); }
    }
    return errs.length ? null : v;
  }
  dForm.addEventListener("input", function (e) { var fld = e.target.closest(".fld"); if (fld && fld.classList.contains("bad")) fieldErr(e.target, ""); });
  dForm.addEventListener("submit", function (e) { e.preventDefault(); proceed(); });
  function proceed() {
    var v = readDetails(true);
    if (!v) return;
    if (APPLIED) {   // coupon beech mein expire/band ho gaya ho toh
      var re = checkCoupon(APPLIED.code);
      if (!re.ok || re.final !== FINAL) { removeCoupon(re.ok ? "" : re.msg + " Ab total ₹" + PRICE + " hai."); return; }
    }
    BUYER = v;
    setAll(".js-recap-who", v.name.split(" ")[0] + " · +91 " + v.phone);
    show(stP);
  }
  modal.querySelector(".js-proceed").addEventListener("click", proceed);

  /* ---- QR reveal + mascot buddy ---- */
  var qrzone = modal.querySelector(".js-qrzone");
  var mz = modal.querySelector(".js-mz");
  var bub = modal.querySelector(".js-bub"), bubText = modal.querySelector(".js-bub-text");
  (function () {   // wahi WhatsApp wala character (neeche kone wala) yahan bhi
    var src = document.querySelector(".orb-dock .m-bob"), wa = document.querySelector(".orb-dock .orb-wa");
    if (src) mz.appendChild(src.cloneNode(true));
    if (wa) mz.appendChild(wa.cloneNode(true));
  })();
  var DEFAULT_MOTIV = [
    "Thank you {BUYER}! 🙏 Ye aapki comeback story ki shuruaat hai 🔥",
    "Aaj ka ek chhota step, kal ka bada result 💪",
    "Seekhna shuru — baaki raasta khud banega ✨"
  ];
  var MOTIV = (Array.isArray(C.CHECKOUT_MOTIVATION) && C.CHECKOUT_MOTIVATION.length ? C.CHECKOUT_MOTIVATION : DEFAULT_MOTIV)
    .map(function (s) { return String(s || "").trim(); }).filter(Boolean);
  var MOTIV_MS = Math.max(2.5, Number(C.CHECKOUT_MOTIVATION_SECONDS) || 4) * 1000;
  var bt = [], mi = 0;
  function bLater(fn, t) { bt.push(setTimeout(fn, t)); }
  function stopBuddy() { bt.forEach(clearTimeout); bt = []; qrzone.classList.remove("go", "landed", "talk"); mz.className = "co-mz js-mz"; }
  function lineFor(i) {
    var first = BUYER ? BUYER.name.split(" ")[0] : "";
    return fill(MOTIV[i % MOTIV.length]).replace(/\s*\{BUYER\}/g, first ? " " + first : "").replace(/\s+([!,?.])/g, "$1");
  }
  function mzFlash(cls, t) { mz.classList.add(cls); bLater(function () { mz.classList.remove(cls); }, t); }
  function sayNext() {
    bub.classList.add("swap");
    bLater(function () {
      bubText.textContent = lineFor(mi++);
      bub.classList.remove("swap", "typing");
      mzFlash("smile", 1800);
      if (mi % 2 === 0) mzFlash("waving", 2400);
      if (!reduceMotion) { mz.classList.remove("pop"); void mz.offsetWidth; mzFlash("pop", 700); }
    }, reduceMotion ? 0 : 260);
    bLater(sayNext, MOTIV_MS);
  }
  function blinkLoop() { mzFlash("blink", 240); bLater(blinkLoop, 2200 + Math.random() * 2800); }
  function startPay() {
    stopBuddy();
    drawQR();
    mi = 0; bubText.textContent = "";
    bub.classList.add("typing");
    void qrzone.offsetWidth;
    qrzone.classList.add("go");                    // QR reveal + character chal ke aata hai
    var walk = reduceMotion ? 0 : 1500;
    bLater(function () { qrzone.classList.add("landed"); mzFlash("pop", 700); mzFlash("waving", 2600); mzFlash("smile", 2600); }, walk);
    bLater(function () { qrzone.classList.add("talk"); }, walk + 250);
    bLater(sayNext, walk + (reduceMotion ? 0 : 1100));
    if (!reduceMotion) bLater(blinkLoop, walk + 1600);
  }

  /* copy UPI */
  modal.querySelector(".js-copy").addEventListener("click", function () {
    var btn = this;
    function done() { btn.textContent = "Copied ✓"; btn.classList.add("done"); setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(UPI).then(done, fallback);
    } else fallback();
    function fallback() {
      var t = document.createElement("textarea"); t.value = UPI; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(t);
    }
  });

  /* ---- UTR -> invoice ---- */
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function istParts(d) {   // India time
    var t = new Date(d.getTime() + 5.5 * 3600 * 1000);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth(), d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes() };
  }
  function invNo(d) {
    var p = istParts(d), A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += A.charAt(Math.floor(Math.random() * A.length));
    return "PY-" + p.y + pad2(p.mo + 1) + pad2(p.d) + "-" + r;
  }
  function niceTime(d) {
    var p = istParts(d), h = p.h % 12 || 12;
    return p.d + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][p.mo] + " " + p.y + ", " + h + ":" + pad2(p.mi) + " " + (p.h < 12 ? "AM" : "PM") + " IST";
  }
  var STATUS = C.INVOICE_STATUS_TEXT || "Payment verification pending — 10-30 min mein WhatsApp pe course link milega";
  function invRows(I) {
    return [
      ["Invoice no.", I.no], ["Date", I.when],
      ["Naam", I.name], ["WhatsApp", "+91 " + I.phone], ["Email", I.email]
    ];
  }
  function renderInvoice(I) {
    var el = modal.querySelector(".js-inv");
    function row(k, v, cls) { return "<div class=\"" + (cls || "") + "\"><dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>"; }
    el.innerHTML =
      "<header class=\"inv-h\"><span class=\"inv-logo\" aria-hidden=\"true\">₹</span><div><b class=\"inv-brand\">Paisa<span>Yug</span></b><small>Payment Invoice</small></div><span class=\"inv-no\">" + esc(I.no) + "</span></header>" +
      "<dl class=\"inv-meta\">" + invRows(I).slice(1).map(function (r) { return row(r[0], r[1]); }).join("") + "</dl>" +
      "<div class=\"inv-item\"><div><b>" + esc(I.item) + "</b><small>Ebook · Lifetime access</small></div><span>×1</span></div>" +
      "<dl class=\"inv-amt\">" +
        row("MRP", "₹" + I.mrp, "i-mrp") +
        row("Offer price", "₹" + I.price) +
        (I.coupon ? row("Coupon (" + I.coupon + ")", "−₹" + I.disc, "disc") : row("Coupon", "—")) +
        row("Total paid", "₹" + I.total, "tot") +
      "</dl>" +
      "<dl class=\"inv-pay\">" + row("Paid to (UPI)", I.upi) + row("UTR / Txn ID", I.utr) + "</dl>" +
      "<p class=\"inv-status\"><span class=\"inv-dot\" aria-hidden=\"true\"></span>" + esc(I.status) + "</p>" +
      "<p class=\"inv-foot\">Computer generated invoice · Help: WhatsApp +" + esc(WA) + "</p>";
  }
  function waMessage(I) {
    return "🧾 " + NAME + " — Payment Done\n" +
      "Invoice: " + I.no + "\n" +
      "Date: " + I.when + "\n\n" +
      "Name: " + I.name + "\n" +
      "Phone: +91 " + I.phone + "\n" +
      "Email: " + I.email + "\n\n" +
      "Course: " + I.item + "\n" +
      "MRP: ₹" + I.mrp + "\n" +
      "Price: ₹" + I.price + "\n" +
      (I.coupon ? "Coupon: " + I.coupon + " (₹" + I.disc + " off)\n" : "Coupon: none\n") +
      "Amount: ₹" + I.total + "\n" +
      "Paid to UPI: " + I.upi + "\n" +
      "UTR: " + I.utr + "\n\n" +
      "Status: verification pending. Please course link bhej do 🙏";
  }
  uForm.addEventListener("input", function (e) { var fld = e.target.closest(".fld"); if (fld && fld.classList.contains("bad")) fieldErr(e.target, ""); });
  uForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = uForm.elements.utr;
    var utr = inp.value.replace(/[\s-]+/g, "").toUpperCase();
    if (!/^[A-Z0-9]{6,30}$/.test(utr)) { fieldErr(inp, "UTR / Transaction ID sahi likho (payment receipt mein milega)"); inp.focus(); return; }
    fieldErr(inp, "");
    if (!BUYER) { show(stD); return; }
    if (APPLIED) {   // coupon beech mein expire/band ho gaya ho toh
      var re = checkCoupon(APPLIED.code);
      if (!re.ok || re.final !== FINAL) { removeCoupon(re.ok ? "" : re.msg + " Naye amount ₹" + PRICE + " se pay karo."); show(stD); return; }
    }
    var now = new Date();
    INVOICE = {
      no: invNo(now), when: niceTime(now),
      name: BUYER.name, phone: BUYER.phone, email: BUYER.email,
      item: NAME + " — A-to-Z Course", mrp: MRP, price: PRICE,
      coupon: APPLIED ? APPLIED.code : "", disc: APPLIED ? APPLIED.saved : 0, total: FINAL,
      upi: UPI, utr: utr, status: STATUS
    };
    if (APPLIED) markUsed(APPLIED.code);   // payment confirm = coupon is phone pe use ho gaya
    renderInvoice(INVOICE);
    var waUrl = "https://wa.me/" + WA + "?text=" + encodeURIComponent(waMessage(INVOICE));
    $all(".js-inv-wa").forEach(function (a) { a.href = waUrl; });
    setAll(".js-buyer", BUYER.name.split(" ")[0]);
    try { localStorage.setItem("py_last_invoice_v1", JSON.stringify(INVOICE)); } catch (er) {}
    invBlob = null; makeInvoicePng(INVOICE);
    show(stI);
  });

  /* ---- invoice image (PNG) — bina kisi library ke canvas pe ---- */
  var invBlob = null;
  function makeInvoicePng(I, cb) {
    var W = 720, S = 2, pad = 40, y = 0;
    var cv = document.createElement("canvas");
    var rows = 0;
    var Hh = 912;
    cv.width = W * S; cv.height = Hh * S;
    var x = cv.getContext("2d");
    if (!x) return;
    x.scale(S, S);
    var F = "Poppins, Arial, sans-serif";
    function txt(t, px, py, size, weight, color, align) { x.font = (weight || 400) + " " + size + "px " + F; x.fillStyle = color || "#14211a"; x.textAlign = align || "left"; x.fillText(t, px, py); }
    function rr(px, py, w, h, r, fillC, strokeC) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); if (fillC) { x.fillStyle = fillC; x.fill(); } if (strokeC) { x.strokeStyle = strokeC; x.lineWidth = 1.5; x.stroke(); } }
    function line(py) { x.strokeStyle = "#e3e9e4"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(pad, py); x.lineTo(W - pad, py); x.stroke(); }
    function kv(k, v, py, opt) { opt = opt || {}; txt(k, pad, py, opt.ks || 19, opt.kw || 500, opt.kc || "#5b6b61"); txt(String(v), W - pad, py, opt.vs || 19, opt.vw || 700, opt.vc || "#14211a", "right"); }
    x.fillStyle = "#0a0f0b"; x.fillRect(0, 0, W, Hh);
    rr(20, 20, W - 40, Hh - 40, 26, "#ffffff");
    // header
    var g = x.createLinearGradient(0, 20, 0, 150); g.addColorStop(0, "#0f2a1b"); g.addColorStop(1, "#0a1a11");
    x.save(); rr(20, 20, W - 40, 130, 26, null); x.clip(); x.fillStyle = g; x.fillRect(20, 20, W - 40, 150); x.restore();
    var cg = x.createLinearGradient(56, 50, 116, 110); cg.addColorStop(0, "#ffe08a"); cg.addColorStop(.55, "#f5b301"); cg.addColorStop(1, "#c98a00");
    x.beginPath(); x.arc(86, 85, 30, 0, Math.PI * 2); x.fillStyle = cg; x.fill();
    txt("₹", 86, 97, 34, 800, "#0a0f0b", "center");
    txt("Paisa", 130, 92, 34, 800, "#ffffff");
    var pw = (x.font = "800 34px " + F, x.measureText("Paisa").width);
    txt("Yug", 130 + pw, 92, 34, 800, "#f5b301");
    txt("PAYMENT INVOICE", 131, 118, 14, 700, "#a8d8b8");
    txt(I.no, W - 52, 80, 18, 800, "#ffd54a", "right");
    txt(I.when, W - 52, 106, 15, 500, "#cfe3d6", "right");
    y = 196;
    txt("BILL TO", pad + 6, y, 14, 700, "#16a34a"); y += 34;
    kv("Naam", I.name, y); y += 34; kv("WhatsApp", "+91 " + I.phone, y); y += 34; kv("Email", I.email, y); y += 26;
    line(y); y += 40;
    txt("ITEM", pad + 6, y, 14, 700, "#16a34a"); y += 34;
    kv(I.item + "  ×1", "", y, { kw: 700, kc: "#14211a", ks: 20 }); y += 26; txt("Ebook · Lifetime access", pad, y, 15, 500, "#7b8a80"); y += 24;
    line(y); y += 40;
    kv("MRP", "₹" + I.mrp, y); x.strokeStyle = "#ff5a5f"; x.lineWidth = 2; x.font = "700 19px " + F; var mw = x.measureText("₹" + I.mrp).width; x.beginPath(); x.moveTo(W - pad - mw, y - 6); x.lineTo(W - pad, y - 6); x.stroke(); y += 34;
    kv("Offer price", "₹" + I.price, y); y += 34;
    if (I.coupon) kv("Coupon (" + I.coupon + ")", "−₹" + I.disc, y, { vc: "#16a34a" }); else kv("Coupon", "—", y); y += 22;
    rr(pad - 6, y, W - 2 * pad + 12, 62, 14, "#f2faf4", "#bfe5cb"); y += 41;
    kv("Total paid", "₹" + I.total, y, { ks: 22, kw: 800, kc: "#0f5130", vs: 28, vw: 800, vc: "#0f7a3d" }); y += 52;
    kv("Paid to (UPI)", I.upi, y, { vs: 17 }); y += 34; kv("UTR / Txn ID", I.utr, y, { vs: 18 }); y += 30;
    rr(pad - 6, y, W - 2 * pad + 12, 84, 14, "#fff8e1", "#f5d27a"); 
    x.beginPath(); x.arc(pad + 16, y + 30, 6, 0, Math.PI * 2); x.fillStyle = "#f59e0b"; x.fill();
    var st = I.status.split(" — ");
    txt(st[0], pad + 32, y + 36, 18, 800, "#7a4b00"); txt(st.slice(1).join(" — "), pad + 32, y + 64, 16, 500, "#7a5a1a");
    y += 84 + 40;
    txt("Computer generated invoice · Help: WhatsApp +" + WA, W / 2, y, 14, 500, "#8a978e", "center");
    try {
      cv.toBlob(function (b) { invBlob = b; if (cb) cb(b); }, "image/png");
    } catch (e) { invBlob = null; }
  }
  function fname() { return "PaisaYug-Invoice-" + (INVOICE ? INVOICE.no : "") + ".png"; }
  function downloadBlob(b) {
    var url = URL.createObjectURL(b), a = document.createElement("a");
    a.href = url; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  modal.querySelector(".js-inv-dl").addEventListener("click", function () {
    if (!INVOICE) return;
    var b = invBlob;
    if (!b) { var go = function (bb) { if (bb) downloadBlob(bb); else window.print(); }; document.fonts && document.fonts.ready ? makeInvoicePng(INVOICE, go) : makeInvoicePng(INVOICE, go); return; }
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    try {
      var file = new File([b], fname(), { type: "image/png" });
      if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "PaisaYug Invoice" }).catch(function () {}); return; }
    } catch (e) {}
    downloadBlob(b);
  });
  modal.querySelector(".js-inv-print").addEventListener("click", function () { window.print(); });
  window.PAISAYUG_CHECKOUT = { open: open, show: function (n) { show([stD, stP, stI][n]); }, invoicePng: function () { return invBlob; } };

  /* ---- reviews / highlights carousel ----
     REVIEWS (asli buyers) khaali ho toh HIGHLIGHTS (seller ke apne points) ghoomte hain.
     REVIEWS mein entry aate hi yahi carousel chat-style reviews dikhata hai. Fake review kabhi nahi. */
  var REVIEWS = (Array.isArray(C.REVIEWS) ? C.REVIEWS : []).filter(function (r) { return r && String(r.text || "").trim(); });
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function starStr(n) { n = Math.max(1, Math.min(5, Math.round(Number(n) || 5))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function who(r) { return [r.name, r.city].filter(Boolean).map(function (s) { return String(s).trim(); }).join(", "); }
  function fill(t) { return String(t == null ? "" : t).replace(/\{PRICE\}/g, PRICE).replace(/\{MRP\}/g, MRP).replace(/\{NAME\}/g, NAME); }
  var DEFAULT_HL = [
    { icon: "📱", title: "Sirf phone se shuru karo", text: "Laptop ya mehenga setup nahi — phone aur internet, bas." },
    { icon: "💸", title: "₹0 investment wale tarike", text: "Freelancing, content, reselling, affiliate — bina paisa lagaye." },
    { icon: "🧠", title: "Step-by-step, beginner friendly", text: "Zero se shuru, simple Hinglish mein, ek-ek step." },
    { icon: "⚡", title: "Aaj padho, aaj se try karo", text: "Har module ke baad seedha action — theory kam, kaam zyada." },
    { icon: "♾️", title: "Lifetime access, ek baar payment", text: "Sirf ₹{PRICE} ek baar. Jab chaho, jitni baar chaho dekho." }
  ];
  function normHL(h) {
    if (typeof h === "string") {
      var m = h.trim().match(/^(\S+)\s+(.+)$/);
      var first = m ? m[1] : "";
      if (m && !/[A-Za-z0-9₹]/.test(first)) return { icon: first, title: m[2], text: "" };
      return { icon: "✨", title: h.trim(), text: "" };
    }
    return h && h.title ? { icon: h.icon || "✨", title: h.title, text: h.text || "" } : null;
  }
  (function () {
    var car = document.querySelector(".js-car");
    var track = document.querySelector(".js-car-track");
    var dotsEl = document.querySelector(".js-car-dots");
    var bar = document.querySelector(".js-car-bar");
    var summary = document.querySelector(".js-rv-summary");
    var ticker = document.querySelector(".js-rv-ticker");
    var mode = REVIEWS.length ? "reviews" : "highlights";
    var items, html;
    if (mode === "reviews") {
      var title = document.querySelector(".js-rv-title"), eyebrow = document.querySelector(".js-rv-eyebrow");
      if (title) title.textContent = C.REVIEWS_TITLE || "Students kya bol rahe hain";
      if (eyebrow) eyebrow.textContent = C.REVIEWS_EYEBROW || "Asli students, asli baatein";
      if (car) car.setAttribute("aria-label", "Student reviews");
      items = REVIEWS;
      html = items.map(function (r, i) {
        var nm = String(r.name || "Student").trim();
        return "<div class=\"car-slide\" role=\"group\" aria-roledescription=\"slide\" aria-label=\"" + (i + 1) + " / " + items.length + "\">" +
          "<figure class=\"rv-chat\"><div class=\"rv-chat-head\"><span class=\"rv-av\" aria-hidden=\"true\">" + esc(nm.charAt(0).toUpperCase()) +
          "</span><div class=\"rv-name\">" + esc(nm) + (r.city ? "<small>" + esc(String(r.city).trim()) + "</small>" : "") +
          "</div><span class=\"rv-stars\" aria-label=\"" + Math.max(1, Math.min(5, Math.round(Number(r.stars) || 5))) + " out of 5\">" + starStr(r.stars) +
          "</span></div><div class=\"rv-chat-body\"><blockquote class=\"rv-msg\" style=\"margin:0\">" + esc(String(r.text).trim()) + "</blockquote></div></figure></div>";
      }).join("");
      if (summary) {
        var avg = REVIEWS.reduce(function (s, r) { return s + Math.max(1, Math.min(5, Number(r.stars) || 5)); }, 0) / REVIEWS.length;
        summary.innerHTML = "<b>" + avg.toFixed(1) + " ★</b> · " + REVIEWS.length + " student review" + (REVIEWS.length > 1 ? "s" : "");
        summary.hidden = false;
      }
    } else {
      items = (Array.isArray(C.HIGHLIGHTS) && C.HIGHLIGHTS.length ? C.HIGHLIGHTS : DEFAULT_HL).map(normHL).filter(Boolean);
      html = items.map(function (h, i) {
        return "<div class=\"car-slide\" role=\"group\" aria-roledescription=\"slide\" aria-label=\"" + (i + 1) + " / " + items.length + "\">" +
          "<div class=\"hl-card\"><span class=\"hl-n\" aria-hidden=\"true\">" + (i + 1) + "/" + items.length + "</span><span class=\"hl-ico\" aria-hidden=\"true\">" + esc(fill(h.icon)) + "</span><div class=\"hl-body\">" +
          "<span class=\"hl-tag\">✔ Course mein shamil</span><h3>" + esc(fill(h.title)) + "</h3>" + (h.text ? "<p>" + esc(fill(h.text)) + "</p>" : "") + "</div></div></div>";
      }).join("");
    }
    if (car && track && items.length) {
      track.innerHTML = html;
      var slides = Array.prototype.slice.call(track.children);
      var cur = 0, timer = null, paused = false, visible = true;
      var ms = Math.max(2, Number(C.CAROUSEL_SECONDS) || 3.5) * 1000;
      car.style.setProperty("--car-ms", ms + "ms");
      dotsEl.innerHTML = slides.map(function (_, i) { return "<button class=\"car-dot\" type=\"button\" role=\"tab\" aria-label=\"Slide " + (i + 1) + "\" aria-selected=\"false\"></button>"; }).join("");
      var dots = Array.prototype.slice.call(dotsEl.children);
      if (slides.length < 2) { dotsEl.hidden = true; if (bar) bar.parentNode.hidden = true; }
      function restartBar() {
        if (!bar) return;
        bar.classList.remove("run"); void bar.offsetWidth;
        if (slides.length > 1 && !reduceMotion) bar.classList.add("run");
      }
      function go(i, back) {
        var prev = cur;
        cur = (i + slides.length) % slides.length;
        car.classList.toggle("back", !!back);
        slides.forEach(function (s, k) {
          s.classList.toggle("on", k === cur);
          s.classList.toggle("out", k === prev && prev !== cur);
          s.setAttribute("aria-hidden", k === cur ? "false" : "true");
        });
        dots.forEach(function (d, k) { d.setAttribute("aria-selected", k === cur ? "true" : "false"); });
        restartBar();
        schedule();
      }
      function schedule() {
        clearTimeout(timer);
        if (slides.length < 2 || paused || !visible) return;
        timer = setTimeout(function () { if (!document.hidden) go(cur + 1); else schedule(); }, ms);
      }
      function setPaused(p) { paused = p; car.classList.toggle("paused", p); if (p) clearTimeout(timer); else { restartBar(); schedule(); } }
      dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k, k < cur); }); });
      car.addEventListener("mouseenter", function () { setPaused(true); });
      car.addEventListener("mouseleave", function () { setPaused(false); });
      car.addEventListener("focusin", function () { setPaused(true); });
      car.addEventListener("focusout", function () { setPaused(false); });
      var sx = 0, sy = 0, touching = false;
      car.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; touching = true; clearTimeout(timer); car.classList.add("paused"); }, { passive: true });
      car.addEventListener("touchend", function (e) {
        if (!touching) return; touching = false; car.classList.remove("paused");
        var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? cur + 1 : cur - 1, dx > 0); else schedule();
      }, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { restartBar(); schedule(); } else clearTimeout(timer); }, { threshold: 0.2 }).observe(car);
      }
      document.addEventListener("visibilitychange", function () { if (!document.hidden) { restartBar(); schedule(); } });
      window.PAISAYUG_CAROUSEL = { go: go, count: slides.length, mode: mode, current: function () { return cur; } };
      go(0);
    }
    /* hero ki chhoti review patti — sirf asli REVIEWS ho tab */
    if (!ticker) return;
    if (!REVIEWS.length) { ticker.hidden = true; return; }
    var tText = ticker.querySelector(".js-tk-text"), tWho = ticker.querySelector(".js-tk-who"), tStars = ticker.querySelector(".js-tk-stars");
    var idx = 0;
    function put(r) { tText.textContent = "“" + String(r.text).trim() + "”"; tWho.textContent = "— " + who(r); tStars.textContent = starStr(r.stars); }
    put(REVIEWS[0]);
    ticker.hidden = false;
    if (REVIEWS.length < 2) return;
    var every = Math.max(2, Number(C.REVIEW_ROTATE_SECONDS) || 4) * 1000;
    setInterval(function () {
      if (document.hidden) return;
      idx = (idx + 1) % REVIEWS.length;
      if (reduceMotion) { put(REVIEWS[idx]); return; }
      ticker.classList.add("fading");
      setTimeout(function () { put(REVIEWS[idx]); ticker.classList.remove("fading"); }, 450);
    }, every);
  })();

  /* ---- help mascot: WhatsApp pe le jata hai; aankhein, smile, haath hilana, jhaankna ---- */
  (function () {
    var dock = document.querySelector(".js-orb-dock");
    if (!dock || C.ORB_ON === false || !WA) return;
    var waText = C.ORB_WHATSAPP_TEXT || ("Hi, " + NAME + " course ke baare mein help chahiye");
    var href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(waText);
    $all(".js-orb-link").forEach(function (a) { a.href = href; });
    var nudges = (Array.isArray(C.ORB_NUDGES) && C.ORB_NUDGES.length ? C.ORB_NUDGES : ["Hi! 👋 Koi doubt hai?"]).map(fill);
    var textEl = dock.querySelector(".js-orb-text");
    var orb = dock.querySelector(".orb");
    var sticky = document.querySelector(".sticky");
    function measure() {
      var hgt = sticky && getComputedStyle(sticky).display !== "none" ? sticky.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty("--sticky-h", Math.round(hgt) + "px");
    }
    measure();
    window.addEventListener("resize", measure);
    dock.hidden = false;

    var timers = {};
    function later(key, fn, t) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, t); }
    function flash(cls, t) { dock.classList.add(cls); later(cls, function () { dock.classList.remove(cls); }, t); }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function busy() { return document.hidden || document.body.classList.contains("modal-open"); }

    /* aankhein: pointer/scroll ki taraf thoda dekhti hain */
    var lookLock = 0;
    function look(x, y) { dock.style.setProperty("--lx", x.toFixed(2) + "px"); dock.style.setProperty("--ly", y.toFixed(2) + "px"); }
    if (!reduceMotion) {
      var onPoint = function (cx, cy) {
        if (Date.now() < lookLock) return;
        var r = orb.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
        var dx = cx - ox, dy = cy - oy, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 160);
        look(dx / d * 2.6 * k, dy / d * 2.4 * k);
        later("lookback", function () { look(0, 0); }, 2600);
      };
      window.addEventListener("pointermove", function (e) { onPoint(e.clientX, e.clientY); }, { passive: true });
      window.addEventListener("touchstart", function (e) { var t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); }, { passive: true });
      var lastY = window.scrollY;
      window.addEventListener("scroll", function () {
        var y = window.scrollY, dy = y - lastY; lastY = y;
        if (Math.abs(dy) < 4 || Date.now() < lookLock) return;
        look(0, dy > 0 ? 2.2 : -2.4);
        later("lookback", function () { look(0, 0); }, 900);
      }, { passive: true });
    }

    /* chhoti chhoti idle harkatein */
    function blink() {
      if (!busy()) {
        flash("blink", 240);
        if (Math.random() < 0.25) later("blink2", function () { flash("blink", 240); }, 330);
      }
      later("blinkLoop", blink, rnd(2400, 5200));
    }
    function glance() {
      if (!busy() && Date.now() >= lookLock) {
        var spots = [[-2.6, 0], [2.6, 0], [0, -2.4], [-2, 1.8], [2, 1.8], [0, 0]];
        var p = spots[Math.floor(Math.random() * spots.length)];
        look(p[0], p[1]);
        later("lookback", function () { look(0, 0); }, rnd(900, 1600));
      }
      later("glanceLoop", glance, rnd(3200, 6000));
    }
    function idleFun() {
      if (!busy() && !dock.classList.contains("talking")) {
        var r = Math.random();
        if (r < 0.4) flash("smile", 1600);
        else if (r < 0.75) { flash("waving", 2600); flash("smile", 2200); }
        else { flash("peek", 1800); lookLock = Date.now() + 1800; look(-2.6, 0.6); later("lookback", function () { look(0, 0); }, 1800); }
      }
      later("idleLoop", idleFun, rnd(7000, 11000));
    }

    /* nudge: bounce + wave + smile + bubble (kabhi kabhi side mein jhaank ke) */
    var n = 0, muted = false;
    var first = Math.max(1, Number(C.ORB_FIRST_NUDGE_SECONDS) || 5) * 1000;
    var every = Math.max(8, Number(C.ORB_NUDGE_EVERY_SECONDS) || 20) * 1000;
    var showFor = Math.max(2, Number(C.ORB_BUBBLE_SECONDS) || 5) * 1000;
    function nudge(force) {
      if (!force && (muted || busy())) return;
      var line = nudges[n % nudges.length];
      textEl.textContent = line;
      n++;
      var peek = /fayda|😉|buy|kharid/i.test(line) || n % 3 === 0;
      if (!reduceMotion) {
        dock.classList.remove("pop"); void dock.offsetWidth;
        flash("pop", 700);
        flash("waving", 2800);
        flash("smile", 2400);
        if (peek) { flash("peek", Math.min(showFor, 3200)); lookLock = Date.now() + 2600; look(-2.6, -0.4); later("lookback", function () { look(0, 0); }, 2600); }
      }
      flash("talking", showFor);
    }
    dock.querySelector(".js-orb-x").addEventListener("click", function (e) {
      e.preventDefault();
      muted = true;
      dock.classList.remove("talking", "waving", "peek");
    });
    window.PAISAYUG_ORB_NUDGE = function (i) { muted = false; if (typeof i === "number") n = i; nudge(true); };
    if (!reduceMotion) {
      later("blinkLoop", blink, 1800);
      later("glanceLoop", glance, 3000);
      later("idleLoop", idleFun, first + 4500);
    }
    setTimeout(function () { nudge(); setInterval(nudge, every); }, first);
  })();
})();
