import React from 'react'

interface LogoProps {
  icon?: string
  title?: string
  subtitle?: string
  className?: string
}

export function Logo({ 
  icon = '📊', 
  title = 'Investie', 
  subtitle = 'AI Investment Analysis',
  className = '' 
}: LogoProps) {
  return (
    <div className={`header-logo ${className}`}>
      <span className="logo-icon">{icon}</span>
      <span className="logo-text">{title}</span>
      <span className="logo-subtitle">{subtitle}</span>
    </div>
  )
}