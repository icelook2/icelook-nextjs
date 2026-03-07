// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
	let timeoutId: ReturnType<typeof setTimeout>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((...args: any[]) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), ms);
	}) as T;
}
