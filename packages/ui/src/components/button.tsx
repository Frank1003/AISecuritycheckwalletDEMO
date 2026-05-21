import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../utils'

type Variant = 'primary' | 'secondary' | 'warning' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
}

export function Button({ variant = 'primary', block, className, children, ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn('ui-btn', `ui-btn-${variant}`, block && 'ui-btn-block', className)}
      {...props}
    >
      {children}
    </button>
  )
}
