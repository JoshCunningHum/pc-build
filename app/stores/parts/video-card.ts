import type { Parts } from '~/types/parts';
import { createPartsStore } from '~/lib/parts-store';

export const useVideoCardPartsStore = createPartsStore<Parts.VideoCard>(
	'parts-video-card',
	'pcbuild:parts:video_card',
);
