export default defineAppConfig({
    ui: {
        colors: {
            primary: 'emerald',
            neutral: 'neutral',
        },
        link: {
            base: 'underline',
        },
        formField: {
            slots: {
                error: 'mt-0 text-xs',
                help: 'mt-0 text-xs',
            },
        },
        alert: {
            defaultVariants: {
                color: 'neutral',
                variant: 'subtle',
            },
        },
    },
});
