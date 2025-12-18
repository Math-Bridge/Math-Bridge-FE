import { useEffect, useRef } from 'react';

const SYMBOLS = [
  '∫','∑','π','α','β','γ','δ','θ','λ','σ','∞','√','Δ','Ω','Σ',
  '±','×','÷','≤','≥','≠','≈','∝','∠','⊥','∥','∪','∩','ℝ','ℤ','∇'
];

const COLORS = [
  '#3B82F6','#6366F1','#8B5CF6',
  '#EC4899','#06B6D4','#10B981','#F59E0B'
];

const MAX = 12; // Giảm số lượng để tối ưu performance
const SPAWN_MS = 800; // Tăng thời gian spawn để giảm số lượng symbols

interface Slot {
  el: HTMLDivElement;
  active: boolean;
  start: number;
  duration: number;
  x: number;
  drift: number;
  rot: number;
  opacity: number;
}

const FallingLatexSymbols = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const pool = useRef<Slot[]>([]);
  const lastSpawn = useRef(0);
  const raf = useRef(0);
  const height = useRef(window.innerHeight);
  const isVisible = useRef(true);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(0);

  useEffect(() => {
    const root = rootRef.current!;
    height.current = window.innerHeight;

    // Tạm dừng animation khi đang scroll
    const handleScroll = () => {
      isScrolling.current = true;
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrolling.current = false;
      }, 150);
    };

    // Intersection Observer để tạm dừng khi không visible
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible.current = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );

    if (root) {
      observer.observe(root);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ==== INIT POOL ====
    for (let i = 0; i < MAX; i++) {
      const el = document.createElement('div');
      el.textContent = SYMBOLS[i % SYMBOLS.length];

      Object.assign(el.style, {
        position: 'absolute',
        top: '-200px',
        left: '0%',
        fontSize: '64px',
        fontWeight: '900',
        opacity: '0',
        pointerEvents: 'none',
        userSelect: 'none',
        transform: 'translate3d(0,0,0)',
        willChange: 'transform',
        // Tối ưu: chỉ dùng textShadow thay vì filter (nhanh hơn)
        textShadow: '0 2px 8px rgba(0,0,0,.4)',
        contain: 'layout style paint', // CSS containment để tối ưu rendering
      });

      root.appendChild(el);

      pool.current.push({
        el,
        active: false,
        start: 0,
        duration: 0,
        x: 0,
        drift: 0,
        rot: 0,
        opacity: 0.45,
      });
    }

    const spawn = (t: number) => {
      for (let i = 0; i < MAX; i++) {
        const s = pool.current[i];
        if (!s.active) {
          s.active = true;
          s.start = t;
          s.duration = 15000 + Math.random() * 8000;
          s.x = Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
          s.drift = (Math.random() - 0.5) * 120;
          s.rot = Math.random() * 1080;

          s.el.textContent = SYMBOLS[(Math.random() * SYMBOLS.length) | 0];
          s.el.style.left = `${s.x}%`;
          s.el.style.color = COLORS[(Math.random() * COLORS.length) | 0];
          s.el.style.opacity = `${s.opacity}`;
          return;
        }
      }
    };

    const animate = (t: number) => {
      // Tạm dừng animation khi đang scroll hoặc không visible
      if (isScrolling.current || !isVisible.current) {
        raf.current = requestAnimationFrame(animate);
        return;
      }

      if (t - lastSpawn.current > SPAWN_MS) {
        spawn(t);
        lastSpawn.current = t;
      }

      // Batch DOM updates
      for (let i = 0; i < MAX; i++) {
        const s = pool.current[i];
        if (!s.active) continue;

        const p = (t - s.start) / s.duration;
        if (p >= 1) {
          s.active = false;
          s.el.style.opacity = '0';
          continue;
        }

        const y = -200 + (height.current + 200) * p;
        const x = s.drift * p;
        const r = s.rot * p;

        // Sử dụng transform thay vì thay đổi nhiều thuộc tính
        s.el.style.transform =
          `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    const onResize = () => (height.current = window.innerHeight);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(scrollTimeout.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      pool.current.forEach(s => s.el.remove());
      pool.current = [];
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Tối ưu rendering
        contain: 'layout style paint',
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
    />
  );
};

export default FallingLatexSymbols;
