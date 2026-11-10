import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useCoolerPartsStore = createPartsStore<Parts.CPUCooler>(
	'parts-cooler',
	'pcbuild:parts:cooler',
);
