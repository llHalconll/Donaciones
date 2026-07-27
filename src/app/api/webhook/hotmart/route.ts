import { NextResponse } from 'next/server'

export type HotmartWebhookStatus = 'disabled' | 'not-implemented'

export function getHotmartWebhookStatus(
  enabledValue = process.env.HOTMART_WEBHOOK_ENABLED
): HotmartWebhookStatus {
  return enabledValue === 'true' ? 'not-implemented' : 'disabled'
}

export async function POST() {
  const status = getHotmartWebhookStatus()
  const message = status === 'disabled'
    ? 'El webhook de Hotmart está deshabilitado.'
    : 'El webhook de Hotmart no está implementado y no procesó el evento.'

  return NextResponse.json({ error: message, status }, { status: 503 })
}

export async function GET() {
  const status = getHotmartWebhookStatus()
  return NextResponse.json({
    status,
    processing: false,
    message: 'No se procesan webhooks de Hotmart en este endpoint.',
  })
}
