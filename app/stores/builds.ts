import type { Builds } from '~/types/build';

function allRefs(build: Builds.Build): Builds.PartRef[] {
	const parts = build.parts;
	return [
		parts.cpu,
		parts.cooler,
		parts.motherboard,
		parts.video_card,
		parts.case,
		parts.psu,
		...(parts.memory ?? []),
		...(parts.storage ?? []),
	].filter((ref): ref is Builds.PartRef => Boolean(ref));
}

export const useBuildsStore = defineStore('builds', () => {
	const list = useLocalStorage<Builds.Build[]>('pcbuild:builds', []);

	function getByName(name: string): Builds.Build | undefined {
		return list.value.find((build) => build.name === name);
	}

	function add(build: Builds.Build): void {
		list.value.push(build);
	}

	function update(oldName: string, build: Builds.Build): void {
		const index = list.value.findIndex((item) => item.name === oldName);
		if (index === -1) list.value.push(build);
		else list.value[index] = build;
	}

	function remove(name: string): void {
		list.value = list.value.filter((build) => build.name !== name);
	}

	function renamePartReference(type: Builds.PartType, oldTitle: string, newTitle: string): void {
		for (const build of list.value) {
			for (const ref of allRefs(build)) {
				if (ref.type === type && ref.title === oldTitle) ref.title = newTitle;
			}
		}
	}

	function countPartReferences(type: Builds.PartType, title: string): number {
		return list.value.filter((build) =>
			allRefs(build).some((ref) => ref.type === type && ref.title === title),
		).length;
	}

	return { list, getByName, add, update, remove, renamePartReference, countPartReferences };
});
