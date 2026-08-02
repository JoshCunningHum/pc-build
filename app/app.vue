<script setup lang="ts">
import { env } from '~/env';

const title = env.VITE_APP_NAME;

useHead({
	title,
	meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
	link: [{ rel: 'icon', href: '/favicon.ico' }],
	htmlAttrs: { lang: 'en' },
});
</script>

<template>
	<Html class="overflow-x-hidden dark" lang="en">
		<Body class="font-sans antialiased">
			<UApp :tooltip="{ delayDuration: 0 }">
				<NuxtLayout>
					<NuxtPage />
				</NuxtLayout>
				<NuxtLoadingIndicator color="var(--ui-primary)" />
			</UApp>
		</Body>
	</Html>
</template>
