import React from 'react'

interface GridProps {
  children: React.ReactNode
  className?: string
}

interface GridItemProps {
  children: React.ReactNode
  span?: 1 | 2 | 3
  className?: string
}

export function Grid({ children, className = '' }: GridProps) {
  return (
    <div className={`optimized-content-grid ${className}`}>
      {children}
    </div>
  )
}

export function GridItem({ children, span = 1, className = '' }: GridItemProps) {
  return (
    <div className={`grid-item span-${span} ${className}`}>
      {children}
    </div>
  )
}