import type { Builds } from '~/types/build';
import type { SpecsByPartType, SpecsRow } from '~/types/parts';
import { specLabel } from '~/constants/spec-labels';

export interface PartFilterValues {
	cpu: {
		name?: string;
		socket?: string;
		microarchitecture?: string;
		minCores?: number;
		maxTdp?: number;
		integratedGraphics?: boolean;
	};
	cooler: { name?: string; socket?: string; maxNoise?: number; color?: string };
	motherboard: {
		name?: string;
		socket?: string;
		ddr?: string;
		formFactor?: string;
		minMemorySlots?: number;
		minMaxMemory?: number;
	};
	memory: {
		name?: string;
		ddr?: string;
		minSpeed?: number;
		minModuleSize?: number;
		maxCasLatency?: number;
	};
	storage: {
		name?: string;
		type?: string;
		formFactor?: string;
		interface?: string;
		minCapacity?: number;
	};
	video_card: {
		name?: string;
		chipset?: string;
		minMemory?: number;
		maxLength?: number;
		color?: string;
	};
	case: {
		name?: string;
		maxFormFactor?: string;
		sidePanel?: string;
		minGpuClearance?: number;
		color?: string;
	};
	psu: {
		name?: string;
		type?: string;
		efficiency?: string;
		modular?: string;
		minWattage?: number;
	};
}

export interface PartFilter<TPart extends Builds.PartType = Builds.PartType> {
	part: TPart;
	values: PartFilterValues[TPart];
}

export type AnyPartFilter = { [K in Builds.PartType]: PartFilter<K> }[Builds.PartType];

type KeysMatching<TValues, TValue> = {
	[K in keyof TValues]-?: TValues[K] extends TValue ? K : never;
}[keyof TValues] &
	string;

export type FilterField<TRow, TValues> =
	| {
			kind: 'text';
			key: KeysMatching<TValues, string | undefined>;
			label: string;
			get: (row: TRow) => string | undefined;
	  }
	| {
			kind: 'select';
			key: KeysMatching<TValues, string | undefined>;
			label: string;
			get: (row: TRow) => string | string[] | undefined;
	  }
	| {
			kind: 'min' | 'max';
			key: KeysMatching<TValues, number | undefined>;
			label: string;
			unit?: string;
			get: (row: TRow) => number | undefined;
	  }
	| {
			kind: 'boolean';
			key: KeysMatching<TValues, boolean | undefined>;
			label: string;
			get: (row: TRow) => boolean;
	  };

function high(value: number | [number, number] | undefined): number | undefined {
	return Array.isArray(value) ? value[1] : value;
}

export const PART_FILTER_FIELDS: {
	[K in Builds.PartType]: FilterField<SpecsByPartType[K], PartFilterValues[K]>[];
} = {
	cpu: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'socket', label: 'Socket', get: (row) => row.socket.name },
		{
			kind: 'select',
			key: 'microarchitecture',
			label: 'Microarchitecture',
			get: (row) => row.microarchitecture,
		},
		{ kind: 'min', key: 'minCores', label: 'Min cores', get: (row) => row.core_count },
		{ kind: 'max', key: 'maxTdp', label: 'Max TDP', unit: 'W', get: (row) => row.tdp },
		{
			kind: 'boolean',
			key: 'integratedGraphics',
			label: 'Integrated graphics',
			get: (row) => row.graphics != null,
		},
	],
	cooler: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{
			kind: 'select',
			key: 'socket',
			label: 'Socket',
			get: (row) => row.sockets.map((socket) => socket.name),
		},
		{
			kind: 'max',
			key: 'maxNoise',
			label: 'Max noise',
			unit: 'dBA',
			get: (row) => high(row.noise_level),
		},
		{ kind: 'select', key: 'color', label: 'Color', get: (row) => row.color },
	],
	motherboard: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'socket', label: 'Socket', get: (row) => row.socket.name },
		{ kind: 'select', key: 'ddr', label: 'DDR', get: (row) => row.ddr },
		{
			kind: 'select',
			key: 'formFactor',
			label: 'Form factor',
			get: (row) => specLabel('form_factor', row.form_factor),
		},
		{ kind: 'min', key: 'minMemorySlots', label: 'Min slots', get: (row) => row.memory_slots },
		{
			kind: 'min',
			key: 'minMaxMemory',
			label: 'Min max memory',
			unit: 'GB',
			get: (row) => row.max_memory,
		},
	],
	memory: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'ddr', label: 'DDR', get: (row) => row.ddr },
		{ kind: 'min', key: 'minSpeed', label: 'Min speed', unit: 'MT/s', get: (row) => row.speed },
		{
			kind: 'min',
			key: 'minModuleSize',
			label: 'Min module size',
			unit: 'GB',
			get: (row) => row.module_size,
		},
		{ kind: 'max', key: 'maxCasLatency', label: 'Max CAS', get: (row) => row.cas_latency },
	],
	storage: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'type', label: 'Type', get: (row) => row.type },
		{ kind: 'select', key: 'formFactor', label: 'Form factor', get: (row) => row.form_factor },
		{ kind: 'select', key: 'interface', label: 'Interface', get: (row) => row.interface },
		{
			kind: 'min',
			key: 'minCapacity',
			label: 'Min capacity',
			unit: 'GB',
			get: (row) => row.capacity,
		},
	],
	video_card: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'chipset', label: 'Chipset', get: (row) => row.chipset },
		{ kind: 'min', key: 'minMemory', label: 'Min memory', unit: 'GB', get: (row) => row.memory },
		{ kind: 'max', key: 'maxLength', label: 'Max length', unit: 'mm', get: (row) => row.length },
		{ kind: 'select', key: 'color', label: 'Color', get: (row) => row.color },
	],
	case: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{
			kind: 'select',
			key: 'maxFormFactor',
			label: 'Max form factor',
			get: (row) => specLabel('form_factor', row.type),
		},
		{ kind: 'select', key: 'sidePanel', label: 'Side panel', get: (row) => row.side_panel },
		{
			kind: 'min',
			key: 'minGpuClearance',
			label: 'Min GPU clearance',
			unit: 'mm',
			get: (row) => row.max_gpu_length,
		},
		{ kind: 'select', key: 'color', label: 'Color', get: (row) => row.color },
	],
	psu: [
		{ kind: 'text', key: 'name', label: 'Name', get: (row) => row.name },
		{ kind: 'select', key: 'type', label: 'Type', get: (row) => row.type },
		{
			kind: 'select',
			key: 'efficiency',
			label: 'Efficiency',
			get: (row) => specLabel('efficiency', row.efficiency),
		},
		{
			kind: 'select',
			key: 'modular',
			label: 'Modular',
			get: (row) => (row.modular === false ? 'No' : row.modular),
		},
		{ kind: 'min', key: 'minWattage', label: 'Min wattage', unit: 'W', get: (row) => row.wattage },
	],
};

export type FilterValue = string | number | boolean | undefined;

export interface ErasedFilterField {
	kind: FilterField<never, never>['kind'];
	key: string;
	label: string;
	unit?: string;
	get: (row: SpecsRow) => unknown;
}

export function filterFieldsFor(part: Builds.PartType): ErasedFilterField[] {
	return PART_FILTER_FIELDS[part] as unknown as ErasedFilterField[];
}

export function distinctStrings<TRow>(rows: TRow[], get: (row: TRow) => unknown): string[] {
	const options = new Set<string>();
	for (const row of rows) {
		const value = get(row);
		if (typeof value === 'string') options.add(value);
		else if (Array.isArray(value)) {
			for (const entry of value) if (typeof entry === 'string') options.add(entry);
		}
	}
	return [...options].toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function filterOptionsFor(field: ErasedFilterField, rows: SpecsRow[]): string[] {
	return distinctStrings(rows, field.get);
}

export function isFilterActive(filter: AnyPartFilter): boolean {
	return Object.values(filter.values).some((value) => value !== undefined && value !== '');
}

export function matchesFilter(filter: AnyPartFilter, row: SpecsRow): boolean {
	const values = filter.values as Record<string, FilterValue>;

	for (const field of filterFieldsFor(filter.part)) {
		const wanted = values[field.key];
		if (wanted === undefined || wanted === '') continue;

		const actual = field.get(row);
		switch (field.kind) {
			case 'text': {
				const query = String(wanted).toLowerCase();
				if (typeof actual !== 'string' || !actual.toLowerCase().includes(query)) return false;
				break;
			}
			case 'select': {
				const matched = Array.isArray(actual) ? actual.includes(wanted) : actual === wanted;
				if (!matched) return false;
				break;
			}
			case 'min': {
				if (typeof actual !== 'number' || actual < Number(wanted)) return false;
				break;
			}
			case 'max': {
				if (typeof actual !== 'number' || actual > Number(wanted)) return false;
				break;
			}
			case 'boolean': {
				if (actual !== wanted) return false;
				break;
			}
		}
	}

	return true;
}
