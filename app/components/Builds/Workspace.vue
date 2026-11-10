<script setup lang="ts">
import type { BuildTab } from '~/stores/build-tabs';

const buildsStore = useBuildsStore();
const tabs = useBuildTabsStore();
const route = useRoute();
const router = useRouter();

const dirtyTabs = reactive<Record<string, boolean>>({});
const syncingFromRoute = ref(false);
const pendingClose = ref<BuildTab>();

tabs.syncBuilds(buildsStore.list.map((build) => build.name));

watch(
	() => buildsStore.list.map((build) => build.name).join('\u0000'),
	() => tabs.syncBuilds(buildsStore.list.map((build) => build.name)),
);

const hasDirty = computed(() => Object.values(dirtyTabs).some(Boolean));

function tabLabel(tab: BuildTab): string {
	switch (tab.kind) {
		case 'builds':
			return 'Builds';
		case 'create':
			return 'Create build';
		case 'build':
			return tab.buildName ?? 'Build';
		case 'compare': {
			const count = tab.buildNames?.length ?? 0;
			return `Compare ${count} build${count === 1 ? '' : 's'}`;
		}
	}
}

function tabIcon(tab: BuildTab): string {
	switch (tab.kind) {
		case 'builds':
			return 'i-lucide-blocks';
		case 'create':
			return 'i-lucide-plus';
		case 'build':
			return 'i-lucide-cpu';
		case 'compare':
			return 'i-lucide-git-compare';
	}
}

function buildQueryFromTab(tab: BuildTab | undefined): Record<string, string> {
	if (!tab) return {};
	if (tab.kind === 'build' && tab.buildName) return { build: tab.buildName };
	if (tab.kind === 'create') return { create: '1' };
	if (tab.kind === 'compare' && tab.buildNames?.length)
		return { compare: tab.buildNames.join(',') };
	return {};
}

function applyRouteToTabs(): void {
	const query = route.query;
	if (typeof query.build === 'string' && query.build) {
		tabs.openBuild(query.build);
		return;
	}
	if (query.create === '1') {
		tabs.openCreate();
		return;
	}
	if (typeof query.compare === 'string' && query.compare) {
		tabs.openComparison(query.compare.split(',').filter(Boolean));
		return;
	}
	const buildsTab = tabs.tabs.find((tab) => tab.kind === 'builds');
	if (buildsTab) tabs.activateTab(buildsTab.id);
}

function syncRouteFromTabs(mode: 'push' | 'replace' = 'replace'): void {
	const query = buildQueryFromTab(tabs.activeTab);
	const current = route.query;
	const same =
		Object.keys(query).length === Object.keys(current).length &&
		Object.entries(query).every(([key, value]) => current[key] === value);
	if (same) return;

	const target = { path: '/builds', query };
	if (mode === 'push') void router.push(target);
	else void router.replace(target);
}

// Keep the URL in sync with the active tab so browser back/forward work.
watch(
	() => tabs.activeTab?.id,
	() => {
		if (syncingFromRoute.value) return;
		syncRouteFromTabs('push');
	},
);

watch(
	() => route.fullPath,
	() => {
		syncingFromRoute.value = true;
		applyRouteToTabs();
		syncingFromRoute.value = false;
	},
	{ immediate: true },
);

function onDirtyChange(payload: { tabId: string; dirty: boolean }): void {
	dirtyTabs[payload.tabId] = payload.dirty;
}

function onSaved(
	tabId: string,
	payload: { created: boolean; previousName?: string; name: string },
): void {
	delete dirtyTabs[tabId];

	if (payload.created) {
		tabs.convertCreateToBuild(tabId, payload.name);
	} else if (payload.previousName && payload.previousName !== payload.name) {
		tabs.renameBuild(payload.previousName, payload.name);
	}

	dirtyTabs[`build:${payload.name}`] = false;
}

function requestClose(tab: BuildTab): void {
	if (tab.kind === 'builds') return;
	if (dirtyTabs[tab.id]) {
		pendingClose.value = tab;
		return;
	}
	tabs.closeTab(tab.id);
}

function discardAndClose(): void {
	if (!pendingClose.value) return;
	const tab = pendingClose.value;
	pendingClose.value = undefined;
	delete dirtyTabs[tab.id];
	tabs.closeTab(tab.id);
}

// Navigation is held open on this resolver until the user answers the dialog.
const confirmLeave = ref<(proceed: boolean) => void>();

onBeforeRouteLeave(() => {
	if (!hasDirty.value) return true;
	return new Promise<boolean>((resolve) => {
		confirmLeave.value = resolve;
	});
});

function answerLeave(proceed: boolean): void {
	confirmLeave.value?.(proceed);
	confirmLeave.value = undefined;
}

useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
	if (hasDirty.value) event.preventDefault();
});
</script>

<template>
	<div class="flex flex-col h-full min-h-0">
		<div
			class="flex items-stretch gap-1 px-2 border-default border-b overflow-x-auto shrink-0"
			role="tablist"
			aria-label="Builds workspace tabs"
		>
			<div
				v-for="tab in tabs.tabs"
				:key="tab.id"
				class="flex items-center border-b-2"
				:class="
					tab.id === tabs.activeId ? 'border-primary' : 'border-transparent hover:border-default'
				"
			>
				<button
					type="button"
					role="tab"
					:aria-selected="tab.id === tabs.activeId"
					class="flex items-center gap-2 px-2.5 py-2 max-w-52 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
					:class="tab.id === tabs.activeId ? 'text-highlighted' : 'text-muted hover:text-default'"
					@click="tabs.activateTab(tab.id)"
				>
					<UIcon :name="tabIcon(tab)" class="size-3.5 shrink-0" />
					<span class="truncate">{{ tabLabel(tab) }}</span>
					<span
						v-if="dirtyTabs[tab.id]"
						class="bg-primary rounded-full size-1.5 shrink-0"
						aria-label="Unsaved changes"
					/>
				</button>
				<UButton
					v-if="tab.kind !== 'builds'"
					icon="i-lucide-x"
					color="neutral"
					variant="ghost"
					size="xs"
					class="mr-1"
					:aria-label="`Close ${tabLabel(tab)}`"
					@click.stop="requestClose(tab)"
				/>
			</div>
		</div>

		<div class="flex-1 min-h-0">
			<div
				v-for="tab in tabs.tabs"
				v-show="tab.id === tabs.activeId"
				:key="tab.id"
				class="h-full min-h-0"
			>
				<BuildsList v-if="tab.kind === 'builds'" />

				<BuildsEditor
					v-else-if="tab.kind === 'create' || tab.kind === 'build'"
					:tab-id="tab.id"
					:build-name="tab.buildName"
					@dirty-change="onDirtyChange"
					@saved="onSaved(tab.id, $event)"
				/>

				<BuildsComparison
					v-else-if="tab.kind === 'compare'"
					:build-names="tab.buildNames ?? []"
					@update:build-names="tabs.setComparisonBuilds(tab.id, $event)"
				/>
			</div>
		</div>

		<UModal
			:open="!!pendingClose"
			title="Discard unsaved changes?"
			:description="`“${pendingClose ? tabLabel(pendingClose) : ''}” has changes that have not been saved. Closing this tab will discard them.`"
			@update:open="pendingClose = undefined"
		>
			<template #footer>
				<div class="flex justify-end gap-2 w-full">
					<UButton color="neutral" variant="ghost" @click="pendingClose = undefined">
						Keep editing
					</UButton>
					<UButton color="error" @click="discardAndClose">Discard and close</UButton>
				</div>
			</template>
		</UModal>

		<UModal
			:open="!!confirmLeave"
			title="Discard unsaved changes?"
			description="One or more build tabs have changes that have not been saved. Leaving this page will discard them."
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
