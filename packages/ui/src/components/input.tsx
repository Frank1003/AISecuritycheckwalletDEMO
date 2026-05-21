import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('ui-input', props.className)} />
}
