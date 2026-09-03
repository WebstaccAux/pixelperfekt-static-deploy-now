const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('.page-progress span');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-menu a[href^="#"]')];

function updateScrollUI() {
  const y = window.scrollY;
  const available = document.documentElement.scrollHeight - window.innerHeight;
  header?.classList.toggle('is-scrolled', y > 20);
  if (progressBar) progressBar.style.transform = `scaleX(${available > 0 ? y / available : 0})`;
}

updateScrollUI();
window.addEventListener('scroll', updateScrollUI, { passive: true });

function setMenu(open) {
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  mobileMenu?.classList.toggle('is-open', open);
  header?.classList.toggle('menu-active', open);
  document.body.classList.toggle('menu-open', open);
}

menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    setMenu(false);
    if (noticeDialog?.open) noticeDialog.close();
  }
});

const observedSections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  observedSections.forEach(section => sectionObserver.observe(section));
}

const revealElements = [...document.querySelectorAll('.reveal')];
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const group = entry.target.parentElement?.querySelectorAll(':scope > .reveal');
      const index = group ? [...group].indexOf(entry.target) : 0;
      entry.target.style.transitionDelay = `${Math.min(index * 80, 320)}ms`;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -45px' });
  revealElements.forEach(element => revealObserver.observe(element));
}

const processLine = document.querySelector('.process-line');
if (processLine && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) processLine.classList.add('is-visible');
  }, { threshold: .5 }).observe(processLine);
}

document.querySelectorAll('[data-compare]').forEach(compare => {
  const range = compare.querySelector('input[type="range"]');
  const updateComparison = () => {
    const value = Number(range.value);
    compare.style.setProperty('--position', `${value}%`);
    const afterImage = compare.querySelector('.comparison-after img');
    if (afterImage) afterImage.style.width = `${10000 / Math.max(value, .1)}%`;
  };
  range?.addEventListener('input', updateComparison);
  updateComparison();
});

function animateCounter(element) {
  const target = Number(element.dataset.count);
  const duration = 1100;
  const started = performance.now();
  const tick = now => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('[data-count]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  counters.forEach(counter => counter.textContent = counter.dataset.count);
} else {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  });
  counters.forEach(counter => counterObserver.observe(counter));
}

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const scrollHero = document.querySelector('.hero');
const scrollHeroCopy = scrollHero?.querySelector('.hero-copy');
const scrollHeroVisual = scrollHero?.querySelector('.hero-visual-stage');
const scrollStory = document.querySelector('[data-scroll-story]');
const storyLines = [...document.querySelectorAll('[data-story-line]')];
const storyCopy = document.querySelector('[data-story-copy]');
const storyCount = document.querySelector('[data-story-count]');
const parallaxCards = [...document.querySelectorAll('.work-card')];
let scrollMotionFrame = 0;

function updateScrollMotion() {
  scrollMotionFrame = 0;
  if (reduceMotion) return;

  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  if (scrollHero && scrollHeroCopy && scrollHeroVisual) {
    const heroProgress = clamp(scrollY / Math.max(scrollHero.offsetHeight * .82, 1));
    const baseRotation = window.innerWidth <= 650 ? 1 : 1.8;
    scrollHeroCopy.style.setProperty('--hero-copy-y', `${heroProgress * -48}px`);
    scrollHeroCopy.style.setProperty('--hero-copy-opacity', String(1 - heroProgress * .48));
    scrollHeroVisual.style.setProperty('--hero-visual-y', `${heroProgress * 76}px`);
    scrollHeroVisual.style.setProperty('--hero-visual-scale', String(1 - heroProgress * .075));
    scrollHeroVisual.style.setProperty('--hero-visual-opacity', String(1 - heroProgress * .18));
    scrollHeroVisual.style.setProperty('--hero-rotate', `${baseRotation - heroProgress * 2.4}deg`);
  }

  if (scrollStory) {
    const rect = scrollStory.getBoundingClientRect();
    const travel = Math.max(scrollStory.offsetHeight - viewportHeight, 1);
    const progress = clamp(-rect.top / travel);
    const wave = Math.sin(progress * Math.PI);

    scrollStory.style.setProperty('--story-progress', String(progress));
    scrollStory.style.setProperty('--story-x', `${Math.sin(progress * Math.PI * 2) * 46}px`);
    scrollStory.style.setProperty('--story-y', `${(progress - .5) * -92}px`);
    scrollStory.style.setProperty('--story-angle', `${progress * 230}deg`);
    scrollStory.style.setProperty('--story-scale', String(.46 + progress * .92));
    scrollStory.style.setProperty('--story-glow-opacity', String(.18 + wave * .3));
    scrollStory.style.setProperty('--story-orbit-scale', String(.42 + progress * .78));
    scrollStory.style.setProperty('--story-orbit-small', String(.22 + progress * .95));
    scrollStory.style.setProperty('--story-orbit-rotate', `${progress * 190}deg`);
    scrollStory.style.setProperty('--story-orbit-opacity', String(.08 + wave * .32));
    scrollStory.style.setProperty('--story-grid-x', `${progress * -80}px`);
    scrollStory.style.setProperty('--story-grid-y', `${progress * 54}px`);
    scrollStory.style.setProperty('--story-haze-y', `${80 - progress * 120}px`);
    scrollStory.style.setProperty('--story-haze-scale', String(.75 + progress * .6));
    scrollStory.style.setProperty('--story-haze-opacity', String(.18 + progress * .34));
    scrollStory.style.setProperty('--story-bar', `${progress * 100}%`);

    storyLines.forEach((line, index) => {
      const entry = clamp((progress - (.015 + index * .22)) / .24);
      line.style.setProperty('--line-opacity', String(entry));
      line.style.setProperty('--line-y', `${(1 - entry) * 74}px`);
      line.style.setProperty('--line-scale', String(.92 + entry * .08));
      line.style.setProperty('--line-blur', `${(1 - entry) * 12}px`);
    });

    const copyProgress = clamp((progress - .64) / .2);
    storyCopy?.style.setProperty('--story-copy-opacity', String(copyProgress));
    storyCopy?.style.setProperty('--story-copy-y', `${(1 - copyProgress) * 28}px`);
    storyCopy?.style.setProperty('--story-copy-blur', `${(1 - copyProgress) * 10}px`);
    if (storyCount) storyCount.textContent = progress < .24 ? '01' : progress < .5 ? '02' : '03';
  }

  parallaxCards.forEach((card, index) => {
    const image = card.querySelector('.work-image');
    if (!image) return;
    const rect = card.getBoundingClientRect();
    if (rect.bottom < -viewportHeight * .25 || rect.top > viewportHeight * 1.25) return;
    const centerOffset = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
    const normalized = clamp(centerOffset, -1, 1);
    image.style.setProperty('--card-parallax-y', `${normalized * (index === 0 ? 26 : 18)}px`);
    image.style.setProperty('--card-scroll-scale', String(.985 + (1 - Math.abs(normalized)) * .015));
  });
}

function queueScrollMotion() {
  if (scrollMotionFrame || reduceMotion) return;
  scrollMotionFrame = requestAnimationFrame(updateScrollMotion);
}

queueScrollMotion();
window.addEventListener('scroll', queueScrollMotion, { passive: true });
window.addEventListener('resize', queueScrollMotion);

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const hero = document.querySelector('.hero');
  const heroMotionLayer = hero?.querySelector('.hero-motion-layer');
  if (hero && heroMotionLayer) {
    let heroFrame = 0;
    hero.addEventListener('pointermove', event => {
      cancelAnimationFrame(heroFrame);
      heroFrame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 18;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 14;
        heroMotionLayer.style.setProperty('--motion-x', `${x}px`);
        heroMotionLayer.style.setProperty('--motion-y', `${y}px`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      heroMotionLayer.style.setProperty('--motion-x', '0px');
      heroMotionLayer.style.setProperty('--motion-y', '0px');
    });
  }

  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(900px) rotateX(${y * -1.3}deg) rotateY(${x * 1.8}deg)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });
}

document.querySelectorAll('.accordion-list details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.accordion-list details').forEach(other => {
      if (other !== detail) other.open = false;
    });
  });
});

const form = document.getElementById('requestForm');
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const uploadEmpty = document.getElementById('uploadEmpty');
const previewWrap = document.getElementById('previewWrap');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeImage = document.getElementById('removeImage');
const uploadError = document.getElementById('uploadError');
const submitButton = form?.querySelector('button[type="submit"]');
const submitButtonLabel = submitButton?.querySelector('span');
let selectedFile = null;
let previewUrl = null;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setUploadError(message = '') {
  if (uploadError) uploadError.textContent = message;
  uploadBox?.classList.toggle('has-error', Boolean(message));
}

function clearImage() {
  selectedFile = null;
  imageInput.value = '';
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  previewImage.removeAttribute('src');
  previewWrap.hidden = true;
  uploadEmpty.hidden = false;
  setUploadError();
}

function handleFile(file) {
  setUploadError();
  if (!ACCEPTED_TYPES.includes(file.type)) {
    setUploadError('Bitte wähle eine JPG-, PNG- oder WEBP-Datei aus.');
    showToast('Dieses Dateiformat wird nicht unterstützt.', false);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setUploadError('Die Datei ist größer als 10 MB. Bitte wähle ein kleineres Bild.');
    showToast('Die Bilddatei ist zu groß.', false);
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  uploadEmpty.hidden = true;
  previewWrap.hidden = false;
  showToast('Bild erfolgreich ausgewählt.');
}

uploadBox?.addEventListener('click', event => {
  if (!event.target.closest('button')) imageInput.click();
});
uploadBox?.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    imageInput.click();
  }
});
imageInput?.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (file) handleFile(file);
});
['dragenter', 'dragover'].forEach(type => uploadBox?.addEventListener(type, event => {
  event.preventDefault();
  uploadBox.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach(type => uploadBox?.addEventListener(type, event => {
  event.preventDefault();
  uploadBox.classList.remove('is-dragging');
}));
uploadBox?.addEventListener('drop', event => {
  const file = event.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});
removeImage?.addEventListener('click', event => {
  event.stopPropagation();
  clearImage();
  showToast('Bild aus der Anfrage entfernt.');
});

function validateField(field) {
  const error = field.closest('label')?.querySelector('.field-error');
  let message = '';
  if (field.validity.valueMissing) message = 'Bitte fülle dieses Feld aus.';
  else if (field.validity.typeMismatch) message = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  field.classList.toggle('is-invalid', Boolean(message));
  if (error) error.textContent = message;
  return !message;
}

form?.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="hidden"]):not([name="website"]), select, textarea').forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.classList.contains('is-invalid')) validateField(field);
  });
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="hidden"]):not([name="website"]), select, textarea')];
  const fieldsValid = fields.map(validateField).every(Boolean);
  const consent = form.elements.consent;
  const consentValid = consent.checked;
  consent.closest('label').classList.toggle('consent-error', !consentValid);

  if (!selectedFile) setUploadError('Bitte wähle zuerst ein Bild aus.');
  if (!fieldsValid || !consentValid || !selectedFile) {
    showToast('Bitte prüfe die markierten Angaben.', false);
    const firstInvalid = form.querySelector('.is-invalid, .consent-error') || (!selectedFile ? uploadBox : null);
    firstInvalid?.focus?.();
    return;
  }

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const service = form.elements.service.value.trim();
  const message = form.elements.message.value.trim();
  const subject = `Projektanfrage von ${name} – ${service}`;
  const body = [
    'Hallo PixelPerfekt,',
    '',
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Bearbeitung: ${service}`,
    `Ausgewählte Bilddatei: ${selectedFile.name}`,
    '',
    'Wunsch:',
    message,
    '',
    'Bitte die oben genannte Bilddatei jetzt als Anhang hinzufügen.'
  ].join('\n');
  const mailto = `mailto:hallo@pixelperfekt.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  showToast('E-Mail wird vorbereitet. Bitte füge dein Bild als Anhang hinzu.');
  window.location.href = mailto;
});

let toastTimer;
const toast = document.getElementById('toast');
function showToast(message, success = true) {
  if (!toast) return;
  toast.querySelector('span').textContent = success ? '✓' : '!';
  toast.querySelector('p').textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

const noticeDialog = document.getElementById('noticeDialog');
const dialogContent = document.getElementById('dialogContent');
const notices = {
  impressum: '<h2>Impressum</h2><p>Bitte ergänze vor der Veröffentlichung die vollständigen Anbieterangaben gemäß den für dein Unternehmen geltenden gesetzlichen Vorgaben.</p><p><strong>PixelPerfekt</strong><br>Geschäftsanschrift<br>E-Mail: hallo@pixelperfekt.de</p>',
  datenschutz: '<h2>Datenschutz</h2><p>Die Bildvorschau entsteht ausschließlich in deinem Browser. Die Website überträgt oder speichert die ausgewählte Datei nicht. Beim Absenden wird dein E-Mail-Programm mit deinen eingegebenen Angaben geöffnet; die Bilddatei fügst du dort selbst als Anhang hinzu.</p><p>Vor Nutzung mit einer eigenen Domain müssen die vollständigen Anbieter- und Datenschutzhinweise ergänzt werden.</p>'
};
document.querySelectorAll('[data-notice]').forEach(button => button.addEventListener('click', () => {
  dialogContent.innerHTML = notices[button.dataset.notice];
  noticeDialog.showModal();
}));
document.querySelector('.dialog-close')?.addEventListener('click', () => noticeDialog.close());
noticeDialog?.addEventListener('click', event => {
  const rect = noticeDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) noticeDialog.close();
});

document.getElementById('year').textContent = new Date().getFullYear();
