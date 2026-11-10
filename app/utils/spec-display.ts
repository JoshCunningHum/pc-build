import type { ConstantId } from '~/stores/constants';
import type { Builds } from '~/types/build';
import type { Specs, SpecsRow } from '~/types/parts';
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

/**
 * Picker label for a spec. Spec names repeat heavily in the catalog (RAM especially), so the
 * label appends the fields that tell otherwise-identical rows apart.
 */
export function specOptionLabel(type: Builds.PartType, row: SpecsRow): string {
	const name = row.name;

	switch (type) {
		case 'cpu': {
			const cpu = row as Specs.CPU;
			return `${name} · ${cpu.socket.name} · ${cpu.core_count} cores · ${cpu.boost_clock} GHz`;
		}
		case 'cooler': {
			const cooler = row as Specs.CPUCooler;
			const sockets = cooler.sockets.map((socket) => socket.name).join('/');
			return `${name} · ${sockets || 'Any socket'}${cooler.size ? ` · ${cooler.size} mm` : ''}`;
		}
		case 'motherboard': {
			const board = row as Specs.Motherboard;
			return `${name} · ${board.socket.name} · ${board.ddr ?? '—'} · ${specLabel('form_factor', board.form_factor)}`;
		}
		case 'memory': {
			const memory = row as Specs.Memory;
			const color = memory.color ? ` · ${memory.color}` : '';
			return `${name} · ${memory.ddr} · ${memory.module_count}×${memory.module_size} GB · ${memory.speed} MT/s · CL${memory.cas_latency}${color}`;
		}
		case 'storage': {
			const drive = row as Specs.InternalHardDrive;
			return `${name} · ${drive.capacity} GB · ${drive.type} · ${drive.interface}`;
		}
		case 'video_card': {
			const card = row as Specs.VideoCard;
			return `${name} · ${card.chipset} · ${card.memory} GB`;
		}
		case 'case': {
			const pcCase = row as Specs.Case;
			return `${name} · ${specLabel('form_factor', pcCase.type)}${pcCase.color ? ` · ${pcCase.color}` : ''}`;
		}
		case 'psu': {
			const psu = row as Specs.PowerSupply;
			return `${name} · ${psu.wattage} W · ${specLabel('efficiency', psu.efficiency)}`;
		}
		default:
			return name;
	}
}

/**
 * Stable picker value for one spec row. Names are not unique in the catalog (RAM especially),
 * so the full row is the identity; selecting by name would always resolve the first variant.
 */
export function specKey(type: Builds.PartType, row: SpecsRow): string {
	return `${type}:${JSON.stringify(row)}`;
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
