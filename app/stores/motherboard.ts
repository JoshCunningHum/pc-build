import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useMotherboardStore = createSpecsStore<Specs.Motherboard>(
	'specs-motherboard',
	'pcbuild:motherboard:overrides',
	() => import('~/data/seed/motherboard.json').then((m) => m.default as Specs.Motherboard[]),
);
