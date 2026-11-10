import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useMemoryPartsStore = createPartsStore<Parts.Memory>(
	'parts-memory',
	'pcbuild:parts:memory',
);
