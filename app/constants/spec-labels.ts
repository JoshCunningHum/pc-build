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
