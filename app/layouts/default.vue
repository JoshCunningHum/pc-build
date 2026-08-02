<template>
	<UMain>
		<UDashboardGroup unit="rem">
			<Sidebar />
			<UDashboardPanel>
				<slot />
			</UDashboardPanel>
		</UDashboardGroup>
	</UMain>
</template>
