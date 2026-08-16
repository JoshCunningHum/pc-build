<script setup lang="ts">
defineProps<{ label: string; name: string; unit?: string; step?: number }>();
const value = defineModel<number | undefined>();

function update(raw: string | number): void {
	const text = String(raw).trim();
	if (text === '') {
		value.value = undefined;
		return;
	}
	const parsed = Number(text);
	value.value = Number.isNaN(parsed) ? undefined : parsed;
}
</script>

<template>
	<UFormField :label="unit ? `${label} (${unit})` : label" :name="name">
		<UInput
			:model-value="value ?? ''"
			type="number"
			:step="step"
			class="w-full"
			@update:model-value="update"
		/>
	</UFormField>
</template>
