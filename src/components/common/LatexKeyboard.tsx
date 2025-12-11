import React, { useState, useRef, useEffect } from 'react';
import { Calculator, X, ChevronDown, ChevronUp } from 'lucide-react';

interface LatexKeyboardProps {
  onInsert: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const LatexKeyboard: React.FC<LatexKeyboardProps> = ({ onInsert, textareaRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const keyboardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const categories = {
    basic: {
      name: 'Basic Math',
      symbols: [
        { label: '+', latex: '+' },
        { label: '−', latex: '-' },
        { label: '×', latex: '\\times' },
        { label: '÷', latex: '\\div' },
        { label: '=', latex: '=' },
        { label: '≠', latex: '\\neq' },
        { label: '<', latex: '<' },
        { label: '>', latex: '>' },
        { label: '≤', latex: '\\leq' },
        { label: '≥', latex: '\\geq' },
        { label: '±', latex: '\\pm' },
        { label: '≈', latex: '\\approx' },
      ],
    },
    fractions: {
      name: 'Fractions & Roots',
      symbols: [
        { label: 'Fraction', latex: '\\frac{a}{b}', description: '\\frac{}{}' },
        { label: '√', latex: '\\sqrt{x}', description: '\\sqrt{}' },
        { label: '∛', latex: '\\sqrt[3]{x}', description: '\\sqrt[3]{}' },
        { label: 'ⁿ√', latex: '\\sqrt[n]{x}', description: '\\sqrt[n]{}' },
        { label: 'x²', latex: 'x^{2}', description: '^{}' },
        { label: 'xⁿ', latex: 'x^{n}', description: '^{}' },
        { label: 'x₁', latex: 'x_{1}', description: '_{}' },
        { label: 'xₙ', latex: 'x_{n}', description: '_{}' },
      ],
    },
    greek: {
      name: 'Greek Letters',
      symbols: [
        { label: 'α', latex: '\\alpha' },
        { label: 'β', latex: '\\beta' },
        { label: 'γ', latex: '\\gamma' },
        { label: 'δ', latex: '\\delta' },
        { label: 'ε', latex: '\\epsilon' },
        { label: 'θ', latex: '\\theta' },
        { label: 'λ', latex: '\\lambda' },
        { label: 'μ', latex: '\\mu' },
        { label: 'π', latex: '\\pi' },
        { label: 'ρ', latex: '\\rho' },
        { label: 'σ', latex: '\\sigma' },
        { label: 'φ', latex: '\\phi' },
        { label: 'ω', latex: '\\omega' },
        { label: 'Δ', latex: '\\Delta' },
        { label: 'Ω', latex: '\\Omega' },
        { label: 'Σ', latex: '\\Sigma' },
      ],
    },
    operators: {
      name: 'Operators',
      symbols: [
        { label: '∑', latex: '\\sum', description: '\\sum_{i=1}^{n}' },
        { label: '∏', latex: '\\prod', description: '\\prod_{i=1}^{n}' },
        { label: '∫', latex: '\\int', description: '\\int' },
        { label: '∬', latex: '\\iint', description: '\\iint' },
        { label: '∮', latex: '\\oint', description: '\\oint' },
        { label: '∂', latex: '\\partial', description: '\\partial' },
        { label: '∇', latex: '\\nabla', description: '\\nabla' },
        { label: 'lim', latex: '\\lim', description: '\\lim_{x \\to \\infty}' },
      ],
    },
    sets: {
      name: 'Sets & Logic',
      symbols: [
        { label: '∈', latex: '\\in' },
        { label: '∉', latex: '\\notin' },
        { label: '⊂', latex: '\\subset' },
        { label: '⊆', latex: '\\subseteq' },
        { label: '∪', latex: '\\cup' },
        { label: '∩', latex: '\\cap' },
        { label: '∅', latex: '\\emptyset' },
        { label: '∀', latex: '\\forall' },
        { label: '∃', latex: '\\exists' },
        { label: '∧', latex: '\\land' },
        { label: '∨', latex: '\\lor' },
        { label: '¬', latex: '\\neg' },
        { label: '⇒', latex: '\\Rightarrow' },
        { label: '⇔', latex: '\\Leftrightarrow' },
      ],
    },
    geometry: {
      name: 'Geometry',
      symbols: [
        { label: '∠', latex: '\\angle' },
        { label: '°', latex: '^{\\circ}' },
        { label: '⊥', latex: '\\perp' },
        { label: '∥', latex: '\\parallel' },
        { label: '△', latex: '\\triangle' },
        { label: '□', latex: '\\square' },
        { label: '○', latex: '\\circ' },
        { label: '≅', latex: '\\cong' },
        { label: '~', latex: '\\sim' },
      ],
    },
    brackets: {
      name: 'Brackets',
      symbols: [
        { label: '( )', latex: '\\left( \\right)', description: '\\left( \\right)' },
        { label: '[ ]', latex: '\\left[ \\right]', description: '\\left[ \\right]' },
        { label: '{ }', latex: '\\left\\{ \\right\\}', description: '\\left\\{ \\right\\}' },
        { label: '| |', latex: '\\left| \\right|', description: '\\left| \\right|' },
        { label: '⌊ ⌋', latex: '\\left\\lfloor \\right\\rfloor', description: '\\left\\lfloor \\right\\rfloor' },
        { label: '⌈ ⌉', latex: '\\left\\lceil \\right\\rceil', description: '\\left\\lceil \\right\\rceil' },
      ],
    },
  };

  const handleSymbolClick = (latex: string) => {
    // Insert LaTeX with $ delimiters if not already present
    let textToInsert = latex;
    
    // If the symbol doesn't start with $, wrap it
    if (!latex.startsWith('$')) {
      // Check if it's a simple symbol (no placeholders) or a template
      if (latex.includes('{') && (latex.includes('a') || latex.includes('b') || latex.includes('x') || latex.includes('n'))) {
        // It's a template, wrap with $...$
        textToInsert = `$${latex}$`;
      } else {
        // Simple symbol, wrap with $...$
        textToInsert = `$${latex}$`;
      }
    }
    
    onInsert(textToInsert);
    
    // Focus back on textarea if ref is provided
    if (textareaRef?.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // Handle click outside to close and position keyboard
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        keyboardRef.current &&
        buttonRef.current &&
        !keyboardRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen && buttonRef.current && keyboardRef.current) {
      // Calculate position relative to button
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const keyboard = keyboardRef.current;
      
      // Position above button, or below if not enough space
      const spaceAbove = buttonRect.top;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const keyboardHeight = 500; // approximate height
      
      if (spaceAbove > keyboardHeight || spaceAbove > spaceBelow) {
        // Position above
        keyboard.style.top = `${buttonRect.top - keyboardHeight - 8}px`;
        keyboard.style.bottom = 'auto';
      } else {
        // Position below
        keyboard.style.top = `${buttonRect.bottom + 8}px`;
        keyboard.style.bottom = 'auto';
      }
      
      // Position horizontally - try to align with button, but keep in viewport
      const keyboardWidth = 600;
      let leftPos = buttonRect.left;
      
      // Ensure it doesn't go off screen
      if (leftPos + keyboardWidth > window.innerWidth) {
        leftPos = window.innerWidth - keyboardWidth - 16;
      }
      if (leftPos < 16) {
        leftPos = 16;
      }
      
      keyboard.style.left = `${leftPos}px`;
      keyboard.style.transform = 'none';
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Toggle LaTeX Keyboard"
      >
        <Calculator className="w-4 h-4" />
        <span>LaTeX</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Keyboard Panel */}
          <div
            ref={keyboardRef}
            className="fixed w-[600px] max-w-[95vw] bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: 'min(500px, 80vh)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-sm font-semibold text-gray-900">LaTeX Keyboard</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
              {Object.keys(categories).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeCategory === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {categories[key as keyof typeof categories].name}
                </button>
              ))}
            </div>

            {/* Symbols Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {categories[activeCategory as keyof typeof categories].symbols.map((symbol, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSymbolClick(symbol.latex)}
                    className="p-2 text-sm border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors group relative"
                    title={symbol.description || symbol.latex}
                  >
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-700 group-hover:text-blue-600">
                        {symbol.label}
                      </div>
                      {symbol.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {symbol.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Help */}
            <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500 text-center">
                Click a symbol to insert LaTeX code. Use $...$ for inline math or $$...$$ for display math.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LatexKeyboard;

