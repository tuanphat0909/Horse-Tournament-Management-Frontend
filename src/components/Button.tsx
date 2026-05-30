

type ButtonVariant = 'PRIMARY' | 'SECONDARY' | 'DANGER' | 'GHOST';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({ variant = 'PRIMARY', children, className = '', ...props }: ButtonProps) {
  const baseClasses = "flex items-center justify-center font-bold rounded-md h-11 px-6 text-xs uppercase tracking-widest transition-all duration-200 ease-out";
  
  let variantClasses = '';
  switch (variant) {
    case 'PRIMARY':
      variantClasses = "btn-primary";
      break;
    case 'SECONDARY':
      variantClasses = "bg-transparent border border-gold text-gold hover:bg-gold/10";
      break;
    case 'DANGER':
      variantClasses = "bg-transparent border border-danger text-danger hover:bg-danger/10";
      break;
    case 'GHOST':
      variantClasses = "bg-transparent text-muted hover:text-gold";
      break;
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
