import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt'],
	ssr: false,
	icon: {
		serverBundle: {
			collections: ['lucide'],
		},
	},
	experimental: {
		typedPages: true,
	},
	css: ['~/assets/css/main.css'],
	vite: {
		plugins: [vueJsx()],
	},
});
