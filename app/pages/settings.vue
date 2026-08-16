<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const SECTIONS = [
	{ id: 'constants', label: 'Constants', icon: 'i-lucide-list' },
	{ id: 'stored-data', label: 'Stored data', icon: 'i-lucide-database-backup' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const selected = ref<SectionId>('constants');
const draft = provideSettingsDraft();

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

// Navigation is held open on this resolver until the user answers the dialog.
const confirmLeave = ref<(proceed: boolean) => void>();

onBeforeRouteLeave(() => {
	if (!draft.dirty) return true;
	return new Promise<boolean>((resolve) => {
		confirmLeave.value = resolve;
	});
});

function answerLeave(proceed: boolean): void {
	if (proceed) draft.discard();
	confirmLeave.value?.(proceed);
	confirmLeave.value = undefined;
}

useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
	if (draft.dirty) event.preventDefault();
});
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

		<div class="flex flex-col flex-1 min-w-0">
			<div class="flex-1 min-h-0 overflow-y-auto">
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

			<SettingsFooter v-if="draft.dirty" />
		</div>

		<UModal
			:open="!!confirmLeave"
			title="Discard unsaved changes?"
			description="You have settings changes that have not been saved. Leaving this page will discard them."
			@update:open="answerLeave(false)"
		>
			<template #footer>
				<div class="flex justify-end gap-2 w-full">
					<UButton color="neutral" variant="ghost" @click="answerLeave(false)">
						Stay on this page
					</UButton>
					<UButton color="error" @click="answerLeave(true)">Discard and leave</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
