'use client';

import { useEffect } from 'react';

/**
 * Efectos de la landing sobre el markup renderizado en servidor:
 *  - revelado al entrar en pantalla ([data-reveal] / .rise)
 *  - contadores que suben ([data-count])
 *  - inclinación 3D del móvil con el cursor ([data-tilt])
 * Todo respeta prefers-reduced-motion.
 */
export function LandingFX() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: Array<() => void> = [];

    // ---- revelado ----
    const rises = Array.from(document.querySelectorAll<HTMLElement>('.lz .rise'));
    if (reduce || !('IntersectionObserver' in window)) {
      rises.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            const sibs = Array.from(el.parentElement?.children ?? []).filter((c) =>
              c.classList.contains('rise'),
            );
            el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 70}ms`;
            el.classList.add('in');
            io.unobserve(el);
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
      );
      rises.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // ---- contadores ----
    const nums = Array.from(document.querySelectorAll<HTMLElement>('.lz [data-count]'));
    const run = (el: HTMLElement) => {
      const end = parseInt(el.dataset.count ?? '0', 10);
      if (reduce) {
        el.textContent = end.toLocaleString('es-ES');
        return;
      }
      let t0: number | null = null;
      const tick = (t: number) => {
        if (t0 === null) t0 = t;
        const k = Math.min((t - t0) / 1100, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * eased).toLocaleString('es-ES');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const ioN = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            run(e.target as HTMLElement);
            ioN.unobserve(e.target);
          });
        },
        { threshold: 0.6 },
      );
      nums.forEach((el) => ioN.observe(el));
      cleanups.push(() => ioN.disconnect());
    } else {
      nums.forEach(run);
    }

    // ---- tilt del móvil ----
    document.querySelectorAll<HTMLElement>('.lz [data-tilt]').forEach((box) => {
      const phone = box.querySelector<HTMLElement>('.phone');
      const glare = box.querySelector<HTMLElement>('.phone__glare');
      if (!phone) return;
      const enter = () => box.classList.add('live');
      const move = (ev: PointerEvent) => {
        if (reduce) return;
        const r = phone.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        phone.style.setProperty('--ry', `${((px - 0.5) * 17).toFixed(2)}deg`);
        phone.style.setProperty('--rx', `${((0.5 - py) * 13).toFixed(2)}deg`);
        if (glare) {
          glare.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
          glare.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        }
      };
      const leave = () => {
        box.classList.remove('live');
        phone.style.setProperty('--ry', '0deg');
        phone.style.setProperty('--rx', '0deg');
      };
      box.addEventListener('pointerenter', enter);
      box.addEventListener('pointermove', move);
      box.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        box.removeEventListener('pointerenter', enter);
        box.removeEventListener('pointermove', move);
        box.removeEventListener('pointerleave', leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
