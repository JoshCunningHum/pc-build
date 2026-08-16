<script setup lang="ts">
const draft = useSettingsDraft();
</script>

<template>
	<div class="flex justify-between items-center gap-4 bg-default px-6 py-3 border-default border-t">
		<span class="flex items-center gap-2 text-muted text-sm">
			<UIcon name="i-lucide-circle-dot" class="size-3.5 text-warning" />
			{{ draft.changeCount }} unsaved
			{{ draft.changeCount === 1 ? 'change' : 'changes' }}
		</span>

		<div class="flex gap-2">
			<UButton color="neutral" variant="ghost" @click="draft.discard()">Discard changes</UButton>
			<UButton icon="i-lucide-check" @click="draft.save()">Save changes</UButton>
		</div>
	</div>
</template>
