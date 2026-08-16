<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { EFFICIENCY_ITEMS, MODULAR_ITEMS } from '~/constants/spec-labels';
import { usePowerSupplyStore } from '~/stores/power-supply';

const draft = defineModel<Partial<Specs.PowerSupply>>({ required: true });

const store = usePowerSupplyStore();
const types = computed(() => distinctStrings(store.list, (row) => row.type));
const colors = computed(() => distinctStrings(store.list, (row) => row.color));
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox v-model="draft.type" label="Type" name="type" :options="types" />
		<SpecSelect
			v-model="draft.efficiency"
			label="Efficiency"
			name="efficiency"
			:items="EFFICIENCY_ITEMS"
		/>
		<SpecNumber v-model="draft.wattage" label="Wattage" name="wattage" unit="W" />
		<SpecSelect v-model="draft.modular" label="Modular" name="modular" :items="MODULAR_ITEMS" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
	</div>
</template>
