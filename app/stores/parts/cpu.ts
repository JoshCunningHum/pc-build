import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useCpuPartsStore = createPartsStore<Parts.CPU>('parts-cpu', 'pcbuild:parts:cpu');
