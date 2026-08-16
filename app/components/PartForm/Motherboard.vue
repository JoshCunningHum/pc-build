<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { specItems } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';
import { useMotherboardStore } from '~/stores/motherboard';

const draft = defineModel<Partial<Specs.Motherboard>>({ required: true });

const constants = useConstantsStore();
const store = useMotherboardStore();
const colors = computed(() => distinctStrings(store.list, (row) => row.color));

const socketName = computed({
	get: () => draft.value.socket?.name || undefined,
	set: (name) => {
		if (!name) {
			draft.value.socket = { name: '' };
			return;
		}
		// Brand rides along from the configured socket, falling back to whatever the spec already
		// carried when the socket isn't one of the configured ones.
		const brand = constants.brandOf('socket', name) ?? draft.value.socket?.brand;
		draft.value.socket = brand ? { name, brand } : { name };
	},
});
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox
			v-model="socketName"
			label="Socket"
			name="socket.name"
			:options="constants.labels('socket')"
		/>
		<SpecSelect
			v-model="draft.form_factor"
			label="Form factor"
			name="form_factor"
			:items="specItems('form_factor')"
		/>
		<SpecSelect v-model="draft.ddr" label="DDR" name="ddr" :items="specItems('ddr')" />
		<SpecSelect v-model="draft.pcie" label="PCIe" name="pcie" :items="specItems('pcie')" />
		<SpecNumber v-model="draft.max_memory" label="Max memory" name="max_memory" unit="GB" />
		<SpecNumber v-model="draft.memory_slots" label="Memory slots" name="memory_slots" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
	</div>
</template>
