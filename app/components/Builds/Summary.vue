<script setup lang="ts">
import type { Builds } from '~/types/build';
import {
	buildIncompleteCount,
	buildMissingCount,
	buildPartCount,
	buildTotalPrice,
} from '~/utils/builds';
import { formatPrice } from '~/utils/format';

const props = defineProps<{
	build: Builds.ResolvedBuild;
	issues?: Builds.BuildIssue[];
	/** Keeps only the status badges; the caller renders price and part count itself. */
	compact?: boolean;
}>();

const total = computed(() => buildTotalPrice(props.build));
const partCount = computed(() => buildPartCount(props.build));
const incompleteCount = computed(() => buildIncompleteCount(props.build));
const missingCount = computed(() => buildMissingCount(props.build));
const errorCount = computed(
	() => props.issues?.filter((issue) => issue.severity === 'error').length ?? 0,
);
const warningCount = computed(
	() => props.issues?.filter((issue) => issue.severity === 'warning').length ?? 0,
);
</script>

<template>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
		<span v-if="!compact" class="font-semibold text-highlighted tabular-nums">
			{{ formatPrice(total) }}
		</span>
		<span v-if="!compact" class="text-muted">
			{{ partCount }} part{{ partCount === 1 ? '' : 's' }}
		</span>
		<UBadge v-if="incompleteCount > 0" color="warning" variant="subtle" size="sm">
			{{ incompleteCount }} incomplete
		</UBadge>
		<UBadge v-if="missingCount > 0" color="error" variant="subtle" size="sm">
			{{ missingCount }} missing
		</UBadge>
		<UBadge v-if="errorCount > 0" color="error" variant="subtle" size="sm">
			{{ errorCount }} error{{ errorCount === 1 ? '' : 's' }}
		</UBadge>
		<UBadge v-if="warningCount > 0" color="warning" variant="subtle" size="sm">
			{{ warningCount }} warning{{ warningCount === 1 ? '' : 's' }}
		</UBadge>
	</div>
</template>
