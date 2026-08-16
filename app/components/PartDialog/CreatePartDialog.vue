<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { SpecsRow } from '~/types/parts';
import { PART_TYPE_META, SPECS_STORES } from '~/constants/parts';

const props = defineProps<{ type: Builds.PartType }>();

const open = defineModel<boolean>('open', { required: true });

const store = computed(() => SPECS_STORES[props.type]());
const form = useTemplateRef('form');
const draft = ref<Record<string, unknown>>({});
const nameError = ref<string>();
const presetName = ref<string>();

const presetNames = computed(() => store.value.list.map((row) => row.name));
const preset = computed(() =>
	presetName.value ? store.value.getByName(presetName.value) : undefined,
);

const presetSpecs = computed(() =>
	Object.entries(preset.value ?? {})
		.filter(([key]) => key !== 'name')
		.map(([key, value]) => ({
			key,
			label: humanizeKey(key),
			value: formatSpecValue(props.type, key, value),
		})),
);

// Everything but the name: the point is to start from an existing spec sheet, and two rows
// can't share a name anyway.
function applyPreset(): void {
	if (!preset.value) return;
	const { name: _name, ...specs } = deepClone(preset.value) as Record<string, unknown>;
	draft.value = { ...draft.value, ...specs };
}

watch(open, (isOpen) => {
	if (!isOpen) return;
	presetName.value = undefined;
	nameError.value = undefined;
});

watch(
	draft,
	() => {
		nameError.value = undefined;
	},
	{ deep: true },
);

async function create(): Promise<void> {
	if (!(await form.value?.validate())) return;

	const next = draft.value as SpecsRow;

	if (store.value.getByName(next.name)) {
		nameError.value = `A ${PART_TYPE_META[props.type].label} named “${next.name}” already exists.`;
		return;
	}

	store.value.upsert(next);
	open.value = false;
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`New ${PART_TYPE_META[type].label}`"
		description="Fill the form, or start from an existing spec as a preset."
		:ui="{ content: 'max-w-5xl' }"
	>
		<template #body>
			<div class="gap-6 grid grid-cols-[18rem_1fr]">
				<aside class="flex flex-col gap-3 pr-6 border-default border-r min-w-0">
					<span class="font-semibold text-highlighted text-sm">Start from an existing spec</span>

					<USelectMenu
						v-model="presetName"
						:items="presetNames"
						:placeholder="`Search ${PART_TYPE_META[type].label.toLowerCase()}s…`"
						:search-input="{ placeholder: 'Search…' }"
						virtualize
						clear
						class="w-full"
					/>

					<template v-if="preset">
						<dl class="space-y-1 pr-1 max-h-80 overflow-y-auto text-sm">
							<div v-for="spec in presetSpecs" :key="spec.key" class="flex justify-between gap-3">
								<dt class="text-muted shrink-0">{{ spec.label }}</dt>
								<dd class="text-highlighted text-right break-all">{{ spec.value }}</dd>
							</div>
						</dl>

						<UButton
							icon="i-lucide-clipboard-paste"
							color="neutral"
							variant="subtle"
							block
							@click="applyPreset"
						>
							Apply to form
						</UButton>
					</template>
				</aside>

				<div class="min-w-0">
					<PartForm ref="form" v-model="draft" :type="type" />
					<p v-if="nameError" class="mt-3 text-error text-sm">{{ nameError }}</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-2 w-full">
				<UButton color="neutral" variant="ghost" @click="open = false">Cancel</UButton>
				<UButton @click="create">Create</UButton>
			</div>
		</template>
	</UModal>
</template>
