<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { PART_TYPE_META, SPECS_STORES } from '~/constants/parts';

const props = defineProps<{ type: Builds.PartType; part: SpecsRow }>();

const open = defineModel<boolean>('open', { required: true });

const store = computed(() => SPECS_STORES[props.type]());
const form = useTemplateRef('form');
const draft = ref<Record<string, unknown>>({});
const nameError = ref<string>();

interface Change {
	key: string;
	label: string;
	from: string;
	to: string;
}

const changes = computed<Change[]>(() => {
	const original = props.part as Record<string, unknown>;
	const keys = new Set([...Object.keys(original), ...Object.keys(draft.value)]);

	return [...keys]
		.filter((key) => JSON.stringify(original[key]) !== JSON.stringify(draft.value[key]))
		.map((key) => ({
			key,
			label: humanizeKey(key),
			from: formatSpecValue(props.type, key, original[key]),
			to: formatSpecValue(props.type, key, draft.value[key]),
		}));
});

watch(
	draft,
	() => {
		nameError.value = undefined;
	},
	{ deep: true },
);

async function save(): Promise<void> {
	if (!(await form.value?.validate())) return;

	const next = draft.value as SpecsRow;
	const renamed = next.name !== props.part.name;

	if (renamed && store.value.getByName(next.name)) {
		nameError.value = `A ${PART_TYPE_META[props.type].label} named “${next.name}” already exists.`;
		return;
	}

	if (renamed) store.value.rename(props.part.name, next);
	else store.value.upsert(next);

	open.value = false;
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`Edit ${PART_TYPE_META[type].label}`"
		:description="part.name"
		:ui="{ content: 'max-w-5xl' }"
	>
		<template #body>
			<div class="gap-6 grid grid-cols-[18rem_1fr]">
				<aside class="flex flex-col gap-2 pr-6 border-default border-r min-w-0">
					<span class="font-semibold text-highlighted text-sm">Changes</span>

					<p v-if="!changes.length" class="text-muted text-sm">
						No changes yet. Edit a field to see it listed here.
					</p>

					<ul v-else class="space-y-2 text-sm">
						<li v-for="change in changes" :key="change.key" class="flex flex-col gap-0.5">
							<span class="text-muted text-xs">{{ change.label }}</span>
							<span class="flex flex-wrap items-center gap-1.5 min-w-0">
								<span class="text-muted line-through break-all">{{ change.from }}</span>
								<UIcon name="i-lucide-arrow-right" class="size-3 shrink-0" />
								<span class="text-highlighted break-all">{{ change.to }}</span>
							</span>
						</li>
					</ul>
				</aside>

				<div class="min-w-0">
					<PartForm ref="form" v-model="draft" :type="type" :part="part" />
					<p v-if="nameError" class="mt-3 text-error text-sm">{{ nameError }}</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-2 w-full">
				<UButton color="neutral" variant="ghost" @click="open = false">Cancel</UButton>
				<UButton :disabled="!changes.length" @click="save">Save</UButton>
			</div>
		</template>
	</UModal>
</template>
