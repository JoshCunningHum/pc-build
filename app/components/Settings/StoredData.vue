<script setup lang="ts">
import type { Builds } from '~/types/build';
import { PART_TYPE_META, SPECS_STORES } from '~/constants/parts';

const partTypes = Object.keys(PART_TYPE_META) as Builds.PartType[];

const deletedByType = computed(() =>
	partTypes
		.map((type) => ({ type, names: SPECS_STORES[type]().deletedSeedNames }))
		.filter((group) => group.names.length > 0),
);

const deletedCount = computed(() =>
	deletedByType.value.reduce((sum, group) => sum + group.names.length, 0),
);

function restore(type: Builds.PartType, name: string): void {
	SPECS_STORES[type]().restore(name);
}
</script>

<template>
	<div class="flex flex-col">
		<SettingsSection
			title="Deleted specs"
			description="Pre-seeded specs you removed from the database. Restoring one brings back its original values; specs you created yourself are gone for good once deleted."
		>
			<p v-if="deletedCount === 0" class="text-muted text-sm">Nothing has been deleted.</p>

			<div v-else class="flex flex-col gap-4 max-w-2xl">
				<div v-for="group in deletedByType" :key="group.type" class="flex flex-col gap-1.5">
					<span class="flex items-center gap-1.5 text-muted text-xs">
						<UIcon :name="PART_TYPE_META[group.type].icon" class="size-3.5" />
						{{ PART_TYPE_META[group.type].label }}
					</span>

					<ul class="border-default border rounded-sm divide-default divide-y">
						<li
							v-for="name in group.names"
							:key="name"
							class="flex justify-between items-center gap-3 px-3 py-1.5"
						>
							<span class="text-highlighted text-sm truncate">{{ name }}</span>
							<UButton
								icon="i-lucide-undo-2"
								color="neutral"
								variant="ghost"
								size="xs"
								@click="restore(group.type, name)"
							>
								Restore
							</UButton>
						</li>
					</ul>
				</div>
			</div>
		</SettingsSection>

		<SettingsSection
			title="Data management"
			description="Everything you have added, edited or deleted lives in this browser's local storage. Not wired up yet."
		>
			<div class="flex flex-wrap gap-2">
				<UButton icon="i-lucide-download" color="neutral" variant="subtle" disabled>
					Export
				</UButton>
				<UButton icon="i-lucide-upload" color="neutral" variant="subtle" disabled> Import </UButton>
				<UButton icon="i-lucide-rotate-ccw" color="error" variant="subtle" disabled>
					Reset all data
				</UButton>
			</div>
		</SettingsSection>
	</div>
</template>
