import type { ConstantId } from '~/stores/constants';
import type { Builds } from '~/types/build';
import type { RuleItem } from '~/types/rules';
import { specLabel } from '~/constants/spec-labels';
import { useConstantsStore } from '~/stores/constants';
import { createIssue, createRule } from '~/utils/build-validation';

/** Position in the configured list. `-1` means the value isn't configured at all. */
function rank(id: ConstantId, value: string | number | undefined): number {
	return useConstantsStore().rank(id, value);
}

export const BUILD_RULES: RuleItem<Builds.PartType>[] = [
	createRule({
		parts: ['cpu', 'motherboard'],
		rule({ build: { cpu, motherboard }, issue }) {
			if (cpu.socket.name !== motherboard.socket.name)
				return issue(
					'error',
					'SOCKET_MISMATCH',
					`${cpu.name} uses socket ${cpu.socket.name} but ${motherboard.name} requires ${motherboard.socket.name}`,
				);
		},
	}),
	createRule({
		parts: ['motherboard', 'memory'],
		rule({ build: { motherboard, memory }, issue }) {
			if (!motherboard.ddr) return;
			for (const mem of memory) {
				if (mem.ddr !== motherboard.ddr)
					return issue(
						'error',
						'DDR_MISMATCH',
						`${motherboard.name} supports ${motherboard.ddr} but ${mem.name} is ${mem.ddr}`,
					);
			}
		},
	}),
	createRule({
		parts: ['motherboard', 'memory'],
		rule({ build: { motherboard, memory }, issue }) {
			const totalCapacity = memory.reduce(
				(sum, mem) => sum + mem.module_count * mem.module_size,
				0,
			);
			if (memory.length > 0 && totalCapacity > motherboard.max_memory)
				return issue(
					'warning',
					'RAM_OVER_CAPACITY',
					`Total RAM of ${totalCapacity}GB exceeds the ${motherboard.max_memory}GB supported by ${motherboard.name}`,
				);
		},
	}),
	createRule({
		parts: ['motherboard', 'memory'],
		rule({ build: { motherboard, memory }, issue }) {
			const totalModules = memory.reduce((sum, mem) => sum + mem.module_count, 0);
			if (totalModules > motherboard.memory_slots)
				return issue(
					'warning',
					'MODULE_OVER_SLOTS',
					`${totalModules} memory modules exceed the ${motherboard.memory_slots} slots on ${motherboard.name}`,
				);
		},
	}),
	createRule({
		parts: ['motherboard', 'video_card'],
		rule({ build: { motherboard, video_card }, issue }) {
			if (!motherboard.pcie || !video_card.pcie) return;
			if (motherboard.pcie < video_card.pcie)
				return issue(
					'warning',
					'PCIE_BOTTLENECK',
					`${video_card.name} is PCIe ${video_card.pcie} but ${motherboard.name} only has a PCIe ${motherboard.pcie} slot; the GPU will be bottlenecked`,
				);
		},
	}),
	createRule({
		parts: ['motherboard', 'case'],
		rule({ build: { motherboard, case: pcCase }, issue }) {
			const board = rank('form_factor', motherboard.form_factor);
			const chassis = rank('form_factor', pcCase.type);

			// An unconfigured value has no position to compare against, so the fit check can't
			// run -- say so rather than silently passing or failing the build.
			if (board === -1 || chassis === -1) {
				const unknown =
					board === -1
						? `${motherboard.name} (form factor ${motherboard.form_factor})`
						: `${pcCase.name} (form factor ${pcCase.type})`;
				return issue(
					'warning',
					'FORM_FACTOR_UNKNOWN',
					`${unknown} uses a form factor that is not in your configured constants, so case fit could not be checked`,
				);
			}

			if (board > chassis)
				return issue(
					'warning',
					'CASE_FORM_FACTOR',
					`${motherboard.name} (${specLabel('form_factor', motherboard.form_factor)}) may not fit in ${pcCase.name} (${specLabel('form_factor', pcCase.type)})`,
				);
		},
	}),
	createRule({
		parts: ['psu'],
		rule({ build: { psu }, issue }) {
			if (rank('efficiency', psu.efficiency) === -1)
				return issue(
					'warning',
					'EFFICIENCY_UNKNOWN',
					`${psu.name} uses efficiency tier ${psu.efficiency}, which is not in your configured constants; tier comparisons may be wrong`,
				);
		},
	}),
	createRule({
		parts: ['case', 'video_card'],
		rule({ build: { case: pcCase, video_card }, issue }) {
			if (pcCase.max_gpu_length && video_card.length > pcCase.max_gpu_length)
				return issue(
					'warning',
					'CASE_GPU_LENGTH',
					`${video_card.name} is ${video_card.length}mm long but ${pcCase.name} only fits up to ${pcCase.max_gpu_length}mm`,
				);
		},
	}),
	createRule({
		parts: ['cooler', 'cpu'],
		rule({ build: { cooler, cpu }, issue }) {
			if (cooler.sockets.length > 0 && !cooler.sockets.some((s) => s.name === cpu.socket.name))
				return issue(
					'warning',
					'COOLER_SOCKET',
					`${cooler.name} does not support socket ${cpu.socket.name} used by ${cpu.name}`,
				);
		},
	}),
	createRule({
		parts: ['psu'],
		rule({ build: { psu, cpu, video_card }, issue }) {
			const draw = (cpu?.tdp ?? 0) + (video_card?.wattage ?? 0);
			if (draw > 0 && psu.wattage < draw)
				return issue(
					'warning',
					'PSU_WATTAGE',
					`Estimated draw of ${draw}W exceeds the ${psu.wattage}W provided by ${psu.name}`,
				);
		},
	}),
];

export function validateBuild(build: Builds.Build): Builds.BuildIssue[] {
	const issues: Builds.BuildIssue[] = [];
	for (const rule of BUILD_RULES) {
		if (rule.parts.some((part) => !build.parts[part])) continue;
		const result = rule.rule({
			build: build.parts as Required<Builds.BuildParts>,
			issue: (severity, code, message) => createIssue(severity, code, message, rule.parts),
		});
		if (result) issues.push(result);
	}
	return issues;
}
