import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PublicAmountGrid } from '../src/app/[username]/amount-grid.js'
import {
  buildHotmartWidgetUrl,
  canStartSupportRedirect,
  getFeaturedSupportOptionId,
  getInitialSupportOptionId,
  getSelectedSupportOption,
  getSupportCtaLabel,
  getSupportEmptyStateCopy,
  getVisibleSupportOptions,
  moveOrderedSupportOption,
  type PublicSupportOption,
} from '../src/lib/support-options.js'

function makeOptions(count: number): PublicSupportOption[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `option-${index + 1}`,
    title: `Opción ${index + 1}`,
    emoji: '💚',
    description: `Descripción ${index + 1}`,
    amount: (index + 1) * 5,
    currency: 'USD',
    hotmart_checkout_url: `https://pay.hotmart.com/OPTION-${index + 1}`,
    button_label: null,
    is_featured: false,
  }))
}

describe('support option visibility', () => {
  for (const count of [1, 2, 4]) {
    it(`shows all ${count} option(s) without expansion`, () => {
      const options = makeOptions(count)
      assert.deepEqual(getVisibleSupportOptions(options, null, false), options)
    })
  }

  for (const count of [5, 6, 10, 20]) {
    it(`shows 4 of ${count} initially and all after expansion`, () => {
      const options = makeOptions(count)
      assert.equal(getVisibleSupportOptions(options, null, false).length, 4)
      assert.equal(
        getVisibleSupportOptions(options, null, true).length,
        count
      )
    })
  }

  it('keeps a selected formerly-hidden option visible after contraction', () => {
    const options = makeOptions(10)
    const collapsed = getVisibleSupportOptions(
      options,
      'option-9',
      false
    )

    assert.equal(collapsed.length, 4)
    assert.equal(collapsed[0].id, 'option-9')
    assert.equal(new Set(collapsed.map((option) => option.id)).size, 4)
  })

  it('prioritizes selected, featured and configured order', () => {
    const options = makeOptions(10)
    options[7].is_featured = true

    assert.deepEqual(
      getVisibleSupportOptions(options, 'option-10', false).map(
        (option) => option.id
      ),
      ['option-10', 'option-8', 'option-1', 'option-2']
    )
  })
})

describe('selection, featured option and exact checkout association', () => {
  it('selects the first valid featured option', () => {
    const options = makeOptions(5)
    options[3].is_featured = true

    assert.equal(getFeaturedSupportOptionId(options), 'option-4')
    assert.equal(getInitialSupportOptionId(options), 'option-4')
  })

  it('uses the first valid configured option when there is no featured one', () => {
    const options = makeOptions(5)
    assert.equal(getInitialSupportOptionId(options), 'option-1')
  })

  it('ignores an invalid featured URL and selects the first valid option', () => {
    const options = makeOptions(5)
    options[0].is_featured = true
    options[0].hotmart_checkout_url = 'https://example.com/not-hotmart'

    assert.equal(getInitialSupportOptionId(options), 'option-2')
  })

  it('derives amount, CTA and URL from the same selected object', () => {
    const options = makeOptions(2)
    const selected = getSelectedSupportOption(options, 'option-2')
    const storedUrl = selected?.hotmart_checkout_url
    const widgetUrl = buildHotmartWidgetUrl(selected)

    assert.equal(selected?.amount, 10)
    assert.equal(selected?.hotmart_checkout_url, storedUrl)
    assert.match(getSupportCtaLabel(selected), /10/)
    assert.equal(new URL(widgetUrl!).pathname, '/OPTION-2')
    assert.equal(new URL(widgetUrl!).searchParams.get('checkoutMode'), '2')
  })

  it('rejects invalid checkout URLs and a second locked activation', () => {
    const option = makeOptions(1)[0]
    const validUrl = buildHotmartWidgetUrl(option)
    assert.equal(
      canStartSupportRedirect({
        locked: false,
        option,
        checkoutUrl: validUrl,
      }),
      true
    )
    assert.equal(
      canStartSupportRedirect({
        locked: true,
        option,
        checkoutUrl: validUrl,
      }),
      false
    )

    option.hotmart_checkout_url = 'javascript:alert(1)'
    assert.equal(buildHotmartWidgetUrl(option), null)
  })
})

describe('configured support order', () => {
  it('moves down and normalizes persisted order indexes', () => {
    const options = [
      { id: 'a', order_index: 10 },
      { id: 'b', order_index: 20 },
      { id: 'c', order_index: 30 },
    ]

    assert.deepEqual(moveOrderedSupportOption(options, 'a', 'down'), [
      { id: 'b', order_index: 0 },
      { id: 'a', order_index: 1 },
      { id: 'c', order_index: 2 },
    ])
  })

  it('does not move beyond a boundary', () => {
    const options = [
      { id: 'a', order_index: 0 },
      { id: 'b', order_index: 1 },
    ]

    assert.equal(moveOrderedSupportOption(options, 'a', 'up'), options)
    assert.equal(moveOrderedSupportOption(options, 'b', 'down'), options)
  })
})

describe('empty support state', () => {
  it('points to public links when the profile has them', () => {
    const copy = getSupportEmptyStateCopy('Ana', true)
    assert.equal(copy.title, 'Este perfil todavía no recibe apoyos')
    assert.match(copy.description, /enlaces públicos/)
  })

  it('uses neutral copy when there are no public links', () => {
    const copy = getSupportEmptyStateCopy('Ana', false)
    assert.equal(copy.title, 'Ana está preparando su página')
    assert.doesNotMatch(copy.description, /enlaces públicos/)
  })
})

describe('accessible selector markup', () => {
  it('renders native radios, a fieldset and expansion disclosure', () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicAmountGrid, {
        buttons: makeOptions(5),
        profileId: 'profile-1',
      })
    )

    assert.match(markup, /<fieldset/)
    assert.match(markup, /type="radio"/)
    assert.match(markup, /name="support-option"/)
    assert.match(markup, /aria-expanded="false"/)
    assert.match(markup, /Ver todas las opciones \(5\)/)
  })

  it('keeps the full long title available and marks an invalid option disabled', () => {
    const longTitle = 'Título suficientemente largo '.repeat(5).slice(0, 80)
    const options = makeOptions(2)
    options[0].title = longTitle
    options[1].hotmart_checkout_url = 'https://invalid.example/checkout'
    const markup = renderToStaticMarkup(
      React.createElement(PublicAmountGrid, {
        buttons: options,
        profileId: 'profile-1',
      })
    )

    assert.ok(markup.includes(`title="${longTitle}"`))
    assert.match(markup, /line-clamp-2/)
    assert.match(markup, /overflow-wrap:anywhere/)
    assert.match(markup, /disabled=""/)
    assert.match(markup, /No disponible/)
  })

  it('preserves short, medium, long, unbroken, special and emoji titles', () => {
    const titles = [
      'Café!',
      'Apoyo para un café',
      'Título descriptivo de cincuenta caracteres exactos'.slice(0, 50),
      'PalabraSinEspaciosQueNoDebeDesbordarElSelector',
      'Café + música — edición especial',
      '☕ Apoyo creativo 💚',
    ]

    for (const title of titles) {
      const options = makeOptions(1)
      options[0].title = title
      const markup = renderToStaticMarkup(
        React.createElement(PublicAmountGrid, {
          buttons: options,
          profileId: 'profile-1',
        })
      )

      assert.ok(markup.includes(title), `Expected full title: ${title}`)
    }
  })
})
