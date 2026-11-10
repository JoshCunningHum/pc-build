<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { formatSpecValue, humanizeKey } from '~/utils/spec-display';

const props = defineProps<{ type: Builds.PartType; spec: SpecsRow }>();

const BASE_KEYS = new Set(['name', 'image', 'title', 'link', 'price']);

const entries = computed(() =>
	Object.entries(props.spec)
		.filter(([key]) => !BASE_KEYS.has(key))
		.map(([key, value]) => ({
			key,
			label: humanizeKey(key),
			value: formatSpecValue(props.type, key, value),
		})),
);
</script>

<template>
	<dl class="space-y-1 pr-1 max-h-72 overflow-y-auto text-sm">
		<div v-for="entry in entries" :key="entry.key" class="flex justify-between gap-3">
			<dt class="text-muted shrink-0">{{ entry.label }}</dt>
			<dd class="text-highlighted text-right break-all">{{ entry.value }}</dd>
		</div>
	</dl>
</template>
