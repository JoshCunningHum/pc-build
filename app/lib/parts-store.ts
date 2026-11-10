interface Titled {
	title: string;
}

export function createPartsStore<T extends Titled>(id: string, storageKey: string) {
	return defineStore(id, () => {
		const list = useLocalStorage<T[]>(storageKey, []);

		function getByTitle(title: string): T | undefined {
			return list.value.find((item) => item.title === title);
		}

		function add(part: T): void {
			list.value.push(part);
		}

		function update(title: string, part: T): void {
			const index = list.value.findIndex((item) => item.title === title);
			if (index === -1) list.value.push(part);
			else list.value[index] = part;
		}

		function remove(title: string): void {
			list.value = list.value.filter((item) => item.title !== title);
		}

		return { list, getByTitle, add, update, remove };
	});
}
