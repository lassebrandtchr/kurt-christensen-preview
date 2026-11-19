// Om Kurt: ord-for-ord tekst-reveal styret af scroll (GSAP ScrollTrigger, scrub). Ingen pin.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const el = document.querySelector<HTMLElement>('[data-text-reveal]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (el && !reduce) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo(
    el.querySelectorAll('.w'),
    { opacity: 0.15 },
    { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } },
  );
}
