import type { NavigationMenuItem } from '@nuxt/ui';
import type { Builds } from '~/types/build';

const PART_TYPE_ITEMS: Record<Builds.PartType, NavigationMenuItem> = {
	cpu: { label: 'CPU', icon: 'lucide:cpu', to: '/parts/cpu' },
	cooler: { label: 'CPU Cooler', icon: 'lucide:fan', to: '/parts/cooler' },
	motherboard: { label: 'Motherboard', icon: 'lucide:circuit-board', to: '/parts/motherboard' },
	memory: { label: 'Memory', icon: 'lucide:memory-stick', to: '/parts/memory' },
	storage: { label: 'Storage', icon: 'lucide:hard-drive', to: '/parts/storage' },
	video_card: { label: 'Video Card', icon: 'lucide:gpu', to: '/parts/video-card' },
	case: { label: 'Case', icon: 'lucide:pc-case', to: '/parts/case' },
	psu: { label: 'Power Supply', icon: 'lucide:plug-zap', to: '/parts/psu' },
};

export const SIDEBAR_ITEMS: NavigationMenuItem[] = [
	{ label: 'Builds', icon: 'i-lucide-blocks', to: '/builds' },
	{
		label: 'Parts',
		icon: 'i-lucide-package',
		defaultOpen: true,
		children: Object.values(PART_TYPE_ITEMS),
	},
	{ label: 'Database', icon: 'lucide:database', to: '/databasee' },
	{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
];
