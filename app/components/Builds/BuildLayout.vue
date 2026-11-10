<script setup lang="ts">
import type { Builds } from '~/types/build';
import { specLabel } from '~/constants/spec-labels';

const props = withDefaults(
	defineProps<{
		build: Builds.ResolvedBuild;
		issues?: Builds.BuildIssue[];
		/** List/card variant: bounds only, no labels, no hover or click. */
		mini?: boolean;
	}>(),
	{
		issues: () => [],
		mini: false,
	},
);

const emit = defineEmits<{
	hover: [type: Builds.PartType | undefined];
	activate: [type: Builds.PartType];
}>();

type RegionBox = {
	left: string;
	top: string;
	width: string;
	height: string;
};

/**
 * Percentage bounds for every region inside the case. The diagram is drawn from these, so
 * re-proportioning the machine means changing these numbers, not the markup.
 */
const LAYOUT = {
	caseInset: '0%',
	motherboardInset: '3%',
	cooler: { left: '20%', top: '13%', width: '34%', height: '35%' },
	cpu: { left: '25%', top: '16.5%', width: '24%', height: '24%' },
	video_card: { left: '7.5%', top: '55%', width: '58%', height: '14%' },
	psu: { left: '7.5%', top: '73.5%', width: '34.5%', height: '18%' },
	memory: { left: '69%', top: '9%', width: '16%', height: '43%' },
	storage: { left: '63%', top: '78%', width: '25%', height: '15%' },
} satisfies Record<string, string | RegionBox>;

const cpu = computed(() => props.build.parts.cpu);
const cooler = computed(() => props.build.parts.cooler);
const motherboard = computed(() => props.build.parts.motherboard);
const videoCard = computed(() => props.build.parts.video_card);
const pcCase = computed(() => props.build.parts.case);
const powerSupply = computed(() => props.build.parts.psu);

function missingFor(type: Builds.PartType): Builds.PartRef[] {
	return props.build.missing.filter((ref) => ref.type === type);
}

function filled(type: Builds.PartType): boolean {
	if (type === 'memory') return props.build.parts.memory.length > 0;
	if (type === 'storage') return props.build.parts.storage.length > 0;
	if (type === 'case') return Boolean(pcCase.value);
	if (type === 'motherboard') return Boolean(motherboard.value);
	if (type === 'cpu') return Boolean(cpu.value);
	if (type === 'cooler') return Boolean(cooler.value);
	if (type === 'video_card') return Boolean(videoCard.value);
	return Boolean(powerSupply.value);
}

function issuesFor(type: Builds.PartType): Builds.BuildIssue[] {
	return props.issues.filter((issue) => issue.parts.includes(type));
}

function regionClass(type: Builds.PartType): string {
	const missing = missingFor(type).length > 0;
	const list = issuesFor(type);
	const error = list.some((issue) => issue.severity === 'error');
	const warning = list.some((issue) => issue.severity === 'warning');

	if (missing) return 'border-error/70 border-dashed bg-error/5';
	if (error) return 'border-error/60 bg-elevated/20';
	if (warning) return 'border-amber-500/60 bg-elevated/20';
	if (!filled(type)) return 'border-default border-dashed bg-transparent';
	return 'border-default bg-elevated/20';
}

function shellClass(): string {
	if (missingFor('case').length > 0) return 'border-error/70 border-dashed';
	if (!pcCase.value) return 'border-default border-dashed';
	const list = issuesFor('case');
	if (list.some((issue) => issue.severity === 'error')) return 'border-error/60';
	if (list.length > 0) return 'border-amber-500/60';
	return 'border-default';
}

const ramModules = computed(() => {
	const modules: { key: string; label: string; title: string }[] = [];
	for (const kit of props.build.parts.memory) {
		for (let index = 0; index < kit.module_count; index += 1) {
			modules.push({
				key: `${kit.title}-${index}`,
				label: `${kit.module_size}GB · ${kit.speed}`,
				title: kit.title,
			});
		}
	}
	return modules;
});

const drives = computed(() => props.build.parts.storage);

const cpuMain = computed(() => cpu.value?.socket.name ?? 'CPU');
const cpuSub = computed(() =>
	missingFor('cpu').length > 0 ? 'Missing listing' : (cpu.value?.name ?? 'Select'),
);
const gpuMain = computed(() => videoCard.value?.chipset ?? 'GPU');
const gpuSub = computed(() =>
	missingFor('video_card').length > 0 ? 'Missing listing' : (videoCard.value?.name ?? 'Select'),
);
const psuMain = computed(() =>
	missingFor('psu').length > 0
		? 'PSU'
		: powerSupply.value
			? `${powerSupply.value.wattage} W`
			: 'PSU',
);
const psuSub = computed(() =>
	missingFor('psu').length > 0 ? 'Missing listing' : (powerSupply.value?.name ?? 'Select'),
);
const boardMain = computed(() =>
	motherboard.value ? specLabel('form_factor', motherboard.value.form_factor) : 'Motherboard',
);
const boardSub = computed(() =>
	missingFor('motherboard').length > 0 ? 'Missing listing' : (motherboard.value?.name ?? 'Select'),
);

function linkFor(type: Builds.PartType): string | undefined {
	if (type === 'memory' || type === 'storage') {
		const list = props.build.parts[type];
		return (Array.isArray(list) ? list : []).find((part) => part.link)?.link;
	}
	return props.build.parts[type]?.link;
}

function activate(type: Builds.PartType, event?: MouseEvent): void {
	if (props.mini) return;
	if (event && event.altKey) {
		const url = linkFor(type);
		if (url) {
			event.preventDefault();
			event.stopPropagation();
			window.open(url, '_blank', 'noopener,noreferrer');
			return;
		}
	}
	emit('activate', type);
}

function hover(type: Builds.PartType | undefined): void {
	if (props.mini) return;
	emit('hover', type);
}

function clearHover(): void {
	if (props.mini) return;
	emit('hover', undefined);
}
</script>

<template>
	<div class="relative h-full w-full select-none" @mouseleave="clearHover">
		<!--
			Case: solid outer boundary. It fills the available canvas; the internal regions are
			percentage-based so they keep the sketch's relative layout at any size.
		-->
		<div class="absolute" :style="{ inset: mini ? '0' : LAYOUT.caseInset }">
			<div
				class="absolute inset-0 rounded-xl border-2 transition-colors"
				:class="[shellClass(), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:role="mini ? undefined : 'button'"
				:tabindex="mini ? undefined : 0"
				:aria-label="`Case: ${pcCase?.name ?? 'not selected'}`"
				@mouseenter="hover('case')"
				@focus="hover('case')"
				@click="activate('case', $event)"
				@keydown.enter.self.prevent="activate('case')"
				@keydown.space.self.prevent="activate('case')"
			>
				<span
					v-if="!mini"
					class="absolute -top-2.5 left-4 flex items-center gap-1.5 rounded bg-default px-1.5 text-xs leading-none"
				>
					<span class="font-medium text-highlighted uppercase tracking-wide">Case</span>
					<span class="max-w-48 truncate text-muted">
						{{ missingFor('case').length > 0 ? 'Missing listing' : (pcCase?.name ?? 'Select') }}
					</span>
				</span>
			</div>

			<!-- Motherboard: dashed inner boundary. -->
			<button
				type="button"
				class="absolute rounded-lg border border-dashed transition-colors"
				:style="{ inset: LAYOUT.motherboardInset }"
				:class="[regionClass('motherboard'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`Motherboard: ${motherboard?.name ?? 'not selected'}`"
				@mouseenter="hover('motherboard')"
				@focus="hover('motherboard')"
				@click.stop="activate('motherboard', $event)"
			>
				<span
					v-if="!mini"
					class="absolute -top-2 left-3 rounded bg-default px-1 text-xs text-muted tracking-wide"
				>
					<span class="font-medium text-highlighted uppercase tracking-wide"> Motherboard </span>
					<span class="max-w-48 truncate text-muted">
						{{
							missingFor('motherboard').length > 0
								? 'Missing listing'
								: (motherboard?.name ?? 'Select')
						}}
					</span>
				</span>
				<span
					v-if="!mini && motherboard"
					class="absolute top-2 right-3 max-w-[45%] truncate text-xs text-muted"
				>
					{{ boardMain }} · {{ boardSub }}
				</span>
				<span v-else-if="!mini" class="absolute top-2 right-3 text-xs text-muted/70">
					{{ missingFor('motherboard').length > 0 ? 'Missing' : 'Select' }}
				</span>
			</button>

			<!-- CPU cooler: a dashed ring around the CPU, kept visible so an empty slot can be clicked. -->
			<button
				type="button"
				class="absolute z-10 rounded-lg border-2 border-dashed transition-colors"
				:style="LAYOUT.cooler"
				:class="[regionClass('cooler'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`CPU cooler: ${cooler?.name ?? 'not selected'}`"
				@mouseenter="hover('cooler')"
				@focus="hover('cooler')"
				@click.stop="activate('cooler', $event)"
			>
				<span
					v-if="!mini"
					class="absolute -top-2 left-2 max-w-[70%] truncate rounded bg-default px-1 text-[11px] text-muted uppercase tracking-wide"
				>
					{{
						missingFor('cooler').length > 0
							? 'Cooler · Missing listing'
							: cooler
								? `Cooler · ${cooler.name}`
								: 'Cooler · Select'
					}}
				</span>
			</button>

			<!-- CPU socket, drawn over the cooler ring. -->
			<button
				type="button"
				class="absolute z-20 flex flex-col justify-center items-center rounded-md border p-1 text-center transition-colors"
				:style="LAYOUT.cpu"
				:class="[regionClass('cpu'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`CPU: ${cpu?.name ?? 'not selected'}`"
				@mouseenter="hover('cpu')"
				@focus="hover('cpu')"
				@click.stop="activate('cpu', $event)"
			>
				<template v-if="!mini">
					<span
						class="max-w-full truncate px-0.5 font-medium text-sm text-highlighted leading-tight"
					>
						{{ cpuMain }}
					</span>
					<span class="max-w-full truncate px-0.5 text-xs text-muted leading-tight">
						{{ cpuSub }}
					</span>
				</template>
			</button>

			<!-- GPU. -->
			<button
				type="button"
				class="absolute z-20 flex flex-col justify-center items-center rounded-md border px-2 text-center transition-colors"
				:style="LAYOUT.video_card"
				:class="[regionClass('video_card'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`Video card: ${videoCard?.name ?? 'not selected'}`"
				@mouseenter="hover('video_card')"
				@focus="hover('video_card')"
				@click.stop="activate('video_card', $event)"
			>
				<template v-if="!mini">
					<span class="max-w-full truncate font-medium text-sm text-highlighted leading-tight">
						{{ gpuMain }}
					</span>
					<span class="max-w-full truncate text-xs text-muted leading-tight">
						{{ gpuSub }}
					</span>
				</template>
			</button>

			<!-- Power supply. -->
			<button
				type="button"
				class="absolute z-20 flex flex-col justify-center items-center rounded-md border px-2 text-center transition-colors"
				:style="LAYOUT.psu"
				:class="[regionClass('psu'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`Power supply: ${powerSupply?.name ?? 'not selected'}`"
				@mouseenter="hover('psu')"
				@focus="hover('psu')"
				@click.stop="activate('psu', $event)"
			>
				<template v-if="!mini">
					<span class="max-w-full truncate font-medium text-sm text-highlighted leading-tight">
						{{ psuMain }}
					</span>
					<span class="max-w-full truncate text-xs text-muted leading-tight">
						{{ psuSub }}
					</span>
				</template>
			</button>

			<!-- Memory sticks, one per module. -->
			<button
				type="button"
				class="absolute z-20 flex gap-[2px] rounded-md border p-[3px] transition-colors"
				:style="LAYOUT.memory"
				:class="[regionClass('memory'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`Memory: ${build.parts.memory.length} kit(s)`"
				@mouseenter="hover('memory')"
				@focus="hover('memory')"
				@click.stop="activate('memory', $event)"
			>
				<span
					v-for="mod in ramModules"
					:key="mod.key"
					class="flex flex-1 justify-center items-center bg-elevated/30 border border-default rounded-sm min-w-0 overflow-hidden"
					:title="mini ? undefined : mod.title"
				>
					<span
						v-if="!mini"
						class="overflow-hidden text-[11px] text-muted text-center whitespace-nowrap [writing-mode:vertical-rl]"
					>
						{{ mod.label }}
					</span>
				</span>
				<template v-if="ramModules.length === 0">
					<span
						v-for="index in 2"
						:key="`empty-ram-${index}`"
						class="flex-1 border border-default border-dashed rounded-sm"
					/>
				</template>
				<span
					v-if="missingFor('memory').length > 0 && ramModules.length === 0"
					class="absolute inset-0 flex justify-center items-center text-[11px] text-error"
				>
					Missing listing
				</span>
			</button>

			<!-- Storage bays. -->
			<button
				type="button"
				class="absolute z-20 flex gap-[3px] rounded-md border p-[4px] transition-colors"
				:style="LAYOUT.storage"
				:class="[regionClass('storage'), mini ? '' : 'cursor-pointer hover:border-primary/50']"
				:aria-label="`Storage: ${drives.length} drive(s)`"
				@mouseenter="hover('storage')"
				@focus="hover('storage')"
				@click.stop="activate('storage', $event)"
			>
				<span
					v-for="drive in drives"
					:key="drive.title"
					class="flex flex-1 justify-center items-center bg-elevated/30 border border-default rounded-sm min-w-0 overflow-hidden"
					:title="mini ? undefined : drive.title"
				>
					<span
						v-if="!mini"
						class="overflow-hidden text-[11px] text-muted text-center whitespace-nowrap [writing-mode:vertical-rl]"
					>
						{{ drive.type }} · {{ drive.capacity }}GB
					</span>
				</span>
				<template v-if="drives.length === 0">
					<span
						v-for="index in 3"
						:key="`empty-drive-${index}`"
						class="flex-1 border border-default border-dashed rounded-sm"
					/>
				</template>
				<span
					v-if="missingFor('storage').length > 0 && drives.length === 0"
					class="absolute inset-0 flex justify-center items-center text-[11px] text-error"
				>
					Missing listing
				</span>
			</button>
		</div>
	</div>
</template>
