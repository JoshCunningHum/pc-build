<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { Parts, PartsRow } from '~/types/parts';
import { PART_TYPE_META } from '~/constants/parts';
import { specLabel } from '~/constants/spec-labels';
import { categoryParts } from '~/utils/builds';
import { formatPrice } from '~/utils/format';
import { isPartIncomplete } from '~/utils/parts';

const props = defineProps<{
	type: Builds.PartType;
	build: Builds.ResolvedBuild;
	missing: Builds.PartRef[];
}>();

const meta = computed(() => PART_TYPE_META[props.type]);
const parts = computed(() => categoryParts(props.build, props.type));

function range(value: number | [number, number], unit = ''): string {
	return Array.isArray(value) ? `${value[0]}–${value[1]}${unit}` : `${value}${unit}`;
}

function chips(type: Builds.PartType, part: PartsRow): string[] {
	switch (type) {
		case 'cpu': {
			const cpu = part as Parts.CPU;
			return [
				cpu.socket.name,
				`${cpu.core_count} cores`,
				`${cpu.core_clock}–${cpu.boost_clock} GHz`,
				`${cpu.tdp} W`,
			];
		}
		case 'cooler': {
			const cooler = part as Parts.CPUCooler;
			return [
				cooler.size ? `${cooler.size} mm` : 'Air',
				`${range(cooler.rpm)} RPM`,
				`${range(cooler.noise_level)} dBA`,
				`${cooler.sockets.length} socket${cooler.sockets.length === 1 ? '' : 's'}`,
			];
		}
		case 'motherboard': {
			const board = part as Parts.Motherboard;
			return [
				board.socket.name,
				String(board.ddr ?? '—'),
				board.pcie ? `PCIe ${board.pcie}.0` : 'PCIe —',
				specLabel('form_factor', board.form_factor),
				`${board.memory_slots} slots`,
			];
		}
		case 'memory': {
			const memory = part as Parts.Memory;
			return [
				String(memory.ddr),
				`${memory.module_count}×${memory.module_size} GB`,
				`${memory.speed} MT/s`,
				`CL${memory.cas_latency}`,
			];
		}
		case 'storage': {
			const drive = part as Parts.InternalHardDrive;
			return [`${drive.capacity} GB`, drive.type, drive.form_factor, drive.interface];
		}
		case 'video_card': {
			const gpu = part as Parts.VideoCard;
			return [
				gpu.chipset,
				`${gpu.memory} GB`,
				`${gpu.core_clock}–${gpu.boost_clock} MHz`,
				gpu.wattage ? `${gpu.wattage} W` : 'Power —',
			];
		}
		case 'case': {
			const pcCase = part as Parts.Case;
			return [
				specLabel('form_factor', pcCase.type),
				pcCase.max_gpu_length ? `${pcCase.max_gpu_length} mm GPU` : 'GPU —',
				`${pcCase.internal_35_bays} × 3.5"`,
				pcCase.external_volume ? `${pcCase.external_volume} L` : 'Volume —',
			];
		}
		case 'psu': {
			const psu = part as Parts.PowerSupply;
			return [
				`${psu.wattage} W`,
				specLabel('efficiency', psu.efficiency),
				psu.modular === false ? 'Non-modular' : `${psu.modular} modular`,
				psu.type,
			];
		}
	}
	return [];
}
</script>

<template>
	<div
		class="bg-default/95 border border-default rounded-lg shadow-lg backdrop-blur p-3 w-[20rem] max-w-[calc(100vw-2rem)] max-h-80 overflow-hidden"
	>
		<div class="flex items-center gap-2 mb-2">
			<UIcon :name="meta.icon" class="size-4 text-muted" />
			<span class="font-medium text-highlighted text-sm">{{ meta.label }}</span>
			<span class="ml-auto text-muted text-[10px] uppercase tracking-wide">
				{{ parts.length + missing.length }} selected
			</span>
		</div>

		<div class="flex flex-col gap-2">
			<div
				v-for="part in parts"
				:key="part.title"
				class="bg-elevated/20 p-2 border border-default rounded-md"
			>
				<img
					v-if="part.image"
					:src="part.image"
					:alt="part.title"
					class="mb-2 h-24 w-full rounded-sm border border-default object-cover"
				/>
				<div class="flex justify-between items-start gap-2">
					<div class="min-w-0">
						<div class="flex items-center gap-1">
							<p class="font-medium text-highlighted text-xs truncate">{{ part.title }}</p>
							<UIcon
								v-if="part.link"
								name="i-lucide-external-link"
								class="size-3 shrink-0 text-muted"
							/>
						</div>
						<p class="text-muted text-[10px] truncate">{{ part.name }}</p>
					</div>
					<span class="font-medium text-xs tabular-nums shrink-0">
						{{ formatPrice(part.price) }}
					</span>
				</div>

				<div class="flex flex-wrap gap-1 mt-1.5">
					<span
						v-for="chip in chips(type, part)"
						:key="chip"
						class="bg-elevated px-1.5 py-0.5 rounded text-[10px] text-muted"
					>
						{{ chip }}
					</span>
				</div>

				<div
					v-if="isPartIncomplete(part)"
					class="flex items-center gap-1 mt-1.5 text-warning text-[10px]"
				>
					<UIcon name="i-lucide-circle-alert" class="size-3" />
					Incomplete listing
				</div>
			</div>

			<div
				v-for="ref in missing"
				:key="`missing-${ref.title}`"
				class="bg-error/5 p-2 border border-error/50 border-dashed rounded-md"
			>
				<p class="font-medium text-error text-xs">Missing listing</p>
				<p class="text-muted text-[10px] break-all">{{ ref.title }}</p>
			</div>

			<p v-if="parts.length === 0 && missing.length === 0" class="text-muted text-xs">
				No {{ meta.label.toLowerCase() }} selected. Click the slot to choose one.
			</p>
		</div>

		<p class="mt-2 text-muted text-[10px]">Click the slot to change this part.</p>
		<p v-if="parts.some((part) => part.link)" class="mt-1 text-muted text-[10px]">
			Alt+click a part to open its listing.
		</p>
	</div>
</template>
