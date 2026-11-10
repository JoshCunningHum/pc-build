import type { Parts } from './parts';

export namespace Builds {
	export type PartType =
		| 'cpu'
		| 'cooler'
		| 'motherboard'
		| 'memory'
		| 'storage'
		| 'video_card'
		| 'case'
		| 'psu';

	// Builds reference Parts listings by their title, scoped to a category. The listing itself
	// stays the source of truth, so price and spec edits flow into every build that uses it.
	export interface PartRef {
		type: PartType;
		title: string;
	}

	export interface BuildParts {
		cpu?: PartRef;
		cooler?: PartRef;
		motherboard?: PartRef;
		memory: PartRef[];
		storage: PartRef[];
		video_card?: PartRef;
		case?: PartRef;
		psu?: PartRef;
	}

	export interface Build {
		name: string;
		parts: BuildParts;
	}

	export interface ResolvedParts {
		cpu?: Parts.CPU;
		cooler?: Parts.CPUCooler;
		motherboard?: Parts.Motherboard;
		memory: Parts.Memory[];
		storage: Parts.InternalHardDrive[];
		video_card?: Parts.VideoCard;
		case?: Parts.Case;
		psu?: Parts.PowerSupply;
	}

	export interface ResolvedBuild {
		name: string;
		parts: ResolvedParts;
		missing: PartRef[];
	}

	export interface BuildIssue {
		severity: 'error' | 'warning';
		code: string;
		message: string;
		parts: PartType[];
	}
}
