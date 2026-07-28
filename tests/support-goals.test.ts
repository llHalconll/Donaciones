import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PublicSupportGoals } from '../src/app/[username]/support-goals.js'
import {
  attachHotmartOverlay,
  getHotmartCheckoutPresentation,
  getHotmartCheckoutUrl,
  HOTMART_WIDGET_SCRIPT_SRC,
  type HotmartCheckoutElementsApi,
} from '../src/lib/hotmart-checkout.js'

import {
  canStartSupportCheckout,
  getFeaturedSupportAmountId,
  getInitialSupportAmountId,
  getSelectedSupportAmount,
  getSupportCtaLabel,
  getSupportEmptyStateCopy,
  getVisibleSupportAmounts,
  moveOrderedItem,
  type PublicSupportAmount,
  type PublicSupportGoal,
} from '../src/lib/support-goals.js'
import { validateHotmartOfferCode } from '../src/lib/validations/hotmart.js'

function makeAmounts(
  count: number,
  goalId = 'goal-1'
): PublicSupportAmount[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `amount-${index + 1}`,
    goal_id: goalId,
    amount: (index + 1) * 5,
    currency: 'USD',
    hotmart_checkout_url: `https://pay.hotmart.com/LEVEL-${index + 1}`,
    hotmart_offer_code: null,
    button_label: null,
    is_featured: false,
    order_index: index,
  }))
}

function makeGoal(
  amountCount: number,
  id = 'goal-1'
): PublicSupportGoal {
  return {
    id,
    emoji: '☕',
    title: 'Invítame un café',
    description: 'Gracias por ayudarme a seguir creando.',
    cover_url: null,
    order_index: 0,
    amounts: makeAmounts(amountCount, id),
  }
}

describe('support amount visibility', () => {
  for (const count of [1, 4, 8]) {
    it(`shows all ${count} level(s) without expansion`, () => {
      const amounts = makeAmounts(count)
      assert.deepEqual(
        getVisibleSupportAmounts(amounts, null, false),
        amounts
      )
    })
  }

  for (const count of [9, 10, 20, 50]) {
    it(`shows 8 of ${count} initially and all after expansion`, () => {
      const amounts = makeAmounts(count)
      assert.equal(
        getVisibleSupportAmounts(amounts, null, false).length,
        8
      )
      assert.equal(
        getVisibleSupportAmounts(amounts, null, true).length,
        count
      )
    })
  }

  it('keeps a selected formerly-hidden level visible after contraction', () => {
    const amounts = makeAmounts(20)
    const collapsed = getVisibleSupportAmounts(
      amounts,
      'amount-19',
      false
    )

    assert.equal(collapsed.length, 8)
    assert.equal(collapsed[0].id, 'amount-19')
    assert.equal(new Set(collapsed.map((amount) => amount.id)).size, 8)
  })

  it('prioritizes selected, featured and configured order', () => {
    const amounts = makeAmounts(20)
    amounts[9].is_featured = true

    assert.deepEqual(
      getVisibleSupportAmounts(amounts, 'amount-20', false).map(
        (amount) => amount.id
      ),
      [
        'amount-20',
        'amount-10',
        'amount-1',
        'amount-2',
        'amount-3',
        'amount-4',
        'amount-5',
        'amount-6',
      ]
    )
  })
})

describe('support level selection and checkout association', () => {
  it('selects the featured valid level first', () => {
    const amounts = makeAmounts(5)
    amounts[3].is_featured = true

    assert.equal(getFeaturedSupportAmountId(amounts), 'amount-4')
    assert.equal(getInitialSupportAmountId(amounts), 'amount-4')
  })

  it('falls back to the first configured valid level', () => {
    const amounts = makeAmounts(5)
    assert.equal(getInitialSupportAmountId(amounts), 'amount-1')
  })

  it('does not select a featured level with an invalid URL', () => {
    const amounts = makeAmounts(5)
    amounts[0].is_featured = true
    amounts[0].hotmart_checkout_url = 'https://example.com/not-hotmart'

    assert.equal(getInitialSupportAmountId(amounts), 'amount-2')
  })

  it('derives CTA and checkout from exactly the same selected level', () => {
    const amounts = makeAmounts(2)
    amounts[1].hotmart_offer_code = 'offerLevel2'
    const selected = getSelectedSupportAmount(amounts, 'amount-2')
    const storedUrl = selected?.hotmart_checkout_url
    const presentation = getHotmartCheckoutPresentation({
      amount: selected,
      scriptStatus: 'ready',
      attachedAmountId: 'amount-2',
      failedAmountIds: new Set(),
    })

    assert.equal(selected?.amount, 10)
    assert.match(getSupportCtaLabel(selected), /10/)
    assert.equal(selected?.hotmart_checkout_url, storedUrl)
    assert.equal(presentation.kind, 'overlay')
    assert.equal(presentation.offerCode, 'offerLevel2')
    assert.equal(new URL(presentation.checkoutUrl!).pathname, '/LEVEL-2')
  })

  it('rejects invalid URLs and a second locked activation', () => {
    const amount = makeAmounts(1)[0]
    const checkoutUrl = getHotmartCheckoutUrl(amount)

    assert.equal(
      canStartSupportCheckout({ locked: false, amount, checkoutUrl }),
      true
    )
    assert.equal(
      canStartSupportCheckout({ locked: true, amount, checkoutUrl }),
      false
    )

    amount.hotmart_checkout_url = 'javascript:alert(1)'
    assert.equal(getHotmartCheckoutUrl(amount), null)
    assert.equal(
      canStartSupportCheckout({
        locked: false,
        amount,
        checkoutUrl: getHotmartCheckoutUrl(amount),
      }),
      false
    )
  })
})

describe('Hotmart Checkout Elements', () => {
  it('accepts a structured public offer code and rejects unsafe values', () => {
    assert.equal(
      validateHotmartOfferCode('  kjl7fk5t  ').normalizedCode,
      'kjl7fk5t'
    )
    assert.equal(validateHotmartOfferCode('').ok, true)
    assert.equal(validateHotmartOfferCode('<script>').ok, false)
    assert.equal(validateHotmartOfferCode('offer code').ok, false)
  })

  it('uses fallback when a level has no explicit offer code', () => {
    const amount = makeAmounts(1)[0]
    const presentation = getHotmartCheckoutPresentation({
      amount,
      scriptStatus: 'ready',
      attachedAmountId: null,
      failedAmountIds: new Set(),
    })

    assert.equal(presentation.kind, 'fallback')
    assert.equal(presentation.checkoutUrl, amount.hotmart_checkout_url)
  })

  it('does not infer an offer code from the checkout URL', () => {
    const amount = makeAmounts(1)[0]
    amount.hotmart_checkout_url += '?off=must-be-confirmed'
    const presentation = getHotmartCheckoutPresentation({
      amount,
      scriptStatus: 'ready',
      attachedAmountId: null,
      failedAmountIds: new Set(),
    })

    assert.equal(presentation.kind, 'fallback')
    assert.equal(presentation.offerCode, null)
  })

  it('shows a loading state until the exact selected level is attached', () => {
    const amount = makeAmounts(1)[0]
    amount.hotmart_offer_code = 'offerOne'

    assert.equal(
      getHotmartCheckoutPresentation({
        amount,
        scriptStatus: 'loading',
        attachedAmountId: null,
        failedAmountIds: new Set(),
      }).kind,
      'loading'
    )
    assert.equal(
      getHotmartCheckoutPresentation({
        amount,
        scriptStatus: 'ready',
        attachedAmountId: 'another-amount',
        failedAmountIds: new Set(),
      }).kind,
      'loading'
    )
  })

  it('opens overlay only for the exact attached selected level', () => {
    const amounts = makeAmounts(2)
    amounts[0].hotmart_offer_code = 'offerOne'
    amounts[1].hotmart_offer_code = 'offerTwo'
    const selected = getSelectedSupportAmount(amounts, 'amount-2')
    const presentation = getHotmartCheckoutPresentation({
      amount: selected,
      scriptStatus: 'ready',
      attachedAmountId: 'amount-2',
      failedAmountIds: new Set(),
    })

    assert.equal(presentation.kind, 'overlay')
    assert.equal(presentation.offerCode, 'offerTwo')
  })

  it('passes the exact offer to the official overlay API', () => {
    const calls: unknown[][] = []
    const api: HotmartCheckoutElementsApi = {
      init(mode, options) {
        calls.push([mode, options])
        return {
          attach(selector) {
            calls.push(['attach', selector])
          },
        }
      },
    }

    attachHotmartOverlay({
      api,
      selector: '#hotmart-support-amount-2',
      offerCode: 'offerTwo',
    })

    assert.deepEqual(calls, [
      ['overlayCheckout', { offer: 'offerTwo' }],
      ['attach', '#hotmart-support-amount-2'],
    ])
  })

  it('falls back when the official script fails', () => {
    const amount = makeAmounts(1)[0]
    amount.hotmart_offer_code = 'offerOne'
    assert.equal(
      getHotmartCheckoutPresentation({
        amount,
        scriptStatus: 'error',
        attachedAmountId: null,
        failedAmountIds: new Set(),
      }).kind,
      'fallback'
    )
  })

  it('falls back only for an amount whose overlay initialization failed', () => {
    const amounts = makeAmounts(2)
    amounts.forEach((amount, index) => {
      amount.hotmart_offer_code = `offer${index + 1}`
    })

    assert.equal(
      getHotmartCheckoutPresentation({
        amount: amounts[0],
        scriptStatus: 'ready',
        attachedAmountId: null,
        failedAmountIds: new Set(['amount-1']),
      }).kind,
      'fallback'
    )
    assert.equal(
      getHotmartCheckoutPresentation({
        amount: amounts[1],
        scriptStatus: 'ready',
        attachedAmountId: 'amount-2',
        failedAmountIds: new Set(['amount-1']),
      }).kind,
      'overlay'
    )
  })

  it('allows reopening after the activation lock is released', () => {
    const amount = makeAmounts(1)[0]
    const checkoutUrl = getHotmartCheckoutUrl(amount)
    assert.equal(
      canStartSupportCheckout({ locked: true, amount, checkoutUrl }),
      false
    )
    assert.equal(
      canStartSupportCheckout({ locked: false, amount, checkoutUrl }),
      true
    )
  })
})

describe('support goal and amount order', () => {
  it('moves an item and normalizes persisted indexes', () => {
    const items = [
      { id: 'a', order_index: 10 },
      { id: 'b', order_index: 20 },
      { id: 'c', order_index: 30 },
    ]

    assert.deepEqual(moveOrderedItem(items, 'a', 'down'), [
      { id: 'b', order_index: 0 },
      { id: 'a', order_index: 1 },
      { id: 'c', order_index: 2 },
    ])
  })

  it('does not move beyond a boundary', () => {
    const items = [
      { id: 'a', order_index: 0 },
      { id: 'b', order_index: 1 },
    ]

    assert.equal(moveOrderedItem(items, 'a', 'up'), items)
    assert.equal(moveOrderedItem(items, 'b', 'down'), items)
  })
})

describe('support empty state', () => {
  it('points to public links when they exist', () => {
    const copy = getSupportEmptyStateCopy('Ana', true)
    assert.match(copy.description, /enlaces públicos/)
  })

  it('does not invent public links when there are none', () => {
    const copy = getSupportEmptyStateCopy('Ana', false)
    assert.equal(copy.title, 'Ana está preparando su página')
    assert.doesNotMatch(copy.description, /enlaces públicos/)
  })
})

describe('public support goals markup', () => {
  it('renders an accordion and compact pressed buttons without radios', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicSupportGoals, {
        goals: [makeGoal(9)],
        profileId: 'profile-1',
      })
    )

    assert.match(markup, /aria-expanded="true"/)
    assert.match(markup, /role="group"/)
    assert.match(markup, /aria-pressed="true"/)
    assert.doesNotMatch(markup, /role="radio"/)
    assert.doesNotMatch(markup, /type="radio"/)
    assert.match(markup, /\+1 nivel más/)
    assert.match(markup, /Apoyar con/)
  })

  it('renders several goals with only the first expanded', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicSupportGoals, {
        goals: [makeGoal(4, 'goal-1'), makeGoal(4, 'goal-2')],
        profileId: 'profile-1',
      })
    )

    assert.equal((markup.match(/aria-expanded="true"/g) ?? []).length, 1)
    assert.equal((markup.match(/aria-expanded="false"/g) ?? []).length, 1)
    assert.equal((markup.match(/role="group"/g) ?? []).length, 1)
  })

  it('loads the widget script once for goals with valid checkout URLs', () => {
    const first = makeGoal(1, 'goal-1')
    const second = makeGoal(1, 'goal-2')
    first.amounts[0].hotmart_offer_code = 'offerOne'
    second.amounts[0].hotmart_offer_code = 'offerTwo'

    const markup = renderToStaticMarkup(
      React.createElement(PublicSupportGoals, {
        goals: [first, second],
        profileId: 'profile-1',
      })
    )

    // CTA renders as a link, not a disabled button, while script loads
    assert.match(markup, /hotmart-fb/)
    assert.match(markup, /hotmart__button-checkout/)
    assert.match(markup, /checkoutMode=2/)

    const source = readFileSync(
      join(process.cwd(), 'src/app/[username]/support-goals.tsx'),
      'utf8'
    )
    assert.equal(
      (source.match(/id="hotmart-widget"/g) ?? []).length,
      1
    )
    assert.ok(source.includes('src={HOTMART_WIDGET_SCRIPT_SRC}'))
    assert.equal(
      HOTMART_WIDGET_SCRIPT_SRC,
      'https://static.hotmart.com/checkout/widget.min.js'
    )
  })

  it('includes checkoutMode=2 in the link even without an offer code', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicSupportGoals, {
        goals: [makeGoal(1)],
        profileId: 'profile-1',
      })
    )

    // URL must contain the base checkout URL
    assert.match(markup, /pay\.hotmart\.com\/LEVEL-1/)
    // checkoutMode=2 enables the popup overlay
    assert.match(markup, /checkoutMode=2/)
    // Widget CSS class must be present for the JS to intercept the click
    assert.match(markup, /hotmart__button-checkout/)
  })

  it('preserves long, unbroken, special and emoji goal titles', () => {
    const titles = [
      'Café',
      'Objetivo de veinte',
      'PalabraSinEspaciosQueNoDebeDesbordarElContenedor',
      'Café + música — edición especial',
      '🎥 Mejorar mi estudio 💚',
    ]

    for (const title of titles) {
      const goal = makeGoal(1)
      goal.title = title
      const markup = renderToStaticMarkup(
        React.createElement(PublicSupportGoals, {
          goals: [goal],
          profileId: 'profile-1',
        })
      )
      assert.ok(markup.includes(title))
      assert.match(markup, /line-clamp-2/)
    }
  })

  it('uses the widget script and fires analytics exactly once per click', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/[username]/support-goals.tsx'),
      'utf8'
    )

    // Analytics event fires exactly once
    assert.equal(
      (source.match(/trackEvent\('hotmart_redirect'/g) ?? []).length,
      1
    )
    // Widget script is used (not the legacy Elements script for the CTA)
    assert.ok(source.includes('HOTMART_WIDGET_SCRIPT_SRC'))
    // Widget CSS class required for popup interception
    assert.ok(source.includes('hotmart__button-checkout'))
  })
})
