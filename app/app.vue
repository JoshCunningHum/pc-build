<script setup lang="ts">
import { env } from '~/env';

const title = env.VITE_APP_NAME;

// Enter submits the topmost modal's primary action, except while typing in a
// select/combobox (or a textarea), where Enter keeps its normal meaning.
function onModalEnter(event: KeyboardEvent): void {
	if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey) return;

	const target = event.target as HTMLElement | null;
	if (!target) return;
	if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
	if (target.closest('[role="combobox"], [role="listbox"], select')) return;

	const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
	if (dialogs.length === 0) return;

	const dialog = dialogs[dialogs.length - 1];
	const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button')).filter(
		(button) => !button.disabled && button.offsetParent !== null,
	);
	const primary = buttons.at(-1);
	if (!primary) return;

	event.preventDefault();
	primary.click();
}

useEventListener(window, 'keydown', onModalEnter);
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
