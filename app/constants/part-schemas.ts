import type { ConstantId } from '~/stores/constants';
import type { Builds } from '~/types/build';
import * as z from 'zod';
import { useConstantsStore } from '~/stores/constants';

const name = z.string().trim().min(1, 'Name is required');
const positive = z.number({ error: 'Required' }).positive('Must be greater than 0');
const optionalPositive = positive.optional();
const optionalText = z.string().trim().min(1).optional();

const image = z
	.string()
	.trim()
	.refine(
		(value) => value.startsWith('data:image/') || z.url().safeParse(value).success,
		'Enter a valid image URL or upload a file',
	)
	.optional();

// Parts.Base: what a listing adds on top of the spec it was copied from. Price and link are
// optional -- a listing missing either is still saved, just flagged as incomplete.
export const PART_BASE_SCHEMA = z.object({
	image,
	title: z.string().trim().min(1, 'Title is required'),
	link: z.string().trim().url('Enter a valid link').optional(),
	price: z.number().nonnegative('Price cannot be negative').optional(),
});

// These five fields are user-configurable on the Settings page, so the schema can't hold a
// literal union -- it checks membership of whatever is currently configured instead.
function configured(id: ConstantId, message: string) {
	return z
		.union([z.string(), z.number()])
		.refine((value) => useConstantsStore().rank(id, value) !== -1, { error: message });
}

const ddr = configured('ddr', 'Pick a configured memory generation');
const pcie = configured('pcie', 'Pick a configured PCIe generation');
const formFactor = configured('form_factor', 'Pick a configured form factor');
const efficiency = configured('efficiency', 'Pick a configured efficiency tier');
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
		form_factor: formFactor,
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
		type: formFactor,
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
		efficiency,
		wattage: positive,
		modular: z.union([z.string().trim().min(1), z.literal(false)]),
		color: optionalText,
	}),
} satisfies Record<Builds.PartType, z.ZodType>;
