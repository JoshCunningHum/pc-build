<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { PCIE_ITEMS } from '~/constants/spec-labels';
import { useVideoCardStore } from '~/stores/video-card';

const draft = defineModel<Partial<Specs.VideoCard>>({ required: true });

const store = useVideoCardStore();
const colors = computed(() => distinctStrings(store.list, (row) => row.color));
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecText v-model="draft.chipset" label="Chipset" name="chipset" />
		<SpecNumber v-model="draft.memory" label="Memory" name="memory" unit="GB" />
		<SpecNumber v-model="draft.core_clock" label="Core clock" name="core_clock" unit="MHz" />
		<SpecNumber v-model="draft.boost_clock" label="Boost clock" name="boost_clock" unit="MHz" />
		<SpecSelect v-model="draft.pcie" label="PCIe" name="pcie" :items="PCIE_ITEMS" />
		<SpecNumber v-model="draft.wattage" label="Wattage" name="wattage" unit="W" />
		<SpecNumber v-model="draft.length" label="Length" name="length" unit="mm" />
		<SpecCombobox v-model="draft.color" label="Color" name="color" :options="colors" />
	</div>
</template>
