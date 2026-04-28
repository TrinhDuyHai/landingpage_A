/* ============================================================
   BlueStone BLB-6036 — app.js
   Scroll-driven canvas + GSAP animations
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Config ────────────────────────────────────────────────── */
const FRAME_COUNT  = 241;
const FRAME_PREFIX = 'frames/frame_';
const FRAME_EXT    = '.jpg';
const FRAME_SPEED  = 2.0;    // product animation completes by ~50% scroll
const IMAGE_SCALE  = 0.95;   // contain mode multiplier — product fills viewport height

/* ─── DOM refs ──────────────────────────────────────────────── */
const loader        = document.getElementById('loader');
const loaderBar     = document.getElementById('loader-bar');
const loaderPercent = document.getElementById('loader-percent');
const canvasWrap    = document.getElementById('canvas-wrap');
const canvas        = document.getElementById('canvas');
const ctx           = canvas.getContext('2d');
const darkOverlay   = document.getElementById('dark-overlay');
const marqueeWrap   = document.getElementById('marquee');
const marqueeText   = marqueeWrap.querySelector('.marquee-text');
const scrollContainer = document.getElementById('scroll-container');
const heroSection   = document.getElementById('hero');

/* ─── State ─────────────────────────────────────────────────── */
const frames      = new Array(FRAME_COUNT).fill(null);
let currentFrame  = 0;
let loadedCount   = 0;
let lenis;

/* ─── Canvas sizing ─────────────────────────────────────────── */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  drawFrame(currentFrame);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ─── Frame renderer ────────────────────────────────────────── */
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Contain mode: product fully visible, black background fills sides seamlessly
  const scale = Math.min(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ─── Frame preloader ───────────────────────────────────────── */
function padIndex(n) {
  return String(n).padStart(4, '0');
}

function loadFrames() {
  return new Promise(resolve => {
    // Phase 1: load first 10 frames immediately for fast first paint
    let phase1Done = false;
    let phase1Count = 0;
    const PHASE1 = Math.min(10, FRAME_COUNT);

    function onLoad() {
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + '%';
      loaderPercent.textContent = pct + '%';

      if (!phase1Done && phase1Count < PHASE1) {
        phase1Count++;
        if (phase1Count === PHASE1) {
          phase1Done = true;
          drawFrame(0);
        }
      }

      if (loadedCount === FRAME_COUNT) resolve();
    }

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.onload  = onLoad;
      img.onerror = onLoad; // count errors too so loader never stalls
      img.src = FRAME_PREFIX + padIndex(i) + FRAME_EXT;
      frames[i - 1] = img;
    }
  });
}

/* ─── Init ──────────────────────────────────────────────────── */
async function init() {
  await loadFrames();

  // Hide loader
  loader.classList.add('hidden');

  // Init Lenis smooth scroll
  lenis = new Lenis({
    duration:     1.2,
    easing:       t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel:  true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Draw first frame
  drawFrame(0);

  // Animate hero in
  animateHeroIn();

  // Setup all scroll interactions
  setupHeroTransition();
  setupFrameBinding();
  setupSections();
  setupDarkOverlay();
  setupMarquee();
  setupCounters();
}

/* ─── Hero entrance animation ───────────────────────────────── */
function animateHeroIn() {
  const eyebrow = heroSection.querySelector('.hero-eyebrow');
  const words   = heroSection.querySelectorAll('.hero-word, .hero-dash');
  const tagline = heroSection.querySelector('.hero-tagline');
  const scroll  = heroSection.querySelector('.scroll-indicator');

  const tl = gsap.timeline({ delay: 0.3 });
  tl.from(eyebrow, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' })
    .from(words,   { y: 60, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' }, '-=0.3')
    .from(tagline, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
    .from(scroll,  { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2');
}

/* ─── Hero → Canvas circle-wipe transition ──────────────────── */
function setupHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   true,
    onUpdate(self) {
      const p = self.progress;

      // Hero fades out quickly as scroll begins
      const heroOpacity = Math.max(0, 1 - p * 18);
      heroSection.style.opacity = heroOpacity;

      // Canvas reveals via expanding circle clip-path
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.005) / 0.07));
      const radius = wipeProgress * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    }
  });
}

/* ─── Frame-to-scroll binding ───────────────────────────────── */
function setupFrameBinding() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   true,
    onUpdate(self) {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(
        Math.floor(accelerated * FRAME_COUNT),
        FRAME_COUNT - 1
      );
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

/* ─── Section animation system ──────────────────────────────── */
function setupSections() {
  document.querySelectorAll('.scroll-section').forEach(section => {
    const type    = section.dataset.animation;
    const persist = section.dataset.persist === 'true';
    const enter   = parseFloat(section.dataset.enter) / 100;
    const leave   = parseFloat(section.dataset.leave) / 100;

    const children = section.querySelectorAll(
      '.section-label, .section-heading, .section-body, .cta-heading, .cta-sub, .cta-button, .stat'
    );

    // Build entrance timeline
    const tl = gsap.timeline({ paused: true });

    switch (type) {
      case 'fade-up':
        tl.from(children, {
          y: 50, opacity: 0,
          stagger: 0.12, duration: 0.9, ease: 'power3.out'
        });
        break;

      case 'slide-right':
        tl.from(children, {
          x: 80, opacity: 0,
          stagger: 0.14, duration: 0.9, ease: 'power3.out'
        });
        break;

      case 'clip-reveal':
        tl.from(children, {
          clipPath: 'inset(100% 0 0 0)',
          opacity: 0,
          stagger: 0.15, duration: 1.2, ease: 'power4.inOut'
        });
        break;

      case 'stagger-up':
        tl.from(children, {
          y: 60, opacity: 0,
          stagger: 0.15, duration: 0.8, ease: 'power3.out'
        });
        break;

      case 'scale-up':
        tl.from(children, {
          scale: 0.88, opacity: 0,
          stagger: 0.12, duration: 1.0, ease: 'power2.out'
        });
        break;
    }

    let hasPlayed = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   false,
      onUpdate(self) {
        const p = self.progress;

        if (p >= enter && p <= leave) {
          if (!hasPlayed) {
            hasPlayed = true;
            gsap.set(section, { opacity: 1 });
            tl.restart();
          }
        } else if (!persist) {
          // Fade section out when scrolled past
          if (p > leave) {
            if (hasPlayed) {
              hasPlayed = false;
              gsap.to(section, { opacity: 0, duration: 0.4, ease: 'power2.in' });
            }
          } else if (p < enter) {
            if (hasPlayed) {
              hasPlayed = false;
              gsap.to(section, { opacity: 0, duration: 0.3, ease: 'power2.in' });
            }
          }
        }
      }
    });
  });
}

/* ─── Dark overlay (stats section) ─────────────────────────── */
function setupDarkOverlay() {
  const ENTER = 0.60; // start fading in at 60%
  const LEAVE = 0.82; // start fading out at 82%
  const FADE  = 0.04;

  ScrollTrigger.create({
    trigger: scrollContainer,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   true,
    onUpdate(self) {
      const p = self.progress;
      let opacity = 0;

      if (p >= ENTER - FADE && p <= ENTER) {
        opacity = (p - (ENTER - FADE)) / FADE;
      } else if (p > ENTER && p < LEAVE) {
        opacity = 1;
      } else if (p >= LEAVE && p <= LEAVE + FADE) {
        opacity = 1 - (p - LEAVE) / FADE;
      }

      darkOverlay.style.opacity = Math.max(0, Math.min(1, opacity));
    }
  });
}

/* ─── Horizontal marquee ────────────────────────────────────── */
function setupMarquee() {
  const SHOW_START = 0.55;
  const SHOW_END   = 0.83;
  const FADE_RANGE = 0.04;

  // Horizontal scroll via GSAP
  gsap.to(marqueeText, {
    xPercent: -28,
    ease:     'none',
    scrollTrigger: {
      trigger: scrollContainer,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
    }
  });

  // Fade in/out
  ScrollTrigger.create({
    trigger: scrollContainer,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   true,
    onUpdate(self) {
      const p = self.progress;
      let opacity = 0;

      if (p >= SHOW_START && p <= SHOW_START + FADE_RANGE) {
        opacity = (p - SHOW_START) / FADE_RANGE;
      } else if (p > SHOW_START + FADE_RANGE && p < SHOW_END) {
        opacity = 1;
      } else if (p >= SHOW_END && p <= SHOW_END + FADE_RANGE) {
        opacity = 1 - (p - SHOW_END) / FADE_RANGE;
      }

      marqueeWrap.style.opacity = Math.max(0, Math.min(1, opacity));
    }
  });
}

/* ─── Counter animations (progress-based, works with absolute sections) ── */
function setupCounters() {
  const counters = Array.from(document.querySelectorAll('.stat-number')).map(el => ({
    el,
    target:   parseFloat(el.dataset.value),
    decimals: parseInt(el.dataset.decimals || '0'),
    fired:    false,
  }));

  const STATS_ENTER = 0.64; // mirror data-enter="64"

  ScrollTrigger.create({
    trigger: scrollContainer,
    start:   'top top',
    end:     'bottom bottom',
    scrub:   false,
    onUpdate(self) {
      if (self.progress >= STATS_ENTER) {
        counters.forEach(c => {
          if (c.fired) return;
          c.fired = true;
          gsap.to(c.el, {
            textContent: c.target,
            duration:    2,
            ease:        'power1.out',
            snap:        { textContent: c.decimals === 0 ? 1 : 0.1 },
            onUpdate() {
              const val = parseFloat(c.el.textContent);
              c.el.textContent = c.decimals > 0 ? val.toFixed(c.decimals) : Math.round(val);
            }
          });
        });
      }
    }
  });
}

/* ─── Start ─────────────────────────────────────────────────── */
init();
