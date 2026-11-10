import type { Builds } from '~/types/build';
import type { Parts } from '~/types/parts';
import { PART_TYPE_META } from '~/constants/parts';
import { specLabel } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';
import { formatPrice } from '~/utils/format';
import { buildIncompleteCount, buildPartCount, buildTotalPrice } from '~/utils/builds';
import { validateBuild } from '~/lib/rules';

export type CompareDirection = 'higher' | 'lower';
export type CompareKind = 'percent' | 'label' | 'none';
export type CompareValue = number | string | boolean | [number, number] | undefined;

export interface CompareRow {
	/** Stable key for v-for and baseline tooltips. */
	id: string;
	label: string;
	kind: CompareKind;
	/** Only meaningful for percent and ordered-label rows. */
	direction?: CompareDirection;
	value: (build: Builds.ResolvedBuild) => CompareValue;
	/** Value used for the percentage. Defaults to a numeric `value` or the range upper bound. */
	numeric?: (build: Builds.ResolvedBuild) => number | undefined;
	/** Position used to colour ordered labels such as PSU efficiency. */
	order?: (build: Builds.ResolvedBuild) => number | undefined;
	format?: (value: CompareValue) => string;
}

export interface CompareSection {
	id: 'total' | Builds.PartType;
	label: string;
	icon: string;
	hasPart: (build: Builds.ResolvedBuild) => boolean;
	rows: CompareRow[];
}

type AnyPart =
	| Parts.CPU
	| Parts.CPUCooler
	| Parts.Motherboard
	| Parts.Memory
	| Parts.InternalHardDrive
	| Parts.VideoCard
	| Parts.Case
	| Parts.PowerSupply;

function part(build: Builds.ResolvedBuild, type: Builds.PartType): AnyPart | undefined {
	const value = build.parts[type] as AnyPart | AnyPart[] | undefined;
	return Array.isArray(value) ? undefined : value;
}

function partsOf(build: Builds.ResolvedBuild, type: Builds.PartType): AnyPart[] {
	const value = build.parts[type] as AnyPart | AnyPart[] | undefined;
	return Array.isArray(value) ? value : value ? [value] : [];
}

function cpu(build: Builds.ResolvedBuild): Parts.CPU | undefined {
	return part(build, 'cpu') as Parts.CPU | undefined;
}

function cooler(build: Builds.ResolvedBuild): Parts.CPUCooler | undefined {
	return part(build, 'cooler') as Parts.CPUCooler | undefined;
}

function motherboard(build: Builds.ResolvedBuild): Parts.Motherboard | undefined {
	return part(build, 'motherboard') as Parts.Motherboard | undefined;
}

function memoryKits(build: Builds.ResolvedBuild): Parts.Memory[] {
	return partsOf(build, 'memory') as Parts.Memory[];
}

function drives(build: Builds.ResolvedBuild): Parts.InternalHardDrive[] {
	return partsOf(build, 'storage') as Parts.InternalHardDrive[];
}

function videoCard(build: Builds.ResolvedBuild): Parts.VideoCard | undefined {
	return part(build, 'video_card') as Parts.VideoCard | undefined;
}

function pcCase(build: Builds.ResolvedBuild): Parts.Case | undefined {
	return part(build, 'case') as Parts.Case | undefined;
}

function powerSupply(build: Builds.ResolvedBuild): Parts.PowerSupply | undefined {
	return part(build, 'psu') as Parts.PowerSupply | undefined;
}

// Ranges (`[low, high]`) compare by their upper bound: a kit that can spin louder or a
// cooler with a wider RPM range is represented by the value it can actually reach.
function high(value: number | [number, number] | undefined): number | undefined {
	return Array.isArray(value) ? value[1] : value;
}

function formatNumber(value: CompareValue, unit = ''): string {
	if (value === undefined || value === null || value === '') return '—';
	if (Array.isArray(value)) return `${value[0]}–${value[1]}${unit}`;
	return `${value}${unit}`;
}

function distinct(values: (string | number | false | undefined)[]): string | undefined {
	const present = [...new Set(values.filter((value) => value !== undefined && value !== ''))];
	if (present.length === 0) return undefined;
	if (present.length === 1) return String(present[0]);
	return 'Mixed';
}

function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}

// A category can be absent from one build while present in another, so aggregate rows need an
// explicit "no parts" answer instead of summing to 0 and looking like a real (free) value.
function aggregate(values: number[]): number | undefined {
	return values.length > 0 ? sum(values) : undefined;
}

function errorCount(build: Builds.ResolvedBuild): number {
	return validateBuild({ name: build.name, parts: build.parts }).filter(
		(issue) => issue.severity === 'error',
	).length;
}

function warningCount(build: Builds.ResolvedBuild): number {
	return validateBuild({ name: build.name, parts: build.parts }).filter(
		(issue) => issue.severity === 'warning',
	).length;
}

const totalSection: CompareSection = {
	id: 'total',
	label: 'Summary',
	icon: 'lucide:list',
	hasPart: () => true,
	rows: [
		{
			id: 'total-price',
			label: 'Total price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => buildTotalPrice(build),
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
		{
			id: 'part-count',
			label: 'Parts',
			kind: 'none',
			value: (build) => buildPartCount(build),
		},
		{
			id: 'incomplete',
			label: 'Incomplete parts',
			kind: 'none',
			value: (build) => buildIncompleteCount(build),
		},
		{
			id: 'missing',
			label: 'Missing listings',
			kind: 'none',
			value: (build) => build.missing.length,
		},
		{
			id: 'errors',
			label: 'Compatibility errors',
			kind: 'none',
			value: (build) => errorCount(build),
		},
		{
			id: 'warnings',
			label: 'Warnings',
			kind: 'none',
			value: (build) => warningCount(build),
		},
	],
};

const cpuSection: CompareSection = {
	id: 'cpu',
	label: PART_TYPE_META.cpu.label,
	icon: PART_TYPE_META.cpu.icon,
	hasPart: (build) => Boolean(build.parts.cpu),
	rows: [
		{
			id: 'cores',
			label: 'Cores',
			kind: 'percent',
			direction: 'higher',
			value: (build) => cpu(build)?.core_count,
			format: (value) => formatNumber(value),
		},
		{
			id: 'boost-clock',
			label: 'Boost clock',
			kind: 'percent',
			direction: 'higher',
			value: (build) => cpu(build)?.boost_clock,
			format: (value) => formatNumber(value, ' GHz'),
		},
		{
			id: 'base-clock',
			label: 'Base clock',
			kind: 'percent',
			direction: 'higher',
			value: (build) => cpu(build)?.core_clock,
			format: (value) => formatNumber(value, ' GHz'),
		},
		{
			id: 'tdp',
			label: 'TDP',
			kind: 'percent',
			direction: 'lower',
			value: (build) => cpu(build)?.tdp,
			format: (value) => formatNumber(value, ' W'),
		},
		{
			id: 'socket',
			label: 'Socket',
			kind: 'none',
			value: (build) => cpu(build)?.socket.name,
		},
		{
			id: 'microarchitecture',
			label: 'Microarchitecture',
			kind: 'none',
			value: (build) => cpu(build)?.microarchitecture,
		},
		{
			id: 'smt',
			label: 'SMT',
			kind: 'none',
			value: (build) => cpu(build)?.smt,
			format: (value) => (value === undefined ? '—' : value ? 'Yes' : 'No'),
		},
		{
			id: 'graphics',
			label: 'Integrated graphics',
			kind: 'none',
			value: (build) => cpu(build)?.graphics,
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => cpu(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const coolerSection: CompareSection = {
	id: 'cooler',
	label: PART_TYPE_META.cooler.label,
	icon: PART_TYPE_META.cooler.icon,
	hasPart: (build) => Boolean(build.parts.cooler),
	rows: [
		{
			id: 'radiator',
			label: 'Radiator size',
			kind: 'percent',
			direction: 'higher',
			value: (build) => cooler(build)?.size,
			format: (value) => formatNumber(value, ' mm'),
		},
		{
			id: 'noise',
			label: 'Noise',
			kind: 'percent',
			direction: 'lower',
			value: (build) => cooler(build)?.noise_level,
			numeric: (build) => high(cooler(build)?.noise_level),
			format: (value) => formatNumber(value, ' dBA'),
		},
		{
			id: 'rpm',
			label: 'RPM',
			kind: 'percent',
			direction: 'higher',
			value: (build) => cooler(build)?.rpm,
			numeric: (build) => high(cooler(build)?.rpm),
			format: (value) => formatNumber(value, ' RPM'),
		},
		{
			id: 'sockets',
			label: 'Sockets',
			kind: 'none',
			value: (build) =>
				cooler(build)
					?.sockets.map((socket) => socket.name)
					.join(', '),
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => cooler(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const motherboardSection: CompareSection = {
	id: 'motherboard',
	label: PART_TYPE_META.motherboard.label,
	icon: PART_TYPE_META.motherboard.icon,
	hasPart: (build) => Boolean(build.parts.motherboard),
	rows: [
		{
			id: 'socket',
			label: 'Socket',
			kind: 'none',
			value: (build) => motherboard(build)?.socket.name,
		},
		{
			id: 'form-factor',
			label: 'Form factor',
			kind: 'none',
			value: (build) => {
				const value = motherboard(build)?.form_factor;
				return value === undefined ? undefined : specLabel('form_factor', value);
			},
		},
		{
			id: 'ddr',
			label: 'DDR',
			kind: 'none',
			value: (build) => motherboard(build)?.ddr,
		},
		{
			id: 'pcie',
			label: 'PCIe',
			kind: 'percent',
			direction: 'higher',
			value: (build) => motherboard(build)?.pcie,
			format: (value) => (value === undefined ? '—' : `PCIe ${value}.0`),
		},
		{
			id: 'memory-slots',
			label: 'Memory slots',
			kind: 'percent',
			direction: 'higher',
			value: (build) => motherboard(build)?.memory_slots,
		},
		{
			id: 'max-memory',
			label: 'Max memory',
			kind: 'percent',
			direction: 'higher',
			value: (build) => motherboard(build)?.max_memory,
			format: (value) => formatNumber(value, ' GB'),
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => motherboard(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const memorySection: CompareSection = {
	id: 'memory',
	label: PART_TYPE_META.memory.label,
	icon: PART_TYPE_META.memory.icon,
	hasPart: (build) => build.parts.memory.length > 0,
	rows: [
		{
			id: 'capacity',
			label: 'Total capacity',
			kind: 'percent',
			direction: 'higher',
			value: (build) =>
				aggregate(memoryKits(build).map((kit) => kit.module_count * kit.module_size)),
			format: (value) => formatNumber(value, ' GB'),
		},
		{
			id: 'ddr',
			label: 'DDR',
			kind: 'none',
			value: (build) => distinct(memoryKits(build).map((kit) => kit.ddr)),
		},
		{
			id: 'speed',
			label: 'Speed (worst kit)',
			kind: 'percent',
			direction: 'higher',
			value: (build) => {
				const kits = memoryKits(build);
				return kits.length ? Math.min(...kits.map((kit) => kit.speed)) : undefined;
			},
			format: (value) => formatNumber(value, ' MT/s'),
		},
		{
			id: 'cas-latency',
			label: 'CAS latency (worst)',
			kind: 'percent',
			direction: 'lower',
			value: (build) => {
				const kits = memoryKits(build);
				return kits.length ? Math.max(...kits.map((kit) => kit.cas_latency)) : undefined;
			},
		},
		{
			id: 'first-word-latency',
			label: 'First word latency (worst)',
			kind: 'percent',
			direction: 'lower',
			value: (build) => {
				const kits = memoryKits(build);
				return kits.length ? Math.max(...kits.map((kit) => kit.first_word_latency)) : undefined;
			},
			format: (value) => formatNumber(value, ' ns'),
		},
		{
			id: 'modules',
			label: 'Total modules',
			kind: 'none',
			value: (build) => aggregate(memoryKits(build).map((kit) => kit.module_count)),
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => aggregate(memoryKits(build).map((kit) => kit.price ?? 0)),
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const storageSection: CompareSection = {
	id: 'storage',
	label: PART_TYPE_META.storage.label,
	icon: PART_TYPE_META.storage.icon,
	hasPart: (build) => build.parts.storage.length > 0,
	rows: [
		{
			id: 'capacity',
			label: 'Total capacity',
			kind: 'percent',
			direction: 'higher',
			value: (build) => aggregate(drives(build).map((drive) => drive.capacity)),
			format: (value) => formatNumber(value, ' GB'),
		},
		{
			id: 'type',
			label: 'Type',
			kind: 'none',
			value: (build) => distinct(drives(build).map((drive) => drive.type)),
		},
		{
			id: 'interface',
			label: 'Interface',
			kind: 'none',
			value: (build) => distinct(drives(build).map((drive) => drive.interface)),
		},
		{
			id: 'form-factor',
			label: 'Form factor',
			kind: 'none',
			value: (build) => distinct(drives(build).map((drive) => drive.form_factor)),
		},
		{
			id: 'drives',
			label: 'Drives',
			kind: 'none',
			value: (build) => (drives(build).length > 0 ? drives(build).length : undefined),
		},
		{
			id: 'cache',
			label: 'Total cache',
			kind: 'percent',
			direction: 'higher',
			value: (build) => aggregate(drives(build).map((drive) => drive.cache ?? 0)),
			format: (value) => formatNumber(value, ' MB'),
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => aggregate(drives(build).map((drive) => drive.price ?? 0)),
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const videoCardSection: CompareSection = {
	id: 'video_card',
	label: PART_TYPE_META.video_card.label,
	icon: PART_TYPE_META.video_card.icon,
	hasPart: (build) => Boolean(build.parts.video_card),
	rows: [
		{
			id: 'vram',
			label: 'VRAM',
			kind: 'percent',
			direction: 'higher',
			value: (build) => videoCard(build)?.memory,
			format: (value) => formatNumber(value, ' GB'),
		},
		{
			id: 'boost-clock',
			label: 'Boost clock',
			kind: 'percent',
			direction: 'higher',
			value: (build) => videoCard(build)?.boost_clock,
			format: (value) => formatNumber(value, ' MHz'),
		},
		{
			id: 'core-clock',
			label: 'Core clock',
			kind: 'percent',
			direction: 'higher',
			value: (build) => videoCard(build)?.core_clock,
			format: (value) => formatNumber(value, ' MHz'),
		},
		{
			id: 'wattage',
			label: 'Wattage',
			kind: 'percent',
			direction: 'lower',
			value: (build) => videoCard(build)?.wattage,
			format: (value) => formatNumber(value, ' W'),
		},
		{
			id: 'length',
			label: 'Length',
			kind: 'percent',
			direction: 'lower',
			value: (build) => videoCard(build)?.length,
			format: (value) => formatNumber(value, ' mm'),
		},
		{
			id: 'pcie',
			label: 'PCIe',
			kind: 'percent',
			direction: 'higher',
			value: (build) => videoCard(build)?.pcie,
			format: (value) => (value === undefined ? '—' : `PCIe ${value}.0`),
		},
		{
			id: 'chipset',
			label: 'Chipset',
			kind: 'none',
			value: (build) => videoCard(build)?.chipset,
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => videoCard(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const caseSection: CompareSection = {
	id: 'case',
	label: PART_TYPE_META.case.label,
	icon: PART_TYPE_META.case.icon,
	hasPart: (build) => Boolean(build.parts.case),
	rows: [
		{
			id: 'max-gpu-length',
			label: 'Max GPU length',
			kind: 'percent',
			direction: 'higher',
			value: (build) => pcCase(build)?.max_gpu_length,
			format: (value) => formatNumber(value, ' mm'),
		},
		{
			id: 'form-factor',
			label: 'Form factor',
			kind: 'none',
			value: (build) => {
				const value = pcCase(build)?.type;
				return value === undefined ? undefined : specLabel('form_factor', value);
			},
		},
		{
			id: '35-bays',
			label: '3.5" bays',
			kind: 'percent',
			direction: 'higher',
			value: (build) => pcCase(build)?.internal_35_bays,
		},
		{
			id: 'volume',
			label: 'Volume',
			kind: 'percent',
			direction: 'lower',
			value: (build) => pcCase(build)?.external_volume,
			format: (value) => formatNumber(value, ' L'),
		},
		{
			id: 'side-panel',
			label: 'Side panel',
			kind: 'none',
			value: (build) => pcCase(build)?.side_panel,
		},
		{
			id: 'bundled-psu',
			label: 'Bundled PSU',
			kind: 'percent',
			direction: 'higher',
			value: (build) => pcCase(build)?.psu,
			format: (value) => formatNumber(value, ' W'),
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => pcCase(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

const powerSupplySection: CompareSection = {
	id: 'psu',
	label: PART_TYPE_META.psu.label,
	icon: PART_TYPE_META.psu.icon,
	hasPart: (build) => Boolean(build.parts.psu),
	rows: [
		{
			id: 'wattage',
			label: 'Wattage',
			kind: 'percent',
			direction: 'higher',
			value: (build) => powerSupply(build)?.wattage,
			format: (value) => formatNumber(value, ' W'),
		},
		{
			id: 'efficiency',
			label: 'Efficiency',
			kind: 'label',
			direction: 'higher',
			value: (build) => {
				const value = powerSupply(build)?.efficiency;
				return value === undefined ? undefined : specLabel('efficiency', value);
			},
			order: (build) => {
				const value = powerSupply(build)?.efficiency;
				return value === undefined ? undefined : useConstantsStore().rank('efficiency', value);
			},
		},
		{
			id: 'modular',
			label: 'Modular',
			kind: 'label',
			direction: 'higher',
			value: (build) => {
				const value = powerSupply(build)?.modular;
				if (value === undefined) return undefined;
				return value === false ? 'No' : value;
			},
			order: (build) => {
				const value = powerSupply(build)?.modular;
				if (value === undefined) return undefined;
				return value === 'Full' ? 2 : value === 'Semi' ? 1 : 0;
			},
		},
		{
			id: 'type',
			label: 'Type',
			kind: 'none',
			value: (build) => powerSupply(build)?.type,
		},
		{
			id: 'price',
			label: 'Price',
			kind: 'percent',
			direction: 'lower',
			value: (build) => powerSupply(build)?.price,
			format: (value) => formatPrice(typeof value === 'number' ? value : undefined),
		},
	],
};

export const COMPARE_SECTIONS: CompareSection[] = [
	totalSection,
	cpuSection,
	coolerSection,
	motherboardSection,
	memorySection,
	storageSection,
	videoCardSection,
	caseSection,
	powerSupplySection,
];

export function formatCompareValue(row: CompareRow, value: CompareValue): string {
	if (value === undefined) return '—';
	if (row.format) return row.format(value);
	if (Array.isArray(value)) return `${value[0]}–${value[1]}`;
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return String(value);
}

export function compareNumeric(row: CompareRow, build: Builds.ResolvedBuild): number | undefined {
	if (row.numeric) return row.numeric(build);
	const value = row.value(build);
	return Array.isArray(value) ? value[1] : typeof value === 'number' ? value : undefined;
}

export type CompareTone = 'success' | 'error' | 'neutral';

export function compareTone(delta: number, direction?: CompareDirection): CompareTone {
	if (!direction || Math.abs(delta) < 0.05) return 'neutral';
	if (direction === 'higher') return delta > 0 ? 'success' : 'error';
	return delta < 0 ? 'success' : 'error';
}

export function formatPercent(delta: number): string {
	if (Math.abs(delta) < 0.05) return '0%';
	return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

/** Builds that actually have the part a section compares. */
export function eligibleBuildsFor(
	section: CompareSection,
	builds: Builds.ResolvedBuild[],
): Builds.ResolvedBuild[] {
	return builds.filter((build) => section.hasPart(build));
}

/**
 * The build every percentage in a section is measured against. A section keeps its own basis, so
 * clicking RAM in one build does not change what CPU values are compared to.
 */
export function baselineForSection(
	section: CompareSection,
	builds: Builds.ResolvedBuild[],
	baselines: Record<string, string>,
): Builds.ResolvedBuild | undefined {
	const eligible = eligibleBuildsFor(section, builds);
	return eligible.find((build) => build.name === baselines[section.id]) ?? eligible[0];
}

/** Signed raw percentage difference against the section basis, or undefined when it has no answer. */
export function percentAgainstBasis(
	row: CompareRow,
	basis: Builds.ResolvedBuild | undefined,
	build: Builds.ResolvedBuild,
): number | undefined {
	if (row.kind !== 'percent' || !basis || basis.name === build.name) return undefined;
	const basisValue = compareNumeric(row, basis);
	const value = compareNumeric(row, build);
	if (basisValue === undefined || value === undefined || basisValue === 0) return undefined;
	return ((value - basisValue) / basisValue) * 100;
}
