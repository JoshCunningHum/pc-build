import type { Builds } from '~/types/build';
import type { SpecsByPartType } from '~/types/parts';
import { Specs } from '~/types/parts';

type PartDefaults = { [K in Builds.PartType]: () => Partial<SpecsByPartType[K]> };

export const PART_DEFAULTS: PartDefaults = {
	cpu: () => ({ socket: { name: '' } }),
	cooler: () => ({ sockets: [] }),
	motherboard: () => ({
		socket: { name: '' },
		ddr: 'DDR5',
		pcie: 5,
		form_factor: Specs.MotherboardFormFactor.ATX,
	}),
	memory: () => ({ ddr: 'DDR5' }),
	storage: () => ({}),
	video_card: () => ({ pcie: 5 }),
	case: () => ({ type: Specs.MotherboardFormFactor.ATX, internal_35_bays: 0 }),
	psu: () => ({ efficiency: Specs.PowerSupplyEfficiency.Standard, modular: false }),
};
