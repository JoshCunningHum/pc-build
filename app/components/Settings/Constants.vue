<script setup lang="ts">
import { CONSTANT_META, useConstantsStore } from '~/stores/constants';

const constants = useConstantsStore();
const draft = useSettingsDraft();

onMounted(() => constants.seedWhenLoaded());
</script>

<template>
	<div v-if="!constants.catalogReady" class="flex items-center gap-2 py-6 text-muted text-sm">
		<UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
		<span>Loading the catalog to fill these lists…</span>
	</div>

	<div v-else class="flex flex-col">
		<SettingsSection
			v-for="meta in CONSTANT_META"
			:key="meta.id"
			:title="meta.title"
			:description="meta.description"
		>
			<SettingsEditableList
				:items="draft.list(meta.id)"
				:orderable="meta.orderable"
				:secondary="meta.secondary"
				@add="(label, secondary) => draft.add(meta.id, label, secondary)"
				@update="(value, label, secondary) => draft.update(meta.id, value, label, secondary)"
				@remove="draft.remove(meta.id, $event)"
				@move="(value, delta) => draft.move(meta.id, value, delta)"
			/>

			<div class="flex items-center gap-3 mt-2">
				<span class="text-muted text-xs">{{ draft.list(meta.id).length }} entries</span>
				<UButton
					color="neutral"
					variant="link"
					size="xs"
					class="p-0"
					@click="draft.resetToCatalog(meta.id)"
				>
					Reset to catalog defaults
				</UButton>
			</div>
		</SettingsSection>
	</div>
</template>
