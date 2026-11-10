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

const props = defineProps<{ type: Builds.PartType; initialSpec?: SpecsRow }>();

const open = defineModel<boolean>('open', { required: true });

const meta = computed(() => PART_TYPE_META[props.type]);
const specStore = computed(() => SPECS_STORES[props.type]());
const partsStore = computed(() => PARTS_STORES[props.type]());

const form = useTemplateRef<Form<Partial<Parts.Base>>>('form');
const base = ref<Partial<Parts.Base>>({});
const selectedSpec = ref<string>();
const searchTerm = ref('');
const autoTitle = ref<string>();
const specError = ref<string>();
const titleError = ref<string>();

const specFilter = ref<AnyPartFilter>({ part: props.type, values: {} });
const filterKey = ref(0);

const specRows = computed(() => {
	const rows = specStore.value.list as SpecsRow[];
	// PartFilters emits on a debounce; ignore a filter that still belongs to the previous type.
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
	if (!selectedSpec.value) return undefined;
	return (specStore.value.list as SpecsRow[]).find(
		(row) => specKey(props.type, row) === selectedSpec.value,
	);
});

function specByValue(value: string): SpecsRow | undefined {
	return (specStore.value.list as SpecsRow[]).find((row) => specKey(props.type, row) === value);
}

watch(open, (isOpen) => {
	if (!isOpen) return;
	const initialTitle = props.initialSpec ? defaultTitle(props.initialSpec.name) : undefined;
	base.value = initialTitle ? { title: initialTitle } : {};
	autoTitle.value = initialTitle;
	searchTerm.value = '';
	selectedSpec.value = props.initialSpec ? specKey(props.type, props.initialSpec) : undefined;
	specError.value = undefined;
	titleError.value = undefined;
	specFilter.value = { part: props.type, values: {} };
	filterKey.value += 1;
});

watch(
	() => props.type,
	(type) => {
		specFilter.value = { part: type, values: {} };
		filterKey.value += 1;
	},
);

function defaultTitle(name: string): string {
	let title = name;
	for (let index = 2; partsStore.value.getByTitle(title); index += 1) title = `${name} (${index})`;
	return title;
}

// Keep the title useful while the user is still choosing a spec, but never overwrite a title
// they have already customized. Tracking the generated value handles collision suffixes such as
// “G.Skill Flare X5 32 GB (2)”, which no longer equal the spec name.
watch(spec, (next) => {
	if (!next) return;
	if (!base.value.title || base.value.title === autoTitle.value) {
		autoTitle.value = defaultTitle(next.name);
		base.value.title = autoTitle.value;
	}
	specError.value = undefined;
});

watch(
	base,
	() => {
		titleError.value = undefined;
	},
	{ deep: true },
);

async function create(): Promise<void> {
	specError.value = spec.value ? undefined : 'Pick the spec this listing is for.';
	if (!(await form.value?.validate()) || !spec.value) return;

	const title = base.value.title?.trim();
	if (!title) return;

	if (partsStore.value.getByTitle(title)) {
		titleError.value = `A listing titled “${title}” already exists.`;
		return;
	}

	const part = deepClone({ ...spec.value, ...base.value, title }) as PartsRow;
	partsStore.value.add(part);
	open.value = false;
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`New ${meta.label} listing`"
		description="Pick a spec from the Database, then record what this particular seller is offering."
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

						<div v-if="specStore.loading" class="flex items-center gap-2 text-muted text-sm">
							<UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
							<span>Loading specs…</span>
						</div>

						<template v-else>
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
							<p v-if="specError" class="text-error text-xs">{{ specError }}</p>
							<p v-else-if="specRows.length === 0" class="text-muted text-xs">
								No specs match these filters. Clear a filter to widen the list.
							</p>

							<template v-if="spec">
								<span class="font-medium text-highlighted text-sm break-all">{{ spec.name }}</span>
								<PartsSpecSummary :type="type" :spec="spec" />
								<p class="text-muted text-xs">
									Specs come from the Database. Edit them there if this listing's seller has a
									different variant.
								</p>
							</template>

							<p v-else class="text-muted text-xs">
								Not listed yet?
								<NuxtLink to="/database" class="text-primary"
									>Add the spec in the Database</NuxtLink
								>
								first, then come back to record the listing.
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
							<PartsBaseFields v-model="base" />
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
				<UButton @click="create">Add listing</UButton>
			</div>
		</template>
	</UModal>
</template>
