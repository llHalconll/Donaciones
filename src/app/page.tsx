import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Link2,
  MousePointerClick,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { PublicHeader } from '@/components/shared/header'
import { PublicFooter } from '@/components/shared/footer'
import { buttonStyles } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAuthUser } from '@/lib/supabase/server'
import { getDemoUsername } from '@/lib/public-config'
import { formatSupportAmount } from '@/lib/presentation'
import { formatPublicProfileUrl, resolveSiteUrl } from '@/lib/site-url'
import { validatePublicImageUrl } from '@/lib/validations/url'

export default async function HomePage() {
  const { user, supabase } = await getAuthUser()
  const isLoggedIn = Boolean(user)
  const demoUsername = getDemoUsername()
  const siteUrl = resolveSiteUrl()

  const { data: exampleProfile } = demoUsername
    ? await supabase
        .from('profiles')
        .select(`
          display_name,
          username,
          bio,
          avatar_url,
          donation_buttons (
            id,
            title,
            emoji,
            amount,
            currency,
            is_active,
            is_featured,
            order_index
          )
        `)
        .eq('username', demoUsername)
        .eq('is_active', true)
        .maybeSingle()
    : { data: null }

  const exampleButtons = (exampleProfile?.donation_buttons ?? [])
    .filter((button) => button.is_active)
    .sort((a, b) => a.order_index - b.order_index)
    .slice(0, 3)
  const exampleAvatar = exampleProfile?.avatar_url
    ? validatePublicImageUrl(exampleProfile.avatar_url).normalizedUrl
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="border-b border-slate-200 py-16 dark:border-slate-800 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <Badge variant="emerald" className="px-3 py-1">
              <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
              Perfiles de apoyo para creadores
            </Badge>

            <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-[1.05] tracking-[-0.035em] text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
              Crea tu perfil de apoyo conectado con <span className="text-emerald-500">Hotmart</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
              Crea una página personalizada, añade tus enlaces de Hotmart y comparte una sola URL con tu audiencia.
            </p>

            <div className="mx-auto mt-8 flex max-w-lg flex-col items-stretch justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Link href="/dashboard" className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}>
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  Ir a mi panel
                </Link>
              ) : (
                <Link href="/auth/register" className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}>
                  Crear mi perfil gratis
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              )}
              {exampleProfile && (
                <Link href="/demo" className={buttonStyles({ variant: 'outline', size: 'lg', className: 'w-full sm:w-auto' })}>
                  Ver perfil de ejemplo
                </Link>
              )}
            </div>

            {exampleProfile && (
              <div className="mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs font-semibold text-emerald-700 dark:bg-slate-900 dark:text-emerald-400 sm:text-sm">
                <Globe className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{formatPublicProfileUrl(siteUrl, exampleProfile.username)}</span>
              </div>
            )}
          </div>
        </section>

        {exampleProfile && (
        <section className="py-14 sm:py-20" aria-labelledby="product-preview-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <Badge variant="slate">El producto, en contexto</Badge>
              <h2 id="product-preview-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Todo tu perfil en una sola página
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Presenta quién eres, organiza tus opciones de apoyo y envía a tu audiencia al checkout de Hotmart.
              </p>
            </div>

            <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20">
                <div className="flex min-h-12 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="ml-3 truncate rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {formatPublicProfileUrl(siteUrl, exampleProfile.username)}
                  </span>
                </div>
                <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
                  <div className="flex flex-col justify-center">
                    {exampleAvatar ? (
                      <Image
                        src={exampleAvatar}
                        alt={`Foto de ${exampleProfile.display_name}`}
                        width={80}
                        height={80}
                        className="size-20 rounded-full border-4 border-white object-cover shadow-md dark:border-slate-900"
                      />
                    ) : (
                      <span className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {exampleProfile.display_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">{exampleProfile.display_name}</p>
                    <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">@{exampleProfile.username}</p>
                    {exampleProfile.bio && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{exampleProfile.bio}</p>
                    )}
                    <p className="mt-5 text-xs font-semibold text-slate-400">Vista con datos públicos reales</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">Apoyo directo</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">Apoya mi trabajo</h3>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {exampleButtons.map((button) => (
                        <div key={button.id} className="flex min-h-28 flex-col rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                          <div className="flex items-start gap-2">
                            <span aria-hidden="true">{button.emoji || '♥'}</span>
                            <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{button.title}</p>
                          </div>
                          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                            <p className="font-black text-emerald-600 dark:text-emerald-400">
                              {formatSupportAmount(Number(button.amount), button.currency)}
                            </p>
                            {button.is_featured && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">
                                Destacada
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/demo" className={buttonStyles({ className: 'mt-4 w-full' })}>
                      Abrir perfil real
                    </Link>
                  </div>
                </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/demo" className={buttonStyles({ variant: 'outline' })}>
                Ver el perfil real
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        )}

        <section className="border-y border-slate-200 bg-slate-100/70 py-14 dark:border-slate-800 dark:bg-slate-900/40" aria-labelledby="how-it-works-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="emerald">Cómo funciona</Badge>
              <h2 id="how-it-works-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                De tu cuenta a tu audiencia en tres pasos
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: UserRound, title: 'Crea tu perfil', text: 'Añade tu nombre, presentación e identidad visual.' },
                { icon: CreditCard, title: 'Añade tus enlaces de Hotmart', text: 'Define cada opción y conecta su checkout correspondiente.' },
                { icon: Link2, title: 'Comparte tu URL', text: 'Publica un solo enlace para que tu audiencia elija cómo apoyarte.' },
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title}>
                    <Card className="h-full p-6">
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-black text-slate-300 dark:text-slate-700">0{index + 1}</span>
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.text}</p>
                    </Card>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="benefits-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <Badge variant="slate">Hecho para compartir</Badge>
                <h2 id="benefits-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Una forma simple de presentar tus opciones de apoyo
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  DonacionesSaaS organiza tu perfil y registra visitas y clics. El checkout y el pago continúan en Hotmart.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: UserRound, text: 'Configura tu perfil en pocos pasos.' },
                  { icon: MousePointerClick, text: 'Envía a tu audiencia directamente a Hotmart.' },
                  { icon: CreditCard, text: 'Personaliza tus opciones de apoyo.' },
                  { icon: BarChart2, text: 'Consulta visitas y clics de los últimos 30 días.' },
                  { icon: Globe, text: 'Comparte una sola URL pública.' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <Icon className="size-5 shrink-0 text-emerald-500" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 py-14 dark:border-slate-800 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Badge variant="emerald">Empieza gratis</Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Crea tu perfil y escala cuando lo necesites
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
              DonacionesSaaS no añade comisión por cada apoyo. Hotmart puede aplicar sus propias tarifas según tu cuenta y producto.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className={buttonStyles({ size: 'lg' })}>
                Ver planes y precios
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link href={isLoggedIn ? '/dashboard' : '/auth/register'} className={buttonStyles({ variant: 'outline', size: 'lg' })}>
                {isLoggedIn ? 'Ir a mi panel' : 'Empezar gratis'}
              </Link>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:gap-6">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> Sin tarjeta para empezar</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> 0 % de comisión de DonacionesSaaS</span>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
