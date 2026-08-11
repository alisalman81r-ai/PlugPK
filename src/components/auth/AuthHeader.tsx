// src/components/auth/AuthHeader.tsx
import { cn } from '@/lib/utils'

export interface AuthHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function AuthHeader({ title, subtitle, className }: AuthHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="text-base leading-relaxed text-slate-500">{subtitle}</p> : null}
    </div>
  )
}
