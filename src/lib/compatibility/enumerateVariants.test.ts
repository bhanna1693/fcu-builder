import { describe, it, expect } from 'vitest'
import { enumerateVariants } from './enumerateVariants'
import { partsCatalog } from '../../data/parts/partsCatalog'
import type { PartType } from '../../schemas/partSchema'

function owned(partsByType: Partial<Record<PartType, string[]>>) {
  return partsByType
}

describe('enumerateVariants', () => {
  it('includes a buildable P365 XMacro-style variant', () => {
    const fcuId = 'fcu_sig-p365'
    const variants = enumerateVariants(
      fcuId,
      owned({
        slide: ['sl_365_xl'],
        barrel: ['br_37'],
        grip: ['gr_macro'],
        magazine: ['mg_17'],
      }),
      partsCatalog,
    )

    expect(variants.length).toBe(1)
    expect(variants[0].config.slideId).toBe('sl_365_xl')
    expect(variants[0].config.compensatorId).toBeUndefined()
  })

  it('rejects incompatible Fuse slide + Standard grip', () => {
    const fcuId = 'fcu_sig-p365'
    const variants = enumerateVariants(
      fcuId,
      owned({
        slide: ['sl_365_fuse'],
        barrel: ['br_43'],
        grip: ['gr_x'],
        magazine: ['mg_17'],
      }),
      partsCatalog,
    )

    expect(variants.length).toBe(0)
  })

  it('accepts comp-style P365 XL slide with 3.1 barrel', () => {
    const fcuId = 'fcu_sig-p365'
    const variants = enumerateVariants(
      fcuId,
      owned({
        slide: ['sl_365_xl_comp'],
        barrel: ['br_31'],
        grip: ['gr_macro'],
        magazine: ['mg_17'],
      }),
      partsCatalog,
    )

    expect(variants.length).toBe(1)
    expect(variants[0].config.slideId).toBe('sl_365_xl_comp')
    expect(variants[0].issues.some((i) => i.severity === 'error')).toBe(false)
  })
})

