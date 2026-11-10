import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useCasePartsStore = createPartsStore<Parts.Case>('parts-case', 'pcbuild:parts:case');
