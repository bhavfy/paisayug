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
    setAll(".js-coupon-tag", APPLIED ? " (coupon " + APPLIED.code + ")" : "");
    var mOpen = document.getElementById("pay");
    if (mOpen && !mOpen.hidden) drawQR();
    else { var b = document.querySelector(".js-qr"); if (b) b.dataset.url = ""; }
  }

  /* ---- COUPONS ---- */
  var COUPONS = Array.isArray(C.COUPONS) ? C.COUPONS : [];
  var CKEY = "py_coupon_v1";
  var CTTL = 24 * 3600 * 1000;   // ek visit/din tak yaad rahe
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
  function applyRes(r, save) {
    APPLIED = { code: r.code, saved: PRICE - r.final };
    FINAL = r.final;
    if (save) { try { localStorage.setItem(CKEY, JSON.stringify({ code: r.code, at: Date.now() })); } catch (e) {} }
    if (cMsg) cMsg.textContent = "✅ " + r.code + " applied — ₹" + APPLIED.saved + " bachaye";
    if (cForm) cForm.hidden = true;
    if (cOk) cOk.hidden = false;
    setErr("");
    refreshPay();
  }
  function removeCoupon(errText) {
    APPLIED = null;
    FINAL = PRICE;
    try { localStorage.removeItem(CKEY); } catch (e) {}
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
      if (r.ok) applyRes(r, true); else { setErr(r.msg); cInput.focus(); }
    });
    cInput.addEventListener("input", function () { if (cErr.textContent) setErr(""); });
    document.querySelector(".js-coupon-remove").addEventListener("click", function () { removeCoupon(""); cInput.focus(); });
    // pichli visit ka coupon (ya link mein ?coupon=CODE) — check karke lagao, expire ho gaya ho toh hata do
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get("coupon"); } catch (e) {}
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(CKEY) || "null"); } catch (e) {}
    if (fromUrl) {
      var ru = checkCoupon(fromUrl);
      if (ru.ok) applyRes(ru, true); else { cInput.value = norm(fromUrl); setErr(ru.msg); }
    } else if (stored && stored.code) {
      var rs = (Date.now() - (stored.at || 0) > CTTL) ? { ok: false, msg: "" } : checkCoupon(stored.code);
      if (rs.ok) applyRes(rs, false);
      else removeCoupon(rs.msg ? rs.msg + " Coupon hata diya gaya." : "");
    }
  }
  refreshPay();
  $all(".js-upi-warn").forEach(function (el) { el.hidden = !UPI_PLACEHOLDER; });

  /* ---- modal steps ---- */
  var modal = document.getElementById("pay");
  var stepPay = modal.querySelector(".js-step-pay");
  var stepForm = modal.querySelector(".js-step-form");
  var stepDone = modal.querySelector(".js-step-done");
  var lastFocus = null;
  function show(step) {
    [stepPay, stepForm, stepDone].forEach(function (s) { s.hidden = s !== step; });
    var f = step.querySelector("input, button.btn, a.btn");
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 50);
    modal.querySelector(".modal-card").scrollTop = 0;
  }
  function open() {
    lastFocus = document.activeElement;
    drawQR();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    show(stepPay);
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }
  $all(".js-buy").forEach(function (b) { b.addEventListener("click", open); });
  $all(".js-coupon-open").forEach(function (b) { b.addEventListener("click", function () {
    open();
    var inp = document.querySelector(".js-coupon-input");
    if (inp && !APPLIED) setTimeout(function () { inp.focus({ preventScroll: true }); inp.scrollIntoView({ block: "center" }); }, 120);
  }); });
  $all(".js-close").forEach(function (b) { b.addEventListener("click", close); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
  modal.querySelector(".js-next").addEventListener("click", function () { show(stepForm); });
  modal.querySelector(".js-back").addEventListener("click", function () { show(stepPay); });

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

  /* ---- form -> WhatsApp ---- */
  var err = stepForm.querySelector(".js-err");
  stepForm.addEventListener("input", function (e) { if (e.target.classList.contains("bad")) { e.target.classList.remove("bad"); err.textContent = ""; } });
  stepForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = stepForm.elements;
    var v = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.replace(/[^0-9+]/g, ""),
      utr: f.utr.value.replace(/\s+/g, "").toUpperCase()
    };
    var bad = [];
    if (v.name.length < 2) bad.push(["name", "Apna naam likho"]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad.push(["email", "Sahi email likho"]);
    if (v.phone.replace(/\D/g, "").length < 10) bad.push(["phone", "10 digit WhatsApp number likho"]);
    if (!/^[A-Z0-9]{6,30}$/.test(v.utr)) bad.push(["utr", "UTR / Transaction ID sahi likho (payment receipt mein milega)"]);
    ["name", "email", "phone", "utr"].forEach(function (k) { f[k].classList.remove("bad"); });
    if (bad.length) {
      bad.forEach(function (b) { f[b[0]].classList.add("bad"); });
      err.textContent = bad[0][1];
      f[bad[0][0]].focus();
      return;
    }
    err.textContent = "";
    if (APPLIED) {   // coupon beech mein expire/band ho gaya ho toh
      var re = checkCoupon(APPLIED.code);
      if (!re.ok || re.final !== FINAL) { removeCoupon(re.ok ? "" : re.msg + " Naye amount ₹" + PRICE + " se pay karo."); show(stepPay); return; }
    }
    var msg = NAME + " payment done:\n" +
      "Name: " + v.name + "\n" +
      "Email: " + v.email + "\n" +
      "Phone: " + v.phone + "\n" +
      "UTR: " + v.utr + "\n" +
      (APPLIED ? "Coupon: " + APPLIED.code + " (₹" + APPLIED.saved + " off)\n" : "Coupon: none\n") +
      "Amount: ₹" + FINAL;
    var waUrl = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    $all(".js-wa-again").forEach(function (a) { a.href = waUrl; });
    setAll(".js-buyer", v.name.split(" ")[0]);
    show(stepDone);
    window.open(waUrl, "_blank", "noopener");
  });
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
