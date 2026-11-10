<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { PartsRow } from '~/types/parts';
import { PART_TYPE_META, PART_TYPE_ROUTES } from '~/constants/parts';
import { formatPrice } from '~/utils/format';
import { isPartIncomplete } from '~/utils/parts';

const props = defineProps<{
	type: Builds.PartType;
	part?: PartsRow;
	missingTitle?: string;
}>();

const emit = defineEmits<{ remove: [] }>();

const meta = computed(() => PART_TYPE_META[props.type]);
const link = computed(() => {
	if (!props.part) return undefined;
	return {
		path: PART_TYPE_ROUTES[props.type],
		query: { listing: props.part.title },
	};
});
</script>

<template>
	<div v-if="part" class="flex items-center gap-3 border-default border rounded-sm p-2.5 min-w-0">
		<div
			class="flex justify-center items-center bg-elevated/50 border-default border rounded-sm w-9 h-9 shrink-0 overflow-hidden"
		>
			<img
				v-if="part.image"
				:src="part.image"
				:alt="part.title"
				class="w-full h-full object-cover"
			/>
			<UIcon v-else :name="meta.icon" class="size-4 text-muted" />
		</div>

		<div class="flex-1 min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<span class="font-medium text-highlighted text-sm break-all">{{ part.title }}</span>
				<UBadge v-if="isPartIncomplete(part)" color="warning" variant="subtle" size="sm">
					Incomplete
				</UBadge>
			</div>
			<p class="text-muted text-xs break-all">{{ part.name }}</p>
		</div>

		<span class="font-medium text-sm tabular-nums shrink-0">{{ formatPrice(part.price) }}</span>

		<div class="flex items-center gap-1 shrink-0">
			<UButton
				v-if="link"
				:to="link"
				target="_blank"
				rel="noopener noreferrer"
				icon="i-lucide-square-pen"
				color="neutral"
				variant="ghost"
				size="xs"
				:aria-label="`Edit ${part.title} in Parts`"
			/>
			<UButton
				icon="i-lucide-x"
				color="neutral"
				variant="ghost"
				size="xs"
				:aria-label="`Remove ${part.title}`"
				@click="emit('remove')"
			/>
		</div>
	</div>

	<div
		v-else
		class="flex items-center gap-3 border-default border border-dashed rounded-sm p-2.5 min-w-0"
	>
		<UIcon name="i-lucide-triangle-alert" class="size-4 text-error shrink-0" />
		<div class="flex-1 min-w-0">
			<p class="font-medium text-sm text-highlighted">Missing listing</p>
			<p class="text-muted text-xs break-all">{{ missingTitle }}</p>
		</div>
		<UButton
			icon="i-lucide-x"
			color="neutral"
			variant="ghost"
			size="xs"
			aria-label="Remove missing listing"
			@click="emit('remove')"
		/>
	</div>
</template>
