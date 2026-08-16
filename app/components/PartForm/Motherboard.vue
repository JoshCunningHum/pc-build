<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { specItems } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';

const draft = defineModel<Partial<Specs.Motherboard>>({ required: true });

const constants = useConstantsStore();

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
		<SpecCombobox
			v-model="draft.color"
			label="Color"
			name="color"
			:options="constants.labels('color')"
		/>
	</div>
</template>
