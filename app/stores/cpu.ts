import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useCpuStore = createSpecsStore<Specs.CPU>('specs-cpu', 'pcbuild:cpu:overrides', () =>
	import('~/data/seed/cpu.json').then((m) => m.default as Specs.CPU[]),
);
