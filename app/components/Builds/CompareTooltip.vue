<script setup lang="ts">
import type { Builds } from '~/types/build';
import { COMPARE_SECTIONS } from '~/constants/build-comparison';

const props = defineProps<{
	sectionId: Builds.PartType;
	builds: Builds.ResolvedBuild[];
	baselines: Record<string, string>;
}>();

const section = computed(() => COMPARE_SECTIONS.find((item) => item.id === props.sectionId));
const present = computed(() =>
	section.value ? props.builds.filter((build) => section.value!.hasPart(build)) : [],
);
const sections = computed(() => (section.value ? [section.value] : []));
</script>

<template>
	<div
		class="bg-default/95 border border-default rounded-lg shadow-lg backdrop-blur w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden"
	>
		<div class="flex items-center gap-2 px-3 py-2 border-default border-b">
			<UIcon :name="section?.icon ?? 'lucide:list'" class="size-4 text-muted" />
			<span class="font-medium text-highlighted text-sm">{{ section?.label ?? 'Compare' }}</span>
			<span class="ml-auto text-muted text-[10px] uppercase tracking-wide">
				{{ present.length }} build{{ present.length === 1 ? '' : 's' }}
			</span>
		</div>

		<div v-if="!section || present.length === 0" class="px-3 py-4 text-muted text-xs">
			No build in this comparison has a
			{{ section?.label.toLowerCase() ?? 'part' }} selected.
		</div>

		<div v-else class="max-h-[26rem] overflow-hidden">
			<BuildsCompareTable
				:builds="present"
				:sections="sections"
				:baselines="baselines"
				compact
				readonly
			/>
		</div>

		<div
			v-if="present.length > 1"
			class="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-default border-t text-[10px] text-muted"
		>
			<UKbd value="Tab" size="sm" />
			<span>cycle basis</span>
			<span class="mx-0.5 text-muted/60">·</span>
			<UKbd value="Shift" size="sm" />
			<UKbd value="Tab" size="sm" />
			<span>back</span>
		</div>
	</div>
</template>
