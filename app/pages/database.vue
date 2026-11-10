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

// The actions column is appended here rather than living in DATABASE_COLUMNS: its handlers are
// page state, which a constants module has no access to.
const columns = computed<TableColumn<SpecsRow>[]>(() => [
	{ id: 'actions', header: '', enableSorting: false, maxSize: 0 },
	...(DATABASE_COLUMNS[selectedType.value] as TableColumn<SpecsRow>[]),
]);

const activeRow = ref<SpecsRow>();
const hoveredSpec = ref<SpecsRow>();

const contextMenuItems = computed(() => {
	if (!activeRow.value) return [];
	const row = activeRow.value;
	return [
		{
			label: 'Create listing',
			icon: 'i-lucide-tag',
			onSelect: () => addListing(row),
		},
		{
			label: 'Edit',
			icon: 'i-lucide-pencil',
			onSelect: () => {
				editing.value = row;
			},
		},
		{
			label: 'Delete',
			icon: 'i-lucide-trash-2',
			color: 'error' as const,
			onSelect: () => {
				deleting.value = row;
			},
		},
	];
});

function onRowContextmenu(_event: MouseEvent, row: { original: SpecsRow }): void {
	activeRow.value = row.original;
}

function onRowHover(_event: MouseEvent, row: { original: SpecsRow } | null): void {
	hoveredSpec.value = row?.original;
}

defineShortcuts({
	n: () => {
		if (editing.value || deleting.value || creating.value || creatingListing.value) return;
		creating.value = true;
	},
	e: () => {
		if (
			!hoveredSpec.value ||
			editing.value ||
			deleting.value ||
			creating.value ||
			creatingListing.value
		)
			return;
		editing.value = hoveredSpec.value;
	},
	d: () => {
		if (
			!hoveredSpec.value ||
			editing.value ||
			deleting.value ||
			creating.value ||
			creatingListing.value
		)
			return;
		deleting.value = hoveredSpec.value;
	},
});

function onTableContextMenu(event: MouseEvent): void {
	const tr = (event.target as HTMLElement | null)?.closest('tr');
	if (!tr) {
		event.preventDefault();
		activeRow.value = undefined;
		return;
	}

	const match = tr.className.match(/db-row-(\\d+)/);
	if (match) {
		const index = Number(match[1]);
		if (Number.isInteger(index) && rows.value[index]) activeRow.value = rows.value[index];
	}
}

const filterMatchesCategory = computed(() => filter.value.part === selectedType.value);

const rows = computed(() => {
	// PartFilters emits on a debounce; skip filtering until it catches up with the category.
	if (!filterMatchesCategory.value) return allRows.value;
	return allRows.value.filter((row) => matchesFilter(filter.value, row));
});

const initialLoad = computed(() => partTypes.some((type) => SPECS_STORES[type]().loading));
const loadError = computed(() => partTypes.map((type) => SPECS_STORES[type]().error).find(Boolean));

const creating = ref(false);
const creatingListing = ref(false);
const listingSpec = ref<SpecsRow>();
const editing = ref<SpecsRow>();
const deleting = ref<SpecsRow>();

function addListing(spec?: SpecsRow): void {
	listingSpec.value = spec;
	creatingListing.value = true;
}

function confirmDelete(): void {
	if (!deleting.value) return;
	activeStore.value.remove(deleting.value.name);
	deleting.value = undefined;
}
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
			<div class="flex justify-between items-start gap-4">
				<PartFilters :part="selectedType" @change="filter = $event" />
				<UButton icon="i-lucide-plus" class="shrink-0" @click="creating = true">
					Add {{ PART_TYPE_META[selectedType].label }}
					<UKbd value="N" size="sm" class="ml-1" />
				</UButton>
			</div>
			<p class="text-muted text-xs">
				{{ rows.length.toLocaleString() }} of
				{{ allRows.length.toLocaleString() }}
				{{ PART_TYPE_META[selectedType].label }} specs
			</p>
			<UContextMenu :items="contextMenuItems">
				<div class="flex-1 min-h-0" @contextmenu="onTableContextMenu">
					<UTable
						:key="selectedType"
						:data="rows"
						:columns="columns"
						:meta="{
							class: { tr: (row: { index: number }) => `db-row-${row.index}` },
						}"
						:on-contextmenu="onRowContextmenu"
						:on-hover="onRowHover"
						virtualize
						sticky="header"
						class="h-full"
						:ui="{ tr: 'group', td: 'py-1.5' }"
					>
						<template #actions-cell="{ row }">
							<div
								class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
							>
								<UButton
									icon="i-lucide-tag"
									color="neutral"
									variant="ghost"
									class="px-1"
									title="Create listing"
									:aria-label="`Create a listing from ${row.original.name}`"
									@click="addListing(row.original)"
								/>
								<UButton
									icon="i-lucide-pencil"
									color="neutral"
									variant="ghost"
									size="sm"
									class="px-1"
									title="Edit (E)"
									:aria-label="`Edit ${row.original.name}`"
									@click="editing = row.original"
								/>
								<UButton
									icon="i-lucide-trash-2"
									color="error"
									variant="ghost"
									size="sm"
									class="px-1"
									title="Delete (D)"
									:aria-label="`Delete ${row.original.name}`"
									@click="deleting = row.original"
								/>
							</div>
						</template>
					</UTable>
				</div>
			</UContextMenu>
			<p class="text-muted text-xs">Right-click a row for edit, delete, or listing actions.</p>
		</div>

		<PartDialogCreatePartDialog v-model:open="creating" :type="selectedType" />
		<PartsAddDialog
			v-model:open="creatingListing"
			:type="selectedType"
			:initial-spec="listingSpec"
		/>

		<PartDialogEditPartDialog
			v-if="editing"
			:key="editing.name"
			:type="selectedType"
			:part="editing"
			:open="true"
			@update:open="editing = undefined"
		/>

		<UModal
			:open="!!deleting"
			title="Delete spec"
			:description="`Remove “${deleting?.name}” from the ${PART_TYPE_META[selectedType].label} catalog? This also hides it if it came pre-seeded.`"
			@update:open="deleting = undefined"
		>
			<template #footer>
				<div class="flex justify-end gap-2 w-full">
					<UButton color="neutral" variant="ghost" @click="deleting = undefined">Cancel</UButton>
					<UButton color="error" @click="confirmDelete">Delete</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
