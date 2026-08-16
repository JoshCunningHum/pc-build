import type { Builds } from './build';

export namespace Specs {
	type MaybeRange = number | [number, number];

	// Open, not literal unions: the Settings page lets these lists be extended, so a stored
	// value can be anything the user configured. The enums below stay as the named source of
	// the seeded ordinals -- existing rows keep resolving through them.
	export type DDRVersion = string;
	export type PCIeVersion = number;
	export type FormFactor = number;
	export type Efficiency = number;

	export enum MotherboardFormFactor {
		MiniITX,
		MicroATX,
		ATX,
		EATX,
	}

	export enum PowerSupplyEfficiency {
		Standard,
		Bronze,
		Silver,
		Gold,
		Platinum,
		Titanium,
	}

	export interface CPUSocket {
		name: string;
		brand?: string;
	}

	export interface CPU {
		name: string;
		socket: CPUSocket;
		core_count: number;
		core_clock: number;
		boost_clock: number;
		microarchitecture: string;
		tdp: number;
		graphics?: string;
		smt?: boolean;
	}

	export interface CPUCooler {
		name: string;
		sockets: CPUSocket[];
		rpm: MaybeRange;
		noise_level: MaybeRange;
		color?: string;
		size?: number;
	}

	export interface Motherboard {
		name: string;
		socket: CPUSocket;
		ddr?: DDRVersion;
		pcie?: PCIeVersion;
		form_factor: FormFactor;
		max_memory: number;
		memory_slots: number;
		color?: string;
	}

	export interface Memory {
		name: string;
		ddr: DDRVersion;
		speed: number;
		module_count: number;
		module_size: number;
		color?: string;
		first_word_latency: number;
		cas_latency: number;
	}

	export interface InternalHardDrive {
		name: string;
		capacity: number;
		type: string;
		cache?: number;
		form_factor: string;
		interface: string;
	}

	export interface VideoCard {
		name: string;
		chipset: string;
		memory: number;
		pcie?: PCIeVersion;
		core_clock: number;
		boost_clock: number;
		wattage?: number;
		color?: string;
		length?: number;
	}

	export interface Case {
		name: string;
		type: FormFactor;
		color?: string;
		psu?: number;
		side_panel?: string;
		external_volume?: number;
		internal_35_bays: number;
		max_gpu_length?: number;
	}

	export interface PowerSupply {
		name: string;
		type: string;
		efficiency: Efficiency;
		wattage: number;
		modular: string | false;
		color?: string;
	}
}

export namespace Parts {
	export interface Base {
		image?: string;
		title: string;
		link: string;
		price: number;
	}

	export type CPU = Specs.CPU & Base;
	export type CPUCooler = Specs.CPUCooler & Base;
	export type Motherboard = Specs.Motherboard & Base;
	export type Memory = Specs.Memory & Base;
	export type InternalHardDrive = Specs.InternalHardDrive & Base;
	export type VideoCard = Specs.VideoCard & Base;
	export type Case = Specs.Case & Base;
	export type PowerSupply = Specs.PowerSupply & Base;
}

export interface SpecsByPartType {
	cpu: Specs.CPU;
	cooler: Specs.CPUCooler;
	motherboard: Specs.Motherboard;
	memory: Specs.Memory;
	storage: Specs.InternalHardDrive;
	video_card: Specs.VideoCard;
	case: Specs.Case;
	psu: Specs.PowerSupply;
}

export type SpecsRow = SpecsByPartType[Builds.PartType];
