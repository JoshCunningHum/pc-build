import type { Builds } from '~/types/build';
import type { ConstantId } from '~/stores/constants';
import type { SpecsByPartType } from '~/types/parts';
import { useConstantsStore } from '~/stores/constants';

type PartDefaults = { [K in Builds.PartType]: () => Partial<SpecsByPartType[K]> };

// Newest configured generation, not a hardcoded member -- these lists are user-owned now.
// Ranked-but-required fields (form factor, efficiency) are deliberately left unset so the
// user picks one rather than inheriting an arbitrary default.
function newest(id: ConstantId): string | number | undefined {
	return useConstantsStore().list(id).at(-1)?.value;
}

export const PART_DEFAULTS: PartDefaults = {
	cpu: () => ({ socket: { name: '' } }),
	cooler: () => ({ sockets: [] }),
	motherboard: () => ({
		socket: { name: '' },
		ddr: newest('ddr') as string | undefined,
		pcie: newest('pcie') as number | undefined,
	}),
	memory: () => ({ ddr: newest('ddr') as string | undefined }),
	storage: () => ({}),
	video_card: () => ({ pcie: newest('pcie') as number | undefined }),
	case: () => ({ internal_35_bays: 0 }),
	psu: () => ({ modular: false }),
};
