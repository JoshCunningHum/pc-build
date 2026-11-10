<script setup lang="ts">
import type { Builds } from '~/types/build';
import { COMPARE_SECTIONS } from '~/constants/build-comparison';
import { resolveBuild } from '~/utils/builds';

const props = withDefaults(
	defineProps<{
		buildNames: string[];
		title?: string;
		showBack?: boolean;
		backLabel?: string;
		lockedNames?: string[];
		/** Right-rail use inside a build tab: no page header, just the matrix. */
		embedded?: boolean;
		baselines?: Record<string, string>;
	}>(),
	{
		title: 'Compare builds',
		showBack: false,
		backLabel: 'Back to build',
		lockedNames: () => [],
		embedded: false,
		baselines: () => ({}),
	},
);

const emit = defineEmits<{
	'update:buildNames': [names: string[]];
	'update:baselines': [value: Record<string, string>];
	back: [];
}>();

const buildsStore = useBuildsStore();

const selectedNames = ref<string[]>([...props.buildNames]);

// The table is controlled from the build tab so its tooltip and right rail share one basis.
// Standalone comparison tabs have no parent binding, so keep a local copy for them.
const localBaselines = ref<Record<string, string>>({ ...props.baselines });

watch(
	() => props.baselines,
	(value) => {
		localBaselines.value = { ...value };
	},
	{ deep: true },
);

function setBaselines(value: Record<string, string>): void {
	localBaselines.value = { ...value };
	emit('update:baselines', value);
}

watch(
	() => props.buildNames,
	(names) => {
		selectedNames.value = [...names];
	},
	{ deep: true },
);

const builds = computed<Builds.ResolvedBuild[]>(() =>
	selectedNames.value
		.map((name) => buildsStore.getByName(name))
		.filter((build): build is Builds.Build => Boolean(build))
		.map((build) => resolveBuild(build)),
);

const sections = computed(() =>
	COMPARE_SECTIONS.filter((section) => builds.value.some((build) => section.hasPart(build))),
);

function setSelection(names: string[]): void {
	const locked = props.lockedNames;
	const next = [...new Set([...locked, ...names])];
	selectedNames.value = next;
	emit('update:buildNames', next);
}
</script>

<template>
	<div class="flex flex-col h-full min-h-0">
		<div
			v-if="!embedded"
			class="flex flex-wrap justify-between items-start gap-3 p-4 border-default border-b"
		>
			<div class="flex items-center gap-2 min-w-0">
				<UButton
					v-if="showBack"
					icon="i-lucide-arrow-left"
					:label="backLabel"
					color="neutral"
					variant="ghost"
					size="sm"
					@click="emit('back')"
				/>
				<div class="min-w-0">
					<h1 class="font-semibold text-highlighted text-lg">{{ title }}</h1>
					<p class="text-muted text-sm">
						{{ builds.length }} build{{ builds.length === 1 ? '' : 's' }} · click a value to use
						that build as its section's basis
					</p>
				</div>
			</div>

			<BuildsComparePicker
				:model-value="selectedNames"
				:locked="lockedNames"
				button-label="Builds"
				button-icon="i-lucide-list-filter"
				@update:model-value="setSelection"
			/>
		</div>

		<div
			v-if="builds.length < 2"
			class="flex flex-col flex-1 justify-center items-center gap-3 p-6 text-center"
		>
			<UIcon name="i-lucide-git-compare" class="size-10 text-muted" />
			<div>
				<p class="font-medium text-highlighted">Select at least two builds to compare</p>
				<p class="mt-1 text-muted text-sm">
					Use the build picker to add another build to this comparison.
				</p>
			</div>
		</div>

		<div v-else class="flex-1 min-h-0 overflow-auto">
			<BuildsCompareTable
				:builds="builds"
				:sections="sections"
				:baselines="localBaselines"
				compact
				@update:baselines="setBaselines"
			/>
		</div>
	</div>
</template>
