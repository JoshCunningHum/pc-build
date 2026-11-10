import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const usePsuPartsStore = createPartsStore<Parts.PowerSupply>(
	'parts-psu',
	'pcbuild:parts:psu',
);
