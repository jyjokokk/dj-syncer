export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function okWrapper<T>(
	value: T,
): Extract<Result<T, never>, { ok: true }> {
	return { ok: true, value };
}

export function errWrapper<E>(
	error: E,
): Extract<Result<never, E>, { ok: false }> {
	return { ok: false, error };
}
