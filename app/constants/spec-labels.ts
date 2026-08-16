import { Specs } from '~/types/parts';

export const FORM_FACTOR_LABELS: Record<Specs.MotherboardFormFactor, string> = {
	[Specs.MotherboardFormFactor.MiniITX]: 'Mini ITX',
	[Specs.MotherboardFormFactor.MicroATX]: 'Micro ATX',
	[Specs.MotherboardFormFactor.ATX]: 'ATX',
	[Specs.MotherboardFormFactor.EATX]: 'EATX',
};

export const EFFICIENCY_LABELS: Record<Specs.PowerSupplyEfficiency, string> = {
	[Specs.PowerSupplyEfficiency.Standard]: 'Standard (80+)',
	[Specs.PowerSupplyEfficiency.Bronze]: 'Bronze',
	[Specs.PowerSupplyEfficiency.Silver]: 'Silver',
	[Specs.PowerSupplyEfficiency.Gold]: 'Gold',
	[Specs.PowerSupplyEfficiency.Platinum]: 'Platinum',
	[Specs.PowerSupplyEfficiency.Titanium]: 'Titanium',
};

function itemsFrom<T extends number>(labels: Record<T, string>): { label: string; value: T }[] {
	return Object.entries(labels).map(([value, label]) => ({
		label: label as string,
		value: Number(value) as T,
	}));
}

export const FORM_FACTOR_ITEMS = itemsFrom(FORM_FACTOR_LABELS);
export const EFFICIENCY_ITEMS = itemsFrom(EFFICIENCY_LABELS);

export const DDR_ITEMS: { label: string; value: Specs.DDRVersion }[] = [
	{ label: 'DDR2', value: 'DDR2' },
	{ label: 'DDR3', value: 'DDR3' },
	{ label: 'DDR4', value: 'DDR4' },
	{ label: 'DDR5', value: 'DDR5' },
];

export const PCIE_ITEMS: { label: string; value: Specs.PCIeVersion }[] = [
	{ label: 'PCIe 2.0', value: 2 },
	{ label: 'PCIe 3.0', value: 3 },
	{ label: 'PCIe 4.0', value: 4 },
	{ label: 'PCIe 5.0', value: 5 },
	{ label: 'PCIe 6.0', value: 6 },
];

export const MODULAR_ITEMS: { label: string; value: string | false }[] = [
	{ label: 'Full', value: 'Full' },
	{ label: 'Semi', value: 'Semi' },
	{ label: 'No', value: false },
];
