<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { useCpuStore } from '~/stores/cpu';

const draft = defineModel<Partial<Specs.CPU>>({ required: true });

const store = useCpuStore();
const sockets = computed(() => distinctStrings(store.list, (row) => row.socket.name));
const architectures = computed(() => distinctStrings(store.list, (row) => row.microarchitecture));

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
		<SpecCombobox
			v-model="draft.microarchitecture"
			label="Microarchitecture"
			name="microarchitecture"
			:options="architectures"
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
