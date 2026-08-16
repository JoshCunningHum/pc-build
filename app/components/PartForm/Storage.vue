<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { useConstantsStore } from '~/stores/constants';

const draft = defineModel<Partial<Specs.InternalHardDrive>>({ required: true });

const constants = useConstantsStore();
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox
			v-model="draft.type"
			label="Type"
			name="type"
			:options="constants.labels('storage_type')"
		/>
		<SpecNumber v-model="draft.capacity" label="Capacity" name="capacity" unit="GB" />
		<SpecCombobox
			v-model="draft.form_factor"
			label="Form factor"
			name="form_factor"
			:options="constants.labels('storage_form_factor')"
		/>
		<SpecCombobox
			v-model="draft.interface"
			label="Interface"
			name="interface"
			:options="constants.labels('storage_interface')"
		/>
		<SpecNumber v-model="draft.cache" label="Cache" name="cache" unit="MB" />
	</div>
</template>
