<script setup lang="ts">
import { buildTotalPrice, resolveBuild } from '~/utils/builds';
import { formatPrice } from '~/utils/format';

const props = withDefaults(
	defineProps<{
		modelValue: string[];
		/** Builds that cannot be removed, e.g. the build whose tab is comparing in place. */
		locked?: string[];
		buttonLabel?: string;
		buttonIcon?: string;
		buttonColor?: 'primary' | 'neutral';
		buttonVariant?: 'solid' | 'subtle' | 'ghost' | 'outline';
		confirmLabel?: string;
	}>(),
	{
		locked: () => [],
		buttonLabel: 'Compare',
		buttonIcon: 'i-lucide-git-compare',
		buttonColor: 'neutral',
		buttonVariant: 'subtle',
		confirmLabel: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [names: string[]];
	confirm: [];
}>();

const buildsStore = useBuildsStore();

const open = ref(false);
const search = ref('');

const items = computed(() => {
	const query = search.value.trim().toLowerCase();
	const list = buildsStore.list.toSorted((a, b) => a.name.localeCompare(b.name));
	return query ? list.filter((build) => build.name.toLowerCase().includes(query)) : list;
});

function isSelected(name: string): boolean {
	return props.modelValue.includes(name);
}

function isLocked(name: string): boolean {
	return props.locked.includes(name);
}

function toggle(name: string): void {
	if (isLocked(name)) return;
	const next = isSelected(name)
		? props.modelValue.filter((item) => item !== name)
		: [...props.modelValue, name];
	emit('update:modelValue', next);
}

function priceOf(name: string): string {
	const build = buildsStore.getByName(name);
	if (!build) return '—';
	return formatPrice(buildTotalPrice(resolveBuild(build)));
}

function confirm(): void {
	emit('confirm');
	open.value = false;
}
</script>

<template>
	<UPopover v-model:open="open">
		<UButton
			:icon="buttonIcon"
			:label="buttonLabel"
			:color="buttonColor"
			:variant="buttonVariant"
			size="sm"
		/>

		<template #content>
			<div class="flex flex-col gap-3 p-3 w-80 max-w-[90vw]">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Search builds…"
					size="sm"
					autofocus
				/>

				<div v-if="items.length === 0" class="py-6 text-center text-muted text-sm">
					No builds match “{{ search }}”.
				</div>

				<div v-else class="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
					<button
						v-for="build in items"
						:key="build.name"
						type="button"
						class="flex items-center gap-3 hover:bg-elevated/60 disabled:opacity-60 p-2 rounded-sm text-left transition-colors disabled:cursor-not-allowed"
						:disabled="isLocked(build.name)"
						@click="toggle(build.name)"
					>
						<UCheckbox
							:model-value="isSelected(build.name)"
							:disabled="isLocked(build.name)"
							tabindex="-1"
							class="pointer-events-none"
						/>
						<span class="flex-1 min-w-0 font-medium text-highlighted text-sm truncate">
							{{ build.name }}
						</span>
						<span class="text-muted text-xs tabular-nums shrink-0">
							{{ priceOf(build.name) }}
						</span>
					</button>
				</div>

				<div class="flex justify-between items-center gap-2 pt-2 border-default border-t">
					<span class="text-muted text-xs">
						{{ modelValue.length }} selected
						<span v-if="locked.length"> · current build locked</span>
					</span>
					<UButton v-if="confirmLabel" size="sm" :disabled="modelValue.length < 2" @click="confirm">
						{{ confirmLabel }}
					</UButton>
				</div>
			</div>
		</template>
	</UPopover>
</template>
