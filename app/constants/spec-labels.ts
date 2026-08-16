import type { ConstantId } from '~/stores/constants';
import { useConstantsStore } from '~/stores/constants';

export const MODULAR_ITEMS: { label: string; value: string | false }[] = [
	{ label: 'Full', value: 'Full' },
	{ label: 'Semi', value: 'Semi' },
	{ label: 'No', value: false },
];

// Reads through the constants store rather than a static map: which form factors and
// efficiency tiers exist, and in what order, is configurable on the Settings page.
export function specLabel(id: ConstantId, value: string | number | undefined): string {
	if (value === undefined) return '—';
	return useConstantsStore().labelOf(id, value) ?? String(value);
}

export function specItems(id: ConstantId): { label: string; value: string | number }[] {
	return useConstantsStore().list(id);
}
