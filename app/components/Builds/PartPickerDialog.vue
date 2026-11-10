<script setup lang="ts">
import type { Builds } from '~/types/build';
import type { PartsRow } from '~/types/parts';
import { PART_TYPE_META, PART_TYPE_ROUTES, PARTS_STORES } from '~/constants/parts';
import { validateBuild } from '~/lib/rules';
import { formatPrice } from '~/utils/format';
import { isPartIncomplete } from '~/utils/parts';

const props = defineProps<{
	type: Builds.PartType;
	build: Builds.ResolvedBuild;
	selectedTitles: string[];
	multiple: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{ select: [titles: string[]] }>();

/** Presentation tokens: change these here to restyle the picker without touching the markup. */
const UI = {
	dialog: 'max-w-2xl',
	body: 'flex flex-col gap-3 min-h-0',
	list: 'flex flex-col gap-1 max-h-[24rem] overflow-y-auto pr-1',
	row: 'flex items-center gap-3 hover:bg-elevated/60 disabled:opacity-60 p-2.5 border-default border rounded-sm text-left transition-colors disabled:cursor-not-allowed',
	rowIcon: 'size-4 shrink-0',
	rowIconSelected: 'text-primary',
	rowIconIdle: 'text-muted',
	rowTitle: 'font-medium text-highlighted text-sm break-all',
	rowName: 'text-muted text-xs break-all',
	rowPrice: 'font-medium text-sm tabular-nums shrink-0',
	empty:
		'flex flex-col justify-center items-center gap-3 border-default border border-dashed rounded-sm p-8 text-center',
	noMatch: 'py-8 text-center text-muted text-sm',
	tooltipContent: 'h-auto max-w-xs items-start',
	tooltip: 'flex flex-col gap-1.5',
	tooltipTitle: 'font-medium text-highlighted text-xs',
	tooltipList: 'flex flex-col gap-1',
	issue: 'flex items-start gap-1.5 text-xs',
	issueIcon: 'mt-0.5 size-3.5 shrink-0',
	issueError: 'text-error',
	issueWarning: 'text-warning',
	badge: 'cursor-help',
} as const;

const BADGES = {
	incomplete: { label: 'Incomplete', color: 'warning', variant: 'subtle', size: 'sm' },
	incompatible: {
		label: 'Incompatible',
		color: 'error',
		variant: 'subtle',
		size: 'sm',
		icon: 'i-lucide-circle-alert',
	},
	warning: {
		label: 'Warning',
		color: 'warning',
		variant: 'subtle',
		size: 'sm',
		icon: 'i-lucide-triangle-alert',
	},
} as const;

const meta = computed(() => PART_TYPE_META[props.type]);
const store = computed(() => PARTS_STORES[props.type]());

const search = ref('');
const picked = ref<string[]>([]);

watch(open, (isOpen) => {
	if (!isOpen) return;
	picked.value = [...props.selectedTitles];
	search.value = '';
});

const items = computed(() => store.value.list);
const rows = computed(() => {
	const query = search.value.trim().toLowerCase();
	const list = query
		? items.value.filter(
				(part) =>
					part.title.toLowerCase().includes(query) || part.name.toLowerCase().includes(query),
			)
		: items.value;
	return list.toSorted((a, b) => a.title.localeCompare(b.title));
});

// The picker checks compatibility before a part is chosen. "Unknown constant" warnings are about
// app configuration rather than the listing, so they never flag a row.
const IGNORED_ISSUES = new Set(['FORM_FACTOR_UNKNOWN', 'EFFICIENCY_UNKNOWN']);

function issueKey(issue: Builds.BuildIssue): string {
	return `${issue.code}:${issue.message}`;
}

function previewParts(part: PartsRow): Builds.ResolvedParts {
	const parts = { ...props.build.parts } as unknown as Record<string, unknown>;

	if (props.type === 'memory' || props.type === 'storage') {
		// Multi-part categories preview the pending selection plus this row, so toggling a
		// checkbox updates every badge in the list.
		const titles = new Set(picked.value);
		if (!titles.has(part.title)) titles.add(part.title);
		const byTitle = new Map(items.value.map((item) => [item.title, item]));
		parts[props.type] = [...titles]
			.map((title) => byTitle.get(title))
			.filter((item): item is PartsRow => Boolean(item));
	} else {
		parts[props.type] = part;
	}

	return parts as unknown as Builds.ResolvedParts;
}

const currentIssueKeys = computed(() => {
	const issues = validateBuild({ name: props.build.name, parts: props.build.parts });
	return new Set(issues.filter((issue) => !IGNORED_ISSUES.has(issue.code)).map(issueKey));
});

function issuesFor(part: PartsRow): Builds.BuildIssue[] {
	const issues = validateBuild({ name: props.build.name, parts: previewParts(part) });
	return issues.filter((issue) => {
		if (IGNORED_ISSUES.has(issue.code)) return false;
		// A new issue is caused by this candidate even when a rule attributes it to another
		// category (e.g. a GPU pushing the PSU over its wattage).
		if (!currentIssueKeys.value.has(issueKey(issue))) return true;
		if (props.type === 'memory' || props.type === 'storage') {
			return isSelected(part.title) && issue.parts.includes(props.type);
		}
		return issue.parts.includes(props.type);
	});
}

const compatibility = computed(() => {
	const map = new Map<string, Builds.BuildIssue[]>();
	for (const part of items.value) map.set(part.title, issuesFor(part));
	return map;
});

function issuesForRow(title: string): Builds.BuildIssue[] {
	return compatibility.value.get(title) ?? [];
}

function hasError(title: string): boolean {
	return issuesForRow(title).some((issue) => issue.severity === 'error');
}

function badgeFor(title: string) {
	return hasError(title) ? BADGES.incompatible : BADGES.warning;
}

function isSelected(title: string): boolean {
	return picked.value.includes(title);
}

function choose(title: string): void {
	if (props.multiple) {
		picked.value = isSelected(title)
			? picked.value.filter((item) => item !== title)
			: [...picked.value, title];
		return;
	}
	emit('select', [title]);
	open.value = false;
}

function confirm(): void {
	emit('select', picked.value);
	open.value = false;
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`Add ${meta.label}`"
		:description="`Pick a ${meta.label.toLowerCase()} listing from your Parts shortlist. Parts that conflict with this build are flagged, but you can still pick them.`"
		:ui="{ content: UI.dialog }"
	>
		<template #body>
			<div :class="UI.body">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Search listings…"
					class="w-full"
				/>

				<div v-if="items.length === 0" :class="UI.empty">
					<UIcon :name="meta.icon" class="size-8 text-muted" />
					<div>
						<p class="font-medium text-highlighted">
							No {{ meta.label.toLowerCase() }} listings yet
						</p>
						<p class="mt-1 text-muted text-sm">
							Add one from the Parts page first, then come back to attach it to a build.
						</p>
					</div>
					<UButton :to="PART_TYPE_ROUTES[type]" icon="i-lucide-plus">Open Parts</UButton>
				</div>

				<div v-else-if="rows.length === 0" :class="UI.noMatch">
					No listings match “{{ search }}”.
				</div>

				<div v-else :class="UI.list">
					<button
						v-for="part in rows"
						:key="part.title"
						type="button"
						:class="UI.row"
						:disabled="!multiple && selectedTitles.includes(part.title)"
						@click="choose(part.title)"
					>
						<UCheckbox
							v-if="multiple"
							:model-value="isSelected(part.title)"
							:disabled="!multiple && selectedTitles.includes(part.title)"
							tabindex="-1"
							@click.stop
							@update:model-value="choose(part.title)"
						/>
						<UIcon
							v-else
							:name="
								selectedTitles.includes(part.title) ? 'i-lucide-check-circle-2' : 'i-lucide-circle'
							"
							:class="[
								UI.rowIcon,
								selectedTitles.includes(part.title) ? UI.rowIconSelected : UI.rowIconIdle,
							]"
						/>

						<div class="flex-1 min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span :class="UI.rowTitle">
									{{ part.title }}
								</span>
								<UBadge v-if="isPartIncomplete(part)" v-bind="BADGES.incomplete" />
								<UTooltip
									v-if="issuesForRow(part.title).length > 0"
									:content="{ side: 'top' }"
									:ui="{ content: UI.tooltipContent }"
								>
									<UBadge v-bind="badgeFor(part.title)" :class="UI.badge" />
									<template #content>
										<div :class="UI.tooltip">
											<p :class="UI.tooltipTitle">
												{{
													hasError(part.title)
														? 'Incompatible with this build'
														: 'Warnings for this build'
												}}
											</p>
											<ul :class="UI.tooltipList">
												<li
													v-for="issue in issuesForRow(part.title)"
													:key="issueKey(issue)"
													:class="UI.issue"
												>
													<UIcon
														:name="
															issue.severity === 'error'
																? BADGES.incompatible.icon
																: BADGES.warning.icon
														"
														:class="[
															UI.issueIcon,
															issue.severity === 'error' ? UI.issueError : UI.issueWarning,
														]"
													/>
													<span>{{ issue.message }}</span>
												</li>
											</ul>
										</div>
									</template>
								</UTooltip>
							</div>
							<p :class="UI.rowName">{{ part.name }}</p>
						</div>

						<span :class="UI.rowPrice">
							{{ formatPrice(part.price) }}
						</span>
					</button>
				</div>
			</div>
		</template>

		<template v-if="multiple" #footer>
			<div class="flex justify-end gap-2 w-full">
				<UButton color="neutral" variant="ghost" @click="open = false">Cancel</UButton>
				<UButton @click="confirm">Add selected</UButton>
			</div>
		</template>
	</UModal>
</template>
