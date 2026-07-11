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
  var MYTHS = [
    {
      m: 'I need an LMS to deliver online learning.',
      f: 'You can deliver most learning assets online, including eLearning modules, to a targeted group of learners without an enterprise LMS.'
    },
    {
      m: 'A learning management system (LMS) is the first step to hosting and delivering eLearning.',
      f: "That's backwards. Publish, pilot, and learn about your business requirements before committing to a platform."
    },
    {
      m: 'eLearning assets (modules and courses) lock me into a platform.',
      f: 'Building courses in an LMS is how you get locked in. Build learning assets in universal file types with authoring tools, not an LMS, and take them with you from platform to platform as you grow.'
    },
    {
      m: 'Platforms and authoring tools are the same kind of decision.',
      f: 'Authoring tools make assets and modules of learning. Platforms host them. See the metaphors below to disentangle the two.'
    },
    {
      m: 'I need to host SCORM to deliver eLearning.',
      f: 'SCORM is an industry-standard file type that works in most enterprise LMS, but you can pilot and publish eLearning without it. Web hosting and xAPI are options to explore depending on your requirements.'
    },
    {
      m: 'We need to pick a platform before we can start building content.',
      f: 'Content built in universal formats works on whatever platform you pick later. Start building now.'
    },
    {
      m: 'An LMS will get our people to actually do the training.',
      f: "Platforms don't create engagement; relevant, well-designed learning does. Adoption is a design problem, not a hosting problem."
    },
    {
      m: 'Free LMS options like Moodle or Google Classroom will save us money.',
      f: '"Free" platforms shift costs to admin time, hosting, and support, and they still shape your content around their structure.'
    },
    {
      m: "We're too small for eLearning.",
      f: 'Small orgs benefit most from portable modules. A handful of PDFs, videos, and web modules can serve a whole network without any platform.'
    },
    {
      m: 'Once we pick a platform, migrating later is impossible.',
      f: 'If your assets are in universal formats, moving is a weekend, not a rebuild. Lock-in comes from where you build, not where you host.'
    }
  ];

  var card = root.querySelector('[data-myth-card]');
  var frontFace = root.querySelector('.avp-myth-front');
  var backFace = root.querySelector('.avp-myth-back');
  var textEl = root.querySelector('[data-myth-text]');
  var factEl = root.querySelector('[data-myth-fact]');
  var counterEl = root.querySelector('[data-myth-counter]');
  var dotsWrap = root.querySelector('[data-myth-dots]');
  var liveEl = root.querySelector('[data-myth-live]');
  var idx = 0;

  function announce(msg) {
    if (liveEl) liveEl.textContent = msg;
  }

  // Build progress dots
  var dots = [];
  if (dotsWrap) {
    for (var i = 0; i < MYTHS.length; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'avp-dot';
      dot.setAttribute('aria-label', 'Go to myth ' + (i + 1));
      (function (n) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          go(n);
        });
      })(i);
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }
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
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('is-active', d === idx);
      if (d === idx) {
        dots[d].setAttribute('aria-current', 'true');
      } else {
        dots[d].removeAttribute('aria-current');
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

  if (card) onActivate(card, flipCard);
  var prevBtn = root.querySelector('[data-myth-prev]');
  var nextBtn = root.querySelector('[data-myth-next]');
  if (prevBtn) prevBtn.addEventListener('click', function () { go(idx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(idx + 1); });

  renderMyth();

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
})();
