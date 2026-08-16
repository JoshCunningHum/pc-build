<script setup lang="ts">
import type { NavigationMenuItem, TableColumn } from '@nuxt/ui';
import type { AnyPartFilter } from '~/constants/part-filters';
import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { DATABASE_COLUMNS } from '~/constants/database-columns';
import { matchesFilter } from '~/constants/part-filters';
import { PART_TYPE_META, SPECS_STORES } from '~/constants/parts';

const partTypes = Object.keys(PART_TYPE_META) as Builds.PartType[];
const selectedType = ref<Builds.PartType>('cpu');
const filter = ref<AnyPartFilter>({ part: 'cpu', values: {} });

const categoryItems = computed<NavigationMenuItem[]>(() =>
	partTypes.map((type) => {
		const meta = PART_TYPE_META[type];
		return {
			label: meta.label,
			icon: meta.icon,
			badge: SPECS_STORES[type]().list.length,
			active: type === selectedType.value,
			onSelect: () => {
				selectedType.value = type;
			},
		};
	}),
);

const activeStore = computed(() => SPECS_STORES[selectedType.value]());

// UTable needs one `T` shared by `data` and `columns`, but the category is only known at
// runtime -- widening to the union of every specs shape is where that erasure has to happen.
const allRows = computed(() => activeStore.value.list as SpecsRow[]);
const columns = computed(() => DATABASE_COLUMNS[selectedType.value] as TableColumn<SpecsRow>[]);

const filterMatchesCategory = computed(() => filter.value.part === selectedType.value);

const rows = computed(() => {
	// PartFilters emits on a debounce; skip filtering until it catches up with the category.
	if (!filterMatchesCategory.value) return allRows.value;
	return allRows.value.filter((row) => matchesFilter(filter.value, row));
});

const initialLoad = computed(() => partTypes.some((type) => SPECS_STORES[type]().loading));
const loadError = computed(() => partTypes.map((type) => SPECS_STORES[type]().error).find(Boolean));
</script>

<template>
	<div v-if="initialLoad" class="flex justify-center items-center gap-2 h-full text-muted">
		<UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
		<span>Loading parts catalog…</span>
	</div>
	<div v-else-if="loadError" class="flex justify-center items-center gap-2 h-full text-error">
		<UIcon name="i-lucide-circle-alert" class="size-5" />
		<span>Failed to load the parts catalog. Check the browser console for details.</span>
	</div>
	<div v-else class="flex flex-1 h-full min-h-0">
		<aside class="flex flex-col border-default border-r w-56 shrink-0">
			<div class="px-4 py-3 h-fit">
				<span class="font-semibold text-highlighted text-sm">Stored Specs</span>
			</div>
			<div class="flex-1 p-2 overflow-y-auto">
				<UNavigationMenu :items="categoryItems" orientation="vertical" />
			</div>
		</aside>
		<div class="flex flex-col flex-1 gap-3 p-4 min-w-0">
			<PartFilters :part="selectedType" @change="filter = $event" />
			<p class="text-muted text-xs">
				{{ rows.length.toLocaleString() }} of {{ allRows.length.toLocaleString() }}
				{{ PART_TYPE_META[selectedType].label }} specs
			</p>
			<UTable
				:key="selectedType"
				:data="rows"
				:columns="columns"
				virtualize
				sticky="header"
				class="flex-1 min-h-0"
			/>
		</div>
	</div>
</template>
