<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { PartsRow } from '~/types/parts';
import { PARTS_STORES } from '~/constants/parts';
import { baselineForSection, COMPARE_SECTIONS } from '~/constants/build-comparison';
import { validateBuild } from '~/lib/rules';
import { deepClone } from '~/utils/clone';
import { resolveBuild } from '~/utils/builds';

const props = defineProps<{
	tabId: string;
	buildName?: string;
}>();

const emit = defineEmits<{
	saved: [{ created: boolean; previousName?: string; name: string }];
	'dirty-change': [{ tabId: string; dirty: boolean }];
}>();

const MULTI_PART_TYPES = new Set<Builds.PartType>(['memory', 'storage']);

const buildsStore = useBuildsStore();

function emptyBuild(): Builds.Build {
	return { name: '', parts: { memory: [], storage: [] } };
}

function normalise(build: Builds.Build): Builds.Build {
	const clone = deepClone(build);
	clone.name = (clone.name ?? '').trim();
	const parts = clone.parts;

	const memory = (parts.memory ?? [])
		.filter((ref) => ref.title.trim())
		.map((ref) => ({ type: 'memory' as const, title: ref.title.trim() }))
		.toSorted((a, b) => a.title.localeCompare(b.title));
	const storage = (parts.storage ?? [])
		.filter((ref) => ref.title.trim())
		.map((ref) => ({ type: 'storage' as const, title: ref.title.trim() }))
		.toSorted((a, b) => a.title.localeCompare(b.title));
	parts.memory = memory;
	parts.storage = storage;

	for (const type of ['cpu', 'cooler', 'motherboard', 'video_card', 'case', 'psu'] as const) {
		const ref = parts[type];
		if (!ref) continue;
		const title = ref.title.trim();
		if (!title) parts[type] = undefined;
		else ref.title = title;
	}

	return clone;
}

function buildJson(build: Builds.Build): string {
	return JSON.stringify(normalise(build));
}

const existing = computed(() =>
	props.buildName ? buildsStore.getByName(props.buildName) : undefined,
);

const draft = ref<Builds.Build>(existing.value ? deepClone(existing.value) : emptyBuild());
const original = ref(buildJson(draft.value));
const nameAttempted = ref(false);

const dirty = computed(() => buildJson(draft.value) !== original.value);

const resolved = computed(() => resolveBuild(draft.value));
const issues = computed(() =>
	validateBuild({ name: draft.value.name, parts: resolved.value.parts }),
);

const nameConflict = computed(() => {
	const name = draft.value.name.trim();
	if (!name) return undefined;
	const match = buildsStore.getByName(name);
	if (!match) return undefined;
	if (props.buildName && match.name === props.buildName) return undefined;
	return `A build named “${name}” already exists.`;
});

const nameError = computed(() => {
	if (nameConflict.value) return nameConflict.value;
	if (!draft.value.name.trim() && nameAttempted.value) return 'Give the build a name.';
	return undefined;
});

const canSave = computed(() => dirty.value && !!draft.value.name.trim() && !nameConflict.value);

watch(dirty, (value) => emit('dirty-change', { tabId: props.tabId, dirty: value }), {
	immediate: true,
});

// Parts renames update the stored build. Keep a clean editor in sync so an open build follows
// the new listing title instead of suddenly showing the old one as missing.
watch(
	() => (props.buildName ? buildsStore.getByName(props.buildName) : undefined),
	(stored) => {
		if (!stored || dirty.value) return;
		draft.value = deepClone(stored);
		original.value = buildJson(stored);
	},
	{ deep: true },
);

// The create tab becomes a build tab after Save, and a rename changes the reference the tab
// points at. Keep the comparison selection anchored to the current name either way.
watch(
	() => props.buildName,
	(name, previous) => {
		if (!name) return;
		const rest = compareNames.value.filter((item) => item !== name && item !== previous);
		compareNames.value = [name, ...rest];
	},
);

const pickerType = ref<Builds.PartType>();
const pickerOpen = ref(false);

function openPicker(type: Builds.PartType): void {
	pickerType.value = type;
	pickerOpen.value = true;
}

function refsFor(type: Builds.PartType): Builds.PartRef[] {
	const value = draft.value.parts[type] as Builds.PartRef | Builds.PartRef[] | undefined;
	if (Array.isArray(value)) return value;
	return value ? [value] : [];
}

function selectedTitles(type: Builds.PartType): string[] {
	return refsFor(type).map((ref) => ref.title);
}

const pickerSelectedTitles = computed(() =>
	pickerType.value ? selectedTitles(pickerType.value) : [],
);
const pickerMultiple = computed(() =>
	pickerType.value ? MULTI_PART_TYPES.has(pickerType.value) : false,
);

type MutableParts = Record<string, Builds.PartRef | Builds.PartRef[] | undefined>;

function setSingle(type: Builds.PartType, ref: Builds.PartRef | undefined): void {
	(draft.value.parts as unknown as MutableParts)[type] = ref;
}

function applySelection(titles: string[]): void {
	const type = pickerType.value;
	if (!type) return;

	if (type === 'memory') {
		draft.value.parts.memory = titles.map((title) => ({ type: 'memory', title }));
		return;
	}
	if (type === 'storage') {
		draft.value.parts.storage = titles.map((title) => ({ type: 'storage', title }));
		return;
	}

	setSingle(type, titles[0] ? { type, title: titles[0] } : undefined);
}

function openEditPart(type: Builds.PartType, title: string): void {
	const part = PARTS_STORES[type]().getByTitle(title);
	if (!part) return;
	editingPart.value = { type, part };
}

function hoveredPartTarget(): { type: Builds.PartType; title: string } | null {
	if (hoveredSidebarPart.value) return hoveredSidebarPart.value;
	const type = hoveredType.value;
	if (!type) return null;
	if (type === 'memory' || type === 'storage') {
		const parts = resolved.value.parts[type];
		if (parts.length !== 1) return null;
		return { type, title: parts[0].title };
	}
	const part = resolved.value.parts[type];
	return part ? { type, title: part.title } : null;
}

defineShortcuts({
	e: () => {
		if (comparing.value || pickerOpen.value || editingPart.value) return;
		const target = hoveredPartTarget();
		if (!target) return;
		openEditPart(target.type, target.title);
	},
	d: () => {
		if (comparing.value || pickerOpen.value || editingPart.value) return;
		const target = hoveredPartTarget();
		if (!target) return;
		removeRef(target.type, target.title);
	},
});

function removeRef(type: Builds.PartType, title: string): void {
	if (type === 'memory') {
		draft.value.parts.memory = draft.value.parts.memory.filter((ref) => ref.title !== title);
		return;
	}
	if (type === 'storage') {
		draft.value.parts.storage = draft.value.parts.storage.filter((ref) => ref.title !== title);
		return;
	}
	setSingle(type, undefined);
}

const comparing = ref(false);
const compareNames = ref<string[]>(props.buildName ? [props.buildName] : []);
const baselines = ref<Record<string, string>>({});
const hoveredType = ref<Builds.PartType>();
const hoveredSidebarPart = ref<{ type: Builds.PartType; title: string } | null>(null);
const editingPart = ref<{ type: Builds.PartType; part: PartsRow }>();
const layoutHost = ref<HTMLElement>();
const pointer = reactive({ x: 0, y: 0 });

const TOOLTIP_WIDTH = 360;
// Part details are shorter than a comparison section, which lists a value row plus a percentage
// sub-row per field, and the comparison tooltip adds a keyboard hint footer.
const tooltipHeight = computed(() => (comparing.value ? 500 : 340));

const tooltipStyle = computed(() => {
	const width = layoutHost.value?.clientWidth ?? 0;
	const height = layoutHost.value?.clientHeight ?? 0;
	const left = Math.min(pointer.x + 18, Math.max(8, width - TOOLTIP_WIDTH - 8));
	const top = Math.min(pointer.y + 18, Math.max(8, height - tooltipHeight.value));
	return { left: `${left}px`, top: `${top}px` };
});

const compareBuilds = computed<Builds.ResolvedBuild[]>(() =>
	compareNames.value
		.map((name) => buildsStore.getByName(name))
		.filter((build): build is Builds.Build => Boolean(build))
		.map((build) => resolveBuild(build)),
);

// Tab cycles the hovered part's basis through the builds that actually have that part. The
// shortcut is disabled unless a comparison tooltip is on screen, so it never swallows Tab for
// regular focus navigation.
const hoveredSection = computed(() =>
	hoveredType.value
		? COMPARE_SECTIONS.find((section) => section.id === hoveredType.value)
		: undefined,
);

const basisCandidates = computed(() =>
	hoveredSection.value
		? compareBuilds.value.filter((build) => hoveredSection.value!.hasPart(build))
		: [],
);

function cycleBasis(direction: 1 | -1): void {
	const section = hoveredSection.value;
	const candidates = basisCandidates.value;
	if (!comparing.value || !section || candidates.length < 2) return;

	const current = baselineForSection(section, compareBuilds.value, baselines.value);
	const index = current ? candidates.findIndex((build) => build.name === current.name) : -1;
	const next = candidates[(index + direction + candidates.length) % candidates.length];
	if (!next) return;
	baselines.value = { ...baselines.value, [section.id]: next.name };
}

defineShortcuts(
	computed(() => {
		const enabled = comparing.value && basisCandidates.value.length > 1;
		return {
			tab: enabled ? () => cycleBasis(1) : false,
			shift_tab: enabled ? () => cycleBasis(-1) : false,
		};
	}),
);

function setCompareNames(names: string[]): void {
	const locked = props.buildName ? [props.buildName] : [];
	compareNames.value = [...new Set([...locked, ...names])];
}

function startCompare(): void {
	if (compareNames.value.length < 2) return;
	comparing.value = true;
}

function onPointerMove(event: PointerEvent): void {
	const rect = layoutHost.value?.getBoundingClientRect();
	if (!rect) return;
	pointer.x = event.clientX - rect.left;
	pointer.y = event.clientY - rect.top;
}

function missingFor(type: Builds.PartType): Builds.PartRef[] {
	return resolved.value.missing.filter((ref) => ref.type === type);
}

function activatePart(type: Builds.PartType): void {
	if (comparing.value) return;
	openPicker(type);
}

function save(): void {
	nameAttempted.value = true;
	const name = draft.value.name.trim();
	if (!name || nameConflict.value) return;

	const saved = normalise({ name, parts: draft.value.parts });
	if (props.buildName) buildsStore.update(props.buildName, deepClone(saved));
	else buildsStore.add(deepClone(saved));

	draft.value = deepClone(saved);
	original.value = buildJson(saved);
	emit('saved', {
		created: !props.buildName,
		previousName: props.buildName,
		name,
	});
}
</script>

<template>
	<div class="flex flex-col h-full min-h-0">
		<header class="flex flex-wrap justify-between items-start gap-3 p-4 border-default border-b">
			<div class="flex-1 min-w-48">
				<template v-if="!comparing">
					<div class="flex items-center gap-2 mb-2">
						<UIcon
							:name="buildName ? 'i-lucide-blocks' : 'i-lucide-plus'"
							class="size-4 text-muted"
						/>
						<span class="text-muted text-sm">
							{{ buildName ? 'Build' : 'New build' }}
						</span>
					</div>
					<UInput
						v-model="draft.name"
						placeholder="Name this build…"
						size="lg"
						class="w-full max-w-md"
						:ui="{ base: 'text-highlighted font-medium' }"
					/>
					<p v-if="nameError" class="mt-1 text-error text-sm">
						{{ nameError }}
					</p>
				</template>

				<template v-else>
					<div class="flex items-center gap-2 mb-2 text-muted text-sm">
						<UIcon name="i-lucide-git-compare" class="size-4" />
						Comparing
					</div>
					<h1 class="font-medium text-highlighted text-lg truncate">
						{{ draft.name || 'Untitled build' }}
					</h1>
					<p class="mt-1 max-w-xl text-muted text-xs">
						Hover a part in the layout to see how the selected builds differ. Click a value in the
						table to make that build the basis for its section.
					</p>
				</template>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<UButton
					v-if="comparing"
					icon="i-lucide-arrow-left"
					label="Back to build"
					color="neutral"
					variant="ghost"
					size="sm"
					@click="comparing = false"
				/>
				<BuildsComparePicker
					v-if="buildName"
					:model-value="compareNames"
					:locked="buildName ? [buildName] : []"
					button-label="Compare"
					:confirm-label="comparing ? undefined : 'Compare'"
					@update:model-value="setCompareNames"
					@confirm="startCompare"
				/>
				<UButton v-if="!comparing" :disabled="!canSave" icon="i-lucide-save" @click="save">
					Save
				</UButton>
			</div>
		</header>

		<div class="flex flex-1 flex-col min-h-0 overflow-y-auto lg:flex-row lg:overflow-hidden">
			<section
				ref="layoutHost"
				class="relative flex flex-1 p-2 sm:p-4 min-h-80 lg:min-h-0"
				@pointermove="onPointerMove"
				@mouseleave="hoveredType = undefined"
			>
				<div class="w-full h-full min-h-72">
					<BuildsBuildLayout
						:build="resolved"
						:issues="issues"
						@hover="hoveredType = $event"
						@activate="activatePart"
					/>
				</div>

				<div v-if="hoveredType" class="absolute z-30 pointer-events-none" :style="tooltipStyle">
					<BuildsCompareTooltip
						v-if="comparing"
						:section-id="hoveredType"
						:builds="compareBuilds"
						:baselines="baselines"
					/>
					<BuildsPartTooltip
						v-else
						:type="hoveredType"
						:build="resolved"
						:missing="missingFor(hoveredType)"
					/>
				</div>
			</section>

			<aside
				class="flex flex-col shrink-0 border-default border-t min-h-0 lg:border-t-0 lg:border-l lg:w-[24rem] lg:overflow-y-auto"
			>
				<BuildsComparison
					v-if="comparing"
					embedded
					:build-names="compareNames"
					:locked-names="buildName ? [buildName] : []"
					:baselines="baselines"
					@update:build-names="setCompareNames"
					@update:baselines="baselines = $event"
				/>
				<BuildsSidebar
					v-else
					:build="resolved"
					:issues="issues"
					@open-picker="openPicker"
					@remove="removeRef"
					@edit="openEditPart"
					@hover-part="hoveredSidebarPart = $event"
				/>
			</aside>
		</div>

		<BuildsPartPickerDialog
			v-if="pickerType"
			v-model:open="pickerOpen"
			:type="pickerType"
			:build="resolved"
			:selected-titles="pickerSelectedTitles"
			:multiple="pickerMultiple"
			@select="applySelection"
		/>

		<PartsEditDialog
			v-if="editingPart"
			:type="editingPart.type"
			:part="editingPart.part"
			:open="true"
			@update:open="editingPart = undefined"
		/>
	</div>
</template>
