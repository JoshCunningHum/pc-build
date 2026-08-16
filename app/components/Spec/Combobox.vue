<script setup lang="ts">
const props = defineProps<{ label: string; name: string; options: string[] }>();
const value = defineModel<string | undefined>();

// A user-authored value won't be in the catalog yet, so it has to be added to the option
// list too -- USelectMenu only renders a selection it can find among its items.
const items = computed(() =>
	value.value && !props.options.includes(value.value)
		? [value.value, ...props.options]
		: props.options,
);

function update(raw: string | null): void {
	value.value = raw === null || raw === '' ? undefined : raw;
}
</script>

<template>
	<UFormField :label="label" :name="name">
		<USelectMenu
			:model-value="value ?? undefined"
			:items="items"
			:placeholder="label"
			:search-input="{ placeholder: `Search or type a new ${label.toLowerCase()}…` }"
			create-item="always"
			clear
			class="w-full"
			@update:model-value="update"
			@create="update($event)"
		/>
	</UFormField>
</template>
