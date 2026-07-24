import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio | DonacionesSaaS',
  description: 'Términos y condiciones de uso de la plataforma DonacionesSaaS.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Términos de Servicio</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Última actualización: julio de 2026</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
          <strong>Aviso:</strong> Este documento es un borrador provisional y no constituye asesoría legal definitiva. Debe ser revisado por un profesional del derecho antes de su publicación oficial.
        </div>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Aceptación de los términos</h2>
          <p>Al acceder o utilizar DonacionesSaaS, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo, no debes utilizar la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Descripción del servicio</h2>
          <p>DonacionesSaaS es una plataforma que permite a creadores, personas, organizaciones y proyectos publicar una página pública de apoyo. La plataforma <strong>no procesa pagos directamente</strong>. Cada botón de apoyo redirige al visitante a un enlace de checkout externo configurado por el creador en Hotmart.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Pagos externos</h2>
          <p>Los pagos son procesados exclusivamente por Hotmart, plataforma externa a DonacionesSaaS. Al hacer clic en un botón de apoyo, el visitante será redirigido al sitio de Hotmart. DonacionesSaaS no tiene acceso a datos de tarjeta de crédito, información bancaria ni detalles de las transacciones realizadas fuera de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Responsabilidad del creador</h2>
          <p>Cada creador es responsable de la información publicada en su perfil, incluidos los enlaces de Hotmart configurados. DonacionesSaaS no garantiza la disponibilidad ni el funcionamiento de los checkouts externos.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Uso aceptable</h2>
          <p>Está prohibido usar la plataforma para actividades ilegales, fraudulentas, de suplantación de identidad, distribución de contenido prohibido o cualquier actividad que viole las leyes aplicables.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma.</p>
        </section>
      </div>
    </div>
  )
}
