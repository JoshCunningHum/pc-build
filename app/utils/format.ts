const priceFormatter = new Intl.NumberFormat('en-PH', {
	style: 'currency',
	currency: 'PHP',
	maximumFractionDigits: 2,
});

export function formatPrice(value?: number): string {
	return value === undefined ? '—' : priceFormatter.format(value);
}
