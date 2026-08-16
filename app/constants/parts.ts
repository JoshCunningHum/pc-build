import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { useCaseStore } from '~/stores/case';
import { useCpuStore } from '~/stores/cpu';
import { useCpuCoolerStore } from '~/stores/cpu-cooler';
import { useInternalHardDriveStore } from '~/stores/internal-hard-drive';
import { useMemoryStore } from '~/stores/memory';
import { useMotherboardStore } from '~/stores/motherboard';
import { usePowerSupplyStore } from '~/stores/power-supply';
import { useVideoCardStore } from '~/stores/video-card';

export const PART_TYPE_META: Record<Builds.PartType, { label: string; icon: string }> = {
	cpu: { label: 'CPU', icon: 'lucide:cpu' },
	cooler: { label: 'CPU Cooler', icon: 'lucide:fan' },
	motherboard: { label: 'Motherboard', icon: 'lucide:circuit-board' },
	memory: { label: 'Memory', icon: 'lucide:memory-stick' },
	storage: { label: 'Storage', icon: 'lucide:hard-drive' },
	video_card: { label: 'Video Card', icon: 'lucide:gpu' },
	case: { label: 'Case', icon: 'lucide:pc-case' },
	psu: { label: 'Power Supply', icon: 'lucide:plug-zap' },
};

// Method shorthand, not property syntax: bivariant parameters are what let each store's
// concretely-typed `upsert(spec: Specs.CPU)` satisfy the union-erased signature here.
export interface SpecsStore {
	list: SpecsRow[];
	loading: boolean;
	error: unknown;
	deletedSeedNames: string[];
	getByName(name: string): SpecsRow | undefined;
	restore(name: string): void;
	isOverridden(name: string): boolean;
	upsert(spec: SpecsRow): void;
	remove(name: string): void;
	rename(oldName: string, spec: SpecsRow): void;
}

export const SPECS_STORES: Record<Builds.PartType, () => SpecsStore> = {
	cpu: useCpuStore,
	cooler: useCpuCoolerStore,
	motherboard: useMotherboardStore,
	memory: useMemoryStore,
	storage: useInternalHardDriveStore,
	video_card: useVideoCardStore,
	case: useCaseStore,
	psu: usePowerSupplyStore,
};
