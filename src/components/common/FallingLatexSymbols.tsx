import React, { useEffect, useState, useRef } from 'react';

interface Symbol {
  id: string;
  symbol: string;
  left: number;
  top: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
  rotation: number;
  color: string;
  startTime: number;
}

// Nhiều ký hiệu toán học khác nhau
const mathSymbols = [
  '∫', '∑', 'π', 'α', 'β', 'γ', 'δ', 'θ', 'λ', 'σ', '∞', '√', 'Δ', 'Ω', 'Σ', 
  '±', '×', '÷', '≤', '≥', '≠', '≈', '∝', '∴', '∵', '∠', '⊥', '∥', '∪', '∩', 
  '⊂', '⊃', '∅', 'ℝ', 'ℕ', 'ℤ', 'ℚ', '∂', '∇', '∈', '∉', '∀', '∃', '∄',
  '∨', '∧', '¬', '→', '↔', '⊕', '⊗', '⊖', '⊙', '◯', '△', '□', '◇'
];

const colors = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', 
  '#06B6D4', '#14B8A6', '#F97316', '#EF4444',
  '#10B981', '#F59E0B', '#84CC16', '#06B6D4'
];

const FallingLatexSymbols: React.FC = () => {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [mounted, setMounted] = useState(false);
  const animationFrameRef = useRef<number>();
  const symbolsRef = useRef<Symbol[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    console.log('FallingLatexSymbols: Component mounted');
    
    const createSymbol = (): Symbol => {
      const drift = (Math.random() - 0.5) * 100; // Giảm drift để ít di chuyển ngang
      const rotation = Math.random() * 1080;
      const id = `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      
      // Chỉ spawn ở 2 bên: bên trái (0-15%) hoặc bên phải (85-100%)
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const left = side === 'left' 
        ? Math.random() * 15  // 0-15%
        : 85 + Math.random() * 15; // 85-100%
      
      return {
        id: id,
        symbol: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
        left: left,
        top: -150,
        duration: 15 + Math.random() * 10, // 15-25s (rơi chậm hơn)
        size: 45 + Math.random() * 35, // 45-80px
        opacity: 0.3 + Math.random() * 0.2, // 0.3-0.5 (mờ hơn nữa)
        drift: drift,
        rotation: rotation,
        color: colors[Math.floor(Math.random() * colors.length)],
        startTime: now,
      };
    };

    // Tạo symbols ban đầu
    const initialSymbols: Symbol[] = [];
    for (let i = 0; i < 25; i++) {
      const symbol = createSymbol();
      symbol.startTime = Date.now() - (Math.random() * symbol.duration * 1000);
      initialSymbols.push(symbol);
    }
    symbolsRef.current = initialSymbols;
    setSymbols(initialSymbols);
    lastSpawnTimeRef.current = Date.now();
    console.log('FallingLatexSymbols: Generated', initialSymbols.length, 'initial symbols');

    // Animate using requestAnimationFrame
    const animate = () => {
      const now = Date.now();
      
      // Spawn new symbols continuously (every 500-800ms) - chậm hơn một chút
      if (now - lastSpawnTimeRef.current > 500 + Math.random() * 300) {
        const newSymbol = createSymbol();
        symbolsRef.current = [...symbolsRef.current, newSymbol];
        lastSpawnTimeRef.current = now;
      }
      
      // Update all symbols
      const updated = symbolsRef.current.map(symbol => {
        const elapsed = (now - symbol.startTime) / 1000;
        
        if (elapsed < 0) {
          return { ...symbol, top: -150, opacity: 0 };
        }
        
        const progress = elapsed / symbol.duration;
        
        // Remove symbols that have fallen off screen
        if (progress > 1) {
          return null;
        }
        
        // Rơi từ header (top: 0) xuống footer (document height)
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        const currentTop = -150 + (documentHeight + 300) * progress;
        const currentX = symbol.drift * progress;
        const currentRotation = symbol.rotation * progress;
        const currentOpacity = symbol.opacity * (1 - progress * 0.3); // Fade out rất chậm để giữ độ đậm
        
        return {
          ...symbol,
          top: currentTop,
          left: symbol.left + (currentX / window.innerWidth) * 100,
          rotation: currentRotation,
          opacity: Math.max(0, currentOpacity),
        };
      }).filter((s): s is Symbol => s !== null);
      
      symbolsRef.current = updated;
      setSymbols(updated);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {symbols.map((symbol) => (
        <div
          key={symbol.id}
          style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, symbol.left))}%`,
            top: `${symbol.top}px`,
            fontSize: `${symbol.size}px`,
            color: symbol.color,
            opacity: symbol.opacity,
            transform: `translateX(${symbol.drift * 0.01}%) rotate(${symbol.rotation}deg)`,
            willChange: 'transform, opacity',
            pointerEvents: 'none',
            userSelect: 'none',
            fontWeight: 900, // Extra bold
            fontFamily: 'Arial, "Segoe UI", sans-serif',
            lineHeight: 1,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            textShadow: '0 4px 10px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
            WebkitTextStroke: '0.5px rgba(255,255,255,0.3)', // Thêm stroke để đậm hơn
            zIndex: 1,
            transition: 'none',
          } as React.CSSProperties}
        >
          {symbol.symbol}
        </div>
      ))}
    </div>
  );
};

export default FallingLatexSymbols;
