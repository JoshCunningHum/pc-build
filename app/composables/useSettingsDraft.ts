import type { InjectionKey } from 'vue';
import type { ConstantEntry, ConstantId } from '~/stores/constants';
import type { Builds } from '~/types/build';
import { SPECS_STORES } from '~/constants/parts';
import { useConstantsStore } from '~/stores/constants';
import { deepClone } from '~/utils/clone';
import {
	addEntry,
	moveEntry,
	removeEntry,
	sortedEntries,
	updateEntry,
} from '~/utils/constant-entries';

interface QueuedRestore {
	type: Builds.PartType;
	name: string;
}

export interface SettingsDraft {
	list: (id: ConstantId) => ConstantEntry[];
	add: (id: ConstantId, label: string, brand?: string) => void;
	update: (id: ConstantId, value: string | number, label: string, brand?: string) => void;
	remove: (id: ConstantId, value: string | number) => void;
	move: (id: ConstantId, value: string | number, delta: number) => void;
	resetToCatalog: (id: ConstantId) => void;
	queueRestore: (type: Builds.PartType, name: string) => void;
	unqueueRestore: (type: Builds.PartType, name: string) => void;
	isQueued: (type: Builds.PartType, name: string) => boolean;
	dirty: boolean;
	changeCount: number;
	save: () => void;
	discard: () => void;
}

const DRAFT_KEY: InjectionKey<SettingsDraft> = Symbol('settings-draft');

// Page-scoped on purpose. `lib/rules.ts`, `constants/part-schemas.ts` and every PartForm read
// the constants store live, so a draft held in that store would leak half-finished edits into
// build validation and the part forms before the user saves.
function createSettingsDraft(): SettingsDraft {
	const store = useConstantsStore();

	const constants = ref<Record<ConstantId, ConstantEntry[]>>(deepClone(store.entries));
	const restores = ref<QueuedRestore[]>([]);

	function sync(): void {
		constants.value = deepClone(store.entries);
		restores.value = [];
	}

	// Seeding writes to the store as a bootstrap, not as a user edit -- without this the draft
	// would still hold the pre-seed (empty) lists and read as dirty the moment it lands.
	watch(() => store.seeded, sync);

	const changedConstants = computed(
		() => JSON.stringify(constants.value) !== JSON.stringify(store.entries),
	);

	const dirty = computed(() => changedConstants.value || restores.value.length > 0);

	const changeCount = computed(() => {
		const lists = (Object.keys(constants.value) as ConstantId[]).filter(
			(id) => JSON.stringify(constants.value[id]) !== JSON.stringify(store.entries[id]),
		);
		return lists.length + restores.value.length;
	});

	function apply(id: ConstantId, next: ConstantEntry[] | undefined): void {
		if (next) constants.value[id] = next;
	}

	function indexOfRestore(type: Builds.PartType, name: string): number {
		return restores.value.findIndex((entry) => entry.type === type && entry.name === name);
	}

	return reactive({
		list: (id: ConstantId) => sortedEntries(id, constants.value[id] ?? []),
		add: (id: ConstantId, label: string, brand?: string) =>
			apply(id, addEntry(id, constants.value[id] ?? [], label, brand)),
		update: (id: ConstantId, value: string | number, label: string, brand?: string) =>
			apply(id, updateEntry(constants.value[id] ?? [], value, label, brand)),
		remove: (id: ConstantId, value: string | number) =>
			apply(id, removeEntry(constants.value[id] ?? [], value)),
		move: (id: ConstantId, value: string | number, delta: number) =>
			apply(id, moveEntry(constants.value[id] ?? [], value, delta)),
		resetToCatalog: (id: ConstantId) => apply(id, store.catalogDefaults(id)),

		queueRestore: (type: Builds.PartType, name: string) => {
			if (indexOfRestore(type, name) === -1) restores.value.push({ type, name });
		},
		unqueueRestore: (type: Builds.PartType, name: string) => {
			const index = indexOfRestore(type, name);
			if (index !== -1) restores.value.splice(index, 1);
		},
		isQueued: (type: Builds.PartType, name: string) => indexOfRestore(type, name) !== -1,

		dirty,
		changeCount,

		save: () => {
			store.replaceAll(deepClone(constants.value));
			for (const entry of restores.value) SPECS_STORES[entry.type]().restore(entry.name);
			sync();
		},
		discard: sync,
	}) as SettingsDraft;
}

export function provideSettingsDraft(): SettingsDraft {
	const draft = createSettingsDraft();
	provide(DRAFT_KEY, draft);
	return draft;
}

export function useSettingsDraft(): SettingsDraft {
	const draft = inject(DRAFT_KEY);
	if (!draft) throw new Error('useSettingsDraft() called outside a page that provides the draft');
	return draft;
}
