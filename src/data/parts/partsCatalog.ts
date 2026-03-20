import p365Schema from '../fcu_schemas/p365.json'
import rxmSchema from '../fcu_schemas/rxm.json'
import { parsePartsCatalog, type Part } from '../../schemas/partSchema'
import { convertFcuSchemaToParts } from './fromFcuSchema'

const derivedParts = [
    ...convertFcuSchemaToParts(p365Schema),
    ...convertFcuSchemaToParts(rxmSchema),
]

export const partsCatalog: Part[] = parsePartsCatalog(derivedParts)

