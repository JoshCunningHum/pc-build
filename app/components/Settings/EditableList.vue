<script setup lang="ts">
import type { ConstantEntry, ConstantMeta } from '~/stores/constants';

const props = defineProps<{
	items: ConstantEntry[];
	orderable?: boolean;
	secondary?: ConstantMeta['secondary'];
	placeholder?: string;
}>();

const emit = defineEmits<{
	add: [label: string, secondary: string | undefined];
	remove: [value: string | number];
	move: [value: string | number, delta: number];
}>();

const pending = ref('');
const pendingSecondary = ref('');
const rejected = ref(false);

function commit(): void {
	const label = pending.value.trim();
	if (label === '') return;

	if (props.items.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
		rejected.value = true;
		return;
	}

	emit('add', label, pendingSecondary.value.trim() || undefined);
	pending.value = '';
	pendingSecondary.value = '';
	rejected.value = false;
}

watch(pending, () => {
	rejected.value = false;
});
</script>

<template>
	<div class="max-w-2xl">
		<ul
			class="border-default bg-elevated/30 border rounded-sm max-h-72 overflow-y-auto divide-default divide-y"
		>
			<li
				v-for="(item, index) in items"
				:key="item.value"
				class="group flex items-center gap-2 px-3 py-1.5"
			>
				<span class="flex-1 text-highlighted text-sm truncate">{{ item.label }}</span>

				<span v-if="secondary" class="text-muted text-xs shrink-0">
					{{ item.brand ?? '—' }}
				</span>

				<span
					class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
				>
					<template v-if="orderable">
						<UButton
							icon="i-lucide-arrow-up"
							color="neutral"
							variant="ghost"
							size="xs"
							:disabled="index === 0"
							:aria-label="`Move ${item.label} up`"
							@click="emit('move', item.value, -1)"
						/>
						<UButton
							icon="i-lucide-arrow-down"
							color="neutral"
							variant="ghost"
							size="xs"
							:disabled="index === items.length - 1"
							:aria-label="`Move ${item.label} down`"
							@click="emit('move', item.value, 1)"
						/>
					</template>
					<UButton
						icon="i-lucide-x"
						color="error"
						variant="ghost"
						size="xs"
						:aria-label="`Remove ${item.label}`"
						@click="emit('remove', item.value)"
					/>
				</span>
			</li>

			<li class="px-3 py-1.5">
				<UButtonGroup v-if="secondary" size="sm" class="w-full">
					<UInput
						v-model="pending"
						:placeholder="placeholder ?? 'Add item…'"
						class="flex-1"
						@keydown.enter.prevent="commit"
					/>
					<UInput
						v-model="pendingSecondary"
						:placeholder="secondary.placeholder"
						class="w-40"
						@keydown.enter.prevent="commit"
					/>
					<UButton
						icon="i-lucide-plus"
						color="neutral"
						variant="subtle"
						:disabled="pending.trim() === ''"
						@click="commit"
					>
						Add
					</UButton>
				</UButtonGroup>

				<UInput
					v-else
					v-model="pending"
					:placeholder="placeholder ?? 'Add item…'"
					variant="none"
					size="sm"
					class="w-full"
					:ui="{ base: 'px-0' }"
					@keydown.enter.prevent="commit"
				/>
			</li>
		</ul>

		<p v-if="rejected" class="mt-1 text-error text-xs">“{{ pending }}” is already in this list.</p>
	</div>
</template>
