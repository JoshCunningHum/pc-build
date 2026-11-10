<script setup lang="ts">
import type { Builds } from '~/types/build';
import { formatPrice } from '~/utils/format';
import {
	buildIncompleteCount,
	buildMissingCount,
	buildPartCount,
	buildTotalPrice,
} from '~/utils/builds';

const props = defineProps<{
	build: Builds.ResolvedBuild;
	issues: Builds.BuildIssue[];
	compareSelected: boolean;
}>();

const emit = defineEmits<{
	open: [];
	delete: [];
	'toggle-compare': [];
}>();

type SpecRow = {
	key: string;
	label: string;
	value: string;
	tone?: 'muted' | 'error';
};

const total = computed(() => buildTotalPrice(props.build));
const partCount = computed(() => buildPartCount(props.build));
const missingCount = computed(() => buildMissingCount(props.build));
const incompleteCount = computed(() => buildIncompleteCount(props.build));

const errorCount = computed(
	() => props.issues.filter((issue) => issue.severity === 'error').length,
);
const warningCount = computed(
	() => props.issues.filter((issue) => issue.severity === 'warning').length,
);

const hasProblems = computed(
	() => errorCount.value + warningCount.value + missingCount.value + incompleteCount.value > 0,
);

const problemTone = computed(() =>
	errorCount.value > 0 || missingCount.value > 0
		? 'error'
		: warningCount.value > 0 || incompleteCount.value > 0
			? 'warning'
			: 'ok',
);

const problemSummary = computed(() => {
	const bits: string[] = [];
	if (errorCount.value) bits.push(`${errorCount.value} error${errorCount.value === 1 ? '' : 's'}`);
	if (warningCount.value)
		bits.push(`${warningCount.value} warning${warningCount.value === 1 ? '' : 's'}`);
	if (missingCount.value)
		bits.push(`${missingCount.value} missing listing${missingCount.value === 1 ? '' : 's'}`);
	if (incompleteCount.value)
		bits.push(
			`${incompleteCount.value} incomplete listing${incompleteCount.value === 1 ? '' : 's'}`,
		);
	return bits.join(' · ');
});

const problemTooltip = computed(() => {
	if (!hasProblems.value) return 'No problems or warnings';
	return props.issues.map((issue) => issue.message).join('\n') || problemSummary.value;
});

function hasMissing(type: Builds.PartType): boolean {
	return props.build.missing.some((ref) => ref.type === type);
}

function singleValue(
	type: Builds.PartType,
	part: { name: string } | undefined,
): { value: string; tone?: SpecRow['tone'] } {
	if (hasMissing(type)) return { value: 'Missing listing', tone: 'error' };
	if (!part) return { value: '—', tone: 'muted' };
	return { value: part.name };
}

function memoryValue(): { value: string; tone?: SpecRow['tone'] } {
	const kits = props.build.parts.memory;
	if (kits.length === 0) {
		return hasMissing('memory')
			? { value: 'Missing listing', tone: 'error' }
			: { value: '—', tone: 'muted' };
	}

	const value = kits
		.map((kit) => `${kit.module_count}×${kit.module_size} GB · ${kit.name}`)
		.join(', ');
	return { value, tone: hasMissing('memory') ? 'error' : undefined };
}

function storageValue(): { value: string; tone?: SpecRow['tone'] } {
	const drives = props.build.parts.storage;
	if (drives.length === 0) {
		return hasMissing('storage')
			? { value: 'Missing listing', tone: 'error' }
			: { value: '—', tone: 'muted' };
	}

	const value = drives.map((drive) => `${drive.capacity} GB · ${drive.name}`).join(', ');
	return { value, tone: hasMissing('storage') ? 'error' : undefined };
}

const specRows = computed<SpecRow[]>(() => {
	const parts = props.build.parts;
	return [
		{ key: 'cpu', label: 'CPU', ...singleValue('cpu', parts.cpu) },
		{ key: 'motherboard', label: 'Board', ...singleValue('motherboard', parts.motherboard) },
		{ key: 'memory', label: 'RAM', ...memoryValue() },
		{ key: 'video_card', label: 'GPU', ...singleValue('video_card', parts.video_card) },
		{ key: 'storage', label: 'Storage', ...storageValue() },
		{ key: 'psu', label: 'PSU', ...singleValue('psu', parts.psu) },
		{ key: 'case', label: 'Case', ...singleValue('case', parts.case) },
	];
});

const problemBoxClass = computed(
	() =>
		({
			error: 'border-error/30 bg-error/10',
			warning: 'border-amber-500/30 bg-amber-500/10',
			ok: 'border-default bg-elevated/20',
		})[problemTone.value],
);

const problemTextClass = computed(
	() =>
		({
			error: 'text-error',
			warning: 'text-amber-500',
			ok: 'text-muted',
		})[problemTone.value],
);

const problemIcon = computed(
	() =>
		({
			error: 'i-lucide-circle-alert',
			warning: 'i-lucide-triangle-alert',
			ok: 'i-lucide-circle-check',
		})[problemTone.value],
);
</script>

<template>
	<article
		class="group relative grid gap-4 lg:gap-6 p-4 lg:p-5 border border-default rounded-lg bg-default transition-colors cursor-pointer md:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)_16rem]"
		:class="
			compareSelected ? 'border-primary/60 bg-primary/5' : 'border-default hover:bg-elevated/40'
		"
		role="button"
		tabindex="0"
		:aria-label="`Open ${build.name}`"
		@click="emit('open')"
		@keydown.enter.prevent="emit('open')"
		@keydown.space.prevent="emit('open')"
	>
		<!-- Minified layout: bounds only, matching the editor's diagram. -->
		<div
			class="relative aspect-square w-full max-w-40 self-center justify-self-center p-2 border border-default rounded-xl bg-elevated/20"
		>
			<BuildsBuildLayout :build="build" :issues="issues" mini />
		</div>

		<div class="flex flex-col justify-center min-w-0">
			<div class="flex justify-between items-start gap-3">
				<div class="min-w-0">
					<h3 class="font-semibold text-highlighted text-lg break-all">{{ build.name }}</h3>
					<p class="mt-0.5 text-muted text-xs">
						{{ partCount }} part{{ partCount === 1 ? '' : 's' }}
					</p>
				</div>

				<UButton
					icon="i-lucide-trash-2"
					color="error"
					variant="ghost"
					size="xs"
					class="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
					title="Delete (D)"
					:aria-label="`Delete ${build.name}`"
					@click.stop="emit('delete')"
				/>
			</div>

			<dl
				class="gap-x-3 gap-y-1 grid grid-cols-[4.5rem_minmax(0,1fr)] mt-3 text-sm"
				aria-label="Build parts"
			>
				<template v-for="row in specRows" :key="row.key">
					<dt class="text-muted text-right">{{ row.label }}</dt>
					<dd
						class="min-w-0 font-medium truncate"
						:class="
							row.tone === 'error'
								? 'text-error'
								: row.tone === 'muted'
									? 'text-muted'
									: 'text-highlighted'
						"
						:title="row.value"
					>
						{{ row.value }}
					</dd>
				</template>
			</dl>
		</div>

		<div class="flex flex-col gap-2 justify-center items-stretch md:col-span-2 lg:col-span-1">
			<div class="text-right">
				<p class="font-semibold text-highlighted text-2xl tabular-nums">
					{{ formatPrice(total) }}
				</p>
				<p class="text-muted text-xs">Total price</p>
			</div>

			<div
				class="flex items-center gap-2 p-2.5 border rounded-md"
				:class="problemBoxClass"
				:title="problemTooltip"
			>
				<UIcon :name="problemIcon" class="mt-0.5 size-4 shrink-0" :class="problemTextClass" />
				<div class="min-w-0">
					<p class="font-medium text-sm" :class="problemTextClass">
						{{ hasProblems ? 'Build problems or warnings' : 'No problems or warnings' }}
					</p>
					<p v-if="hasProblems" class="mt-0.5 text-xs" :class="problemTextClass">
						{{ problemSummary }}
					</p>
				</div>
			</div>

			<UButton
				:icon="compareSelected ? 'i-lucide-check-square' : 'i-lucide-git-compare'"
				:color="compareSelected ? 'primary' : 'neutral'"
				:variant="compareSelected ? 'subtle' : 'outline'"
				block
				:aria-pressed="compareSelected"
				:aria-label="
					compareSelected
						? `Remove ${build.name} from comparison`
						: `Add ${build.name} to comparison`
				"
				@click.stop="emit('toggle-compare')"
			>
				{{ compareSelected ? 'Selected' : 'Compare' }}
			</UButton>
		</div>
	</article>
</template>
