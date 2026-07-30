// src/app/station/[slug]/page.tsx
export default function StationDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6">
      <p className="text-plug-slate-500">Station detail Phase 6</p>
      <p className="font-mono text-sm text-plug-slate-400">{params.slug}</p>
    </main>
  )
}
