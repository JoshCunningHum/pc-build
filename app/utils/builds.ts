import type { Builds } from '~/types/build';
import type { PartsByPartType } from '~/types/parts';
import { PARTS_STORES } from '~/constants/parts';
import { isPartIncomplete } from '~/utils/parts';

type SinglePartType = 'cpu' | 'cooler' | 'motherboard' | 'video_card' | 'case' | 'psu';
type MultiPartType = 'memory' | 'storage';

function resolveSingle<K extends SinglePartType>(
	type: K,
	ref: Builds.PartRef | undefined,
): PartsByPartType[K] | undefined {
	if (!ref) return undefined;
	return PARTS_STORES[type]().getByTitle(ref.title) as PartsByPartType[K] | undefined;
}

function resolveMany<K extends MultiPartType>(
	type: K,
	refs: Builds.PartRef[] | undefined,
	missing: Builds.PartRef[],
): PartsByPartType[K][] {
	const parts: PartsByPartType[K][] = [];
	for (const ref of refs ?? []) {
		const part = PARTS_STORES[type]().getByTitle(ref.title) as PartsByPartType[K] | undefined;
		if (part) parts.push(part);
		else missing.push({ type, title: ref.title });
	}
	return parts;
}

export function resolveBuild(build: Builds.Build): Builds.ResolvedBuild {
	const missing: Builds.PartRef[] = [];
	const parts = build.parts;

	const cpu = resolveSingle('cpu', parts.cpu);
	const cooler = resolveSingle('cooler', parts.cooler);
	const motherboard = resolveSingle('motherboard', parts.motherboard);
	const video_card = resolveSingle('video_card', parts.video_card);
	const pcCase = resolveSingle('case', parts.case);
	const psu = resolveSingle('psu', parts.psu);

	const resolved: Builds.ResolvedParts = {
		cpu,
		cooler,
		motherboard,
		memory: resolveMany('memory', parts.memory, missing),
		storage: resolveMany('storage', parts.storage, missing),
		video_card,
		case: pcCase,
		psu,
	};

	const singles: [SinglePartType, Builds.PartRef | undefined][] = [
		['cpu', parts.cpu],
		['cooler', parts.cooler],
		['motherboard', parts.motherboard],
		['video_card', parts.video_card],
		['case', parts.case],
		['psu', parts.psu],
	];
	for (const [type, ref] of singles) {
		if (ref && !resolved[type]) missing.push({ type, title: ref.title });
	}

	return { name: build.name, parts: resolved, missing };
}

export function resolvedPartList(build: Builds.ResolvedBuild): PartsByPartType[Builds.PartType][] {
	return [
		build.parts.cpu,
		build.parts.cooler,
		build.parts.motherboard,
		...build.parts.memory,
		...build.parts.storage,
		build.parts.video_card,
		build.parts.case,
		build.parts.psu,
	].filter((part): part is PartsByPartType[Builds.PartType] => Boolean(part));
}

export function buildTotalPrice(build: Builds.ResolvedBuild): number {
	return resolvedPartList(build).reduce((sum, part) => sum + (part.price ?? 0), 0);
}

export function buildPartCount(build: Builds.ResolvedBuild): number {
	return resolvedPartList(build).length;
}

export function buildIncompleteCount(build: Builds.ResolvedBuild): number {
	return resolvedPartList(build).filter(isPartIncomplete).length;
}

export function buildMissingCount(build: Builds.ResolvedBuild): number {
	return build.missing.length;
}

export function categoryParts<T extends Builds.PartType>(
	build: Builds.ResolvedBuild,
	type: T,
): PartsByPartType[T][] {
	const parts = build.parts[type];
	return (Array.isArray(parts) ? parts : parts ? [parts] : []) as PartsByPartType[T][];
}

export function categoryPrice(build: Builds.ResolvedBuild, type: Builds.PartType): number {
	return categoryParts(build, type).reduce((sum, part) => sum + (part.price ?? 0), 0);
}
