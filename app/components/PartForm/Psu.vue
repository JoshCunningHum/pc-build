<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { MODULAR_ITEMS, specItems } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';

const draft = defineModel<Partial<Specs.PowerSupply>>({ required: true });

const constants = useConstantsStore();
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox
			v-model="draft.type"
			label="Type"
			name="type"
			:options="constants.labels('psu_type')"
		/>
		<SpecSelect
			v-model="draft.efficiency"
			label="Efficiency"
			name="efficiency"
			:items="specItems('efficiency')"
		/>
		<SpecNumber v-model="draft.wattage" label="Wattage" name="wattage" unit="W" />
		<SpecSelect v-model="draft.modular" label="Modular" name="modular" :items="MODULAR_ITEMS" />
		<SpecCombobox
			v-model="draft.color"
			label="Color"
			name="color"
			:options="constants.labels('color')"
		/>
	</div>
</template>
