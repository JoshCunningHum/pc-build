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
	update: [value: string | number, label: string, secondary: string | undefined];
	remove: [value: string | number];
	move: [value: string | number, delta: number];
}>();

const pending = ref('');
const pendingSecondary = ref('');
const rejected = ref(false);

const editingValue = ref<string | number>();
const editLabel = ref('');
const editSecondary = ref('');
const editRejected = ref(false);

function taken(label: string, exclude?: string | number): boolean {
	return props.items.some(
		(item) => item.value !== exclude && item.label.toLowerCase() === label.toLowerCase(),
	);
}

function commit(): void {
	const label = pending.value.trim();
	if (label === '') return;

	if (taken(label)) {
		rejected.value = true;
		return;
	}

	emit('add', label, pendingSecondary.value.trim() || undefined);
	pending.value = '';
	pendingSecondary.value = '';
	rejected.value = false;
}

function startEdit(item: ConstantEntry): void {
	editingValue.value = item.value;
	editLabel.value = item.label;
	editSecondary.value = item.brand ?? '';
	editRejected.value = false;
}

function cancelEdit(): void {
	editingValue.value = undefined;
	editRejected.value = false;
}

function saveEdit(item: ConstantEntry): void {
	const label = editLabel.value.trim();
	if (label === '') return;

	if (taken(label, item.value)) {
		editRejected.value = true;
		return;
	}

	emit('update', item.value, label, editSecondary.value.trim() || undefined);
	cancelEdit();
}

watch(pending, () => {
	rejected.value = false;
});

watch(editLabel, () => {
	editRejected.value = false;
});
</script>

<template>
	<div class="max-w-2xl">
		<!-- The add row is a sibling of the scroll container, not its last child, so it stays put
		     no matter how long the list gets. -->
		<div class="bg-elevated/30 border border-default rounded-sm overflow-hidden">
			<ul class="divide-y divide-default max-h-72 overflow-y-auto">
				<li
					v-for="(item, index) in items"
					:key="item.value"
					class="group flex items-center gap-2 px-3 py-1.5 min-h-9"
				>
					<template v-if="editingValue === item.value">
						<UInput
							v-model="editLabel"
							size="xs"
							class="flex-1"
							autofocus
							@keydown.enter.prevent="saveEdit(item)"
							@keydown.esc.prevent="cancelEdit"
						/>
						<UInput
							v-if="secondary"
							v-model="editSecondary"
							:placeholder="secondary.placeholder"
							size="xs"
							class="w-32"
							@keydown.enter.prevent="saveEdit(item)"
							@keydown.esc.prevent="cancelEdit"
						/>

						<span class="flex items-center gap-0.5">
							<UButton
								icon="i-lucide-check"
								color="primary"
								variant="ghost"
								size="xs"
								:disabled="editLabel.trim() === ''"
								aria-label="Save changes"
								@click="saveEdit(item)"
							/>
							<UButton
								icon="i-lucide-x"
								color="neutral"
								variant="ghost"
								size="xs"
								aria-label="Cancel"
								@click="cancelEdit"
							/>
						</span>
					</template>

					<template v-else>
						<span class="flex-1 text-highlighted text-sm truncate">{{ item.label }}</span>

						<span v-if="secondary" class="text-muted text-xs shrink-0">
							{{ item.brand ?? '—' }}
						</span>

						<span
							class="flex items-center gap-0.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity"
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
								icon="i-lucide-pencil"
								color="neutral"
								variant="ghost"
								size="xs"
								:aria-label="`Edit ${item.label}`"
								@click="startEdit(item)"
							/>
							<UButton
								icon="i-lucide-x"
								color="error"
								variant="ghost"
								size="xs"
								:aria-label="`Remove ${item.label}`"
								@click="emit('remove', item.value)"
							/>
						</span>
					</template>
				</li>

				<li v-if="items.length === 0" class="px-3 py-1.5 text-muted text-sm">
					Nothing configured yet.
				</li>
			</ul>

			<div class="bg-default px-3 py-1.5 border-default border-t">
				<UFieldGroup v-if="secondary" size="sm" class="w-full">
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
				</UFieldGroup>

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
			</div>
		</div>

		<p v-if="rejected" class="mt-1 text-error text-xs">“{{ pending }}” is already in this list.</p>
		<p v-if="editRejected" class="mt-1 text-error text-xs">
			“{{ editLabel }}” is already in this list.
		</p>
	</div>
</template>
