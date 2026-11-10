import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useMotherboardPartsStore = createPartsStore<Parts.Motherboard>(
	'parts-motherboard',
	'pcbuild:parts:motherboard',
);
