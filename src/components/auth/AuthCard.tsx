// src/components/auth/AuthCard.tsx
import { cn } from '@/lib/utils'

export interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

/** Content sits directly on the layout's white background — no card chrome. */
export function AuthCard({ children, className }: AuthCardProps) {
  return <div className={cn('w-full', className)}>{children}</div>
}
