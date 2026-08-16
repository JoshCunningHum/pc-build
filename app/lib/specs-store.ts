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
			return [...merged, ...additions];
		});

		function getByName(name: string): T | undefined {
			return list.value.find((item) => item.name === name);
		}

		function isOverridden(name: string): boolean {
			return overrides.value.some((item) => item.name === name);
		}

		function upsert(spec: T): void {
			const index = overrides.value.findIndex((item) => item.name === spec.name);
			if (index === -1) overrides.value.push(spec);
			else overrides.value[index] = spec;
		}

		function remove(name: string): void {
			overrides.value = overrides.value.filter((item) => item.name !== name);
		}

		return { list, loading, error, getByName, isOverridden, upsert, remove };
	});
}
