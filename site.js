/* ================================================================
   RecoverPath — SHARED SITE BEHAVIOR
   Used by both index.html and hospitals.html. Contains: reduced-motion
   detection, theme toggle, mobile nav menu, nav scroll state, smooth
   anchor scroll, and the generic reveal-on-scroll system. Page-specific
   animation (signal draws, exploded prototype, ROC/PR charts, etc.)
   stays in each page's own inline <script>.

   Loading note: include this with a plain <script src="site.js">
   (no `defer`), placed immediately before each page's inline script.
   `defer` only has an effect on scripts with `src`, so an inline
   script placed after a *deferred* site.js would actually execute
   first (deferred scripts run after parsing finishes; inline scripts
   run synchronously wherever the parser meets them) — reversing the
   intended order and letting reveal-on-scroll elements flash visible
   before this file hides them. Because site.js is a small same-origin
   file, loading it as a normal blocking script is cheap and keeps
   execution order correct.
   ================================================================ */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduceMotion){ document.documentElement.classList.add("reduced-motion"); }
  // Exposed so page-specific inline scripts (hospitals.html's chart
  // draw-on-scroll, etc.) can reuse the same reduced-motion decision
  // without re-querying matchMedia themselves.
  window.__rpReduceMotion = reduceMotion;

  /* Small debounce helper — used for resize handlers below so we do one
     unit of layout work after the user finishes resizing, not on every
     intermediate frame the browser fires during a drag-resize. */
  function debounce(fn, wait){
    var t;
    return function(){
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(null, args); }, wait);
    };
  }
  window.__rpDebounce = debounce;

  /* ---------------- THEME TOGGLE ---------------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  function applyTheme(t){
    if(t === "dark"){ root.setAttribute("data-theme","dark"); if(toggle) toggle.setAttribute("aria-pressed","true"); }
    else { root.removeAttribute("data-theme"); if(toggle) toggle.setAttribute("aria-pressed","false"); }
  }
  // Safari private browsing throws on localStorage.getItem/setItem rather
  // than just failing silently — wrap both so theme switching still works
  // for the session, it just won't persist across reloads there.
  var saved = null;
  try { saved = localStorage.getItem("recoverpath-theme"); } catch(err){ /* private mode / storage disabled */ }
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
  if(toggle){
    toggle.addEventListener("click", function(){
      var isDark = root.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("recoverpath-theme", next); } catch(err){ /* private mode / storage disabled */ }
    });
  }

  /* ---------------- MOBILE NAV MENU ---------------- */
  var hamburger = document.getElementById("navHamburger");
  var mobileMenu = document.getElementById("mobileMenu");
  var menuLastFocused = null;

  function onMenuKeydown(e){
    if(e.key === "Escape"){ closeMenu(); return; }
    if(e.key === "Tab"){
      var focusables = mobileMenu.querySelectorAll("a, button");
      if(!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }
  function openMenu(){
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.classList.add("is-active");
    hamburger.setAttribute("aria-label", "Close menu");
    document.body.classList.add("mobile-menu-open");
    menuLastFocused = document.activeElement;
    var firstLink = mobileMenu.querySelector("a");
    if(firstLink) firstLink.focus();
    document.addEventListener("keydown", onMenuKeydown);
  }
  function closeMenu(returnFocus){
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.classList.remove("is-active");
    hamburger.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("mobile-menu-open");
    document.removeEventListener("keydown", onMenuKeydown);
    if(returnFocus !== false && menuLastFocused){ menuLastFocused.focus(); }
  }
  if(hamburger && mobileMenu){
    hamburger.addEventListener("click", function(){
      if(mobileMenu.classList.contains("is-open")){ closeMenu(); }
      else { openMenu(); }
    });
    mobileMenu.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ closeMenu(false); });
    });
    // Keep menu state consistent if the viewport crosses the collapse
    // breakpoint while open (e.g. rotating a tablet).
    window.addEventListener("resize", debounce(function(){
      if(window.innerWidth > 980 && mobileMenu.classList.contains("is-open")){
        closeMenu(false);
      }
    }, 150));
  }

  /* ---------------- NAV SCROLL STATE ---------------- */
  var nav = document.getElementById("siteNav");
  if(nav){
    var lastScrollCheck = false;
    window.addEventListener("scroll", function(){
      var scrolled = window.scrollY > 40;
      if(scrolled !== lastScrollCheck){
        nav.classList.toggle("is-scrolled", scrolled);
        lastScrollCheck = scrolled;
      }
    }, { passive:true });
  }

  /* ---------------- SMOOTH ANCHOR SCROLL ----------------
     Only wires up same-page anchors (href="#section"). Links like
     hospitals.html's nav items that point elsewhere (e.g.
     "index.html#sensors") are real navigations and are left alone. */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if(!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ================================================================
     GENERIC REVEAL-ON-SCROLL (data-reveal="up|left|right|fade|scale|draw")
     Uses IntersectionObserver for cheap, non-jank triggering.
     Each variant gets a distinct motion signature.
     ================================================================ */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var revealStyles = {
    up:    { from: { opacity:0, transform:"translateY(28px)" }, to: { opacity:1, transform:"translateY(0)" } },
    left:  { from: { opacity:0, transform:"translateX(-32px)" }, to: { opacity:1, transform:"translateX(0)" } },
    right: { from: { opacity:0, transform:"translateX(32px)" }, to: { opacity:1, transform:"translateX(0)" } },
    fade:  { from: { opacity:0 }, to: { opacity:1 } },
    scale: { from: { opacity:0, transform:"scale(0.94)" }, to: { opacity:1, transform:"scale(1)" } },
    draw:  { from: { opacity:0, transform:"translateY(14px)" }, to: { opacity:1, transform:"translateY(0)" } }
  };

  revealEls.forEach(function(el){
    var type = el.getAttribute("data-reveal") || "up";
    var style = revealStyles[type] || revealStyles.up;
    if(reduceMotion){
      el.style.opacity = 1;
    } else {
      Object.assign(el.style, style.from);
      el.style.transition = "none";
    }
  });

  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      var el = entry.target;
      var type = el.getAttribute("data-reveal") || "up";
      var delay = parseFloat(el.getAttribute("data-reveal-delay") || "0");
      var style = revealStyles[type] || revealStyles.up;
      if(reduceMotion){
        el.style.transition = "opacity 0.5s ease " + delay + "s";
        el.style.opacity = 1;
      } else {
        el.style.transition = "opacity 0.8s cubic-bezier(.16,.84,.32,1) " + delay + "s, transform 0.8s cubic-bezier(.16,.84,.32,1) " + delay + "s";
        requestAnimationFrame(function(){ Object.assign(el.style, style.to); });
      }
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  revealEls.forEach(function(el){ revealObserver.observe(el); });

})();
