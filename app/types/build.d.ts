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

	export interface BuildParts {
		cpu?: Parts.CPU;
		cooler?: Parts.CPUCooler;
		motherboard?: Parts.Motherboard;
		memory: Parts.Memory[];
		storage: Parts.InternalHardDrive[];
		video_card?: Parts.VideoCard;
		case?: Parts.Case;
		psu?: Parts.PowerSupply;
	}

	export interface Build {
		name: string;
		parts: BuildParts;
	}

	export interface BuildIssue {
		severity: 'error' | 'warning';
		code: string;
		message: string;
		parts: PartType[];
	}
}
