import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useCaseStore = createSpecsStore<Specs.Case>(
	'specs-case',
	'pcbuild:case:overrides',
	() => import('~/data/seed/case.json').then((m) => m.default as Specs.Case[]),
);
