interface Named {
	name: string;
}

export function createSpecsStore<T extends Named>(
	id: string,
	storageKey: string,
	loadSeed: () => Promise<T[]>,
) {
	return defineStore(id, () => {
		const seed = ref<T[]>([]);
		const loading = ref(true);
		const error = ref<unknown>(null);
		const overrides = useLocalStorage<T[]>(storageKey, []);
		const deleted = useLocalStorage<string[]>(`${storageKey}:deleted`, []);

		loadSeed()
			.then((data) => {
				seed.value = data;
			})
			.catch((err) => {
				error.value = err;
				console.error(`[specs-store:${id}] failed to load seed data`, err);
			})
			.finally(() => {
				loading.value = false;
			});

		const list = computed<T[]>(() => {
			const overrideByName = new Map(overrides.value.map((item) => [item.name, item]));
			const merged = seed.value.map((item) => overrideByName.get(item.name) ?? item);
			const seedNames = new Set(seed.value.map((item) => item.name));
			const additions = overrides.value.filter((item) => !seedNames.has(item.name));
			const tombstoned = new Set(deleted.value);
			return [...merged, ...additions].filter((item) => !tombstoned.has(item.name));
		});

		function getByName(name: string): T | undefined {
			return list.value.find((item) => item.name === name);
		}

		function isOverridden(name: string): boolean {
			return overrides.value.some((item) => item.name === name);
		}

		function upsert(spec: T): void {
			deleted.value = deleted.value.filter((entry) => entry !== spec.name);
			const index = overrides.value.findIndex((item) => item.name === spec.name);
			if (index === -1) overrides.value.push(spec);
			else overrides.value[index] = spec;
		}

		// Tombstoned rather than just un-overridden, so a seed row can be deleted too.
		function remove(name: string): void {
			overrides.value = overrides.value.filter((item) => item.name !== name);
			if (!deleted.value.includes(name)) deleted.value.push(name);
		}

		function rename(oldName: string, spec: T): void {
			remove(oldName);
			upsert(spec);
		}

		// Only seed names are restorable: a tombstoned user addition has no version to fall back
		// to, so it is simply gone.
		const deletedSeedNames = computed(() => {
			const seedNames = new Set(seed.value.map((item) => item.name));
			return deleted.value.filter((name) => seedNames.has(name));
		});

		function restore(name: string): void {
			deleted.value = deleted.value.filter((entry) => entry !== name);
		}

		return {
			list,
			loading,
			error,
			deletedSeedNames,
			getByName,
			isOverridden,
			upsert,
			remove,
			rename,
			restore,
		};
	});
}
