import type { BuildConfig } from '../lib/compatibility/evaluateCompatibility'
import type { PartType } from '../schemas/partSchema'

export type PresetId =
  | 'p365_standard'
  | 'p365_x'
  | 'p365_xl'
  | 'p365_xmacro_tacops'
  | 'p365_xmacro_comp'
  | 'p365_fuse'

export type Preset = {
  id: PresetId
  name: string
  description: string
  selections: Partial<Record<PartType, string | undefined>>
}

export const p365Presets: Preset[] = [
  {
    id: 'p365_standard',
    name: 'P365 Standard',
    description: 'Standard micro grip with 3.1in slide/barrel and 10rd magazine.',
    selections: {
      fcu: 'fcu_sig-p365',
      slide: 'sl_365_std',
      barrel: 'br_31',
      grip: 'gr_x',
      magazine: 'mg_10',
      compensator: undefined,
    },
  },
  {
    id: 'p365_x',
    name: 'P365X',
    description: 'Standard P365 slide/barrel with XL grip module.',
    selections: {
      fcu: 'fcu_sig-p365',
      slide: 'sl_365_std',
      barrel: 'br_31',
      grip: 'gr_xl',
      magazine: 'mg_12',
      compensator: undefined,
    },
  },
  {
    id: 'p365_xl',
    name: 'P365-XL',
    description: 'P365-XL slide/barrel with XL grip module.',
    selections: {
      fcu: 'fcu_sig-p365',
      slide: 'sl_365_xl',
      barrel: 'br_37',
      grip: 'gr_xl',
      magazine: 'mg_12',
      compensator: undefined,
    },
  },
  {
    id: 'p365_xmacro_comp',
    name: 'P365 XMacro Comp',
    description: 'Comp-style XL-length slide with 3.1in barrel and Macro grip.',
    selections: {
      fcu: 'fcu_sig-p365',
      slide: 'sl_365_xl_comp',
      barrel: 'br_31',
      grip: 'gr_macro',
      magazine: 'mg_17',
      compensator: undefined,
    },
  },
  {
    id: 'p365_fuse',
    name: 'P365 Fuse',
    description: 'Fuse extra-long slide with 4.3in barrel and Fuse LXG grip module.',
    selections: {
      fcu: 'fcu_sig-p365',
      slide: 'sl_365_fuse',
      barrel: 'br_43',
      grip: 'gr_fuse',
      magazine: 'mg_21',
      compensator: undefined,
    },
  },
]

export function applyPresetToConfig(
  base: BuildConfig,
  preset: Preset,
): BuildConfig {
  return {
    ...base,
    fcuId: preset.selections.fcu ?? base.fcuId,
    slideId: preset.selections.slide ?? base.slideId,
    barrelId: preset.selections.barrel ?? base.barrelId,
    gripId: preset.selections.grip ?? base.gripId,
    magazineId: preset.selections.magazine ?? base.magazineId,
    compensatorId: preset.selections.compensator ?? base.compensatorId,
  }
}

