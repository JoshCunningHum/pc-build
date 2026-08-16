<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { useConstantsStore } from '~/stores/constants';

const draft = defineModel<Partial<Specs.CPU>>({ required: true });

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
		<SpecCombobox
			v-model="draft.microarchitecture"
			label="Microarchitecture"
			name="microarchitecture"
			:options="constants.labels('microarchitecture')"
		/>
		<SpecNumber v-model="draft.core_count" label="Cores" name="core_count" />
		<SpecNumber v-model="draft.tdp" label="TDP" name="tdp" unit="W" />
		<SpecNumber
			v-model="draft.core_clock"
			label="Core clock"
			name="core_clock"
			unit="GHz"
			:step="0.1"
		/>
		<SpecNumber
			v-model="draft.boost_clock"
			label="Boost clock"
			name="boost_clock"
			unit="GHz"
			:step="0.1"
		/>
		<SpecText v-model="draft.graphics" label="Integrated graphics" name="graphics" />
		<SpecCheckbox v-model="draft.smt" label="SMT / Hyper-Threading" name="smt" />
	</div>
</template>
