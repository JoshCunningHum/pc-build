<script setup lang="ts">
defineProps<{ label: string; name: string; placeholder?: string; disabled?: boolean }>();
const value = defineModel<string | undefined>();

function update(raw: string | number): void {
	const text = String(raw).trim();
	value.value = text === '' ? undefined : text;
}
</script>

<template>
	<UFormField :label="label" :name="name">
		<UInput
			:model-value="value ?? ''"
			:placeholder="placeholder"
			:disabled="disabled"
			class="w-full"
			@update:model-value="update"
		/>
	</UFormField>
</template>
