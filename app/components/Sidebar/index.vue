<script setup lang="ts">
import { SIDEBAR_ITEMS } from '~/constants/sidebar';
</script>

<template>
	<UDashboardSidebar :ui="{ header: 'h-fit py-3' }" collapsible resizable>
		<template #header="{ collapsed }">
			<span v-if="!collapsed" class="text-lg font-semibold text-highlighted">PC Builder</span>
		</template>

		<template #default="{ collapsed }">
			<UNavigationMenu :collapsed="collapsed" :items="SIDEBAR_ITEMS" orientation="vertical" />
		</template>
	</UDashboardSidebar>
</template>

<style lang="css" scoped></style>
