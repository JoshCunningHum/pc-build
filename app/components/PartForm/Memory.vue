<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { specItems } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';

const draft = defineModel<Partial<Specs.Memory>>({ required: true });

const constants = useConstantsStore();
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecSelect v-model="draft.ddr" label="DDR" name="ddr" :items="specItems('ddr')" />
		<SpecNumber v-model="draft.speed" label="Speed" name="speed" unit="MT/s" />
		<SpecNumber v-model="draft.module_count" label="Modules" name="module_count" />
		<SpecNumber v-model="draft.module_size" label="Size per module" name="module_size" unit="GB" />
		<SpecNumber v-model="draft.cas_latency" label="CAS latency" name="cas_latency" />
		<SpecNumber
			v-model="draft.first_word_latency"
			label="First word latency"
			name="first_word_latency"
			unit="ns"
		/>
		<SpecCombobox
			v-model="draft.color"
			label="Color"
			name="color"
			:options="constants.labels('color')"
		/>
	</div>
</template>
