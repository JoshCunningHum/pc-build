import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useStoragePartsStore = createPartsStore<Parts.InternalHardDrive>(
	'parts-storage',
	'pcbuild:parts:storage',
);
