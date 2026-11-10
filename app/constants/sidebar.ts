import type { NavigationMenuItem } from '@nuxt/ui';
import type { Builds } from '~/types/build';
import { PART_TYPE_META, PART_TYPE_ROUTES, PARTS_STORES } from '~/constants/parts';

export function sidebarItems(): NavigationMenuItem[] {
	// Built on demand so the badges read live Pinia stores inside the caller's computed.
	const partTypeItems = (Object.keys(PART_TYPE_META) as Builds.PartType[]).map((type) => {
		const meta = PART_TYPE_META[type];
		return {
			label: meta.label,
			icon: meta.icon,
			to: PART_TYPE_ROUTES[type],
			badge: PARTS_STORES[type]().list.length || '',
		};
	});

	return [
		{ label: 'Builds', icon: 'i-lucide-blocks', to: '/builds' },
		{
			label: 'Parts',
			icon: 'i-lucide-package',
			defaultOpen: true,
			children: partTypeItems,
		},
		{ label: 'Database', icon: 'lucide:database', to: '/database' },
		{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
	];
}
