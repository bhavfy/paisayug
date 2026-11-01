/* PaisaYug — 3D book. Settings config.js mein: BOOK_ON, BOOK_TITLE, BOOK_PAGE3_TITLE, BOOK_PAGE3_TEXT.
   Book apni hi jagah pe khulti hai (zoom nahi) — pages wahin palatte hain.
   Page 1-2 apne aap MODULES se bante hain. Yeh file edit karne ki zaroorat nahi. */
(function () {
  "use strict";
  var C = window.PAISAYUG_CONFIG || {};
  var PRICE = Number(C.PRICE) || 99, MRP = Number(C.MRP) || 999;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fill(s) { return String(s || "").replace(/\{PRICE\}/g, PRICE).replace(/\{MRP\}/g, MRP); }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- cover (3D book + open book + checkout wali chhoti book, sab same) ---- */
  var title = String(C.BOOK_TITLE || ((C.COURSE_NAME || "PaisaYug") + " — Ghar Baithe Paise Kamao A to Z"));
  var parts = title.split(/\s+[—–-]\s+/);
  var brand = parts.shift() || "PaisaYug", sub = parts.join(" — "), az = "";
  var m = sub.match(/^(.*?)\s*(A\s*to\s*Z|A-Z)$/i);
  if (m && m[1]) { sub = m[1]; az = m[2]; }
  function coverHTML() {
    return '<span class="cv"><span class="cv-logo">₹</span>' +
      '<span class="cv-brand">' + esc(brand) + '</span><span class="cv-line"></span>' +
      (sub ? '<span class="cv-sub">' + esc(sub) + '</span>' : '') +
      (az ? '<span class="cv-az">' + esc(az) + '</span>' : '') +
      '<span class="cv-foot">Ebook · Hinglish</span></span>';
  }
  function solidHTML() {
    return '<span class="book3d js-book3d" aria-hidden="true">' +
      '<span class="bk-face bk-front">' + coverHTML() + '</span>' +
      '<span class="bk-face bk-back"><span class="bk-back-t">' + esc(brand) + '</span></span>' +
      '<span class="bk-face bk-spine"><span>' + esc(brand.toUpperCase()) + '</span></span>' +
      '<span class="bk-face bk-pages"></span><span class="bk-face bk-top"></span><span class="bk-face bk-bottom"></span></span>';
  }
  // checkout (aur kahin bhi) ghoomti hui band book lagane ke liye
  window.PAISAYUG_BOOK = { solidHTML: solidHTML, coverHTML: coverHTML, mount: function (el) { if (el) el.innerHTML = solidHTML(); } };

  var zone = document.querySelector(".js-book-zone");
  var cd = document.querySelector(".js-countdown");
  if (!zone) return;
  if (C.BOOK_ON === false) { zone.parentNode.removeChild(zone); if (cd) cd.hidden = false; return; }
  if (cd) cd.parentNode.removeChild(cd);

  /* ---- pages ---- */
  function shortLine(md) {
    if (md.short) return String(md.short);
    var d = String(md.desc || "").split(/\s[—–]\s/)[0];
    var dot = d.search(/[.!?](\s|$)/); if (dot > 0) d = d.slice(0, dot);
    return d.replace(/[.\s—–]+$/, "");
  }
  var mods = (Array.isArray(C.MODULES) ? C.MODULES : []).filter(function (x) { return x && x.title; });
  var half = Math.ceil(mods.length / 2);
  function listPage(list, start, head, foot, pno) {
    return '<div class="pg-in' + (list.length > 4 ? ' dense' : '') + '">' + head +
      '<ol class="pg-list">' + list.map(function (md, i) {
        return '<li title="' + esc(shortLine(md)) + '"><b class="pg-n">' + (start + i + 1) + '</b><strong>' + esc(md.title) + '</strong></li>';
      }).join("") + '</ol>' + foot + '<p class="pg-no">' + pno + '</p></div>';
  }
  var pA = listPage(mods.slice(0, half), 0, '<p class="pg-k">📖 Is book mein kya hai</p>', '', 1);
  var pB = listPage(mods.slice(half), half, '<p class="pg-k pg-k2">Aur aage…</p>', '', 2);
  var pC = '<div class="pg-in pg3"><p class="pg3-h">' + esc(fill(C.BOOK_PAGE3_TITLE || "Ab sochna band karo.")) + '</p>' +
    '<p class="pg3-t">' + esc(fill(C.BOOK_PAGE3_TEXT || "Jo log aaj shuru karte hain, wahi kal kamate hain.")) + '</p><p class="pg-no">3</p></div>';
  var pD = '<div class="pg-in pg4"><p class="pg4-k">Launch offer</p>' +
    '<p class="pg3-price"><s>₹<span class="js-mrp">' + MRP + '</span></s> <b>₹<span class="js-final">' + PRICE + '</span></b></p>' +
    '<div class="pg3-cta"></div><p class="pg3-trust">🔒 Safe UPI<br>♾️ Lifetime access</p><p class="pg-no">4</p></div>';
  // leaf = ek panna: front (right side wala page), back (palatne ke baad left side)
  var LEAVES = [
    ['<div class="lf-cover">' + coverHTML() + '</div>', '<div class="pg pg-l">' + pA + '</div>'],
    ['<div class="pg pg-r">' + pB + '</div>', '<div class="pg pg-l">' + pC + '</div>'],
    ['<div class="pg pg-r">' + pD + '</div>', '<div class="pg pg-l pg-end"></div>']
  ];

  var scene = zone.querySelector(".js-bk-scene");
  var shift = zone.querySelector(".js-bk-shift");
  shift.insertAdjacentHTML("afterbegin", solidHTML());
  var solid = shift.querySelector(".js-book3d");
  var flip = zone.querySelector(".js-flip");
  flip.innerHTML = '<span class="flip-edge flip-edge-l" aria-hidden="true"></span><span class="flip-edge flip-edge-r" aria-hidden="true"></span>' +
    LEAVES.map(function (f, i) {
      return '<div class="leaf" data-i="' + i + '"><div class="lf lf-front">' + f[0] + '</div><div class="lf lf-back">' + f[1] + '</div></div>';
    }).join("");
  var leaves = Array.prototype.slice.call(flip.querySelectorAll(".leaf"));
  var buy = zone.querySelector(".js-book-buy");
  flip.querySelector(".pg3-cta").appendChild(buy);
  buy.hidden = false;

  var openBtn = zone.querySelector(".js-book-open");
  openBtn.setAttribute("aria-label", title + " — book kholo, andar kya hai dekho");
  var hint = zone.querySelector(".js-book-hint");
  var nav = zone.querySelector(".js-bk-nav");
  var prevB = zone.querySelector(".js-rd-prev"), nextB = zone.querySelector(".js-rd-next");
  var closeB = zone.querySelector(".js-book-close");
  var count = zone.querySelector(".js-rd-count");
  var MAXT = LEAVES.length - 1;     // kitne panne palat sakte hain (2 spreads)
  var cur = 0, state = "closed", timers = [];
  function later(fn, t) { timers.push(setTimeout(fn, reduce ? 0 : t)); }
  function clearT() { timers.forEach(clearTimeout); timers = []; }

  function paint() {
    leaves.forEach(function (l, i) {
      var t = i < cur;
      l.classList.toggle("turned", t);
      // turned panne left pe (naya wala upar), baaki right pe (pehla wala upar)
      l.style.zIndex = t ? 10 + i : 10 - i;
      l.style.setProperty("--z", (t ? i * 0.8 : -i * 0.8) + "px");
      var vis = (t && i === cur - 1) || (!t && i === cur);
      l.setAttribute("aria-hidden", vis ? "false" : "true");
      l.inert = !vis;
    });
    if (prevB) prevB.disabled = cur <= 1;
    if (nextB) nextB.disabled = cur >= MAXT;
    if (count) count.textContent = cur <= 1 ? "Page 1–2 / 4" : "Page 3–4 / 4";
  }
  function go(n) {
    if (state !== "open") return;
    n = Math.max(1, Math.min(MAXT, n));
    if (n === cur) return;
    cur = n; paint();
  }

  function openBook() {
    if (state !== "closed") return;
    state = "opening"; clearT();
    // ghoomti book ko usi pal ke angle se seedha karo (jhatka nahi)
    var tf = getComputedStyle(solid).transform;
    solid.classList.remove("back");
    solid.style.transform = tf === "none" ? "" : tf;
    scene.classList.add("straight");
    void solid.offsetWidth;
    solid.style.transform = "";
    openBtn.hidden = true;
    hint.hidden = true;
    later(function () {
      scene.classList.add("flat");          // solid book chhupao, flat panne dikhao (same jagah)
      cur = 0; paint();
      void flip.offsetWidth;
      later(function () {
        scene.classList.add("open");        // cover khulta hai + book thoda khisakti hai taaki dono page beech mein rahein
        cur = 1; paint();
        nav.hidden = false;
        later(function () { state = "open"; if (nextB) nextB.focus({ preventScroll: true }); }, 820);
      }, 30);
    }, 420);
  }
  function closeBook() {
    if (state !== "open") return;
    state = "closing"; clearT();
    cur = 0; paint();
    scene.classList.remove("open");
    nav.hidden = true;
    later(function () {
      scene.classList.remove("flat");
      void solid.offsetWidth;
      later(function () {
        if (!reduce) solid.classList.add("back");     // wapas ghoomne lagti hai, bina jhatke
        scene.classList.remove("straight");
        openBtn.hidden = false; hint.hidden = false;
        state = "closed";
        openBtn.focus({ preventScroll: true });
      }, 60);
    }, 860);
  }
  openBtn.addEventListener("click", openBook);
  closeB.addEventListener("click", closeBook);
  nextB.addEventListener("click", function () { go(cur + 1); });
  prevB.addEventListener("click", function () { go(cur - 1); });
  zone.addEventListener("keydown", function (e) {
    if (state !== "open") return;
    if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
    else if (e.key === "Escape") closeBook();
  });
  /* right page tap = aage, left page tap = peeche, swipe bhi */
  var sx = null, sy = 0, swiped = false;
  flip.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; swiped = false; }, { passive: true });
  flip.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped = true; go(dx < 0 ? cur + 1 : cur - 1); }
  }, { passive: true });
  flip.addEventListener("click", function (e) {
    if (swiped) { swiped = false; return; }
    if (state !== "open" || e.target.closest("button, a")) return;
    var r = flip.getBoundingClientRect();
    if (e.clientX > r.left + r.width / 2) go(cur + 1); else go(cur - 1);
  });
  paint();
})();
