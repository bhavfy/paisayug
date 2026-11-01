/* PaisaYug — 3D book (price box mein). Settings config.js mein: BOOK_ON, BOOK_TITLE, BOOK_PAGE3_TITLE, BOOK_PAGE3_TEXT.
   Page 1-2 apne aap MODULES se bante hain. Yeh file edit karne ki zaroorat nahi. */
(function () {
  "use strict";
  var C = window.PAISAYUG_CONFIG || {};
  var zone = document.querySelector(".js-book-zone");
  var cd = document.querySelector(".js-countdown");
  if (!zone) return;
  if (C.BOOK_ON === false) { zone.parentNode.removeChild(zone); if (cd) cd.hidden = false; return; }
  if (cd) cd.parentNode.removeChild(cd);

  var PRICE = Number(C.PRICE) || 99, MRP = Number(C.MRP) || 999;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fill(s) { return String(s || "").replace(/\{PRICE\}/g, PRICE).replace(/\{MRP\}/g, MRP); }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- cover ---- */
  var title = String(C.BOOK_TITLE || ((C.COURSE_NAME || "PaisaYug") + " — Ghar Baithe Paise Kamao A to Z"));
  var parts = title.split(/\s+[—–-]\s+/);
  var brand = parts.shift() || "PaisaYug", sub = parts.join(" — "), az = "";
  var m = sub.match(/^(.*?)\s*(A\s*to\s*Z|A-Z)$/i);
  if (m && m[1]) { sub = m[1]; az = m[2]; }
  function coverHTML(tag) {
    return '<' + tag + ' class="cv"><' + tag + ' class="cv-logo">₹</' + tag + '>' +
      '<' + tag + ' class="cv-brand">' + esc(brand) + '</' + tag + '>' +
      '<' + tag + ' class="cv-line"></' + tag + '>' +
      (sub ? '<' + tag + ' class="cv-sub">' + esc(sub) + '</' + tag + '>' : '') +
      (az ? '<' + tag + ' class="cv-az">' + esc(az) + '</' + tag + '>' : '') +
      '<' + tag + ' class="cv-foot">Ebook · Hinglish</' + tag + '></' + tag + '>';
  }
  var front = zone.querySelector(".js-cover");
  front.innerHTML = coverHTML("span");
  zone.querySelector(".js-spine").textContent = brand.toUpperCase();
  var openBtn = zone.querySelector(".js-book-open");
  openBtn.setAttribute("aria-label", title + " — book kholo, andar kya hai dekho");

  /* ---- pages 1-2 from MODULES ---- */
  function shortLine(md) {
    if (md.short) return String(md.short);
    var d = String(md.desc || "").split(/\s[—–]\s/)[0];
    var dot = d.search(/[.!?](\s|$)/); if (dot > 0) d = d.slice(0, dot);
    d = d.replace(/[.\s—–]+$/, "");
    if (d.length > 64) {
      var cut = d.slice(0, 64), c = cut.lastIndexOf(", ");
      d = c > 25 ? cut.slice(0, c) : cut.slice(0, cut.lastIndexOf(" ")) + "…";
    }
    return d;
  }
  var mods = (Array.isArray(C.MODULES) ? C.MODULES : []).filter(function (x) { return x && x.title; });
  var half = Math.ceil(mods.length / 2);
  function listPage(list, start, pno) {
    return '<div class="pg-in"><p class="pg-k">📖 Is book mein kya hai <span>(' + pno + '/2)</span></p>' +
      '<ol class="pg-list" start="' + (start + 1) + '">' + list.map(function (md, i) {
        return '<li><b class="pg-n">' + (start + i + 1) + '</b><div><strong>' + esc(md.title) + '</strong><span>' + esc(shortLine(md)) + '</span></div></li>';
      }).join("") + '</ol>' +
      (pno === 1 ? '<p class="pg-more">Aage aur hai… →</p>' : '<p class="pg-more">Simple Hinglish, step by step ✍️</p>') +
      '<p class="pg-no">— ' + pno + ' —</p></div>';
  }
  var p3 = '<div class="pg-in pg3"><p class="pg3-h">' + esc(fill(C.BOOK_PAGE3_TITLE || "Ab sochna band karo.")) + '</p>' +
    '<p class="pg3-t">' + esc(fill(C.BOOK_PAGE3_TEXT || "Jo log aaj shuru karte hain, wahi kal kamate hain.")) + '</p>' +
    '<p class="pg3-price"><s>₹<span class="js-mrp">' + MRP + '</span></s> <b>₹<span class="js-final">' + PRICE + '</span></b></p>' +
    '<div class="pg3-cta"></div>' +
    '<p class="pg3-trust">🔒 Safe UPI · ♾️ Lifetime access</p><p class="pg-no">— 3 —</p></div>';

  var stage = zone.querySelector(".js-rd-stage");
  var faces = [
    '<div class="lf lf-front lf-cover">' + coverHTML("span") + '</div>',
    '<div class="lf lf-front pg">' + listPage(mods.slice(0, half), 0, 1) + '</div>',
    '<div class="lf lf-front pg">' + listPage(mods.slice(half), half, 2) + '</div>',
    '<div class="lf lf-front pg">' + p3 + '</div>'
  ];
  stage.innerHTML = faces.map(function (f, i) {
    return '<div class="leaf" data-i="' + i + '" style="z-index:' + (10 - i) + '">' + f + '<div class="lf lf-back" aria-hidden="true"></div></div>';
  }).join("");
  var leaves = Array.prototype.slice.call(stage.querySelectorAll(".leaf"));
  var buy = zone.querySelector(".js-book-buy");
  stage.querySelector(".pg3-cta").appendChild(buy);
  buy.hidden = false;

  var reader = zone.querySelector(".js-reader");
  var hint = zone.querySelector(".js-book-hint");
  var prevB = zone.querySelector(".js-rd-prev"), nextB = zone.querySelector(".js-rd-next");
  var count = zone.querySelector(".js-rd-count");
  var cur = 0, LAST = leaves.length - 1;

  function sizeStage() {
    var h = 0;
    leaves.forEach(function (l, i) { if (i) { var inn = l.querySelector(".pg-in"); if (inn) h = Math.max(h, inn.offsetHeight); } });
    stage.style.height = Math.max(h, 300) + "px";
  }
  function sync() {
    leaves.forEach(function (l, i) {
      var t = i < cur;
      l.classList.toggle("turned", t);
      l.setAttribute("aria-hidden", i === cur ? "false" : "true");
      l.inert = i !== cur;
    });
    prevB.disabled = cur <= 1;
    nextB.disabled = cur >= LAST;
    count.textContent = "Page " + Math.max(cur, 1) + " / " + LAST;
  }
  function go(n) { n = Math.max(1, Math.min(LAST, n)); if (n === cur) return; cur = n; sync(); }

  function openBook() {
    openBtn.hidden = true; hint.hidden = true;
    reader.hidden = false;
    reader.classList.add("pop");
    stage.classList.add("no-anim");
    cur = 0; sync(); sizeStage();
    void stage.offsetWidth;
    stage.classList.remove("no-anim");
    setTimeout(function () { go(1); nextB.focus({ preventScroll: true }); }, reduce ? 0 : 260);
  }
  function closeBook() {
    reader.hidden = true; reader.classList.remove("pop");
    openBtn.hidden = false; hint.hidden = false;
    stage.classList.add("no-anim"); cur = 0; sync();
    openBtn.focus({ preventScroll: true });
  }
  openBtn.addEventListener("click", openBook);
  zone.querySelector(".js-book-close").addEventListener("click", closeBook);
  nextB.addEventListener("click", function () { go(cur + 1); });
  prevB.addEventListener("click", function () { go(cur - 1); });
  reader.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
    else if (e.key === "Escape") closeBook();
  });
  /* tap = agla page, swipe left/right = aage/peeche */
  var sx = null, sy = 0, swiped = false;
  stage.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; swiped = false; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped = true; go(dx < 0 ? cur + 1 : cur - 1); }
  }, { passive: true });
  stage.addEventListener("click", function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target.closest("button, a")) return;
    go(cur + 1);
  });
  window.addEventListener("resize", function () { if (!reader.hidden) sizeStage(); });
  sync();
})();
