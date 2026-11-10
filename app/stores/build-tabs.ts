export type BuildTabKind = 'builds' | 'create' | 'build' | 'compare';

export interface BuildTab {
	id: string;
	kind: BuildTabKind;
	buildName?: string;
	buildNames?: string[];
}

interface TabState {
	tabs: BuildTab[];
	activeId: string;
}

const BUILDS_TAB_ID = 'builds';

function compareKey(names: string[]): string {
	return names.toSorted().join('\u0000');
}

export const useBuildTabsStore = defineStore('build-tabs', () => {
	const state = useLocalStorage<TabState>('pcbuild:build-tabs', {
		tabs: [{ id: BUILDS_TAB_ID, kind: 'builds' }],
		activeId: BUILDS_TAB_ID,
	});

	const tabs = computed(() => state.value.tabs);
	const activeId = computed(() => state.value.activeId);
	const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeId.value));

	function ensureBuildsTab(): void {
		const buildsTab = state.value.tabs.find((tab) => tab.kind === 'builds');
		if (!buildsTab) state.value.tabs.unshift({ id: BUILDS_TAB_ID, kind: 'builds' });
		state.value.tabs = state.value.tabs.filter(
			(tab, index) => tab.kind !== 'builds' || index === 0,
		);
		if (!state.value.tabs.some((tab) => tab.id === BUILDS_TAB_ID)) {
			state.value.tabs.unshift({ id: BUILDS_TAB_ID, kind: 'builds' });
		}
	}

	function activateTab(id: string): void {
		if (!state.value.tabs.some((tab) => tab.id === id)) return;
		state.value.activeId = id;
	}

	function openBuild(buildName: string): void {
		ensureBuildsTab();
		const existing = state.value.tabs.find(
			(tab) => tab.kind === 'build' && tab.buildName === buildName,
		);
		if (existing) {
			activateTab(existing.id);
			return;
		}
		const tab: BuildTab = { id: `build:${buildName}`, kind: 'build', buildName };
		state.value.tabs.push(tab);
		activateTab(tab.id);
	}

	function openCreate(): void {
		ensureBuildsTab();
		const existing = state.value.tabs.find((tab) => tab.kind === 'create');
		if (existing) {
			activateTab(existing.id);
			return;
		}
		const tab: BuildTab = { id: 'create', kind: 'create' };
		state.value.tabs.push(tab);
		activateTab(tab.id);
	}

	function openComparison(buildNames: string[]): void {
		const names = [...new Set(buildNames)];
		if (names.length < 2) return;
		ensureBuildsTab();
		const key = compareKey(names);
		const existing = state.value.tabs.find(
			(tab) => tab.kind === 'compare' && compareKey(tab.buildNames ?? []) === key,
		);
		if (existing) {
			activateTab(existing.id);
			return;
		}
		const tab: BuildTab = {
			id: `compare:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			kind: 'compare',
			buildNames: names,
		};
		state.value.tabs.push(tab);
		activateTab(tab.id);
	}

	function convertCreateToBuild(tabId: string, buildName: string): void {
		const tab = state.value.tabs.find((item) => item.id === tabId && item.kind === 'create');
		if (!tab) {
			openBuild(buildName);
			return;
		}

		const existing = state.value.tabs.find(
			(item) => item.kind === 'build' && item.buildName === buildName,
		);
		if (existing) {
			closeTab(tabId);
			activateTab(existing.id);
			return;
		}

		const wasActive = state.value.activeId === tabId;
		tab.id = `build:${buildName}`;
		tab.kind = 'build';
		tab.buildName = buildName;
		delete tab.buildNames;
		if (wasActive) state.value.activeId = tab.id;
	}

	function closeTab(id: string): void {
		if (id === BUILDS_TAB_ID) return;
		const index = state.value.tabs.findIndex((tab) => tab.id === id);
		if (index === -1) return;

		const wasActive = state.value.activeId === id;
		state.value.tabs.splice(index, 1);

		if (wasActive) {
			const next = state.value.tabs[Math.max(0, index - 1)] ?? state.value.tabs[0];
			state.value.activeId = next?.id ?? BUILDS_TAB_ID;
		}

		ensureBuildsTab();
	}

	function closeBuild(buildName: string): void {
		const buildTabs = state.value.tabs.filter(
			(tab) => tab.kind === 'build' && tab.buildName === buildName,
		);
		for (const tab of buildTabs) closeTab(tab.id);

		for (const tab of state.value.tabs) {
			if (tab.kind !== 'compare' || !tab.buildNames) continue;
			tab.buildNames = tab.buildNames.filter((name) => name !== buildName);
		}
	}

	function renameBuild(oldName: string, newName: string): void {
		const tab = state.value.tabs.find(
			(item) => item.kind === 'build' && item.buildName === oldName,
		);
		if (tab) {
			const existing = state.value.tabs.find(
				(item) => item.kind === 'build' && item.buildName === newName,
			);
			if (existing && existing.id !== tab.id) {
				closeTab(tab.id);
				activateTab(existing.id);
			} else {
				const wasActive = state.value.activeId === tab.id;
				tab.id = `build:${newName}`;
				tab.buildName = newName;
				if (wasActive) state.value.activeId = tab.id;
			}
		}

		for (const item of state.value.tabs) {
			if (item.kind !== 'compare' || !item.buildNames) continue;
			item.buildNames = item.buildNames.map((name) => (name === oldName ? newName : name));
		}
	}

	function syncBuilds(validNames: string[]): void {
		const valid = new Set(validNames);
		ensureBuildsTab();

		for (const tab of state.value.tabs.slice()) {
			if (tab.kind === 'build' && (!tab.buildName || !valid.has(tab.buildName))) {
				closeTab(tab.id);
			}
		}

		for (const tab of state.value.tabs) {
			if (tab.kind !== 'compare' || !tab.buildNames) continue;
			tab.buildNames = tab.buildNames.filter((name) => valid.has(name));
		}

		if (!state.value.tabs.some((tab) => tab.id === state.value.activeId)) {
			state.value.activeId = BUILDS_TAB_ID;
		}
	}

	function setComparisonBuilds(tabId: string, buildNames: string[]): void {
		const tab = state.value.tabs.find((item) => item.id === tabId && item.kind === 'compare');
		if (!tab) return;
		tab.buildNames = [...new Set(buildNames)];
	}

	return {
		tabs,
		activeId,
		activeTab,
		openBuild,
		openCreate,
		openComparison,
		convertCreateToBuild,
		closeTab,
		activateTab,
		closeBuild,
		renameBuild,
		syncBuilds,
		setComparisonBuilds,
	};
});
