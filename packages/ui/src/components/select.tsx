import type { PropsWithChildren, SelectHTMLAttributes } from 'react'
import { cn } from '../utils'

export function Select(props: PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>>) {
  return <select {...props} className={cn('ui-select', props.className)}>{props.children}</select>
}
