import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useInternalHardDriveStore = createSpecsStore<Specs.InternalHardDrive>(
	'specs-internal-hard-drive',
	'pcbuild:internal-hard-drive:overrides',
	() =>
		import('~/data/seed/internal-hard-drive.json').then(
			(m) => m.default as Specs.InternalHardDrive[],
		),
);
