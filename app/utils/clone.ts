// JSON round-trip, not structuredClone: these objects come off Pinia stores as Vue reactive
// proxies, which structuredClone rejects with a DataCloneError. Everything cloned here is pure
// JSON anyway, and dropping `undefined` keys on the way through is what the callers want.
export function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
