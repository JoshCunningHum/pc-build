import type { ConstantId } from '~/stores/constants';
import type { Builds } from '~/types/build';
import { specLabel } from '~/constants/spec-labels';

const CONSTANT_BACKED: Partial<Record<Builds.PartType, Record<string, ConstantId>>> = {
	motherboard: { form_factor: 'form_factor' },
	case: { type: 'form_factor' },
	psu: { efficiency: 'efficiency' },
};

export function humanizeKey(key: string): string {
	const words = key.replaceAll('_', ' ');
	return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatSpecValue(part: Builds.PartType, key: string, value: unknown): string {
	if (value === undefined || value === null || value === '') return '—';

	const constant = CONSTANT_BACKED[part]?.[key];
	if (constant && typeof value === 'number') return specLabel(constant, value);

	if (typeof value === 'boolean') return value ? 'Yes' : 'No';

	if (Array.isArray(value)) {
		if (value.length === 0) return '—';
		if (value.every((entry) => typeof entry === 'number')) return value.join('–');
		return value.map((entry) => (typeof entry === 'object' ? entry.name : entry)).join(', ');
	}

	if (typeof value === 'object') return (value as { name?: string }).name ?? '—';

	return String(value);
}
