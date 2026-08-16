<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const SECTIONS = [
	{ id: 'constants', label: 'Constants', icon: 'i-lucide-list' },
	{ id: 'stored-data', label: 'Stored data', icon: 'i-lucide-database-backup' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const selected = ref<SectionId>('constants');

const items = computed<NavigationMenuItem[]>(() =>
	SECTIONS.map((section) => ({
		label: section.label,
		icon: section.icon,
		active: section.id === selected.value,
		onSelect: () => {
			selected.value = section.id;
		},
	})),
);

const active = computed(() => SECTIONS.find((section) => section.id === selected.value));
</script>

<template>
	<div class="flex flex-1 h-full min-h-0">
		<aside class="flex flex-col border-default border-r w-56 shrink-0">
			<div class="px-4 py-3 h-fit">
				<span class="font-semibold text-highlighted text-sm">Settings</span>
			</div>
			<div class="flex-1 p-2 overflow-y-auto">
				<UNavigationMenu :items="items" orientation="vertical" />
			</div>
		</aside>

		<div class="flex-1 min-w-0 overflow-y-auto">
			<div class="mx-auto p-6 max-w-4xl">
				<h2 class="font-semibold text-highlighted text-lg">{{ active?.label }}</h2>
				<p v-if="selected === 'constants'" class="mt-1 text-muted text-sm">
					The values the add and edit forms offer. These only shape what you can pick — changing
					them never rewrites specs already in the database.
				</p>

				<SettingsConstants v-if="selected === 'constants'" class="mt-4" />
				<SettingsStoredData v-else class="mt-4" />
			</div>
		</div>
	</div>
</template>
