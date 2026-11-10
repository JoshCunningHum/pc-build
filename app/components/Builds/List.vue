<script setup lang="ts">
import type { Builds } from '~/types/build';
import { validateBuild } from '~/lib/rules';
import { resolveBuild } from '~/utils/builds';

const buildsStore = useBuildsStore();
const tabs = useBuildTabsStore();

const compareQueue = ref<string[]>([]);
const deleting = ref<Builds.ResolvedBuild>();
const hoveredBuild = ref<string>();

const entries = computed(() =>
	buildsStore.list.map((stored) => {
		const build = resolveBuild(stored);
		return {
			build,
			issues: validateBuild({ name: build.name, parts: build.parts }),
		};
	}),
);

const selectedCount = computed(() => compareQueue.value.length);

function isSelected(name: string): boolean {
	return compareQueue.value.includes(name);
}

function toggleCompare(name: string): void {
	compareQueue.value = isSelected(name)
		? compareQueue.value.filter((item) => item !== name)
		: [...compareQueue.value, name];
}

function openBuild(name: string): void {
	tabs.openBuild(name);
}

function createBuild(): void {
	tabs.openCreate();
}

function openComparison(): void {
	if (compareQueue.value.length < 2) return;
	tabs.openComparison(compareQueue.value);
	compareQueue.value = [];
}

function clearQueue(): void {
	compareQueue.value = [];
}

defineShortcuts({
	n: () => {
		if (deleting.value) return;
		createBuild();
	},
	e: () => {
		if (!hoveredBuild.value || deleting.value) return;
		openBuild(hoveredBuild.value);
	},
	d: () => {
		if (!hoveredBuild.value) return;
		const entry = entries.value.find((item) => item.build.name === hoveredBuild.value);
		if (entry) deleting.value = entry.build;
	},
});

function confirmDelete(): void {
	if (!deleting.value) return;
	const name = deleting.value.name;
	buildsStore.remove(name);
	tabs.closeBuild(name);
	compareQueue.value = compareQueue.value.filter((item) => item !== name);
	deleting.value = undefined;
}
</script>

<template>
	<div class="flex flex-col h-full min-h-0">
		<header class="flex flex-wrap justify-between items-start gap-4 p-4 border-default border-b">
			<div class="min-w-0">
				<h1 class="font-semibold text-highlighted text-xl">Build List</h1>
				<p class="mt-1 text-muted text-sm">
					Assemble parts, see what they cost, and compare them side by side.
				</p>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<UButton
					v-if="selectedCount > 0"
					color="neutral"
					variant="ghost"
					size="sm"
					@click="clearQueue"
				>
					Clear
				</UButton>
				<UButton
					icon="i-lucide-git-compare"
					color="neutral"
					variant="outline"
					size="sm"
					:disabled="selectedCount < 2"
					@click="openComparison"
				>
					Compare{{ selectedCount >= 2 ? ` ${selectedCount}` : '' }}
				</UButton>
				<UButton icon="i-lucide-plus" variant="outline" size="sm" @click="createBuild">
					Create
					<UKbd value="N" size="sm" class="ml-1" />
				</UButton>
			</div>
		</header>

		<div class="flex-1 p-4 min-h-0 overflow-y-auto">
			<div
				v-if="entries.length === 0"
				class="flex flex-col justify-center items-center gap-3 border-default border border-dashed rounded-sm min-h-64 p-6 text-center"
			>
				<UIcon name="i-lucide-blocks" class="size-10 text-muted" />
				<div>
					<p class="font-medium text-highlighted">No builds yet</p>
					<p class="mt-1 text-muted text-sm">
						Create a build and pick listings from your Parts shortlist.
					</p>
				</div>
				<UButton icon="i-lucide-plus" variant="outline" @click="createBuild">
					Create your first build
				</UButton>
			</div>

			<div v-else class="flex flex-col gap-4">
				<BuildsCard
					v-for="entry in entries"
					:key="entry.build.name"
					:build="entry.build"
					:issues="entry.issues"
					:compare-selected="isSelected(entry.build.name)"
					@mouseenter="hoveredBuild = entry.build.name"
					@mouseleave="hoveredBuild = undefined"
					@open="openBuild(entry.build.name)"
					@delete="deleting = entry.build"
					@toggle-compare="toggleCompare(entry.build.name)"
				/>
			</div>
		</div>

		<UModal
			:open="!!deleting"
			title="Delete build"
			:description="`Delete “${deleting?.name}”? This removes the build, not its Parts listings.`"
			@update:open="deleting = undefined"
		>
			<template #footer>
				<div class="flex justify-end gap-2 w-full">
					<UButton color="neutral" variant="ghost" @click="deleting = undefined"> Cancel </UButton>
					<UButton color="error" @click="confirmDelete">Delete</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
