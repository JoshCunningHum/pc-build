import type { Builds } from '~/types/build';
import type { SpecsByPartType } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { SPECS_STORES } from '~/constants/parts';
import { Specs } from '~/types/parts';

export interface ConstantEntry {
	label: string;
	/** What actually gets stored on a spec. Equal to `label` for the plain string lists. */
	value: string | number;
	/** Sockets only -- the manufacturer shown beside the name. */
	brand?: string;
}

// Only the values the build validator and the comparator reason about. Open-ended descriptive
// fields (chipset, colors, storage type/interface/form factor, side panels) are deliberately
// absent -- their inputs suggest from the catalog instead of from a curated list.
export type ConstantId =
	| 'form_factor'
	| 'efficiency'
	| 'pcie'
	| 'ddr'
	| 'socket'
	| 'microarchitecture'
	| 'psu_type';

export interface ConstantMeta {
	id: ConstantId;
	title: string;
	description: string;
	orderable: boolean;
	/** Renders a second input in the add row, and shows the value beside each entry. */
	secondary?: { label: string; placeholder: string };
}

export const CONSTANT_META: ConstantMeta[] = [
	{
		id: 'form_factor',
		title: 'Motherboard form factors',
		description:
			'Smallest to largest — the order decides which boards are considered to fit which cases.',
		orderable: true,
	},
	{
		id: 'efficiency',
		title: 'Power supply efficiency tiers',
		description: 'Lowest to highest — the order defines which tier counts as better.',
		orderable: true,
	},
	{
		id: 'pcie',
		title: 'PCIe generations',
		description: 'Offered for motherboards and video cards.',
		orderable: true,
	},
	{
		id: 'ddr',
		title: 'Memory generations',
		description: 'Offered when setting the DDR generation of a board or a memory kit.',
		orderable: true,
	},
	{
		id: 'socket',
		title: 'CPU sockets',
		description:
			'Matched between CPU, motherboard and cooler when validating a build. The brand is carried onto any spec that picks the socket.',
		orderable: false,
		secondary: { label: 'Brand', placeholder: 'Brand' },
	},
	{
		id: 'microarchitecture',
		title: 'CPU microarchitectures',
		description: 'Suggested when setting a CPU microarchitecture.',
		orderable: false,
	},
	{
		id: 'psu_type',
		title: 'Power supply types',
		description: 'ATX, SFX, TFX and other chassis standards.',
		orderable: false,
	},
];

const EMPTY: Record<ConstantId, ConstantEntry[]> = {
	form_factor: [],
	efficiency: [],
	pcie: [],
	ddr: [],
	socket: [],
	microarchitecture: [],
	psu_type: [],
};

// Seeded entries keep the ordinals already written into every spec row, so widening these
// lists never invalidates stored data.
const SEEDED_FORM_FACTORS: ConstantEntry[] = [
	{ label: 'Mini ITX', value: Specs.MotherboardFormFactor.MiniITX },
	{ label: 'Micro ATX', value: Specs.MotherboardFormFactor.MicroATX },
	{ label: 'ATX', value: Specs.MotherboardFormFactor.ATX },
	{ label: 'EATX', value: Specs.MotherboardFormFactor.EATX },
];

const SEEDED_EFFICIENCIES: ConstantEntry[] = [
	{ label: 'Standard (80+)', value: Specs.PowerSupplyEfficiency.Standard },
	{ label: 'Bronze', value: Specs.PowerSupplyEfficiency.Bronze },
	{ label: 'Silver', value: Specs.PowerSupplyEfficiency.Silver },
	{ label: 'Gold', value: Specs.PowerSupplyEfficiency.Gold },
	{ label: 'Platinum', value: Specs.PowerSupplyEfficiency.Platinum },
	{ label: 'Titanium', value: Specs.PowerSupplyEfficiency.Titanium },
];

const SEEDED_PCIE: ConstantEntry[] = [2, 3, 4, 5, 6].map((value) => ({
	label: `PCIe ${value}.0`,
	value,
}));

const SEEDED_DDR: ConstantEntry[] = ['DDR2', 'DDR3', 'DDR4', 'DDR5'].map((label) => ({
	label,
	value: label,
}));

function rowsOf<K extends Builds.PartType>(part: K): SpecsByPartType[K][] {
	return SPECS_STORES[part]().list as SpecsByPartType[K][];
}

export const useConstantsStore = defineStore('constants', () => {
	const entries = useLocalStorage<Record<ConstantId, ConstantEntry[]>>(
		'pc-build:constants',
		structuredClone(EMPTY),
		{ mergeDefaults: true },
	);

	const seeded = ref(false);

	function socketsFromCatalog(): ConstantEntry[] {
		const byName = new Map<string, string | undefined>();
		const seen = [
			...rowsOf('cpu').map((row) => row.socket),
			...rowsOf('motherboard').map((row) => row.socket),
			...rowsOf('cooler').flatMap((row) => row.sockets),
		];

		// First brand seen wins -- the seed data is consistent, but a later blank shouldn't
		// erase a brand an earlier row supplied.
		for (const socket of seen) {
			if (!byName.has(socket.name) || (byName.get(socket.name) === undefined && socket.brand))
				byName.set(socket.name, socket.brand);
		}

		return [...byName.entries()]
			.map(([name, brand]) => ({ label: name, value: name, brand }))
			.toSorted((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
	}

	function fromCatalog(id: ConstantId): ConstantEntry[] {
		switch (id) {
			case 'form_factor':
				return structuredClone(SEEDED_FORM_FACTORS);
			case 'efficiency':
				return structuredClone(SEEDED_EFFICIENCIES);
			case 'pcie':
				return structuredClone(SEEDED_PCIE);
			case 'ddr':
				return structuredClone(SEEDED_DDR);
			case 'socket':
				return socketsFromCatalog();
			case 'microarchitecture':
				return distinctStrings(rowsOf('cpu'), (row) => row.microarchitecture).map((label) => ({
					label,
					value: label,
				}));
			case 'psu_type':
				return distinctStrings(rowsOf('psu'), (row) => row.type).map((label) => ({
					label,
					value: label,
				}));
		}
	}

	function seedFromCatalog(force = false): void {
		for (const meta of CONSTANT_META) {
			if (force || entries.value[meta.id].length === 0)
				entries.value[meta.id] = fromCatalog(meta.id);
		}
		seeded.value = true;
	}

	// The catalog loads per-category and asynchronously, so the snapshot can only be taken once
	// every store has settled -- before that `fromCatalog` would read empty lists and persist
	// them as if the user had emptied them.
	const catalogReady = computed(() =>
		(Object.keys(SPECS_STORES) as Builds.PartType[]).every((part) => !SPECS_STORES[part]().loading),
	);

	function seedWhenLoaded(): void {
		if (seeded.value) return;
		if (catalogReady.value) seedFromCatalog();
		else watchOnce(catalogReady, () => seedFromCatalog());
	}

	function list(id: ConstantId): ConstantEntry[] {
		const stored = entries.value[id];
		const meta = CONSTANT_META.find((entry) => entry.id === id);
		if (meta?.orderable) return stored;
		return [...stored].toSorted((a, b) =>
			a.label.localeCompare(b.label, undefined, { numeric: true }),
		);
	}

	function labels(id: ConstantId): string[] {
		return list(id).map((entry) => entry.label);
	}

	function labelOf(id: ConstantId, value: string | number | undefined): string | undefined {
		return entries.value[id].find((entry) => entry.value === value)?.label;
	}

	/** Position in the configured order — what the compatibility rules compare. */
	function rank(id: ConstantId, value: string | number | undefined): number {
		return entries.value[id].findIndex((entry) => entry.value === value);
	}

	function add(id: ConstantId, label: string, brand?: string): boolean {
		const trimmed = label.trim();
		if (trimmed === '') return false;

		const stored = entries.value[id];
		if (stored.some((entry) => entry.label.toLowerCase() === trimmed.toLowerCase())) return false;

		const trimmedBrand = brand?.trim();
		stored.push({
			label: trimmed,
			value: nextValue(id, trimmed),
			...(trimmedBrand ? { brand: trimmedBrand } : {}),
		});
		return true;
	}

	function brandOf(id: ConstantId, value: string | number | undefined): string | undefined {
		return entries.value[id].find((entry) => entry.value === value)?.brand;
	}

	function update(id: ConstantId, value: string | number, label: string, brand?: string): boolean {
		const trimmed = label.trim();
		if (trimmed === '') return false;

		const stored = entries.value[id];
		const index = stored.findIndex((entry) => entry.value === value);
		const current = stored[index];
		if (!current) return false;

		const clashes = stored.some(
			(entry, at) => at !== index && entry.label.toLowerCase() === trimmed.toLowerCase(),
		);
		if (clashes) return false;

		// Label-keyed lists (sockets, microarchitectures, PSU types) store the label itself, so
		// renaming has to carry the value along. Ranked lists key on a fixed ordinal that specs
		// already reference -- there the label is display-only and the value must not move.
		const keyedByLabel = current.value === current.label;
		const trimmedBrand = brand?.trim();

		stored[index] = {
			label: trimmed,
			value: keyedByLabel ? trimmed : current.value,
			...(trimmedBrand ? { brand: trimmedBrand } : {}),
		};
		return true;
	}

	function nextValue(id: ConstantId, label: string): string | number {
		if (id === 'ddr' || !CONSTANT_META.find((entry) => entry.id === id)?.orderable) return label;

		// pcie stores the generation number itself, so honour a numeric label when there is one.
		const parsed = Number(label.replace(/[^\d.]/g, ''));
		if (id === 'pcie' && !Number.isNaN(parsed) && parsed > 0) return parsed;

		const highest = entries.value[id].reduce(
			(max, entry) => (typeof entry.value === 'number' ? Math.max(max, entry.value) : max),
			-1,
		);
		return highest + 1;
	}

	function remove(id: ConstantId, value: string | number): void {
		entries.value[id] = entries.value[id].filter((entry) => entry.value !== value);
	}

	function move(id: ConstantId, value: string | number, delta: number): void {
		const stored = entries.value[id];
		const from = stored.findIndex((entry) => entry.value === value);
		const to = from + delta;
		if (from === -1 || to < 0 || to >= stored.length) return;
		const [moved] = stored.splice(from, 1);
		if (moved) stored.splice(to, 0, moved);
	}

	function reset(id: ConstantId): void {
		entries.value[id] = fromCatalog(id);
	}

	function resetAll(): void {
		seedFromCatalog(true);
	}

	return {
		entries,
		seeded,
		catalogReady,
		seedWhenLoaded,
		list,
		labels,
		labelOf,
		brandOf,
		rank,
		add,
		update,
		remove,
		move,
		reset,
		resetAll,
	};
});
