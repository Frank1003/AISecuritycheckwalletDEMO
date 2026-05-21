import type { PropsWithChildren } from 'react'
import { cn } from '../utils'

interface CardProps {
  title?: string
  className?: string
}

export function Card({ title, className, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={cn('ui-card', className)}>
      {title ? <p className="ui-card-title">{title}</p> : null}
      {children}
    </section>
  )
}
