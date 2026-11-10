<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Builds } from '~/types/build';
import type { PartsRow } from '~/types/parts';
import { PART_TYPE_META, PARTS_STORES } from '~/constants/parts';
import { formatPrice } from '~/utils/format';
import { isPartIncomplete } from '~/utils/parts';

const props = defineProps<{ type: Builds.PartType }>();

const meta = computed(() => PART_TYPE_META[props.type]);
const store = computed(() => PARTS_STORES[props.type]());
const buildsStore = useBuildsStore();

const route = useRoute();
const router = useRouter();
const toast = useToast();

const search = ref('');
const creating = ref(false);
const editing = ref<PartsRow>();
const deleting = ref<PartsRow>();
const hoveredPart = ref<PartsRow>();

// Build parts deep-link here with `?listing=<title>` so the listing editor opens directly.
function openListingFromQuery(notify: boolean): void {
	const listing = route.query.listing;
	if (typeof listing !== 'string' || !listing) return;

	const match = store.value.list.find((part) => part.title === listing);
	if (match) {
		editing.value = match;
	} else if (notify) {
		toast.add({
			title: 'Listing not found',
			description: `“${listing}” may have been deleted.`,
			color: 'error',
		});
	}

	// Clear the query so closing the dialog does not immediately reopen it.
	const query = { ...route.query };
	delete query.listing;
	router.replace({ query });
}

watch(
	() => route.query.listing,
	() => openListingFromQuery(true),
	{ immediate: true },
);
watch(
	() => store.value.list,
	() => openListingFromQuery(false),
	{ deep: true },
);

const deleteReferences = computed(() =>
	deleting.value ? buildsStore.countPartReferences(props.type, deleting.value.title) : 0,
);

const deleteDescription = computed(() => {
	const base = `Remove “${deleting.value?.title}” from your ${meta.value.label.toLowerCase()} shortlist?`;
	if (deleteReferences.value === 0) return base;
	return `${base} ${deleteReferences.value} build${
		deleteReferences.value === 1 ? '' : 's'
	} use this listing and will show it as a missing part until you replace it.`;
});

const items = computed(() => store.value.list);
const rows = computed(() => {
	const query = search.value.trim().toLowerCase();
	if (!query) return items.value;
	return items.value.filter(
		(part) => part.title.toLowerCase().includes(query) || part.name.toLowerCase().includes(query),
	);
});

const pricedCount = computed(() => rows.value.filter((part) => part.price !== undefined).length);
const totalPrice = computed(() => rows.value.reduce((sum, part) => sum + (part.price ?? 0), 0));
const incompleteCount = computed(() => rows.value.filter(isPartIncomplete).length);

const columns: TableColumn<PartsRow>[] = [
	{ id: 'image', header: '', enableSorting: false },
	{ accessorKey: 'title', header: 'Listing' },
	{ accessorKey: 'name', header: 'Spec' },
	{ accessorKey: 'price', header: 'Price' },
	{ id: 'link', header: 'Source', enableSorting: false },
	{ id: 'actions', header: '', enableSorting: false },
];

function confirmDelete(): void {
	if (!deleting.value) return;
	store.value.remove(deleting.value.title);
	deleting.value = undefined;
}

function onRowHover(_event: MouseEvent, row: { original: PartsRow } | null): void {
	hoveredPart.value = row?.original;
}

defineShortcuts({
	n: () => {
		if (editing.value || deleting.value) return;
		creating.value = true;
	},
	e: () => {
		if (!hoveredPart.value || editing.value || deleting.value) return;
		editing.value = hoveredPart.value;
	},
	d: () => {
		if (!hoveredPart.value || editing.value || deleting.value) return;
		deleting.value = hoveredPart.value;
	},
});
</script>

<template>
	<div class="flex flex-col flex-1 h-full min-h-0">
		<div class="flex justify-between items-start gap-4 p-4 border-default border-b">
			<div>
				<h1 class="flex items-center gap-2 font-semibold text-highlighted text-lg">
					<UIcon :name="meta.icon" class="size-5" />
					{{ meta.label }} listings
				</h1>
				<p class="mt-1 text-muted text-sm">
					Your canvassed {{ meta.label.toLowerCase() }} shortlist — each listing is a spec from the
					Database plus the details you found. Missing a price or source link marks a listing
					incomplete.
				</p>
			</div>
			<UButton icon="i-lucide-plus" class="shrink-0" @click="creating = true">
				Add listing
				<UKbd value="N" size="sm" class="ml-1" />
			</UButton>
		</div>

		<div class="flex flex-col flex-1 gap-3 p-4 min-w-0">
			<div class="flex flex-wrap justify-between items-center gap-3">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Search listings…"
					class="w-64"
				/>
				<p class="text-muted text-xs">
					{{ rows.length.toLocaleString() }} of {{ items.length.toLocaleString() }} listing{{
						items.length === 1 ? '' : 's'
					}}
					<span v-if="pricedCount > 0"> · {{ formatPrice(totalPrice) }}</span>
					<span v-if="incompleteCount > 0" class="text-warning">
						· {{ incompleteCount }} incomplete
					</span>
				</p>
			</div>

			<div
				v-if="items.length === 0"
				class="flex flex-col flex-1 justify-center items-center gap-3 border-default border border-dashed rounded-sm min-h-0 p-6 text-center"
			>
				<UIcon :name="meta.icon" class="size-10 text-muted" />
				<div>
					<p class="font-medium text-highlighted">No {{ meta.label.toLowerCase() }} listings yet</p>
					<p class="mt-1 text-muted text-sm">
						Pick a spec from the Database and record the details you found for this listing.
					</p>
				</div>
				<UButton icon="i-lucide-plus" @click="creating = true"> Add your first listing </UButton>
			</div>

			<div
				v-else-if="rows.length === 0"
				class="flex flex-col flex-1 justify-center items-center gap-2 text-center"
			>
				<UIcon name="i-lucide-search-x" class="size-8 text-muted" />
				<p class="text-muted text-sm">No listings match “{{ search }}”.</p>
				<UButton color="neutral" variant="ghost" size="xs" @click="search = ''">
					Clear search
				</UButton>
			</div>

			<UTable
				v-else
				:key="type"
				:data="rows"
				:columns="columns"
				:on-hover="onRowHover"
				virtualize
				sticky="header"
				class="flex-1 min-h-0"
				:ui="{ tr: 'group', td: 'py-1.5' }"
			>
				<template #image-cell="{ row }">
					<div
						class="flex justify-center items-center bg-elevated/50 border-default border rounded-sm w-10 h-10 overflow-hidden"
					>
						<img
							v-if="row.original.image"
							:src="row.original.image"
							:alt="row.original.title"
							loading="lazy"
							class="w-full h-full object-cover"
						/>
						<UIcon v-else name="i-lucide-image-off" class="size-4 text-muted" />
					</div>
				</template>

				<template #title-cell="{ row }">
					<div class="flex items-center gap-2">
						<span class="font-medium text-highlighted">{{ row.original.title }}</span>
						<UBadge
							v-if="isPartIncomplete(row.original)"
							color="warning"
							variant="subtle"
							size="sm"
							label="Incomplete"
						/>
					</div>
				</template>

				<template #name-cell="{ row }">
					<span class="text-muted">{{ row.original.name }}</span>
				</template>

				<template #price-cell="{ row }">
					<span
						class="font-medium tabular-nums"
						:class="{ 'text-muted': row.original.price === undefined }"
					>
						{{ formatPrice(row.original.price) }}
					</span>
				</template>

				<template #link-cell="{ row }">
					<UButton
						v-if="row.original.link"
						:to="row.original.link"
						target="_blank"
						rel="noopener noreferrer"
						icon="i-lucide-external-link"
						color="neutral"
						variant="ghost"
						size="xs"
						aria-label="Open source link"
					/>
					<UIcon
						v-else
						name="i-lucide-link-2-off"
						class="size-4 text-muted"
						aria-label="No source link"
					/>
				</template>

				<template #actions-cell="{ row }">
					<div
						class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
					>
						<UButton
							icon="i-lucide-pencil"
							color="neutral"
							variant="ghost"
							size="xs"
							title="Edit (E)"
							:aria-label="`Edit ${row.original.title}`"
							@click="editing = row.original"
						/>
						<UButton
							icon="i-lucide-trash-2"
							color="error"
							variant="ghost"
							size="xs"
							title="Delete (D)"
							:aria-label="`Delete ${row.original.title}`"
							@click="deleting = row.original"
						/>
					</div>
				</template>
			</UTable>
		</div>

		<PartsAddDialog v-model:open="creating" :type="type" />

		<PartsEditDialog
			v-if="editing"
			:key="editing.title"
			:type="type"
			:part="editing"
			:open="true"
			@update:open="editing = undefined"
		/>

		<UModal
			:open="!!deleting"
			title="Delete listing"
			:description="deleteDescription"
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
