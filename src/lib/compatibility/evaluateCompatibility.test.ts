import { describe, it, expect } from 'vitest'
import { evaluateCompatibility } from './evaluateCompatibility'
import { partsCatalog } from '../../data/parts/partsCatalog'
import type { BuildConfig } from './evaluateCompatibility'

function evaluate(config: BuildConfig) {
  return evaluateCompatibility(config, partsCatalog)
}

describe('evaluateCompatibility', () => {
  it('flags slide/grip incompatibility from schema mapping', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_fuse',
      barrelId: 'br_37',
      gripId: 'gr_x',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'grip_overhang')).toBe(true)

    const msg = result.issues.find((i) => i.code === 'grip_overhang')?.message ?? ''
    expect(msg).toContain('not compatible')
  })

  it('flags barrel/slide mismatch: 3.7in barrel cannot fit 3.1in slide', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_std',
      barrelId: 'br_37',
      gripId: 'gr_x',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'barrel_slide_length_mismatch')).toBe(true)

    const msg = result.issues.find((i) => i.code === 'barrel_slide_length_mismatch')?.message ?? ''
    expect(msg).toContain('cannot fit')
  })

  it('allows comp-style slide with short barrel from schema rules', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_xl_comp',
      barrelId: 'br_31',
      gripId: 'gr_macro',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.severity === 'error')).toBe(false)
  })

  it('allows P365X pattern: short slide/barrel with XL grip', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_std',
      barrelId: 'br_31',
      gripId: 'gr_xl',
      magazineId: 'mg_12',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.severity === 'error')).toBe(false)
    expect(result.issues.some((i) => i.code === 'grip_underbite')).toBe(false)
  })

  it('flags magazine/grip mismatch: 10rd magazine on macro grip', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_xl',
      barrelId: 'br_37',
      gripId: 'gr_macro',
      magazineId: 'mg_10',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'magazine_grip_size_mismatch')).toBe(true)

    const msg = result.issues.find((i) => i.code === 'magazine_grip_size_mismatch')?.message ?? ''
    expect(msg).toContain('not compatible')
  })

  it('allows XL 17rd magazine with XL grip', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_xl',
      barrelId: 'br_37',
      gripId: 'gr_macro',
      magazineId: 'mg_21',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'magazine_grip_size_mismatch')).toBe(false)
  })

  it('flags 12rd magazine on macro grip', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_xl',
      barrelId: 'br_37',
      gripId: 'gr_macro',
      magazineId: 'mg_12',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'magazine_grip_size_mismatch')).toBe(true)
  })

  it('allows standard 10rd magazine with standard grip', () => {
    const config: BuildConfig = {
      fcuId: 'fcu_sig-p365',
      slideId: 'sl_365_std',
      barrelId: 'br_31',
      gripId: 'gr_x',
      magazineId: 'mg_10',
    }

    const result = evaluate(config)
    expect(result.issues.some((i) => i.code === 'magazine_grip_size_mismatch')).toBe(false)
  })
})

