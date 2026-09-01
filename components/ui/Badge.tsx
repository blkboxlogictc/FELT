type BadgeVariant = 'default' | 'win' | 'loss' | 'active' | 'closed' | 'gold' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-slate-400 border border-surface-border',
  win: 'bg-green-950/60 text-green-400 border border-green-800/40',
  loss: 'bg-red-950/60 text-red-400 border border-red-800/40',
  active: 'bg-felt-subtle text-felt-light border border-felt/40',
  closed: 'bg-surface-elevated text-slate-500 border border-surface-border',
  gold: 'bg-gold-subtle text-gold border border-gold/30',
  neutral: 'bg-slate-800/60 text-slate-400 border border-slate-700/40',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
