<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
	<section class="flex flex-col gap-2 py-5 border-default border-b last:border-b-0">
		<div class="flex flex-col gap-0.5">
			<h3 class="font-medium text-highlighted text-sm">{{ title }}</h3>
			<p v-if="description" class="max-w-2xl text-muted text-xs">{{ description }}</p>
		</div>

		<div class="mt-1">
			<slot />
		</div>
	</section>
</template>
