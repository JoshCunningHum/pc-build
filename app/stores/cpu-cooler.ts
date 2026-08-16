import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useCpuCoolerStore = createSpecsStore<Specs.CPUCooler>(
	'specs-cpu-cooler',
	'pcbuild:cpu-cooler:overrides',
	() => import('~/data/seed/cpu-cooler.json').then((m) => m.default as Specs.CPUCooler[]),
);
