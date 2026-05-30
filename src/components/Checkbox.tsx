import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            className="peer appearance-none w-4 h-4 border border-gold/40 rounded-[3px] bg-transparent checked:bg-gold checked:border-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold/20"
            {...props}
          />
          <svg 
            className="absolute w-3 h-3 text-navy opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span className="text-muted text-xs group-hover:text-body transition-colors">
          {label}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
