// ===================== INTRO VIDEO GATE =====================
// Plays the intro video full-screen as soon as the page loads. Browsers only
// allow autoplay when a video starts muted, so it always starts muted, then
// the sound button lets the visitor turn audio on with one click (a real
// click always satisfies the browser's "user gesture" requirement for
// unmuted playback).
(function () {
  const gate = document.getElementById('intro-gate');
  const video = document.getElementById('intro-video');
  const skipBtn = document.getElementById('intro-skip');
  const muteBtn = document.getElementById('intro-mute');

  if (!gate || !video) { document.body.classList.remove('gate-active'); return; }

  // Must start muted so the browser allows autoplay at all.
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 1;

  let started = false;

  function closeGate() {
    gate.classList.add('fade-out');
    document.body.classList.remove('gate-active');
    setTimeout(() => {
      gate.classList.add('done');
      video.pause();
    }, 950);
  }

  function startPlayback() {
    if (started) return;
    started = true;
    video.classList.add('showing');
    video.play().catch(() => { });
  }

  // Wait for the browser to estimate it has enough buffered to play through
  // without stalling ("canplaythrough") — this is what actually fixes
  // choppy/laggy playback, since starting on the earlier "canplay" event
  // (just "the first frame is ready") can begin before enough is downloaded.
  video.addEventListener('canplaythrough', startPlayback, { once: true });

  // Safety net: on a slow connection "canplaythrough" may never fire even
  // though the video is fine to start. Don't make people wait forever —
  // start anyway after a short grace period if it hasn't started yet.
  setTimeout(startPlayback, 2500);

  if (skipBtn) skipBtn.addEventListener('click', closeGate);

  // Sound toggle. Only actually audible if intro.mp4 contains an audio
  // track — if the file is video-only, unmuting is a silent no-op.
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const turningOn = video.muted;
      video.muted = !turningOn;
      video.volume = 1;
      muteBtn.textContent = turningOn ? '🔊 Sound on' : '🔇 Sound off';
      if (turningOn) video.play().catch(() => { });
    });
  }

  video.addEventListener('ended', closeGate);
  // Never let a slow/broken video trap someone on the gate.
  video.addEventListener('error', closeGate);
  setTimeout(() => {
    if (!gate.classList.contains('fade-out') && video.readyState === 0) closeGate();
  }, 6000);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !gate.classList.contains('done')) closeGate();
  });
})();

// ===================== PRELOADER =====================
// Hides once the page fully loads — but never waits on that longer than
// 3s, so a slow-loading video/image never leaves someone staring at the
// preloader indefinitely.
(function () {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  let hidden = false;
  function hide() {
    if (hidden) return;
    hidden = true;
    pre.classList.add('hide');
  }
  window.addEventListener('load', () => setTimeout(hide, 400));
  setTimeout(hide, 3000);
})();

// ===================== CURSOR GLOW =====================
(function () {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  window.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }, { passive: true });
})();

// ===================== MOBILE NAV TOGGLE =====================
const toggle = document.getElementById('nav-toggle');
const navlinks = document.getElementById('navlinks');
toggle.addEventListener('click', () => navlinks.classList.toggle('open'));
navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navlinks.classList.remove('open')));

// ===================== REACTIVE NAV INDICATOR =====================
const links = Array.from(document.querySelectorAll('.nav-link'));
const indicator = document.getElementById('nav-indicator');
const navInner = document.querySelector('.nav-inner');
const sections = links.map(l => document.querySelector(l.getAttribute('href')));

function moveIndicator(link) {
  if (!link || window.innerWidth <= 1080) { indicator.style.opacity = '0'; return; }
  const linkBox = link.getBoundingClientRect();
  const innerBox = navInner.getBoundingClientRect();
  indicator.style.left = (linkBox.left - innerBox.left) + 'px';
  indicator.style.width = linkBox.width + 'px';
  indicator.style.opacity = '1';
}

let activeLink = links[0];
function setActive() {
  let current = sections[0];
  const scrollPos = window.scrollY + 130;
  sections.forEach((sec) => {
    if (sec && sec.offsetTop <= scrollPos) current = sec;
  });
  const idx = sections.indexOf(current);
  if (idx > -1) {
    links.forEach(l => l.classList.remove('active'));
    links[idx].classList.add('active');
    activeLink = links[idx];
    moveIndicator(activeLink);
  }
}
window.addEventListener('scroll', setActive, { passive: true });
window.addEventListener('resize', () => moveIndicator(activeLink));
window.addEventListener('load', setActive);
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => moveIndicator(activeLink)); }
setActive();

// ===================== FLOW STAGE REVEAL =====================
const flowSection = document.getElementById('flow-stages');
const flowFill = document.getElementById('flow-fill');
const flowPulse = document.getElementById('flow-pulse');
const stages = document.querySelectorAll('.flow-stage');
let flowDone = false;
const flowObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !flowDone) {
      flowDone = true;
      flowFill.style.width = '100%';
      stages.forEach((s, i) => setTimeout(() => s.classList.add('lit'), 300 + i * 500));
      setTimeout(() => flowPulse.classList.add('run'), 1900);
    }
  });
}, { threshold: 0.4 });
flowObserver.observe(flowSection);

// ===================== FADE-IN ON SCROLL =====================
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
fadeEls.forEach(el => fadeObserver.observe(el));

// ===================== COUNT-UP NUMBERS =====================
const counters = document.querySelectorAll('[data-count]');
function animateCount(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const prefix = el.getAttribute('data-prefix') || '';
  const suffix = el.getAttribute('data-suffix') || '';
  const pad = el.getAttribute('data-pad');
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    let val = Math.round(target * eased);
    let valStr = pad ? String(val).padStart(parseInt(pad, 10), '0') : val.toLocaleString('en-IN');
    el.textContent = prefix + valStr + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });
counters.forEach(c => countObserver.observe(c));

// ===================== FAQ ACCORDION =====================
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// ===================== REGISTER LINK =====================
// TODO: once your Google Form is ready, put its URL here (or directly in the
// href="#" on the #register-link button in index.html — either works).
const GOOGLE_FORM_URL = ''; // e.g. 'https://forms.gle/xxxxxxxxxxxx'

const registerLink = document.getElementById('register-link');
if (registerLink && GOOGLE_FORM_URL) {
  registerLink.href = GOOGLE_FORM_URL;
} else if (registerLink) {
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Registrations Opens Soon'); // add your Google Form URL in js/main.js (GOOGLE_FORM_URL) or as the href on #register-link.
  });
}

// ===================== THEME DETAILS MODAL =====================
// Edit the text below to customize each theme's description, and drop a
// matching image into assets/images/themes/ (named as shown) to replace the
// placeholder box.
const THEME_DETAILS = {
  '01': {
    title: 'Agritech And Rural Innovation',
    image: 'assets/images/themes/theme-01.jpg',
    description: 'Build mechanical or product solutions that improve farming, food processing, or rural livelihoods — from low-cost tools to smarter agricultural machinery.'
    points: [
      'Statement 1 — Design a modular agricultural machine that can adjust its tool depth/position according to soil condition and crop spacing.',
      'Statement 2 — Develop a small ground robot that identifies crop rows and mechanically removes weeds without disturbing crops..',
      'Statement 3 — Create a mechanism that maintains uniform seed spacing and depth for different seed sizes..',
      'Statement 4 — Design a compact machine that converts loose agricultural residue into dense transportable blocks..',
      'Statement 5 — Develop a solar-based micro-power system that intelligently manages energy generated from solar panels and prioritizes essential agricultural loads such as irrigation, sensors, lighting and farm equipment during limited-power conditions...',
      'Statement 6 — Develop an AI model that analyzes crop images captured through a smartphone and identifies early signs of common diseases or abnormalities, providing farmers with simple preventive recommendations...',
      'Statement 7 — Develop a portable system that detects early signs of crop stress caused by water deficiency, nutrient imbalance, pests or disease and provides the farmer with a simple actionable recommendation...',
      'Statement 8 — Design an intelligent irrigation system that combines soil moisture, weather, crop stage and water availability to determine where, when and how much water should be supplied, with automatic control of individual zones...',
      'Statement 9 — Create a smart monitoring system that detects abnormal electrical conditions around agricultural pumps and field wiring, such as leakage, overload or unusual current behaviour, and provides an immediate warning to prevent equipment damage and electrical accidents...',
      'Statement 10 — Create an intelligent platform that matches agricultural waste producers with nearby potential users such as composters, biofuel producers, livestock owners or small industries, reducing waste and improving rural income opportunities.x..'
    ]
  },
  '02': {
    title: 'Drone Technology',
    image: 'assets/images/themes/theme-02.jpg',
    description: 'Design or improve a drone — its frame, propulsion, payload mechanism, or control system — for a real inspection, delivery, agriculture, or safety use case.'
  },
  '03': {
    title: 'Industry 5.0',
    image: 'assets/images/themes/theme-03.jpg',
    description: 'Blend human-centered design with automation and smart systems — collaborative robots, adaptive manufacturing, or human-machine interfaces that put people back at the center.'
  },
  '04': {
    title: 'Smart Robotics And Automation',
    image: 'assets/images/themes/theme-04.jpg',
    description: 'Design a mechanism or control system that senses its environment and acts on it with little to no human input — arms, rovers, automated rigs, or anything in between.'
  },
  '05': {
    title: 'Health Care And Assistive Technology With A.I.',
    image: 'assets/images/themes/theme-05.jpg',
    description: 'Build a mechanical or physical device — assistive, diagnostic, or rehabilitative — that uses sensors or A.I. to improve patient care or independence.'
  },
  '06': {
    title: 'Renewable Energy And E.V\'s',
    image: 'assets/images/themes/theme-06.jpg',
    description: 'Create hardware for generating or storing renewable energy, or components that improve the range, safety, or efficiency of electric vehicles.'
  },
  '07': {
    title: 'Sustainable Manufacturing And Waste Management',
    image: 'assets/images/themes/theme-07.jpg',
    description: 'Design a process, machine, or product that reduces waste, reuses materials, or makes manufacturing more sustainable end-to-end.'
  },
  '08': {
    title: 'Smart Automation',
    image: 'assets/images/themes/theme-08.jpg',
    description: 'Automate a repetitive or manual process with sensors, actuators, or control logic — anywhere from a workshop floor to a household task.'
  },
  '09': {
    title: 'Open Innovation',
    image: 'assets/images/themes/theme-09.jpg',
    description: 'Any mechanical problem worth solving that doesn\'t fit neatly into the other eight themes. Bring your own idea and make the case for it.'
  }
};

// Preload every theme photo as soon as the page loads.
Object.values(THEME_DETAILS).forEach((data) => {
  const preload = new Image();
  preload.src = data.image;
});

const themeModal = document.getElementById('theme-modal');
const modalImage = document.getElementById('modal-image');
const modalImageBackdrop = document.getElementById('modal-image-backdrop');
const modalImageWrap = document.querySelector('.modal-image-wrap');
const modalNum = document.getElementById('modal-num');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalClose = document.getElementById('modal-close');

function openThemeModal(id) {
  const data = THEME_DETAILS[id];
  if (!data || !themeModal) return;

  modalNum.textContent = 'THEME ' + id;
  modalTitle.textContent = data.title;
  modalDesc.textContent = data.description;
  modalImage.alt = data.title;

  modalImageWrap.classList.remove('missing');
  modalImage.classList.remove('loaded');
  modalImageBackdrop.classList.remove('loaded');

  const loader = new Image();
  loader.onload = () => {
    if (modalImage.dataset.pending !== data.image) return;
    modalImage.src = data.image;
    modalImageBackdrop.src = data.image;
    modalImage.classList.add('loaded');
    modalImageBackdrop.classList.add('loaded');
  };
  loader.onerror = () => {
    if (modalImage.dataset.pending !== data.image) return;
    modalImageWrap.classList.add('missing');
  };
  modalImage.dataset.pending = data.image;
  loader.src = data.image;

  themeModal.classList.add('open');
  themeModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeThemeModal() {
  if (!themeModal) return;
  themeModal.classList.remove('open');
  themeModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.theme-details-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.theme-card');
    openThemeModal(card.dataset.theme);
  });
});

if (modalClose) modalClose.addEventListener('click', closeThemeModal);
if (themeModal) {
  themeModal.addEventListener('click', (e) => {
    if (e.target === themeModal) closeThemeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeThemeModal();
});

// ===================== GALLERY CAROUSEL =====================
(function () {
  const track = document.getElementById('gallery-track');
  if (!track) return;
  const viewport = track.parentElement;
  const slides = Array.from(track.querySelectorAll('.gallery-slide'));
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const dotsWrap = document.getElementById('gallery-dots');
  const progressFill = document.getElementById('gallery-progress-fill');

  // Load each slide's photo; if it 404s, mark the slide "missing" and show
  // a mechanical placeholder instead of a broken image.
  slides.forEach((slide) => {
    const src = slide.dataset.src;
    const fg = slide.querySelector('.slide-fg');
    const bg = slide.querySelector('.slide-backdrop');
    const tester = new Image();
    tester.onload = () => {
      fg.src = src;
      bg.src = src;
    };
    tester.onerror = () => {
      slide.classList.add('missing');
      const tag = slide.dataset.tag || 'photo';
      slide.innerHTML = `
        <div class="slide-empty">
          <svg viewBox="0 0 200 200"><use href="#gear10" fill="currentColor"></use></svg>
          <span>${tag} — Event Images Coming Soon</span>
        </div>`;
    };
    tester.src = src;
  });

  let index = 0;
  const total = slides.length;
  let autoplayTimer = null;
  let progressTimer = null;
  const AUTOPLAY_MS = 4800;

  // Build nav dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.gallery-dot'));

  function render() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  function goTo(i, manual) {
    index = (i + total) % total;
    render();
    if (manual) restartAutoplay();
  }
  function next(manual) { goTo(index + 1, manual); }
  function prev(manual) { goTo(index - 1, manual); }

  function runProgress() {
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
      // Force reflow so the transition below actually restarts.
      void progressFill.offsetWidth;
      progressFill.style.transition = `width ${AUTOPLAY_MS}ms linear`;
      progressFill.style.width = '100%';
    }
  }

  function startAutoplay() {
    stopAutoplay();
    runProgress();
    autoplayTimer = setInterval(() => {
      next(false);
      runProgress();
    }, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  function restartAutoplay() {
    // A manual click/tap moves the slide, then autoplay simply resumes
    // from the new position after the usual interval.
    startAutoplay();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => prev(true));
  if (nextBtn) nextBtn.addEventListener('click', () => next(true));

  // Pause on hover / focus (desktop), resume on leave.
  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', startAutoplay);

  // Touch swipe support for mobile.
  let touchStartX = null;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(true); else prev(true);
    } else {
      startAutoplay();
    }
    touchStartX = null;
  });

  render();
  startAutoplay();

  // Lightbox — click a photo to view it full-size.
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(src, alt) {
    if (!lightbox) return;
    lightboxImage.src = src;
    lightboxImage.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    stopAutoplay();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    startAutoplay();
  }

  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      if (slide.classList.contains('missing')) return;
      const img = slide.querySelector('.slide-fg');
      openLightbox(img.src, img.alt);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (lightbox.classList.contains('open')) {
      if (e.key === 'ArrowLeft') { prev(true); lightboxImage.src = slides[index].querySelector('.slide-fg').src; }
      if (e.key === 'ArrowRight') { next(true); lightboxImage.src = slides[index].querySelector('.slide-fg').src; }
    } else {
      if (e.key === 'ArrowLeft') prev(true);
      if (e.key === 'ArrowRight') next(true);
    }
  });
})();
