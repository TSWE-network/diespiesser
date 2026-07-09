/* ============================================================
   Die Spiesser — interactions & scroll choreography
   GSAP + ScrollTrigger + Lenis (loaded via CDN before this file)
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------- always-on basics (no GSAP required) ---------- */

  // Nav background on scroll
  var nav = document.getElementById('nav');
  function onScrollNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  // Burger / mobile menu
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMenu() {
    burger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var open = !burger.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  // Contact form
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      var success = contactForm.querySelector('.form__success');
      success.hidden = false;
      contactForm.reset();
      var btn = contactForm.querySelector('.form__submit-label');
      if (btn) btn.textContent = 'Gesendet ✓';
    });
  }

  // Newsletter form
  var newsForm = document.getElementById('newsletterForm');
  if (newsForm) {
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = newsForm.querySelector('input');
      if (!input.checkValidity()) {
        newsForm.reportValidity();
        return;
      }
      var btn = newsForm.querySelector('button');
      btn.textContent = 'danke ✓';
      input.value = '';
      setTimeout(function () { btn.textContent = 'abonnieren'; }, 3000);
    });
  }

  /* ---------- graceful fallback: no GSAP or reduced motion ---------- */

  function showEverything() {
    document.querySelectorAll('[data-reveal], [data-stagger]').forEach(function (el) {
      el.style.opacity = '1';
    });
    document.querySelectorAll('[data-img-reveal]').forEach(function (el) {
      el.style.clipPath = 'none';
    });
  }

  if (!hasGsap || reduceMotion) {
    showEverything();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll, driven by GSAP's ticker ---------- */

  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Anchor links scroll through Lenis so easing stays consistent
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70, duration: 1.2 });
      });
    });
  }

  /* ---------- scroll progress bar ---------- */

  gsap.to('.scroll-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ---------- custom cursor ---------- */

  var dot = document.querySelector('.cursor-dot');
  var ring = document.querySelector('.cursor-ring');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && dot && ring) {
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      ringX(e.clientX);
      ringY(e.clientY);
    });
    document.querySelectorAll('a, button, [data-tilt]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });
  }

  /* ---------- word splitting (keeps nested spans like the accent) ---------- */

  function splitWords(el) {
    var words = [];
    function process(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
            } else {
              var w = document.createElement('span');
              w.className = 'word';
              w.style.display = 'inline-block';
              w.textContent = part;
              frag.appendChild(w);
              words.push(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          process(child);
        }
      });
    }
    process(el);
    return words;
  }

  /* ---------- hero entrance (runs on load, not on scroll) ---------- */

  var hero = document.querySelector('.hero');
  var heroTitleWords = splitWords(document.querySelector('.hero__title'));
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero__bg img', { scale: 1.18, duration: 2.2, ease: 'power2.out' }, 0)
    .from(heroTitleWords, {
      yPercent: 110,
      opacity: 0,
      rotation: 4,
      duration: 0.9,
      stagger: 0.06
    }, 0.35)
    .to('.hero__sub', { opacity: 1, duration: 0.01 }, 0.95)
    .from('.hero__sub', { y: 24, duration: 0.7 }, 0.95)
    .to('.hero__actions', { opacity: 1, duration: 0.01 }, 1.1)
    .from('.hero__actions', { y: 24, duration: 0.7 }, 1.1);

  // Hero background parallax + soft fade while scrolling away
  gsap.to('[data-parallax-bg] img', {
    yPercent: 22,
    scale: 1.06,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__content', {
    yPercent: -14,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: true }
  });

  /* ---------- split titles reveal on scroll ---------- */

  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.closest('.hero')) return; // hero handled above
    var words = splitWords(el);
    gsap.from(words, {
      yPercent: 105,
      opacity: 0,
      rotation: 3,
      duration: 0.8,
      stagger: 0.045,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* ---------- manifesto: word-by-word scrubbed reveal ---------- */

  var manifesto = document.querySelector('[data-split-lines]');
  if (manifesto) {
    var mWords = splitWords(manifesto);
    gsap.set(mWords, { opacity: 0.14 });
    gsap.to(mWords, {
      opacity: 1,
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: {
        trigger: manifesto,
        start: 'top 78%',
        end: 'bottom 45%',
        scrub: 0.4
      }
    });
  }

  /* ---------- generic reveals ---------- */

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
  });

  /* ---------- staggered card grids ---------- */

  var staggerGroups = new Map();
  document.querySelectorAll('[data-stagger]').forEach(function (el) {
    var parent = el.parentElement;
    if (!staggerGroups.has(parent)) staggerGroups.set(parent, []);
    staggerGroups.get(parent).push(el);
  });
  staggerGroups.forEach(function (els, parent) {
    gsap.fromTo(els,
      { opacity: 0, y: 44, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.75,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: parent, start: 'top 82%', once: true }
      });
  });

  /* ---------- image clip reveals + inner parallax ---------- */

  document.querySelectorAll('[data-img-reveal]').forEach(function (el) {
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0 round var(--radius))',
      duration: 1.1,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true }
    });
  });

  document.querySelectorAll('[data-parallax-img]').forEach(function (img) {
    gsap.set(img.parentElement, { overflow: 'hidden' });
    gsap.fromTo(img,
      { yPercent: -8, scale: 1.12 },
      {
        yPercent: 8,
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
  });

  /* ---------- rotating brand mark in manifesto ---------- */

  var rotor = document.querySelector('[data-rotate]');
  if (rotor) {
    gsap.to(rotor, {
      rotation: 200,
      ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  }

  /* ---------- magnetic buttons ---------- */

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });

    /* ---------- 3D tilt on menu cards ---------- */

    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power2.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power2.out' });
      gsap.set(card, { transformPerspective: 700 });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      });
      card.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- refresh once images settle ---------- */

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
