import { defineConfig } from 'oxlint';

export default defineConfig({
    plugins: ['typescript', 'unicorn', 'import', 'vue', 'oxc'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
        perf: 'warn',
    },
    env: {
        browser: true,
        node: true,
    },
    ignorePatterns: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
    rules: {
        'eslint/no-console': ['warn', { allow: ['warn', 'error'] }],
        'eslint/no-underscore-dangle': 'off',
    },
    overrides: [
        {
            files: ['**/*.test.ts', '**/*.spec.ts'],
            rules: { 'typescript/no-explicit-any': 'off' },
        },
    ],
});
