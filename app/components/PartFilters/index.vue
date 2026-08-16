<script setup lang="ts">
import type { AnyPartFilter, ErasedFilterField, FilterValue } from '~/constants/part-filters';
import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { filterFieldsFor, filterOptionsFor } from '~/constants/part-filters';
import { SPECS_STORES } from '~/constants/parts';

const props = defineProps<{ part: Builds.PartType }>();

const emit = defineEmits<{
	change: [filter: AnyPartFilter];
}>();

const BOOLEAN_ITEMS = [
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

const values = ref<Record<string, FilterValue>>({});

const fields = computed(() => filterFieldsFor(props.part));

const rows = computed(() => SPECS_STORES[props.part]().list as SpecsRow[]);
const optionsByKey = computed<Record<string, string[]>>(() =>
	Object.fromEntries(
		fields.value
			.filter((field) => field.kind === 'select')
			.map((field) => [field.key, filterOptionsFor(field, rows.value)]),
	),
);

const activeCount = computed(
	() => Object.values(values.value).filter((value) => value !== undefined && value !== '').length,
);

function stringValue(field: ErasedFilterField): string | undefined {
	return values.value[field.key] as string | undefined;
}

function numberValue(field: ErasedFilterField): number | undefined {
	return values.value[field.key] as number | undefined;
}

function booleanValue(field: ErasedFilterField): boolean | undefined {
	return values.value[field.key] as boolean | undefined;
}

function setValue(field: ErasedFilterField, raw: unknown): void {
	if (raw === '' || raw === null || raw === undefined) {
		values.value[field.key] = undefined;
		return;
	}

	values.value[field.key] =
		field.kind === 'min' || field.kind === 'max' ? Number(raw) : (raw as FilterValue);
}

function reset(): void {
	values.value = {};
}

function numberPlaceholder(field: ErasedFilterField): string {
	return field.unit ? `${field.label} (${field.unit})` : field.label;
}

function emitChange(): void {
	// Sound by construction: `part` is what selected these fields.
	emit('change', { part: props.part, values: values.value } as AnyPartFilter);
}

watch(() => props.part, reset);

watchDebounced(values, emitChange, { deep: true, debounce: 200, immediate: true });
</script>

<template>
	<div class="flex flex-wrap items-center gap-2">
		<template v-for="field in fields" :key="`${part}-${field.key}`">
			<UInput
				v-if="field.kind === 'text'"
				:model-value="stringValue(field)"
				:placeholder="field.label"
				icon="i-lucide-search"
				class="w-56"
				@update:model-value="setValue(field, $event)"
			>
				<template v-if="stringValue(field)" #trailing>
					<UButton
						icon="i-lucide-x"
						color="neutral"
						variant="link"
						size="sm"
						padded
						@click="setValue(field, '')"
					/>
				</template>
			</UInput>

			<USelectMenu
				v-else-if="field.kind === 'select'"
				:model-value="stringValue(field)"
				:items="optionsByKey[field.key]"
				:placeholder="field.label"
				:search-input="{ placeholder: `Search ${field.label.toLowerCase()}…` }"
				clear
				class="w-44"
				@update:model-value="setValue(field, $event)"
			/>

			<USelectMenu
				v-else-if="field.kind === 'boolean'"
				:model-value="booleanValue(field)"
				:items="BOOLEAN_ITEMS"
				:placeholder="field.label"
				:search-input="false"
				value-key="value"
				clear
				class="w-44"
				@update:model-value="setValue(field, $event)"
			/>

			<UInput
				v-else
				:model-value="numberValue(field)"
				:placeholder="numberPlaceholder(field)"
				type="number"
				class="w-40"
				@update:model-value="setValue(field, $event)"
			/>
		</template>

		<UButton
			v-if="activeCount > 0"
			icon="i-lucide-filter-x"
			color="neutral"
			variant="ghost"
			@click="reset"
		>
			Clear {{ activeCount }}
		</UButton>
	</div>
</template>
