import type { Builds } from '~/types/build';
import { Specs } from '~/types/parts';
import type { RuleItem } from '~/types/rules';
import { createIssue, createRule } from '~/utils/build-validation';

const FORM_FACTOR_LABELS: Record<Specs.MotherboardFormFactor, string> = {
    [Specs.MotherboardFormFactor.MiniITX]: 'Mini ITX',
    [Specs.MotherboardFormFactor.MicroATX]: 'Micro ATX',
    [Specs.MotherboardFormFactor.ATX]: 'ATX',
    [Specs.MotherboardFormFactor.EATX]: 'EATX',
};

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
            if (motherboard.form_factor > pcCase.type)
                return issue(
                    'warning',
                    'CASE_FORM_FACTOR',
                    `${motherboard.name} (${FORM_FACTOR_LABELS[motherboard.form_factor]}) may not fit in ${pcCase.name} (${FORM_FACTOR_LABELS[pcCase.type]})`,
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
