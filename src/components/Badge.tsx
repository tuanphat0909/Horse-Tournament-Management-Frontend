

type BadgeStatus = 'Approved' | 'Pending' | 'Rejected' | 'Active' | 'Draft' | 'Live';

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  let styleClasses = '';
  let showLiveDot = false;

  switch (status) {
    case 'Approved':
      styleClasses = "bg-[#0B2318] text-success border-[#1A5C36]";
      break;
    case 'Pending':
      styleClasses = "bg-[#1C1A08] text-champagne border-[#6B5A1A]";
      break;
    case 'Rejected':
      styleClasses = "bg-[#200B0B] text-danger border-[#5C1A1A]";
      break;
    case 'Active':
      styleClasses = "bg-[#0B1A2E] text-info border-[#1A3A6B]";
      break;
    case 'Draft':
      styleClasses = "bg-[#141414] text-muted border-[#2A2A2A]";
      break;
    case 'Live':
      styleClasses = "bg-[#0B2318] text-success border-[#1A5C36]";
      showLiveDot = true;
      break;
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-3 py-0.5 border ${styleClasses} ${className}`}>
      {showLiveDot && <span className="live-dot" />}
      {status}
    </span>
  );
}
