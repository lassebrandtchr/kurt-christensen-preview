// Signaturmomentet "Skjoldet" (forside-hero). Kun første besøg i sessionen; ellers slut-tilstand.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('[data-hero]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function finish() {
  root.classList.remove('hero-intro');
}

if (hero && !reduce) {
  gsap.registerPlugin(ScrollTrigger);
  const q = gsap.utils.selector(hero);
  const paths = q('.shield__path');
  const img = q('[data-hero-img]');
  const word = q('[data-hero-word] > span');
  const lines = q('[data-hero-line]');
  const tag = q('[data-hero-tag]');
  const h1 = q('[data-hero-h1]');
  const cta = q('[data-hero-cta]');
  const shine = hero.querySelector('.metal-text.shine');

  if (root.classList.contains('hero-intro')) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: () => { try { sessionStorage.setItem('kc-hero', '1'); } catch {} } });
    // Fjern intro-klassen og overtag tilstanden i GSAP (samme startværdier)
    gsap.set(paths, { strokeDashoffset: 1 });
    gsap.set(img, { filter: 'brightness(0.35)', scale: 1.04 });
    gsap.set(word, { yPercent: 110 });
    gsap.set(lines, { scaleX: 0 });
    gsap.set([tag, h1, cta], { opacity: 0 });
    gsap.set(tag, { letterSpacing: '0.5em' });
    finish();

    tl.to(paths, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.15)
      .to(img, { filter: 'brightness(1)', scale: 1, duration: 0.9, ease: 'power1.out' }, 0.9)
      .to(word, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 1.3)
      .add(() => shine?.classList.add('is-shining'), 1.45)
      .to(lines, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 1.5)
      .to(tag, { opacity: 1, letterSpacing: '0.22em', duration: 0.8 }, 1.7)
      .to(h1, { opacity: 1, duration: 0.6 }, 1.8)
      .to(cta, { opacity: 1, duration: 0.6 }, 1.9)
      .set(img, { clearProps: 'filter' })
      .set(tag, { clearProps: 'letterSpacing' });
  } else {
    shine?.classList.add('is-shining');
  }

  // Scroll: skjoldet skalerer let ud og fader, billedet driver langsomt (parallax)
  gsap.to(q('.hero__shield'), {
    scale: 1.15,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  gsap.to(q('[data-hero-img] img'), {
    yPercent: 8,
    scale: 1.06,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
} else {
  finish();
}
