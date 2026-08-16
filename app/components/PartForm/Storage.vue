<script setup lang="ts">
import type { Specs } from '~/types/parts';
import { distinctStrings } from '~/constants/part-filters';
import { useInternalHardDriveStore } from '~/stores/internal-hard-drive';

const draft = defineModel<Partial<Specs.InternalHardDrive>>({ required: true });

const store = useInternalHardDriveStore();
const types = computed(() => distinctStrings(store.list, (row) => row.type));
const formFactors = computed(() => distinctStrings(store.list, (row) => row.form_factor));
const interfaces = computed(() => distinctStrings(store.list, (row) => row.interface));
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText v-model="draft.name" label="Name" name="name" class="col-span-2" />
		<SpecCombobox v-model="draft.type" label="Type" name="type" :options="types" />
		<SpecNumber v-model="draft.capacity" label="Capacity" name="capacity" unit="GB" />
		<SpecCombobox
			v-model="draft.form_factor"
			label="Form factor"
			name="form_factor"
			:options="formFactors"
		/>
		<SpecCombobox
			v-model="draft.interface"
			label="Interface"
			name="interface"
			:options="interfaces"
		/>
		<SpecNumber v-model="draft.cache" label="Cache" name="cache" unit="MB" />
	</div>
</template>
