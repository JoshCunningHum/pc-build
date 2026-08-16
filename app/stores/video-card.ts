import type { Specs } from '~/types/parts';
import { createSpecsStore } from '~/lib/specs-store';

export const useVideoCardStore = createSpecsStore<Specs.VideoCard>(
	'specs-video-card',
	'pcbuild:video-card:overrides',
	() => import('~/data/seed/video-card.json').then((m) => m.default as Specs.VideoCard[]),
);
