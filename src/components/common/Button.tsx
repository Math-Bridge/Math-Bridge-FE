import React, { useRef, useState, useCallback } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  preventDoubleClick?: boolean;
  clickDelay?: number;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Button component with built-in double-click prevention
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  preventDoubleClick: enablePrevention = true,
  clickDelay = 500,
  disabled,
  className = '',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastClickTime = useRef<number>(0);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isProcessing) {
        e.preventDefault();
        return;
      }

      if (enablePrevention && onClick) {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime.current;

        if (timeSinceLastClick < clickDelay) {
          e.preventDefault();
          return;
        }

        lastClickTime.current = now;
        setIsProcessing(true);

        // Execute the original onClick
        const result = onClick(e);

        // If onClick returns a promise, wait for it
        if (result instanceof Promise) {
          result
            .finally(() => {
              setTimeout(() => {
                setIsProcessing(false);
              }, clickDelay);
            })
            .catch(() => {
              setTimeout(() => {
                setIsProcessing(false);
              }, clickDelay);
            });
        } else {
          setTimeout(() => {
            setIsProcessing(false);
          }, clickDelay);
        }
      } else if (onClick) {
        onClick(e);
      }
    },
    [onClick, disabled, isProcessing, enablePrevention, clickDelay]
  );

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    default: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseStyles =
    'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className} ${isProcessing ? 'opacity-75 cursor-wait' : ''}`.trim();

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={combinedClassName}
    >
      {children}
    </button>
  );
};

export default Button;

