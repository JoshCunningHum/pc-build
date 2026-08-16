import type { Builds } from '~/types/build';
import type { SpecsByPartType } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { SPECS_STORES } from '~/constants/parts';
import { Specs } from '~/types/parts';

export interface ConstantEntry {
	label: string;
	/** What actually gets stored on a spec. Equal to `label` for the plain string lists. */
	value: string | number;
}

export type ConstantId =
	| 'form_factor'
	| 'efficiency'
	| 'pcie'
	| 'ddr'
	| 'socket'
	| 'microarchitecture'
	| 'chipset'
	| 'storage_type'
	| 'storage_form_factor'
	| 'storage_interface'
	| 'psu_type'
	| 'side_panel'
	| 'color';

export interface ConstantMeta {
	id: ConstantId;
	title: string;
	description: string;
	orderable: boolean;
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
		description: 'Suggested when setting the socket of a CPU, motherboard or cooler.',
		orderable: false,
	},
	{
		id: 'microarchitecture',
		title: 'CPU microarchitectures',
		description: 'Suggested when setting a CPU microarchitecture.',
		orderable: false,
	},
	{
		id: 'chipset',
		title: 'Video card chipsets',
		description: 'Suggested when setting a video card chipset.',
		orderable: false,
	},
	{
		id: 'storage_type',
		title: 'Storage types',
		description: 'SSD, HDD, and anything else worth recording.',
		orderable: false,
	},
	{
		id: 'storage_form_factor',
		title: 'Storage form factors',
		description: 'M.2, 2.5", and the rest.',
		orderable: false,
	},
	{
		id: 'storage_interface',
		title: 'Storage interfaces',
		description: 'SATA, the NVMe PCIe variants, and so on.',
		orderable: false,
	},
	{
		id: 'psu_type',
		title: 'Power supply types',
		description: 'ATX, SFX, TFX and other chassis standards.',
		orderable: false,
	},
	{
		id: 'side_panel',
		title: 'Case side panels',
		description: 'What a case’s side panel is made of.',
		orderable: false,
	},
	{
		id: 'color',
		title: 'Colors',
		description: 'Shared by every part type that records a color.',
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
	chipset: [],
	storage_type: [],
	storage_form_factor: [],
	storage_interface: [],
	psu_type: [],
	side_panel: [],
	color: [],
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

	function fromCatalog(id: ConstantId): ConstantEntry[] {
		const strings = (): string[] => {
			switch (id) {
				case 'socket':
					return distinctStrings(
						[
							...rowsOf('cpu').map((row) => row.socket.name),
							...rowsOf('motherboard').map((row) => row.socket.name),
							...rowsOf('cooler').flatMap((row) => row.sockets.map((s) => s.name)),
						],
						(value) => value,
					);
				case 'microarchitecture':
					return distinctStrings(rowsOf('cpu'), (row) => row.microarchitecture);
				case 'chipset':
					return distinctStrings(rowsOf('video_card'), (row) => row.chipset);
				case 'storage_type':
					return distinctStrings(rowsOf('storage'), (row) => row.type);
				case 'storage_form_factor':
					return distinctStrings(rowsOf('storage'), (row) => row.form_factor);
				case 'storage_interface':
					return distinctStrings(rowsOf('storage'), (row) => row.interface);
				case 'psu_type':
					return distinctStrings(rowsOf('psu'), (row) => row.type);
				case 'side_panel':
					return distinctStrings(rowsOf('case'), (row) => row.side_panel);
				case 'color':
					return distinctStrings(
						[
							...rowsOf('cooler').map((row) => row.color),
							...rowsOf('motherboard').map((row) => row.color),
							...rowsOf('memory').map((row) => row.color),
							...rowsOf('video_card').map((row) => row.color),
							...rowsOf('case').map((row) => row.color),
							...rowsOf('psu').map((row) => row.color),
						],
						(value) => value,
					);
				default:
					return [];
			}
		};

		switch (id) {
			case 'form_factor':
				return structuredClone(SEEDED_FORM_FACTORS);
			case 'efficiency':
				return structuredClone(SEEDED_EFFICIENCIES);
			case 'pcie':
				return structuredClone(SEEDED_PCIE);
			case 'ddr':
				return structuredClone(SEEDED_DDR);
			default:
				return strings().map((label) => ({ label, value: label }));
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

	function add(id: ConstantId, label: string): boolean {
		const trimmed = label.trim();
		if (trimmed === '') return false;

		const stored = entries.value[id];
		if (stored.some((entry) => entry.label.toLowerCase() === trimmed.toLowerCase())) return false;

		stored.push({ label: trimmed, value: nextValue(id, trimmed) });
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
		rank,
		add,
		remove,
		move,
		reset,
		resetAll,
	};
});
