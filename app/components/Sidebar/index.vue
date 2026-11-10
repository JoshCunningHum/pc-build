<script setup lang="ts">
import { sidebarItems } from '~/constants/sidebar';

const items = computed(() => sidebarItems());
</script>

<template>
	<UDashboardSidebar :ui="{ header: 'h-fit py-3' }" collapsible resizable>
		<template #header="{ collapsed }">
			<span v-if="!collapsed" class="text-lg font-semibold text-highlighted">PC Builder</span>
		</template>

		<template #default="{ collapsed }">
			<UNavigationMenu :collapsed="collapsed" :items="items" orientation="vertical" />
		</template>
	</UDashboardSidebar>
</template>

<style lang="css" scoped></style>
