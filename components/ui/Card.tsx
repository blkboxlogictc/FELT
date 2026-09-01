interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  accent?: 'none' | 'felt' | 'gold'
}

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  accent = 'none',
}: CardProps) {
  const accentBorder =
    accent === 'felt'
      ? 'border-l-2 border-l-felt'
      : accent === 'gold'
      ? 'border-l-2 border-l-gold'
      : ''

  return (
    <div
      onClick={onClick}
      className={[
        'bg-surface-card border border-surface-border rounded-xl',
        hoverable
          ? 'cursor-pointer hover:bg-surface-elevated hover:border-surface-hover transition-colors duration-150'
          : '',
        onClick ? 'cursor-pointer' : '',
        accentBorder,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
