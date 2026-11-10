<script setup lang="ts">
import { useTemplateRef } from 'vue';

defineProps<{ label: string; name: string; unit?: string; step?: number; autofocus?: boolean }>();
const value = defineModel<number | undefined>();

const input = useTemplateRef<HTMLInputElement>('input');

defineExpose({
	focus: () => input.value?.focus(),
});

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
			ref="input"
			:model-value="value ?? ''"
			type="number"
			:step="step"
			:autofocus="autofocus"
			class="w-full"
			@focus="($event.target as HTMLInputElement)?.select()"
			@update:model-value="update"
		/>
	</UFormField>
</template>
