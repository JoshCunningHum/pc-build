import type { Builds } from '~/types/build';
import * as z from 'zod';
import { Specs } from '~/types/parts';

const name = z.string().trim().min(1, 'Name is required');
const positive = z.number({ error: 'Required' }).positive('Must be greater than 0');
const optionalPositive = positive.optional();
const optionalText = z.string().trim().min(1).optional();

const ddr = z.enum(['DDR2', 'DDR3', 'DDR4', 'DDR5']);
const pcie = z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
const maybeRange = z.union([positive, z.tuple([positive, positive])]);
const socket = z.object({
	name: z.string().trim().min(1, 'Socket is required'),
	brand: optionalText,
});

export const PART_SCHEMAS = {
	cpu: z.object({
		name,
		socket,
		core_count: positive.int(),
		core_clock: positive,
		boost_clock: positive,
		microarchitecture: z.string().trim().min(1, 'Microarchitecture is required'),
		tdp: positive,
		graphics: optionalText,
		smt: z.boolean().optional(),
	}),
	cooler: z.object({
		name,
		sockets: z.array(socket).min(1, 'Pick at least one socket'),
		rpm: maybeRange,
		noise_level: maybeRange,
		color: optionalText,
		size: optionalPositive,
	}),
	motherboard: z.object({
		name,
		socket,
		ddr: ddr.optional(),
		pcie: pcie.optional(),
		form_factor: z.enum(Specs.MotherboardFormFactor),
		max_memory: positive,
		memory_slots: positive.int(),
		color: optionalText,
	}),
	memory: z.object({
		name,
		ddr,
		speed: positive,
		module_count: positive.int(),
		module_size: positive,
		color: optionalText,
		first_word_latency: positive,
		cas_latency: positive,
	}),
	storage: z.object({
		name,
		capacity: positive,
		type: z.string().trim().min(1, 'Type is required'),
		cache: optionalPositive,
		form_factor: z.string().trim().min(1, 'Form factor is required'),
		interface: z.string().trim().min(1, 'Interface is required'),
	}),
	video_card: z.object({
		name,
		chipset: z.string().trim().min(1, 'Chipset is required'),
		memory: positive,
		pcie: pcie.optional(),
		core_clock: positive,
		boost_clock: positive,
		wattage: optionalPositive,
		color: optionalText,
		length: optionalPositive,
	}),
	case: z.object({
		name,
		type: z.enum(Specs.MotherboardFormFactor),
		color: optionalText,
		psu: optionalPositive,
		side_panel: optionalText,
		external_volume: optionalPositive,
		internal_35_bays: z.number({ error: 'Required' }).int().min(0),
		max_gpu_length: optionalPositive,
	}),
	psu: z.object({
		name,
		type: z.string().trim().min(1, 'Type is required'),
		efficiency: z.enum(Specs.PowerSupplyEfficiency),
		wattage: positive,
		modular: z.union([z.string().trim().min(1), z.literal(false)]),
		color: optionalText,
	}),
} satisfies Record<Builds.PartType, z.ZodType>;
