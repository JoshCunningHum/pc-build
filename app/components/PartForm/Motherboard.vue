<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { DDR_ITEMS, FORM_FACTOR_ITEMS, PCIE_ITEMS } from '~/constants/spec-labels';
import { useMotherboardStore } from '~/stores/motherboard';

const draft = defineModel<Partial<Specs.Motherboard>>({ required: true });

const store = useMotherboardStore();
const sockets = computed(() => distinctStrings(store.list, (row) => row.socket.name));
const colors = computed(() => distinctStrings(store.list, (row) => row.color));

const socketName = computed({
	get: () => draft.value.socket?.name || undefined,
	set: (name) => {
		draft.value.socket = { name: name ?? '', brand: draft.value.socket?.brand };
	},
});
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox v-model="socketName" label="Socket" name="socket.name" :options="sockets" />
		<SpecSelect
			v-model="draft.form_factor"
			label="Form factor"
			name="form_factor"
			:items="FORM_FACTOR_ITEMS"
		/>
		<SpecSelect v-model="draft.ddr" label="DDR" name="ddr" :items="DDR_ITEMS" />
		<SpecSelect v-model="draft.pcie" label="PCIe" name="pcie" :items="PCIE_ITEMS" />
		<SpecNumber v-model="draft.max_memory" label="Max memory" name="max_memory" unit="GB" />
		<SpecNumber v-model="draft.memory_slots" label="Memory slots" name="memory_slots" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
	</div>
</template>
