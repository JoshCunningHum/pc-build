import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const usePowerSupplyStore = createSpecsStore<Specs.PowerSupply>(
	'specs-power-supply',
	'pcbuild:power-supply:overrides',
	() => import('~/data/seed/power-supply.json').then((m) => m.default as Specs.PowerSupply[]),
);
