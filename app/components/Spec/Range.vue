<script setup lang="ts">
defineProps<{ label: string; name: string; unit?: string }>();
const value = defineModel<number | [number, number] | undefined>();

const isRange = ref(Array.isArray(value.value));

const low = computed(() => (Array.isArray(value.value) ? value.value[0] : value.value));
const high = computed(() => (Array.isArray(value.value) ? value.value[1] : undefined));

function parse(raw: string | number): number | undefined {
	const text = String(raw).trim();
	if (text === '') return undefined;
	const parsed = Number(text);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function setSingle(raw: string | number): void {
	value.value = parse(raw);
}

function setLow(raw: string | number): void {
	const next = parse(raw);
	value.value = next === undefined ? undefined : [next, high.value ?? next];
}

function setHigh(raw: string | number): void {
	const next = parse(raw);
	value.value = [low.value ?? next ?? 0, next ?? low.value ?? 0];
}

// Switching mode has to rewrite the stored shape, not just the layout: `MaybeRange` is
// either a number or a tuple, and validation reads whichever is there.
watch(isRange, (range) => {
	if (range) value.value = [low.value ?? 0, high.value ?? low.value ?? 0];
	else value.value = low.value;
});
</script>

<template>
	<UFormField :label="unit ? `${label} (${unit})` : label" :name="name">
		<template #hint>
			<USwitch v-model="isRange" label="Range" size="xs" />
		</template>

		<UInput
			v-if="!isRange"
			:model-value="low ?? ''"
			type="number"
			class="w-full"
			@update:model-value="setSingle"
		/>
		<div v-else class="flex items-center gap-2">
			<UInput
				:model-value="low ?? ''"
				type="number"
				placeholder="Min"
				class="flex-1"
				@update:model-value="setLow"
			/>
			<span class="text-muted text-xs">to</span>
			<UInput
				:model-value="high ?? ''"
				type="number"
				placeholder="Max"
				class="flex-1"
				@update:model-value="setHigh"
			/>
		</div>
	</UFormField>
</template>
