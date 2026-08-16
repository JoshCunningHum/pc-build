<script setup lang="ts">
defineProps<{ label: string; name: string }>();
const value = defineModel<boolean | undefined>();
</script>

<template>
	<UFormField :name="name">
		<UCheckbox
			:model-value="value ?? false"
			:label="label"
			@update:model-value="value = $event === true"
		/>
	</UFormField>
</template>
