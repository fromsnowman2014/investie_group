import React from 'react'

interface SectionProps {
  title: string
  icon?: string
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Section({ 
  title, 
  icon, 
  children, 
  className = '', 
  as: Component = 'section' 
}: SectionProps) {
  return (
    <Component className={`section-container ${className}`}>
      <div className="section-header">
        <h2>
          {icon && `${icon} `}{title}
        </h2>
      </div>
      <div className="section-content">
        {children}
      </div>
    </Component>
  )
}