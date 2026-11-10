import type { Parts } from '~/types/parts';

// Derived, never stored: filling in the missing field clears the flag automatically.
export function isPartIncomplete(part: Pick<Parts.Base, 'price' | 'link'>): boolean {
	return part.price === undefined || !part.link;
}

export function missingPartFields(part: Pick<Parts.Base, 'price' | 'link'>): string[] {
	return [...(part.price === undefined ? ['price'] : []), ...(!part.link ? ['source link'] : [])];
}
