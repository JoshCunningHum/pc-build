<script setup lang="ts">
const props = defineProps<{ label: string; name: string; options: string[] }>();
const value = defineModel<string[]>({ default: () => [] });

const items = computed(() => {
	const unknown = value.value.filter((entry) => !props.options.includes(entry));
	return [...unknown, ...props.options];
});
</script>

<template>
	<UFormField :label="label" :name="name">
		<USelectMenu
			v-model="value"
			:items="items"
			multiple
			:placeholder="label"
			:search-input="{ placeholder: `Search ${label.toLowerCase()}…` }"
			create-item="always"
			class="w-full"
			@create="value = [...value, $event]"
		/>
	</UFormField>
</template>
