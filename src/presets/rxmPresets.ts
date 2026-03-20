import type { PartType } from '../schemas/partSchema'

export type RxmPresetId = 'rxm_compact' | 'rxm_fullsize'

export type RxmPreset = {
  id: RxmPresetId
  name: string
  description: string
  selections: Partial<Record<PartType, string | undefined>>
}

export const rxmPresets: RxmPreset[] = [
  {
    id: 'rxm_compact',
    name: 'Ruger RXM Compact',
    description: 'OEM compact configuration with standard slide and 15rd magazine.',
    selections: {
      fcu: 'fcu_ruger-rxm',
      slide: 'sl_rxm_std',
      barrel: 'br_rxm_40_std',
      grip: 'gr_ehg_15',
      magazine: 'mg_gl9_15',
      compensator: undefined,
    },
  },
  {
    id: 'rxm_fullsize',
    name: 'Ruger RXM Full-Size',
    description: 'OEM full-size configuration with 4.5in slide/barrel and 17rd magazine.',
    selections: {
      fcu: 'fcu_ruger-rxm',
      slide: 'sl_rxm_full',
      barrel: 'br_rxm_45_std',
      grip: 'gr_ehg_17',
      magazine: 'mg_gl9_17',
      compensator: undefined,
    },
  },
]
