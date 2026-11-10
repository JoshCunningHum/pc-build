<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { PartsRow } from '~/types/parts';
import { PART_TYPE_META, PART_TYPE_ORDER, PART_TYPE_ROUTES } from '~/constants/parts';
import {
	buildIncompleteCount,
	buildMissingCount,
	buildPartCount,
	buildTotalPrice,
	categoryParts,
	categoryPrice,
} from '~/utils/builds';
import { formatPrice } from '~/utils/format';
import { isPartIncomplete, missingPartFields } from '~/utils/parts';

const props = defineProps<{
	build: Builds.ResolvedBuild;
	issues: Builds.BuildIssue[];
}>();

const emit = defineEmits<{
	'open-picker': [type: Builds.PartType];
	remove: [type: Builds.PartType, title: string];
	edit: [type: Builds.PartType, title: string];
	'hover-part': [payload: { type: Builds.PartType; title: string } | null];
}>();

const total = computed(() => buildTotalPrice(props.build));
const partCount = computed(() => buildPartCount(props.build));
const incompleteCount = computed(() => buildIncompleteCount(props.build));
const missingCount = computed(() => buildMissingCount(props.build));

interface Group {
	type: Builds.PartType;
	parts: PartsRow[];
	subtotal: number;
}

const groups = computed<Group[]>(() =>
	PART_TYPE_ORDER.map((type) => ({
		type,
		parts: categoryParts(props.build, type) as PartsRow[],
		subtotal: categoryPrice(props.build, type),
	})).filter((group) => group.parts.length > 0),
);

const missingGroups = computed(() =>
	PART_TYPE_ORDER.map((type) => ({
		type,
		refs: props.build.missing.filter((ref) => ref.type === type),
	})).filter((group) => group.refs.length > 0),
);

const incomplete = computed(() => {
	const list: { type: Builds.PartType; part: PartsRow }[] = [];
	for (const type of PART_TYPE_ORDER) {
		for (const part of categoryParts(props.build, type) as PartsRow[]) {
			if (isPartIncomplete(part)) list.push({ type, part });
		}
	}
	return list;
});

const emptyRequired = computed(() =>
	PART_TYPE_ORDER.filter(
		(type) =>
			type !== 'cooler' &&
			(categoryParts(props.build, type) as PartsRow[]).length === 0 &&
			!props.build.missing.some((ref) => ref.type === type),
	),
);

const sortedIssues = computed(() =>
	props.issues.toSorted((a, b) =>
		a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1,
	),
);

const problemCount = computed(
	() =>
		sortedIssues.value.length +
		incomplete.value.length +
		emptyRequired.value.length +
		missingCount.value,
);

function addLabel(type: Builds.PartType): string {
	if (type === 'memory' || type === 'storage') {
		return (categoryParts(props.build, type) as PartsRow[]).length > 0 ? 'Add' : 'Select';
	}
	return (categoryParts(props.build, type) as PartsRow[]).length > 0 ? 'Change' : 'Select';
}

function linkFor(type: Builds.PartType, title: string) {
	return { path: PART_TYPE_ROUTES[type], query: { listing: title } };
}

function openLink(url: string): void {
	window.open(url, '_blank', 'noopener,noreferrer');
}

function missingDescription(part: PartsRow): string {
	return `Missing ${missingPartFields(part).join(' and ')}`;
}
</script>

<template>
	<div class="flex flex-col">
		<section class="p-4 border-default border-b">
			<p class="text-muted text-[10px] uppercase tracking-wide">Total price</p>
			<p class="mt-0.5 font-semibold text-highlighted text-2xl tabular-nums">
				{{ formatPrice(total) }}
			</p>
			<p class="mt-1 text-muted text-xs">
				{{ partCount }} part{{ partCount === 1 ? '' : 's' }}
				<span v-if="incompleteCount > 0"> · {{ incompleteCount }} incomplete</span>
				<span v-if="missingCount > 0" class="text-error"> · {{ missingCount }} missing</span>
			</p>
		</section>

		<section class="p-4 border-default border-b">
			<div class="flex justify-between items-center gap-2 mb-2">
				<h2 class="font-medium text-highlighted text-sm">Price breakdown</h2>
				<span class="text-muted text-xs">{{ groups.length }} categories</span>
			</div>

			<p v-if="groups.length === 0" class="text-muted text-xs">
				No parts yet. Click a slot in the layout to add one.
			</p>

			<div
				v-for="group in groups"
				:key="group.type"
				class="py-2 border-default/60 border-b last:border-b-0"
			>
				<div class="flex items-center gap-2">
					<UIcon :name="PART_TYPE_META[group.type].icon" class="size-3.5 text-muted" />
					<span class="font-medium text-highlighted text-xs">
						{{ PART_TYPE_META[group.type].label }}
					</span>
					<span class="ml-auto text-muted text-xs tabular-nums">
						{{ formatPrice(group.subtotal) }}
					</span>
					<UButton
						size="xs"
						variant="ghost"
						color="neutral"
						icon="i-lucide-repeat-2"
						:aria-label="`${addLabel(group.type)} ${PART_TYPE_META[group.type].label}`"
						@click="emit('open-picker', group.type)"
					/>
				</div>

				<div
					v-for="part in group.parts"
					:key="part.title"
					class="group flex items-center gap-2 mt-1 pl-5"
					@mouseenter="emit('hover-part', { type: group.type, title: part.title })"
					@mouseleave="emit('hover-part', null)"
				>
					<div class="flex-1 min-w-0">
						<p class="text-default text-xs truncate">{{ part.title }}</p>
						<p class="text-muted text-[10px] truncate">{{ part.name }}</p>
					</div>
					<span class="font-medium text-xs tabular-nums shrink-0">
						{{ formatPrice(part.price) }}
					</span>
					<UButton
						v-if="part.link"
						icon="i-lucide-external-link"
						color="neutral"
						variant="ghost"
						size="xs"
						class="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
						title="Open listing"
						:aria-label="`Open ${part.title}`"
						@click.stop="openLink(part.link)"
					/>
					<UButton
						icon="i-lucide-square-pen"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Edit (E)"
						:aria-label="`Edit ${part.title}`"
						@click="emit('edit', group.type, part.title)"
					/>
					<UButton
						icon="i-lucide-x"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Remove (D)"
						:aria-label="`Remove ${part.title}`"
						@click="emit('remove', group.type, part.title)"
					/>
				</div>
			</div>
		</section>

		<section class="p-4">
			<div class="flex justify-between items-center gap-2 mb-2">
				<h2 class="font-medium text-highlighted text-sm">Problems</h2>
				<UBadge v-if="problemCount > 0" color="warning" variant="subtle" size="sm">
					{{ problemCount }}
				</UBadge>
			</div>

			<div v-if="problemCount === 0" class="flex items-center gap-2 text-muted text-xs">
				<UIcon name="i-lucide-circle-check" class="size-4 text-success" />
				No problems found.
			</div>

			<ul v-else class="flex flex-col gap-1">
				<li
					v-for="issue in sortedIssues"
					:key="issue.code + issue.message"
					class="flex items-start gap-2 py-1 text-xs"
				>
					<UIcon
						:name="issue.severity === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-triangle-alert'"
						class="mt-0.5 size-3.5 shrink-0"
						:class="issue.severity === 'error' ? 'text-error' : 'text-amber-500'"
					/>
					<span class="min-w-0">{{ issue.message }}</span>
				</li>

				<li
					v-for="group in missingGroups"
					:key="`missing-${group.type}`"
					class="flex flex-col gap-1 py-1 text-xs"
				>
					<div v-for="ref in group.refs" :key="ref.title" class="flex items-center gap-2 min-w-0">
						<UIcon name="i-lucide-link-2-off" class="size-3.5 text-error shrink-0" />
						<span class="flex-1 min-w-0">
							<span class="block text-error text-xs truncate">{{ ref.title }}</span>
							<span class="block text-muted text-[10px]">
								Missing listing · {{ PART_TYPE_META[group.type].label }}
							</span>
						</span>
						<UButton
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							size="xs"
							:aria-label="`Remove missing ${ref.title}`"
							@click="emit('remove', group.type, ref.title)"
						/>
					</div>
				</li>

				<li
					v-for="entry in incomplete"
					:key="`incomplete-${entry.part.title}`"
					class="group flex items-center gap-2 py-1 text-xs"
					@mouseenter="emit('hover-part', { type: entry.type, title: entry.part.title })"
					@mouseleave="emit('hover-part', null)"
				>
					<UIcon name="i-lucide-circle-alert" class="size-3.5 text-warning shrink-0" />
					<span class="flex-1 min-w-0 truncate">
						{{ entry.part.title }} — {{ missingDescription(entry.part) }}
					</span>
					<UButton
						v-if="entry.part.link"
						icon="i-lucide-external-link"
						color="neutral"
						variant="ghost"
						size="xs"
						class="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
						title="Open listing"
						:aria-label="`Open ${entry.part.title}`"
						@click.stop="openLink(entry.part.link)"
					/>
					<UButton
						icon="i-lucide-square-pen"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Edit (E)"
						:aria-label="`Fix ${entry.part.title}`"
						@click="emit('edit', entry.type, entry.part.title)"
					/>
				</li>

				<li
					v-for="type in emptyRequired"
					:key="`empty-${type}`"
					class="flex items-center gap-2 py-1 text-xs"
				>
					<UIcon :name="PART_TYPE_META[type].icon" class="size-3.5 text-muted shrink-0" />
					<span class="flex-1 min-w-0 text-muted">
						No {{ PART_TYPE_META[type].label.toLowerCase() }} selected
					</span>
					<UButton
						size="xs"
						variant="ghost"
						color="neutral"
						icon="i-lucide-plus"
						:aria-label="`Add ${PART_TYPE_META[type].label}`"
						@click="emit('open-picker', type)"
					/>
				</li>
			</ul>
		</section>
	</div>
</template>
