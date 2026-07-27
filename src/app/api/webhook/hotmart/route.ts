import { NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINT — PREPARED, NOT ACTIVE
// ═══════════════════════════════════════════════════════════════════
//
// This endpoint is scaffolded for future Hotmart webhook integration.
// It does NOT process real webhooks yet.
//
// When Hotmart integration is ready, you will need:
//   HOTMART_WEBHOOK_SECRET — HMAC secret from Hotmart dashboard
//   HOTMART_TOKEN          — Bearer token for API requests
//
// Security requirements before going live:
//   1. Verify HMAC signature on every request
//   2. Validate external_event_id for idempotency
//   3. Handle all Hotmart event types (PURCHASE_COMPLETE, etc.)
//   4. Never mark a transaction as confirmed without verified signature
//
// ═══════════════════════════════════════════════════════════════════

export async function POST() {
  // Check that the endpoint is intentionally enabled
  if (!process.env.HOTMART_WEBHOOK_ENABLED) {
    return NextResponse.json(
      { error: 'Webhook integration not yet enabled. Set HOTMART_WEBHOOK_ENABLED=true to activate.' },
      { status: 503 }
    )
  }

  // TODO: Verify HMAC signature
  // const signature = req.headers.get('x-hotmart-hottok') // placeholder header name
  // Actual header name must be verified against Hotmart official documentation
  // if (!verifyHmac(body, signature, process.env.HOTMART_WEBHOOK_SECRET)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // }

  // TODO: Parse and validate payload
  // const payload = await req.json()
  // const { event, data } = payload

  // TODO: Store raw event for idempotency
  // await supabase.from('webhook_events').insert({
  //   provider: 'hotmart',
  //   external_event_id: payload.id, // must be verified against actual Hotmart payload structure
  //   event_type: event,
  //   payload,
  //   status: 'received',
  // })

  // Log that the endpoint was hit in prepared mode
  console.warn('[webhook/hotmart] Endpoint hit in PREPARED mode — not processing.')

  return NextResponse.json({ received: true, status: 'prepared' })
}

export async function GET() {
  return NextResponse.json({ status: 'prepared', message: 'Hotmart webhook endpoint is scaffolded but not active.' })
}
