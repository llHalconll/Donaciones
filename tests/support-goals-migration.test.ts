import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/011_support_goals.sql'),
  'utf8'
)

describe('support goals migration', () => {
  it('runs as one transaction and verifies migrated counts', () => {
    assert.match(sql, /\bBEGIN;/)
    assert.match(sql, /DO \$\$/)
    assert.match(sql, /Support migration count mismatch/)
    assert.match(sql, /\bCOMMIT;/)
  })

  it('converts every legacy button into one goal and one amount', () => {
    assert.match(sql, /INSERT INTO public\.support_goals/)
    assert.match(sql, /INSERT INTO public\.support_amounts/)
    assert.match(sql, /FROM public\.donation_buttons/g)
  })

  it('migrates analytics and webhook references before dropping the legacy table', () => {
    const analyticsPosition = sql.indexOf('ADD COLUMN support_amount_id UUID')
    const verificationPosition = sql.indexOf('Verificación obligatoria')
    const dropPosition = sql.indexOf('DROP TABLE public.donation_buttons')

    assert.ok(analyticsPosition >= 0)
    assert.ok(verificationPosition > analyticsPosition)
    assert.ok(dropPosition > verificationPosition)
    assert.match(sql, /analytics_events_support_amount_id_fkey/)
    assert.match(sql, /webhook_events_support_amount_id_fkey/)
  })

  it('enables RLS and validates active profile and goal ownership', () => {
    assert.match(sql, /ALTER TABLE public\.support_goals ENABLE ROW LEVEL SECURITY/)
    assert.match(sql, /ALTER TABLE public\.support_amounts ENABLE ROW LEVEL SECURITY/)
    assert.match(sql, /profiles\.is_active = true/)
    assert.match(sql, /support_goals\.profile_id = auth\.uid\(\)/)
  })
})
