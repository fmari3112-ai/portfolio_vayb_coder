/**
 * Адаптация MagicBento: vanilla JS + GSAP (без React).
 * Плашки: .magic-bento-card внутри .bento-section
 */
(function () {
  "use strict";

  var MOBILE_BREAKPOINT = 768;
  var DEFAULT_GLOW_RGB = "88, 210, 200";
  var DEFAULT_SPOTLIGHT_RADIUS = 400;
  var DEFAULT_PARTICLE_COUNT = 12;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isNarrow() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function calculateSpotlightValues(radius) {
    return {
      proximity: radius * 0.5,
      fadeDistance: radius * 0.75,
    };
  }

  function updateCardGlowProperties(card, mouseX, mouseY, glow, radius) {
    var rect = card.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    var relativeX = ((mouseX - rect.left) / rect.width) * 100;
    var relativeY = ((mouseY - rect.top) / rect.height) * 100;
    card.style.setProperty("--glow-x", relativeX + "%");
    card.style.setProperty("--glow-y", relativeY + "%");
    card.style.setProperty("--glow-intensity", String(glow));
    card.style.setProperty("--glow-radius", radius + "px");
  }

  function createParticleElement(x, y, color) {
    var el = document.createElement("div");
    el.className = "magic-bento-particle";
    el.style.cssText =
      "position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(" +
      color +
      ",1);box-shadow:0 0 6px rgba(" +
      color +
      ",0.55);pointer-events:none;z-index:10;left:" +
      x +
      "px;top:" +
      y +
      "px;";
    return el;
  }

  function initParticleCard(card, glowColor, particleCount, clickEffect) {
    var particlesRef = [];
    var timeoutsRef = [];
    var memoizedParticles = [];
    var particlesInitialized = false;
    var isHovered = false;

    function clearAllParticles() {
      timeoutsRef.forEach(function (id) {
        clearTimeout(id);
      });
      timeoutsRef = [];
      particlesRef.forEach(function (particle) {
        if (typeof gsap !== "undefined") {
          gsap.to(particle, {
            scale: 0,
            opacity: 0,
            duration: 0.28,
            ease: "back.in(1.7)",
            onComplete: function () {
              if (particle.parentNode) particle.parentNode.removeChild(particle);
            },
          });
        } else if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      particlesRef = [];
    }

    function initializeParticles() {
      if (particlesInitialized || !card) return;
      var r = card.getBoundingClientRect();
      var w = r.width;
      var h = r.height;
      memoizedParticles = [];
      for (var i = 0; i < particleCount; i++) {
        memoizedParticles.push(
          createParticleElement(Math.random() * w, Math.random() * h, glowColor)
        );
      }
      particlesInitialized = true;
    }

    function animateParticles() {
      if (!card || !isHovered) return;
      if (!particlesInitialized) initializeParticles();
      memoizedParticles.forEach(function (particle, index) {
        var timeoutId = setTimeout(function () {
          if (!isHovered || !card) return;
          var clone = particle.cloneNode(true);
          card.appendChild(clone);
          particlesRef.push(clone);
          if (typeof gsap === "undefined") return;
          gsap.fromTo(
            clone,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
          );
          gsap.to(clone, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: "none",
            repeat: -1,
            yoyo: true,
          });
          gsap.to(clone, {
            opacity: 0.3,
            duration: 1.5,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
          });
        }, index * 100);
        timeoutsRef.push(timeoutId);
      });
    }

    function onEnter() {
      if (isNarrow()) return;
      isHovered = true;
      animateParticles();
    }

    function onLeave() {
      isHovered = false;
      particlesInitialized = false;
      clearAllParticles();
    }

    function onClick(e) {
      if (isNarrow()) return;
      if (!clickEffect || typeof gsap === "undefined") return;
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );
      var ripple = document.createElement("div");
      var d = maxDistance * 2;
      ripple.style.cssText =
        "position:absolute;width:" +
        d +
        "px;height:" +
        d +
        "px;border-radius:50%;background:radial-gradient(circle,rgba(" +
        glowColor +
        ",0.35) 0%,rgba(" +
        glowColor +
        ",0.15) 35%,transparent 72%);left:" +
        (x - maxDistance) +
        "px;top:" +
        (y - maxDistance) +
        "px;pointer-events:none;z-index:20;";
      card.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.75,
          ease: "power2.out",
          onComplete: function () {
            ripple.remove();
          },
        }
      );
    }

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("click", onClick);

    return function destroy() {
      isHovered = false;
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("click", onClick);
      clearAllParticles();
    };
  }

  function initGlobalSpotlight(spotlightRadius, glowRgb) {
    var spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.background =
      "radial-gradient(circle,rgba(" +
      glowRgb +
      ",0.14) 0%,rgba(" +
      glowRgb +
      ",0.07) 18%,rgba(" +
      glowRgb +
      ",0.035) 28%,rgba(" +
      glowRgb +
      ",0.015) 42%,rgba(" +
      glowRgb +
      ",0.006) 62%,transparent 72%)";
    document.body.appendChild(spotlight);

    function getActiveSection(clientX, clientY) {
      var sections = document.querySelectorAll(".bento-section");
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var rect = s.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return s;
        }
      }
      return null;
    }

    function handleMouseMove(e) {
      if (typeof gsap === "undefined" || !spotlight.parentNode) return;
      if (isNarrow()) {
        gsap.to(spotlight, { opacity: 0, duration: 0.25, ease: "power2.out" });
        return;
      }
      var section = getActiveSection(e.clientX, e.clientY);
      var cards = section
        ? section.querySelectorAll(".magic-bento-card.magic-bento-card--border-glow")
        : [];

      if (!section || cards.length === 0) {
        gsap.to(spotlight, { opacity: 0, duration: 0.35, ease: "power2.out" });
        document.querySelectorAll(".magic-bento-card--border-glow").forEach(function (c) {
          c.style.setProperty("--glow-intensity", "0");
        });
        return;
      }

      var proximity = calculateSpotlightValues(spotlightRadius).proximity;
      var fadeDistance = calculateSpotlightValues(spotlightRadius).fadeDistance;
      var minDistance = Infinity;

      cards.forEach(function (cardEl) {
        var cardRect = cardEl.getBoundingClientRect();
        var centerX = cardRect.left + cardRect.width / 2;
        var centerY = cardRect.top + cardRect.height / 2;
        var distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        var effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        var glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }
        updateCardGlowProperties(cardEl, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.set(spotlight, { left: e.clientX, top: e.clientY });

      var targetOpacity =
        minDistance <= proximity
          ? 0.72
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.72
            : 0;

      gsap.to(spotlight, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.18 : 0.45,
        ease: "power2.out",
      });
    }

    function handleMouseLeaveDoc() {
      document.querySelectorAll(".magic-bento-card--border-glow").forEach(function (c) {
        c.style.setProperty("--glow-intensity", "0");
      });
      gsap.to(spotlight, { opacity: 0, duration: 0.35, ease: "power2.out" });
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeaveDoc);

    return function teardown() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeaveDoc);
      if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
    };
  }

  var teardownAll = null;

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function runMagicBento() {
    var teardowns = [];
    var spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS;
    var glowRgb = DEFAULT_GLOW_RGB;
    var particleCount = DEFAULT_PARTICLE_COUNT;

    teardowns.push(initGlobalSpotlight(spotlightRadius, glowRgb));

    document.querySelectorAll(".magic-bento-card--particles").forEach(function (card) {
      teardowns.push(initParticleCard(card, glowRgb, particleCount, true));
    });

    return function () {
      teardowns.forEach(function (fn) {
        try {
          fn();
        } catch (e) {}
      });
      teardowns.length = 0;
    };
  }

  function sync() {
    if (typeof gsap === "undefined") return;
    if (prefersReducedMotion()) {
      if (teardownAll) {
        teardownAll();
        teardownAll = null;
      }
      document.querySelectorAll(".magic-bento-card--border-glow").forEach(function (c) {
        c.style.setProperty("--glow-intensity", "0");
      });
      return;
    }
    if (isNarrow()) {
      if (teardownAll) {
        teardownAll();
        teardownAll = null;
      }
      document.querySelectorAll(".magic-bento-card--border-glow").forEach(function (c) {
        c.style.setProperty("--glow-intensity", "0");
      });
      return;
    }
    if (teardownAll) teardownAll();
    teardownAll = runMagicBento();
  }

  function boot() {
    var start = function () {
      sync();
      window.addEventListener("resize", debounce(sync, 200));
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(start);
        } else {
          start();
        }
      });
    } else if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }
  }

  boot();
})();
