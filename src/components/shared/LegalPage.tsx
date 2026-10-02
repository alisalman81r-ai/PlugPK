// src/components/shared/LegalPage.tsx
import Link from 'next/link'

/**
 * The layout shared by /terms and /privacy: the Credits page's measure and
 * type, a "last updated" line, and numbered sections with anchors so a
 * specific clause can be linked to.
 */

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

export interface LegalPageProps {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}

export function LegalPage({ eyebrow, title, intro, updated, sections }: LegalPageProps) {
  return (
    <main className="container-plug py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="text-ui-xs font-semibold uppercase tracking-[0.18em] text-plug-blue-600">{eyebrow}</p>
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-slate-900">
          {title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-slate-600">{intro}</p>
        <p className="mt-4 text-ui-sm text-slate-400">Last updated {updated}</p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-28 flex flex-col gap-2 text-ui-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-slate-500 transition-colors hover:text-plug-blue-600">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-slate-200 py-8 first:border-t-0 first:pt-0">
              <h2 className="text-xl font-bold tracking-[-0.01em] text-slate-900">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-600 [&_a]:font-medium [&_a]:text-plug-blue-600 [&_a:hover]:underline [&_li]:pl-1 [&_strong]:text-slate-800 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}

          <p className="border-t border-slate-200 pt-8 text-ui-sm text-slate-500">
            Questions about this page? Write to <a href="mailto:hello@plug.pk" className="font-medium text-plug-blue-600 hover:underline">hello@plug.pk</a>.
            See also the <Link href={title.startsWith('Terms') ? '/privacy' : '/terms'} className="font-medium text-plug-blue-600 hover:underline">{title.startsWith('Terms') ? 'Privacy Policy' : 'Terms of Service'}</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}
