import Link from 'next/link'
import { ArrowUp, ChevronDown, FileText } from 'lucide-react'
import { parseLegalDocument, type LegalBlock } from '@/lib/legal-document'

interface LegalLayoutProps {
  source: string
  relatedDocument: {
    href: '/terms' | '/privacy'
    label: string
  }
}

function LegalBlockContent({ block }: { block: LegalBlock }) {
  if (block.type === 'list') {
    return (
      <ul className="my-4 space-y-2 pl-5 text-[0.95rem] leading-7 text-slate-700 marker:text-emerald-500 dark:text-slate-300">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`} className="list-disc pl-1">
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'subheading') {
    return (
      <h3
        id={block.id}
        className="scroll-mt-28 pt-4 text-base font-bold leading-7 text-slate-900 dark:text-white sm:text-lg"
      >
        {block.text}
      </h3>
    )
  }

  if (block.type === 'continuation') {
    return (
      <p className="my-5 border-y border-slate-200 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
        {block.text}
      </p>
    )
  }

  return (
    <p className="my-3 text-[0.95rem] leading-7 text-slate-700 dark:text-slate-300 sm:text-base sm:leading-8">
      {block.text}
    </p>
  )
}

function TableOfContents({
  title,
  sections,
}: {
  title: string
  sections: ReturnType<typeof parseLegalDocument>['sections']
}) {
  return (
    <nav aria-label={`Índice de ${title}`}>
      <ol className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-lg px-3 py-2 text-xs leading-5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-emerald-400"
            >
              {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function LegalLayout({
  source,
  relatedDocument,
}: LegalLayoutProps) {
  const document = parseLegalDocument(source)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,48rem)] lg:items-start lg:justify-center lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain pr-3">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              En esta página
            </p>
            <TableOfContents
              title={document.title}
              sections={document.sections}
            />
          </div>
        </aside>

        <article
          aria-labelledby="legal-document-title"
          className="min-w-0"
        >
          <header className="border-b border-slate-200 pb-8 dark:border-slate-800 sm:pb-10">
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <h1
              id="legal-document-title"
              className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl"
            >
              {document.title}
            </h1>
            <div className="mt-5 flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <p>{document.versionLine}</p>
              <p>{document.updatedLine}</p>
            </div>
          </header>

          <details className="group my-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
              Índice del documento
              <ChevronDown
                className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="max-h-[60vh] overflow-y-auto border-t border-slate-200 p-2 dark:border-slate-800">
              <TableOfContents
                title={document.title}
                sections={document.sections}
              />
            </div>
          </details>

          <div className="mt-8 sm:mt-10">
            {document.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-24 border-b border-slate-200 py-8 first:pt-0 last:border-b-0 dark:border-slate-800 sm:py-10"
              >
                <h2
                  id={`${section.id}-title`}
                  className="text-xl font-extrabold leading-8 tracking-tight text-slate-950 dark:text-white sm:text-2xl"
                >
                  {section.heading}
                </h2>
                <div className="mt-4">
                  {section.blocks.map((block, index) => (
                    <LegalBlockContent
                      key={`${block.type}-${index}`}
                      block={block}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-100/70 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={relatedDocument.href}
              className="font-semibold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
            >
              {relatedDocument.label}
            </Link>
            <a
              href="#legal-document-title"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-white sm:self-auto"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
              Volver arriba
            </a>
          </footer>
        </article>
      </div>
    </div>
  )
}
