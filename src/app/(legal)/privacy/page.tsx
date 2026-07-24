import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | DonacionesSaaS',
  description: 'Cómo recopilamos, usamos y protegemos tu información.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Última actualización: julio de 2026</p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
          <strong>Aviso:</strong> Este documento es un borrador provisional. Debe ser revisado por un profesional del derecho.
        </div>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Información que recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Correo electrónico y contraseña (para autenticación)</li>
            <li>Nombre de usuario, nombre visible y biografía</li>
            <li>Avatar y banner de perfil</li>
            <li>Redes sociales y sitio web (opcionales)</li>
            <li>Eventos anónimos de visita y clics (sin datos personales identificables)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lo que no recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Datos de tarjeta de crédito</li>
            <li>Información bancaria</li>
            <li>Detalles de transacciones de Hotmart</li>
            <li>Direcciones IP en texto plano</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pagos externos</h2>
          <p>Los pagos son procesados por Hotmart. Consulta la política de privacidad de Hotmart para saber cómo manejan tus datos de pago.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tus derechos</h2>
          <p>Puedes solicitar acceso, corrección o eliminación de tus datos contactándonos directamente.</p>
        </section>
      </div>
    </div>
  )
}
