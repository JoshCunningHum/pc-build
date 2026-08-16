<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { useConstantsStore } from '~/stores/constants';
import { useCpuCoolerStore } from '~/stores/cpu-cooler';

const draft = defineModel<Partial<Specs.CPUCooler>>({ required: true });

const constants = useConstantsStore();
const store = useCpuCoolerStore();
const colors = computed(() => distinctStrings(store.list, (row) => row.color));

const socketNames = computed({
	get: () => (draft.value.sockets ?? []).map((socket) => socket.name),
	set: (names) => {
		draft.value.sockets = names.map((name) => {
			const brand = constants.brandOf('socket', name);
			return brand ? { name, brand } : { name };
		});
	},
});
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecMultiSelect
			v-model="socketNames"
			label="Sockets"
			name="sockets"
			:options="constants.labels('socket')"
			class="col-span-2"
		/>
		<SpecRange v-model="draft.rpm" label="RPM" name="rpm" />
		<SpecRange v-model="draft.noise_level" label="Noise" name="noise_level" unit="dBA" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
		<SpecNumber v-model="draft.size" label="Radiator size" name="size" unit="mm" />
	</div>
</template>
