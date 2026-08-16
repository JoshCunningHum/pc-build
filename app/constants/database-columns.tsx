import type { Column, RowData } from '@tanstack/vue-table';
import type { TableColumn } from '@nuxt/ui';
import type { Builds } from '~/types/build';
import type { Specs, SpecsByPartType } from '~/types/parts';
import { EFFICIENCY_LABELS, FORM_FACTOR_LABELS } from '~/constants/spec-labels';
import { UIcon } from '#components';

// `HeaderContext` is invariant in `TData`; asking for only these two members makes one
// header helper assignable across every category's columns.
type SortableColumn = Pick<Column<RowData, unknown>, 'getIsSorted' | 'toggleSorting'>;

function sortableHeader(label: string) {
	return ({ column }: { column: SortableColumn }) => {
		const sorted = column.getIsSorted();
		const icon =
			sorted === 'asc'
				? 'i-lucide-arrow-down-a-z'
				: sorted === 'desc'
					? 'i-lucide-arrow-up-a-z'
					: 'i-lucide-arrow-down-up';
		return (
			<button
				class="flex items-center gap-1 font-medium"
				onClick={() => column.toggleSorting(sorted === 'asc')}
			>
				{label}
				<UIcon name={icon} class="size-4" />
			</button>
		);
	};
}

function nameColumn<T extends { name: string }>(): TableColumn<T> {
	return {
		accessorKey: 'name',
		header: sortableHeader('Name'),
		filterFn: 'includesString',
	};
}

function formatMaybeRange(value: number | [number, number] | undefined): string {
	if (value == null) return '—';
	return Array.isArray(value) ? `${value[0]}–${value[1]}` : String(value);
}

function formatSockets(sockets: Specs.CPUSocket[]): string {
	return sockets.length ? sockets.map((s) => s.name).join(', ') : 'Any';
}

const cpuColumns: TableColumn<Specs.CPU>[] = [
	nameColumn(),
	{ accessorKey: 'socket.name', header: sortableHeader('Socket') },
	{ accessorKey: 'core_count', header: sortableHeader('Cores') },
	{ accessorKey: 'core_clock', header: sortableHeader('Base clock (GHz)') },
	{ accessorKey: 'boost_clock', header: sortableHeader('Boost clock (GHz)') },
	{ accessorKey: 'microarchitecture', header: sortableHeader('Microarchitecture') },
	{ accessorKey: 'tdp', header: sortableHeader('TDP (W)') },
	{
		accessorKey: 'graphics',
		header: sortableHeader('Integrated graphics'),
		cell: ({ row }) => row.getValue('graphics') ?? '—',
	},
];

const cpuCoolerColumns: TableColumn<Specs.CPUCooler>[] = [
	nameColumn(),
	{
		accessorKey: 'sockets',
		header: 'Sockets',
		cell: ({ row }) => formatSockets(row.original.sockets),
		enableSorting: false,
	},
	{
		accessorKey: 'rpm',
		header: sortableHeader('RPM'),
		cell: ({ row }) => formatMaybeRange(row.original.rpm),
	},
	{
		accessorKey: 'noise_level',
		header: sortableHeader('Noise (dBA)'),
		cell: ({ row }) => formatMaybeRange(row.original.noise_level),
	},
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
	{
		accessorKey: 'size',
		header: sortableHeader('Radiator size (mm)'),
		cell: ({ row }) => row.getValue('size') ?? '—',
	},
];

const motherboardColumns: TableColumn<Specs.Motherboard>[] = [
	nameColumn(),
	{ accessorKey: 'socket.name', header: sortableHeader('Socket') },
	{
		accessorKey: 'ddr',
		header: sortableHeader('DDR'),
		cell: ({ row }) => row.getValue('ddr') ?? '—',
	},
	{
		accessorKey: 'pcie',
		header: sortableHeader('PCIe'),
		cell: ({ row }) => row.getValue('pcie') ?? '—',
	},
	{
		accessorKey: 'form_factor',
		header: sortableHeader('Form factor'),
		cell: ({ row }) => FORM_FACTOR_LABELS[row.original.form_factor],
	},
	{ accessorKey: 'max_memory', header: sortableHeader('Max memory (GB)') },
	{ accessorKey: 'memory_slots', header: sortableHeader('Memory slots') },
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
];

const memoryColumns: TableColumn<Specs.Memory>[] = [
	nameColumn(),
	{ accessorKey: 'ddr', header: sortableHeader('DDR') },
	{ accessorKey: 'speed', header: sortableHeader('Speed (MT/s)') },
	{ accessorKey: 'module_count', header: sortableHeader('Modules') },
	{ accessorKey: 'module_size', header: sortableHeader('Size per module (GB)') },
	{ accessorKey: 'first_word_latency', header: sortableHeader('First word latency (ns)') },
	{ accessorKey: 'cas_latency', header: sortableHeader('CAS latency') },
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
];

const internalHardDriveColumns: TableColumn<Specs.InternalHardDrive>[] = [
	nameColumn(),
	{ accessorKey: 'capacity', header: sortableHeader('Capacity (GB)') },
	{ accessorKey: 'type', header: sortableHeader('Type') },
	{ accessorKey: 'form_factor', header: sortableHeader('Form factor') },
	{ accessorKey: 'interface', header: sortableHeader('Interface') },
	{
		accessorKey: 'cache',
		header: sortableHeader('Cache (MB)'),
		cell: ({ row }) => row.getValue('cache') ?? '—',
	},
];

const videoCardColumns: TableColumn<Specs.VideoCard>[] = [
	nameColumn(),
	{ accessorKey: 'chipset', header: sortableHeader('Chipset') },
	{ accessorKey: 'memory', header: sortableHeader('Memory (GB)') },
	{
		accessorKey: 'pcie',
		header: sortableHeader('PCIe'),
		cell: ({ row }) => row.getValue('pcie') ?? '—',
	},
	{ accessorKey: 'core_clock', header: sortableHeader('Core clock (MHz)') },
	{ accessorKey: 'boost_clock', header: sortableHeader('Boost clock (MHz)') },
	{
		accessorKey: 'length',
		header: sortableHeader('Length (mm)'),
		cell: ({ row }) => row.getValue('length') ?? '—',
	},
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
];

const caseColumns: TableColumn<Specs.Case>[] = [
	nameColumn(),
	{
		accessorKey: 'type',
		header: sortableHeader('Max form factor'),
		cell: ({ row }) => FORM_FACTOR_LABELS[row.original.type],
	},
	{ accessorKey: 'internal_35_bays', header: sortableHeader('3.5" bays') },
	{
		accessorKey: 'external_volume',
		header: sortableHeader('Volume (L)'),
		cell: ({ row }) => row.getValue('external_volume') ?? '—',
	},
	{
		accessorKey: 'max_gpu_length',
		header: sortableHeader('Max GPU length (mm)'),
		cell: ({ row }) => row.getValue('max_gpu_length') ?? '—',
	},
	{
		accessorKey: 'side_panel',
		header: sortableHeader('Side panel'),
		cell: ({ row }) => row.getValue('side_panel') ?? '—',
	},
	{
		accessorKey: 'psu',
		header: sortableHeader('Bundled PSU (W)'),
		cell: ({ row }) => row.getValue('psu') ?? '—',
	},
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
];

const powerSupplyColumns: TableColumn<Specs.PowerSupply>[] = [
	nameColumn(),
	{ accessorKey: 'type', header: sortableHeader('Type') },
	{ accessorKey: 'wattage', header: sortableHeader('Wattage (W)') },
	{
		accessorKey: 'efficiency',
		header: sortableHeader('Efficiency'),
		cell: ({ row }) => EFFICIENCY_LABELS[row.original.efficiency],
	},
	{
		accessorKey: 'modular',
		header: sortableHeader('Modular'),
		cell: ({ row }) => {
			const value = row.original.modular;
			return value === false ? 'No' : value;
		},
	},
	{
		accessorKey: 'color',
		header: sortableHeader('Color'),
		cell: ({ row }) => row.getValue('color') ?? '—',
	},
];

export const DATABASE_COLUMNS: { [K in Builds.PartType]: TableColumn<SpecsByPartType[K]>[] } = {
	cpu: cpuColumns,
	cooler: cpuCoolerColumns,
	motherboard: motherboardColumns,
	memory: memoryColumns,
	storage: internalHardDriveColumns,
	video_card: videoCardColumns,
	case: caseColumns,
	psu: powerSupplyColumns,
};
