<script setup lang="ts">
import type { Parts } from '~/types/parts';
import { isPartIncomplete, missingPartFields } from '~/utils/parts';

const draft = defineModel<Partial<Parts.Base>>({ required: true });

const incomplete = computed(() => isPartIncomplete(draft.value));
const missing = computed(() => missingPartFields(draft.value));

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const priceField = useTemplateRef<{ focus: () => void }>('priceField');
const imageError = ref<string>();

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const imageUrl = computed({
	get: () => (draft.value.image?.startsWith('data:') ? '' : draft.value.image),
	set: (value) => {
		draft.value.image = value?.trim() || undefined;
		imageError.value = undefined;
	},
});

function focusPrice(): void {
	priceField.value?.focus();
}

function chooseImage(): void {
	fileInput.value?.click();
}

defineExpose({ focusPrice });

function onFile(event: Event): void {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;

	if (!file.type.startsWith('image/')) {
		imageError.value = 'Choose an image file.';
		input.value = '';
		return;
	}

	if (file.size > MAX_IMAGE_BYTES) {
		imageError.value = 'Images must be 2 MB or smaller.';
		input.value = '';
		return;
	}

	const reader = new FileReader();
	reader.addEventListener('load', () => {
		if (typeof reader.result !== 'string') return;
		draft.value.image = reader.result;
		imageError.value = undefined;
	});
	reader.readAsDataURL(file);
	input.value = '';
}
</script>

<template>
	<div class="gap-4 grid grid-cols-2">
		<SpecText
			v-model="draft.title"
			label="Title"
			name="title"
			placeholder="Ryzen 5 5600 — FB Marketplace, Cebu"
			class="col-span-2"
		/>
		<SpecNumber
			ref="priceField"
			v-model="draft.price"
			label="Price"
			name="price"
			unit="₱"
			autofocus
		/>
		<SpecText
			v-model="draft.link"
			label="Source link (optional)"
			name="link"
			placeholder="https://…"
			class="col-span-2"
		/>

		<p v-if="incomplete" class="col-span-2 flex items-center gap-2 text-muted text-xs">
			<UBadge color="warning" variant="subtle" size="sm" label="Incomplete" />
			<span>
				Missing {{ missing.join(' and ') }} — optional, but the listing stays flagged until you add
				{{ missing.length === 1 ? 'it' : 'them' }}.
			</span>
		</p>

		<UFormField label="Photo" name="image" class="col-span-2">
			<div class="flex gap-2">
				<UInput
					v-model="imageUrl"
					placeholder="Paste an image URL, or upload a file"
					class="flex-1"
				/>
				<UButton
					type="button"
					icon="i-lucide-image-plus"
					color="neutral"
					variant="subtle"
					@click="chooseImage"
				>
					Upload
				</UButton>
				<input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
			</div>

			<p v-if="imageError" class="mt-1 text-error text-xs">{{ imageError }}</p>

			<div v-if="draft.image" class="flex items-center gap-3 mt-3">
				<img
					:src="draft.image"
					alt="Listing photo preview"
					class="border-default border rounded-sm w-24 h-24 object-cover"
				/>
				<UButton
					type="button"
					icon="i-lucide-trash-2"
					color="error"
					variant="ghost"
					size="xs"
					@click="draft.image = undefined"
				>
					Remove photo
				</UButton>
			</div>
		</UFormField>
	</div>
</template>
