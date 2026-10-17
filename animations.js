/* ==========================================================================
   Portfolio micro-animations (additive layer) — pairs with animations.css
   Tags existing elements with data-fx-* attributes; never edits content,
   classes, layout or styles the Figma runtime manages.
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // content stays exactly as published
  doc.classList.add("fx-motion");

  var booted = false, io = null, pending = [], flushTimer = null, scanTimer = null;

  function visibleRoot() {
    var bps = document.querySelectorAll("#container [data-breakpoint-id]");
    for (var i = 0; i < bps.length; i++) {
      if (getComputedStyle(bps[i]).display !== "none") return bps[i];
    }
    return document.getElementById("container");
  }
  function alpha(color) {
    if (!color || color === "transparent") return 0;
    var m = color.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean);
    return p.length > 3 ? parseFloat(p[3]) : 1;
  }
  function hasFill(el) {
    if (alpha(getComputedStyle(el).backgroundColor) > 0.02) return true;
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (c.getAttribute("aria-hidden") === "true") {
        var cs = getComputedStyle(c);
        if (alpha(cs.backgroundColor) > 0.02) return true;
        if (parseFloat(cs.borderTopWidth) >= 1 && alpha(cs.borderTopColor) > 0.05) return true;
      }
    }
    return false;
  }
  function inLink(el, stop) {
    for (var p = el.parentElement; p && p !== stop; p = p.parentElement) {
      if (p.tagName === "A" || p.getAttribute("role") === "link") return true;
    }
    return false;
  }

  /* ---- Classify one element as an animation unit (or null to recurse) ---- */
  function classify(el, root) {
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 4) return null;
    var tag = el.tagName;
    var rootW = root.getBoundingClientRect().width;
    if ((tag === "A" || tag === "BUTTON") && r.width <= 360 && r.height <= 96) return "button";
    if (el.classList.contains("textContents") || tag === "P" || /^H[1-6]$/.test(tag)) return "text";
    if (tag === "VIDEO") return "media";
    if (el.children.length === 1 && el.firstElementChild.tagName === "VIDEO") return "video";
    if (el.dataset.isimage && r.width >= 120 && r.height >= 80) return "media";
    if (tag === "IMG" && r.width >= 120 && r.height >= 80) return "media";
    if (r.width >= 120 && r.height >= 80 && r.width < rootW * 0.92 && hasFill(el)) return "card";
    return null;
  }

  function tagUnit(el, kind, root) {
    var r = el.getBoundingClientRect();
    var linked = inLink(el, root);
    if (kind === "button") el.setAttribute("data-fx-btn", "");
    if (kind === "video") {
      el.setAttribute("data-fx-zoom", "");
      // overflow is clipped via CSS ([data-fx-zoom]); wrapper is exactly the video size
      if (linked) el.setAttribute("data-fx-lift", "");
    }
    if (kind === "card") {
      if (linked || r.width <= 480) el.setAttribute("data-fx-lift", "");
      // zoom a large image that already sits inside this card's clipped frame
      var ov = getComputedStyle(el).overflow;
      if (ov !== "visible") {
        var img = el.querySelector("[data-isimage]");
        if (img && img.getBoundingClientRect().width >= 160) {
          el.setAttribute("data-fx-zoom-host", "");
          img.setAttribute("data-fx-zoom-img", "");
        }
      }
    }
    if (kind === "media" && linked) el.setAttribute("data-fx-lift", "");
    return r;
  }

  function collect(root, header, out) {
    (function walk(el) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        if (c === header || c.tagName === "SCRIPT" || c.tagName === "STYLE") continue;
        if (c.hasAttribute("data-fx")) continue; // already handled
        var kind = classify(c, root);
        if (kind) out.push([c, kind]);
        else if (c.tagName !== "svg") walk(c);
      }
    })(root);
  }

  function findHeader(root) {
    var all = root.querySelectorAll(":scope > div, :scope > header");
    for (var i = 0; i < all.length; i++) if (getComputedStyle(all[i]).position === "fixed") return all[i];
    return null;
  }

  function setupHeader(header) {
    if (!header || header.hasAttribute("data-fx-header-done")) return;
    header.setAttribute("data-fx-header-done", "");
    if (!booted) header.setAttribute("data-fx-header", "");
    var links = header.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      links[i].setAttribute("data-fx-link", /\.pdf|resume/i.test(href) ? "doc" : (/^https?:/.test(href) ? "external" : "internal"));
    }
  }

  function setupCue(root) {
    var btns = root.querySelectorAll("button, a");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!/case stud/i.test(b.textContent || "")) continue;
      var kids = b.children;
      for (var k = kids.length - 1; k >= 0; k--) {
        if (kids[k].querySelector("[data-isimage], svg, img")) {
          kids[k].setAttribute("data-fx-cue", "");
          b.setAttribute("data-fx-cue-btn", "");
          break;
        }
      }
    }
  }

  function flush() {
    flushTimer = null;
    pending.sort(function (a, b) { return (a.r.top - b.r.top) || (a.r.left - b.r.left); });
    var n = 0;
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i].el;
      if (el.hasAttribute("data-fx-in")) continue;
      if (el.getBoundingClientRect().bottom <= 0) {
        // already scrolled past (fast jump): just show it, no animation, no delay
        el.setAttribute("data-fx", "static");
        el.setAttribute("data-fx-in", "");
        continue;
      }
      el.style.setProperty("--fx-delay", Math.min(n++ * 80, 400) + "ms");
      el.setAttribute("data-fx-in", "");
    }
    pending = [];
  }

  function onIntersect(entries) {
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      pending.push({ el: e.target, r: e.boundingClientRect });
    }
    if (pending.length && !flushTimer) flushTimer = setTimeout(flush, 16);
  }

  /* Catch-up: anything already scrolled past (fast jumps, End key, anchor links)
     is revealed too, so content above the viewport is never left hidden. */
  var sweepQueued = false;
  function sweep() {
    sweepQueued = false;
    var vh = window.innerHeight;
    var hidden = document.querySelectorAll('[data-fx="reveal"]:not([data-fx-in])');
    for (var i = 0; i < hidden.length; i++) {
      var r = hidden[i].getBoundingClientRect();
      if (r.top < vh * 0.92) {
        io.unobserve(hidden[i]);
        pending.push({ el: hidden[i], r: r });
      }
    }
    if (pending.length && !flushTimer) flushTimer = setTimeout(flush, 16);
  }
  function queueSweep() {
    if (!sweepQueued) { sweepQueued = true; requestAnimationFrame(sweep); }
  }

  function scan() {
    scanTimer = null;
    var root = visibleRoot();
    if (!root) return;
    var header = findHeader(root);
    setupHeader(header);
    setupCue(root);
    var units = [];
    collect(root, header, units);
    var vh = window.innerHeight, heroIdx = 0;
    var tagged = units.map(function (u) { return { el: u[0], r: tagUnit(u[0], u[1], root) }; });
    tagged.sort(function (a, b) { return (a.r.top - b.r.top) || (a.r.left - b.r.left); });
    tagged.forEach(function (t) {
      var onScreen = t.r.top < vh && t.r.bottom > 0;
      if (onScreen) {
        if (!booted) {
          t.el.setAttribute("data-fx", "hero");
          t.el.style.setProperty("--fx-delay", (180 + Math.min(heroIdx++ * 110, 660)) + "ms");
        } else {
          t.el.setAttribute("data-fx", "static"); // late re-render already on screen: never flash it
        }
      } else {
        t.el.setAttribute("data-fx", "reveal");
        io.observe(t.el);
      }
    });
  }

  function boot() {
    if (booted) return;
    io = new IntersectionObserver(onIntersect, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    scan();
    booted = true;
    doc.classList.add("fx-booted");
    var container = document.getElementById("container");
    if (container && "MutationObserver" in window) {
      new MutationObserver(function () {
        if (!scanTimer) scanTimer = setTimeout(scan, 200);
      }).observe(container, { childList: true, subtree: true });
    }
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", function () {
      if (!scanTimer) scanTimer = setTimeout(scan, 250);
    });
  }

  function start() { requestAnimationFrame(function () { requestAnimationFrame(boot); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
