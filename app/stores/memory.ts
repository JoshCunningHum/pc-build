import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useMemoryStore = createSpecsStore<Specs.Memory>(
	'specs-memory',
	'pcbuild:memory:overrides',
	() => import('~/data/seed/memory.json').then((m) => m.default as Specs.Memory[]),
);
