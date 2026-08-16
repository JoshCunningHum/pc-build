import type { ConstantEntry, ConstantId } from '~/stores/constants';
import { CONSTANT_META } from '~/stores/constants';

// Pure operations over a plain entry list, so the Settings draft can stage edits without
// touching the persisted store. Each returns a new array; `undefined` means rejected.

function isOrderable(id: ConstantId): boolean {
	return CONSTANT_META.find((meta) => meta.id === id)?.orderable ?? false;
}

function taken(entries: ConstantEntry[], label: string, exclude?: string | number): boolean {
	return entries.some(
		(entry) => entry.value !== exclude && entry.label.toLowerCase() === label.toLowerCase(),
	);
}

function nextValue(id: ConstantId, entries: ConstantEntry[], label: string): string | number {
	if (id === 'ddr' || !isOrderable(id)) return label;

	// pcie stores the generation number itself, so honour a numeric label when there is one.
	const parsed = Number(label.replace(/[^\d.]/g, ''));
	if (id === 'pcie' && !Number.isNaN(parsed) && parsed > 0) return parsed;

	const highest = entries.reduce(
		(max, entry) => (typeof entry.value === 'number' ? Math.max(max, entry.value) : max),
		-1,
	);
	return highest + 1;
}

export function sortedEntries(id: ConstantId, entries: ConstantEntry[]): ConstantEntry[] {
	if (isOrderable(id)) return entries;
	return [...entries].toSorted((a, b) =>
		a.label.localeCompare(b.label, undefined, { numeric: true }),
	);
}

export function addEntry(
	id: ConstantId,
	entries: ConstantEntry[],
	label: string,
	brand?: string,
): ConstantEntry[] | undefined {
	const trimmed = label.trim();
	if (trimmed === '' || taken(entries, trimmed)) return undefined;

	const trimmedBrand = brand?.trim();
	return [
		...entries,
		{
			label: trimmed,
			value: nextValue(id, entries, trimmed),
			...(trimmedBrand ? { brand: trimmedBrand } : {}),
		},
	];
}

export function updateEntry(
	entries: ConstantEntry[],
	value: string | number,
	label: string,
	brand?: string,
): ConstantEntry[] | undefined {
	const trimmed = label.trim();
	if (trimmed === '') return undefined;

	const index = entries.findIndex((entry) => entry.value === value);
	const current = entries[index];
	if (!current || taken(entries, trimmed, value)) return undefined;

	// Label-keyed lists (sockets, microarchitectures, PSU types) store the label itself, so
	// renaming has to carry the value along. Ranked lists key on a fixed ordinal that specs
	// already reference -- there the label is display-only and the value must not move.
	const keyedByLabel = current.value === current.label;
	const trimmedBrand = brand?.trim();

	return entries.with(index, {
		label: trimmed,
		value: keyedByLabel ? trimmed : current.value,
		...(trimmedBrand ? { brand: trimmedBrand } : {}),
	});
}

export function removeEntry(entries: ConstantEntry[], value: string | number): ConstantEntry[] {
	return entries.filter((entry) => entry.value !== value);
}

export function moveEntry(
	entries: ConstantEntry[],
	value: string | number,
	delta: number,
): ConstantEntry[] {
	const from = entries.findIndex((entry) => entry.value === value);
	const to = from + delta;
	if (from === -1 || to < 0 || to >= entries.length) return entries;

	const next = [...entries];
	const [moved] = next.splice(from, 1);
	if (moved) next.splice(to, 0, moved);
	return next;
}
