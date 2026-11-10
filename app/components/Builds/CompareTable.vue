<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { CompareRow, CompareSection, CompareTone } from '~/constants/build-comparison';
import {
	baselineForSection,
	compareTone,
	formatCompareValue,
	formatPercent,
	percentAgainstBasis,
} from '~/constants/build-comparison';
import { validateBuild } from '~/lib/rules';
import { buildPartCount, buildTotalPrice } from '~/utils/builds';
import { formatPrice } from '~/utils/format';

const props = withDefaults(
	defineProps<{
		builds: Builds.ResolvedBuild[];
		sections: CompareSection[];
		baselines: Record<string, string>;
		/** Tighter type and padding for the build tab's right rail. */
		compact?: boolean;
		/** Tooltips show the same table but cannot change the basis. */
		readonly?: boolean;
	}>(),
	{
		compact: false,
		readonly: false,
	},
);

const emit = defineEmits<{
	'update:baselines': [value: Record<string, string>];
}>();

// Dark green behind every cell in a section's basis column. The basis is not a separate row or
// badge any more: the column itself carries the colour.
const BASIS_CELL = 'bg-emerald-900/30 ring-1 ring-emerald-500/20 ring-inset';

const TONE_CLASS: Record<CompareTone, string> = {
	success: 'text-success',
	error: 'text-error',
	neutral: 'text-muted',
};

function baselineBuild(section: CompareSection): Builds.ResolvedBuild | undefined {
	return baselineForSection(section, props.builds, props.baselines);
}

function isBaseline(section: CompareSection, build: Builds.ResolvedBuild): boolean {
	return baselineBuild(section)?.name === build.name;
}

function canSetBaseline(section: CompareSection, build: Builds.ResolvedBuild): boolean {
	return section.hasPart(build);
}

function setBaseline(section: CompareSection, build: Builds.ResolvedBuild): void {
	if (props.readonly || !canSetBaseline(section, build)) return;
	emit('update:baselines', { ...props.baselines, [section.id]: build.name });
}

interface Delta {
	text: string;
	tone: CompareTone;
}

function deltaFor(
	row: CompareRow,
	section: CompareSection,
	build: Builds.ResolvedBuild,
): Delta | undefined {
	if (row.kind !== 'percent') return undefined;
	const delta = percentAgainstBasis(row, baselineBuild(section), build);
	if (delta === undefined) return undefined;
	return { text: formatPercent(delta), tone: compareTone(delta, row.direction) };
}

function valueTone(
	row: CompareRow,
	section: CompareSection,
	build: Builds.ResolvedBuild,
): CompareTone {
	if (row.kind !== 'label' || !row.order) return 'neutral';
	const basis = baselineBuild(section);
	if (!basis || basis.name === build.name) return 'neutral';
	const basisOrder = row.order(basis);
	const value = row.order(build);
	if (basisOrder === undefined || value === undefined) return 'neutral';
	return compareTone(value - basisOrder, row.direction);
}

function issueCounts(build: Builds.ResolvedBuild): { errors: number; warnings: number } {
	const issues = validateBuild({ name: build.name, parts: build.parts });
	return {
		errors: issues.filter((issue) => issue.severity === 'error').length,
		warnings: issues.filter((issue) => issue.severity === 'warning').length,
	};
}
</script>

<template>
	<table class="w-full border-collapse" :class="compact ? 'text-[11px]' : 'text-sm'">
		<thead class="top-0 z-20 sticky bg-default">
			<tr class="border-default border-b">
				<th
					class="left-0 z-30 sticky bg-default px-2 py-2 text-left font-medium text-muted text-[10px] uppercase tracking-wide"
					:class="compact ? 'w-24 min-w-24' : 'w-32 min-w-32'"
				>
					Spec
				</th>
				<th
					v-for="build in builds"
					:key="build.name"
					class="px-2 py-2 border-default border-l text-left align-top font-normal"
					:class="compact ? 'min-w-24' : 'min-w-32'"
				>
					<span
						class="block font-semibold text-highlighted"
						:class="compact ? 'text-[11px]' : 'text-xs'"
					>
						{{ build.name }}
					</span>
					<template v-if="!compact">
						<span class="block mt-1 text-muted text-[10px]">
							{{ formatPrice(buildTotalPrice(build)) }} · {{ buildPartCount(build) }} parts
						</span>
						<div class="flex flex-wrap gap-1 mt-1">
							<UBadge v-if="build.missing.length > 0" color="error" variant="subtle" size="sm">
								{{ build.missing.length }} missing
							</UBadge>
							<UBadge v-if="issueCounts(build).errors > 0" color="error" variant="subtle" size="sm">
								{{ issueCounts(build).errors }} error{{
									issueCounts(build).errors === 1 ? '' : 's'
								}}
							</UBadge>
							<UBadge
								v-if="issueCounts(build).warnings > 0"
								color="warning"
								variant="subtle"
								size="sm"
							>
								{{ issueCounts(build).warnings }} warning{{
									issueCounts(build).warnings === 1 ? '' : 's'
								}}
							</UBadge>
						</div>
					</template>
				</th>
			</tr>
		</thead>

		<tbody v-for="section in sections" :key="section.id">
			<tr class="border-default border-y bg-elevated/40">
				<th
					:colspan="builds.length + 1"
					class="px-2 py-1.5 text-left font-semibold text-highlighted text-[10px] uppercase tracking-wide"
				>
					<span class="inline-flex items-center gap-1.5">
						<UIcon :name="section.icon" class="size-3.5" />
						{{ section.label }}
						<span
							v-if="baselineBuild(section)"
							class="font-normal text-muted normal-case tracking-normal"
						>
							· basis {{ baselineBuild(section)?.name }}
						</span>
					</span>
				</th>
			</tr>

			<template v-for="row in section.rows" :key="row.id">
				<tr class="border-default/50 border-b">
					<th
						class="left-0 z-10 sticky bg-default px-2 py-1 text-left font-normal text-muted text-[11px] whitespace-nowrap"
					>
						{{ row.label }}
					</th>
					<td
						v-for="build in builds"
						:key="build.name"
						class="px-2 py-1 border-default/50 border-l align-top"
						:class="[
							isBaseline(section, build) ? BASIS_CELL : '',
							canSetBaseline(section, build) && !readonly
								? 'cursor-pointer hover:bg-elevated/40'
								: '',
						]"
						:title="
							canSetBaseline(section, build) && !readonly
								? `Use ${build.name} as the ${section.label} basis`
								: undefined
						"
						@click="setBaseline(section, build)"
					>
						<div class="flex flex-col gap-0.5">
							<span
								v-if="row.value(build) !== undefined"
								:class="TONE_CLASS[valueTone(row, section, build)]"
							>
								{{ formatCompareValue(row, row.value(build)) }}
							</span>
							<span v-else class="text-muted" title="Not in this build">—</span>

							<span
								v-if="row.kind === 'percent' && deltaFor(row, section, build)"
								class="font-medium text-[10px] tabular-nums leading-none"
								:class="TONE_CLASS[deltaFor(row, section, build)!.tone]"
							>
								{{ deltaFor(row, section, build)!.text }}
							</span>
						</div>
					</td>
				</tr>
			</template>
		</tbody>
	</table>
</template>
