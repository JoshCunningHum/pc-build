<script setup lang="ts">
import type { Form } from '@nuxt/ui';
import type { AnyPartFilter } from '~/constants/part-filters';
import type { Builds } from '~/types/build';
import type { Parts, PartsRow, SpecsRow } from '~/types/parts';
import { fuzzyMatch, matchesFilter } from '~/constants/part-filters';
import { PART_TYPE_META, PARTS_STORES, SPECS_STORES } from '~/constants/parts';
import { PART_BASE_SCHEMA } from '~/constants/part-schemas';
import { deepClone } from '~/utils/clone';
import { specKey, specOptionLabel } from '~/utils/spec-display';

const props = defineProps<{ type: Builds.PartType; part: PartsRow }>();

const open = defineModel<boolean>('open', { required: true });

const meta = computed(() => PART_TYPE_META[props.type]);
const specStore = computed(() => SPECS_STORES[props.type]());
const partsStore = computed(() => PARTS_STORES[props.type]());
const buildsStore = useBuildsStore();

const form = useTemplateRef<Form<Partial<Parts.Base>>>('form');
const baseFields = useTemplateRef<{ focusPrice: () => void }>('baseFields');
const base = ref<Partial<Parts.Base>>({
	image: props.part.image,
	title: props.part.title,
	link: props.part.link,
	price: props.part.price,
});
const titleError = ref<string>();

const selectedSpec = ref<string>();
const specFilter = ref<AnyPartFilter>({ part: props.type, values: {} });
const searchTerm = ref('');
const filterKey = ref(0);

const specRows = computed(() => {
	const rows = specStore.value.list as SpecsRow[];
	if (specFilter.value.part !== props.type) return rows;
	return rows.filter((row) => matchesFilter(specFilter.value, row));
});

const specNames = computed(() =>
	specRows.value
		.filter(
			(row) =>
				!searchTerm.value.trim() || fuzzyMatch(searchTerm.value, specOptionLabel(props.type, row)),
		)
		.map((row) => ({
			value: specKey(props.type, row),
			label: specOptionLabel(props.type, row),
		})),
);

const spec = computed<SpecsRow | undefined>(() => {
	if (selectedSpec.value) {
		return (specStore.value.list as SpecsRow[]).find(
			(row) => specKey(props.type, row) === selectedSpec.value,
		);
	}
	return props.part as unknown as SpecsRow;
});

function specByValue(value: string): SpecsRow | undefined {
	return (specStore.value.list as SpecsRow[]).find((row) => specKey(props.type, row) === value);
}

function matchingSpecKey(): string | undefined {
	const current = props.part as unknown as SpecsRow;
	const match = (specStore.value.list as SpecsRow[]).find(
		(row) => JSON.stringify(row) === JSON.stringify(current),
	);
	return match ? specKey(props.type, match) : undefined;
}

onMounted(() => {
	setTimeout(() => baseFields.value?.focusPrice(), 50);
});

watch(open, (isOpen) => {
	if (!isOpen) return;
	base.value = {
		image: props.part.image,
		title: props.part.title,
		link: props.part.link,
		price: props.part.price,
	};
	titleError.value = undefined;
	specFilter.value = { part: props.type, values: {} };
	searchTerm.value = '';
	filterKey.value += 1;
	selectedSpec.value = matchingSpecKey();
	setTimeout(() => baseFields.value?.focusPrice(), 50);
});

watch(
	() => props.type,
	(type) => {
		specFilter.value = { part: type, values: {} };
		filterKey.value += 1;
	},
);

watch(
	base,
	() => {
		titleError.value = undefined;
	},
	{ deep: true },
);

async function save(): Promise<void> {
	if (!(await form.value?.validate())) return;

	const title = base.value.title?.trim();
	if (!title) return;

	if (title !== props.part.title && partsStore.value.getByTitle(title)) {
		titleError.value = `A listing titled “${title}” already exists.`;
		return;
	}

	const previousTitle = props.part.title;
	const specSource = spec.value ?? props.part;
	const next = deepClone({ ...specSource, ...base.value, title }) as PartsRow;
	partsStore.value.update(previousTitle, next);

	// Builds store live references by listing title, so a rename has to follow through.
	if (title !== previousTitle) buildsStore.renamePartReference(props.type, previousTitle, title);

	open.value = false;
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`Edit ${meta.label} listing`"
		:description="part.title"
		:ui="{ content: 'max-w-5xl' }"
	>
		<template #body>
			<div class="flex flex-col gap-4">
				<div class="space-y-2 p-3 border border-default rounded-lg bg-elevated/40">
					<span class="font-semibold text-highlighted text-sm">Filter specs</span>
					<PartFilters
						:key="filterKey"
						:part="type"
						layout="inline"
						:exclude="['name']"
						@change="specFilter = $event"
					/>
				</div>

				<div class="gap-6 grid grid-cols-[20rem_1fr]">
					<aside class="flex flex-col gap-3 pr-6 border-default border-r min-w-0">
						<span class="font-semibold text-highlighted text-sm">Spec from the Database</span>

						<USelectMenu
							v-model="selectedSpec"
							v-model:search-term="searchTerm"
							:items="specNames"
							value-key="value"
							:placeholder="`Search ${meta.label.toLowerCase()}s…`"
							:search-input="{ placeholder: 'Search…' }"
							ignore-filter
							virtualize
							clear
							class="w-full"
						>
							<template #item="{ item }">
								<UTooltip
									:content="{ side: 'left', align: 'start' }"
									:delay-duration="150"
									:ui="{ content: 'h-auto max-w-xs p-3 text-sm' }"
								>
									<span class="truncate">{{ item.label }}</span>
									<template #content>
										<PartsSpecSummary :type="type" :spec="specByValue(item.value)" />
									</template>
								</UTooltip>
							</template>
						</USelectMenu>
						<p v-if="specRows.length === 0" class="text-muted text-xs">
							No specs match these filters. Clear a filter to widen the list.
						</p>

						<template v-if="spec">
							<span class="font-medium text-highlighted text-sm break-all">{{ spec.name }}</span>
							<PartsSpecSummary :type="type" :spec="spec" />
							<p class="text-muted text-xs">
								Specs come from the Database. Editing the spec replaces the copied values.
							</p>
						</template>
					</aside>

					<div class="min-w-0">
						<UForm
							ref="form"
							:schema="PART_BASE_SCHEMA"
							:state="base"
							class="space-y-4"
							@submit.prevent
						>
							<PartsBaseFields ref="baseFields" v-model="base" />
						</UForm>
						<p v-if="titleError" class="mt-3 text-error text-sm">
							{{ titleError }}
						</p>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-2 w-full">
				<UButton color="neutral" variant="ghost" @click="open = false">Cancel</UButton>
				<UButton @click="save">Save</UButton>
			</div>
		</template>
	</UModal>
</template>
