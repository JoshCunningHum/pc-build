<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { specItems } from '~/constants/spec-labels';
import { useCaseStore } from '~/stores/case';

const draft = defineModel<Partial<Specs.Case>>({ required: true });

const store = useCaseStore();
const colors = computed(() => distinctStrings(store.list, (row) => row.color));
const sidePanels = computed(() => distinctStrings(store.list, (row) => row.side_panel));
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecSelect
			v-model="draft.type"
			label="Max form factor"
			name="type"
			:items="specItems('form_factor')"
		/>
		<SpecCombobox
			v-model="draft.side_panel"
			label="Side panel"
			name="side_panel"
			:options="sidePanels"
		/>
		<SpecNumber
			v-model="draft.max_gpu_length"
			label="Max GPU length"
			name="max_gpu_length"
			unit="mm"
		/>
		<SpecNumber v-model="draft.internal_35_bays" label='3.5" bays' name="internal_35_bays" />
		<SpecNumber
			v-model="draft.external_volume"
			label="External volume"
			name="external_volume"
			unit="L"
		/>
		<SpecNumber v-model="draft.psu" label="Included PSU" name="psu" unit="W" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
	</div>
</template>
