// src/components/auth/AuthDivider.tsx
export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      <span className="whitespace-nowrap text-sm text-slate-400">or continue with email</span>
      <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
    </div>
  )
}
