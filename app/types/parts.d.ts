export namespace Specs {
	type MaybeRange = number | [number, number];

	export type DDRVersion = 'DDR2' | 'DDR3' | 'DDR4' | 'DDR5';
	export type PCIeVersion = 2 | 3 | 4 | 5 | 6;

	export enum MotherboardFormFactor {
		MiniITX,
		MicroATX,
		ATX,
		EATX,
	}

	export interface CPUSocket {
		name: string;
		brand?: string;
	}

	export interface CPU {
		socket: CPUSocket;
		core_count: number;
		core_clock: number;
		boost_clock: number;
		microarchitecture: string;
		tdp: number;
		graphics?: string;
		smt: boolean;
	}

	export interface CPUCooler {
		sockets: CPUSocket[];
		rpm: number;
		noise_level: MaybeRange;
		color: string;
		size: number;
	}

	export interface Motherboard {
		socket: CPUSocket;
		ddr: DDRVersion;
		pcie: PCIeVersion;
		form_factor: MotherboardFormFactor;
		max_memory: number;
		memory_slots: number;
		color: string;
	}

	export interface Memory {
		ddr: DDRVersion;
		speed: number;
		module_count: number;
		module_size: number;
		price_per_gb: number;
		color: string;
		first_word_latency: number;
		cas_latency: number;
	}

	export interface InternalHardDrive {
		capacity: number;
		price_per_gb: number;
		type: string;
		cache: number;
		form_factor: string;
		interface: string;
	}

	export interface VideoCard {
		chipset: string;
		memory: number;
		pcie: PCIeVersion;
		core_clock: number;
		boost_clock: number;
		wattage?: number;
		color: string;
		length: number;
	}

	export interface Case {
		type: MotherboardFormFactor;
		color: string;
		psu?: number;
		side_panel: string;
		external_volume: number;
		internal_35_bays: number;
		max_gpu_length?: number;
	}

	export interface PowerSupply {
		type: string;
		efficiency: string;
		wattage: number;
		modular: string | false;
		color: string;
	}
}

export namespace Parts {
	export interface Base {
		image?: string;
		name: string;
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
