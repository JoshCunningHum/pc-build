<script setup lang="ts" generic="TValue extends string | number | boolean">
defineProps<{
	label: string;
	name: string;
	items: { label: string; value: TValue }[];
	clearable?: boolean;
}>();
const value = defineModel<TValue | undefined>();
</script>

<template>
	<UFormField :label="label" :name="name">
		<USelectMenu
			v-model="value"
			:items="items"
			:placeholder="label"
			:search-input="items.length > 8 ? undefined : false"
			value-key="value"
			:clear="clearable"
			class="w-full"
		/>
	</UFormField>
</template>
