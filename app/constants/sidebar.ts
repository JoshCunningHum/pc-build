import type { NavigationMenuItem } from '@nuxt/ui';
import type { Builds } from '~/types/build';
import { PART_TYPE_META } from '~/constants/parts';

const PART_TYPE_ROUTES: Record<Builds.PartType, string> = {
	cpu: '/parts/cpu',
	cooler: '/parts/cooler',
	motherboard: '/parts/motherboard',
	memory: '/parts/memory',
	storage: '/parts/storage',
	video_card: '/parts/video-card',
	case: '/parts/case',
	psu: '/parts/psu',
};

const PART_TYPE_ITEMS: NavigationMenuItem[] = (
	Object.keys(PART_TYPE_META) as Builds.PartType[]
).map((type) => {
	const meta = PART_TYPE_META[type];
	return { label: meta.label, icon: meta.icon, to: PART_TYPE_ROUTES[type] };
});

export const SIDEBAR_ITEMS: NavigationMenuItem[] = [
	{ label: 'Builds', icon: 'i-lucide-blocks', to: '/builds' },
	{
		label: 'Parts',
		icon: 'i-lucide-package',
		defaultOpen: true,
		children: PART_TYPE_ITEMS,
	},
	{ label: 'Database', icon: 'lucide:database', to: '/database' },
	{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
];
