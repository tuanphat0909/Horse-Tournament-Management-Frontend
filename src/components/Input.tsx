import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightIcon, onRightIconClick, className = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col mb-4 ${className}`}>
        <label className="text-muted text-[12px] uppercase tracking-[0.08em] mb-1.5 font-sans">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            className={`w-full bg-[#060E1C] border ${
              error ? 'border-danger focus:ring-danger/20' : 'border-gold/20 focus:border-gold focus:ring-gold/10'
            } rounded-md h-11 px-4 text-body placeholder:text-[#3D5070] focus:outline-none focus:ring-[3px] transition-all duration-200 ${
              rightIcon ? 'pr-11' : ''
            }`}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <span className="text-danger text-xs mt-1.5 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
