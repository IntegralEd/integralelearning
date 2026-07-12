/**
 * Authoring vs. Platforms explainer — interactions
 *
 * Vanilla-JS reimplementation of the prototype's Component logic:
 *   • Myth flip-card carousel (10 pairs) — mouse, touch, and keyboard
 *   • Global analogy state (home / music) driving the sticky toggle,
 *     hero picker cards, and every stage's flip strips
 *   • Two-question self-assessment decision tree
 *
 * Also hooks the GA4 engagement events suggested in the design handoff
 * (myth flips, analogy switches, assessment completions, checklist clicks).
 * All copy is final and mirrors the client-reviewed design verbatim.
 */
(function () {
  'use strict';

  var root = document.querySelector('.avp');
  if (!root) return;

  /* GA4 helper — the analytics snippet is injected at build time; no-op
     when gtag is absent (e.g. `npm run dev` against src/). */
  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  /* Shared keyboard activation for role="button" elements */
  function onActivate(el, handler) {
    el.addEventListener('click', handler);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  /* ── Myth carousel ──────────────────────────────────────── */
  // The myth/fact pairs live in the page markup (SEO-visible list next to
  // the featured card); that list is the single source of truth here.
  var mythListEl = root.querySelector('[data-myth-list]');
  var MYTHS = [];
  var mythItemBtns = [];
  if (mythListEl) {
    Array.prototype.forEach.call(mythListEl.querySelectorAll('li'), function (li) {
      var btn = li.querySelector('.avp-myth-item');
      var fact = li.querySelector('.avp-myth-item-f');
      if (!btn) return;
      var n = MYTHS.length;
      MYTHS.push({
        m: btn.textContent.replace(/\s+/g, ' ').trim(),
        f: fact ? fact.textContent.replace(/\s+/g, ' ').trim() : ''
      });
      btn.addEventListener('click', function () { go(n); });
      mythItemBtns.push(btn);
    });
  }

  var card = root.querySelector('[data-myth-card]');
  var frontFace = root.querySelector('.avp-myth-front');
  var backFace = root.querySelector('.avp-myth-back');
  var textEl = root.querySelector('[data-myth-text]');
  var factEl = root.querySelector('[data-myth-fact]');
  var counterEl = root.querySelector('[data-myth-counter]');
  var liveEl = root.querySelector('[data-myth-live]');
  var idx = 0;

  function announce(msg) {
    if (liveEl) liveEl.textContent = msg;
  }

  function isFlipped() {
    return card ? card.classList.contains('is-flipped') : false;
  }

  function syncFaces() {
    var flipped = isFlipped();
    if (frontFace) frontFace.setAttribute('aria-hidden', flipped ? 'true' : 'false');
    if (backFace) backFace.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    if (card) {
      card.setAttribute('aria-label', flipped
        ? 'Fact shown. Activate to flip back to the myth.'
        : 'Myth shown. Activate to reveal what is actually true.');
    }
  }

  function renderMyth() {
    if (textEl) textEl.textContent = MYTHS[idx].m;
    if (factEl) factEl.textContent = MYTHS[idx].f;
    if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + MYTHS.length;
    for (var d = 0; d < mythItemBtns.length; d++) {
      mythItemBtns[d].classList.toggle('is-active', d === idx);
      if (d === idx) {
        mythItemBtns[d].setAttribute('aria-current', 'true');
      } else {
        mythItemBtns[d].removeAttribute('aria-current');
      }
    }
    syncFaces();
  }

  function go(n) {
    idx = (n + MYTHS.length) % MYTHS.length;
    if (card) card.classList.remove('is-flipped'); // navigating resets to myth side
    renderMyth();
    announce('Myth ' + (idx + 1) + ' of ' + MYTHS.length + ': ' + MYTHS[idx].m);
  }

  function flipCard() {
    if (!card) return;
    card.classList.toggle('is-flipped');
    var flipped = isFlipped();
    syncFaces();
    announce(flipped
      ? 'Actually: ' + MYTHS[idx].f
      : 'Myth: ' + MYTHS[idx].m);
    track('myth_flip', { myth_index: idx + 1, face: flipped ? 'fact' : 'myth' });
  }

  if (card && MYTHS.length) onActivate(card, flipCard);
  var prevBtn = root.querySelector('[data-myth-prev]');
  var nextBtn = root.querySelector('[data-myth-next]');
  if (prevBtn) prevBtn.addEventListener('click', function () { go(idx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(idx + 1); });

  if (MYTHS.length) renderMyth();

  /* ── Analogy state (home / music) ───────────────────────── */
  var currentAnalogy = null;
  var analogySetters = root.querySelectorAll('[data-set-analogy]');

  function setAnalogy(mode, silent) {
    if (mode === currentAnalogy) return;
    currentAnalogy = mode;
    var home = mode !== 'music';
    root.classList.toggle('is-home', home);
    root.classList.toggle('is-music', !home);
    analogySetters.forEach(function (el) {
      el.setAttribute('aria-pressed',
        el.getAttribute('data-set-analogy') === mode ? 'true' : 'false');
    });
    if (!silent) track('analogy_switch', { analogy: mode });
  }

  // Buttons / cards that set a specific analogy (keyboard-activatable)
  analogySetters.forEach(function (el) {
    onActivate(el, function () {
      setAnalogy(el.getAttribute('data-set-analogy'));
    });
  });

  // Clicking a visible strip flips to the *other* analogy (click-to-flip).
  // Keyboard users reach the same action via the strip's inner ⟳ button,
  // whose activation click bubbles up to this handler.
  root.querySelectorAll('[data-flip-analogy]').forEach(function (el) {
    el.addEventListener('click', function () {
      setAnalogy(el.getAttribute('data-flip-analogy'));
    });
  });

  // Default analogy: 'home' (no analytics event for the initial state)
  setAnalogy('home', true);

  /* ── Decision tree ──────────────────────────────────────── */
  var steps = {
    q1: root.querySelector('[data-step="q1"]'),
    q2: root.querySelector('[data-step="q2"]'),
    vA: root.querySelector('[data-step="vA"]'),
    vB: root.querySelector('[data-step="vB"]')
  };

  function showStep(name) {
    Object.keys(steps).forEach(function (key) {
      if (steps[key]) steps[key].hidden = key !== name;
    });
  }

  root.querySelectorAll('[data-goto-step]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (el.tagName === 'A') e.preventDefault();
      var target = el.getAttribute('data-goto-step');
      showStep(target);
      if (target === 'vA') track('assessment_result', { verdict: 'ready' });
      if (target === 'vB') track('assessment_result', { verdict: 'pilot_first' });
    });
  });

  showStep('q1');

  /* ── Checklist CTA ──────────────────────────────────────── */
  var checklistBtn = root.querySelector('.avp-cta-primary');
  if (checklistBtn) {
    checklistBtn.addEventListener('click', function () {
      // checklist_click kept for metric continuity with the pre-PDF stub;
      // file_download follows GA4's recommended-event shape.
      track('checklist_click', {});
      track('file_download', {
        file_name: 'platform-decision-checklist.pdf',
        file_extension: 'pdf',
        link_url: checklistBtn.getAttribute('href')
      });
    });
  }

  /* ── Reveal-on-scroll (anniversary pattern) ─────────────── */
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          revealIO.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ── Scroll-spy left rail (anniversary pattern) ─────────── */
  var railLinks = Array.prototype.slice.call(
    document.querySelectorAll('.avp-rail-nav a'));
  if (railLinks.length && 'IntersectionObserver' in window) {
    var spySections = railLinks.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    }).filter(Boolean);

    var setActive = function (id) {
      railLinks.forEach(function (a) {
        a.parentElement.classList.toggle(
          'active', a.getAttribute('href') === '#' + id);
      });
    };
    var spyIO = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      if (vis.length) {
        vis.sort(function (a, b) {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        setActive(vis[0].target.id);
      }
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    spySections.forEach(function (s) { spyIO.observe(s); });
  }

  /* ── Mobile rail: collapse the section nav into a menu ──── */
  var rail = document.getElementById('avp-rail');
  var railToggle = document.getElementById('avp-rail-toggle');
  if (rail && railToggle) {
    var setRailOpen = function (open) {
      rail.classList.toggle('is-open', open);
      railToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    railToggle.addEventListener('click', function () {
      setRailOpen(!rail.classList.contains('is-open'));
    });
    // Close the panel after choosing a section
    railLinks.forEach(function (a) {
      a.addEventListener('click', function () { setRailOpen(false); });
    });
  }
})();
