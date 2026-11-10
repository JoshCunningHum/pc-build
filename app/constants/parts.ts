import type { Builds } from '~/types/build';
import type { PartsRow, SpecsRow } from '~/types/parts';
import { useCaseStore } from '~/stores/case';
import { useCpuStore } from '~/stores/cpu';
import { useCpuCoolerStore } from '~/stores/cpu-cooler';
import { useInternalHardDriveStore } from '~/stores/internal-hard-drive';
import { useMemoryStore } from '~/stores/memory';
import { useMotherboardStore } from '~/stores/motherboard';
import { useCasePartsStore } from '~/stores/parts/case';
import { useCoolerPartsStore } from '~/stores/parts/cooler';
import { useCpuPartsStore } from '~/stores/parts/cpu';
import { useMemoryPartsStore } from '~/stores/parts/memory';
import { useMotherboardPartsStore } from '~/stores/parts/motherboard';
import { usePsuPartsStore } from '~/stores/parts/psu';
import { useStoragePartsStore } from '~/stores/parts/storage';
import { useVideoCardPartsStore } from '~/stores/parts/video-card';
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

export const PART_TYPE_ORDER = Object.keys(PART_TYPE_META) as Builds.PartType[];

export const PART_TYPE_ROUTES: Record<Builds.PartType, string> = {
	cpu: '/parts/cpu',
	cooler: '/parts/cooler',
	motherboard: '/parts/motherboard',
	memory: '/parts/memory',
	storage: '/parts/storage',
	video_card: '/parts/video-card',
	case: '/parts/case',
	psu: '/parts/psu',
};

// Method shorthand, not property syntax: bivariant parameters are what let each store's
// concretely-typed methods (e.g. `upsert(spec: Specs.CPU)`) satisfy the union-erased signatures.
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

export interface PartsStore {
	list: PartsRow[];
	getByTitle(title: string): PartsRow | undefined;
	add(part: PartsRow): void;
	update(title: string, part: PartsRow): void;
	remove(title: string): void;
}

export const PARTS_STORES: Record<Builds.PartType, () => PartsStore> = {
	cpu: useCpuPartsStore,
	cooler: useCoolerPartsStore,
	motherboard: useMotherboardPartsStore,
	memory: useMemoryPartsStore,
	storage: useStoragePartsStore,
	video_card: useVideoCardPartsStore,
	case: useCasePartsStore,
	psu: usePsuPartsStore,
};
