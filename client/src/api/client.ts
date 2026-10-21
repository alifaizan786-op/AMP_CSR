// Carries the HTTP status so pages can react differently, e.g. show "not found" on a 404.
// `field` is set when the server says the problem is a specific value we sent.
export class ApiError extends Error {
	status: number;
	field?: string;

	constructor(message: string, status: number, field?: string) {
		super(message);
		this.status = status;
		this.field = field;
	}
}

// Sends a request and returns the parsed JSON, or throws an ApiError with the server's message
export const request = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	// Always same-origin: Vite proxies /api in development, and Express serves the app in production
	const response = await fetch(`/api${path}`, {
		...options,
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});

	// A failed request may not have a JSON body (e.g. the server is down), so don't let parsing crash
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(
			data?.message ?? 'Something went wrong. Please try again.',
			response.status,
			data?.field,
		);
	}

	return data as T;
};

// A 409 or 404 on a write usually means the data changed after the page loaded
// (another tab or CSR got there first), so the page should reload what it shows.
// A conflict about a specific field (e.g. an email already in use) is about what was typed instead.
export const describeWriteError = (err: unknown) => {
	const message = err instanceof Error ? err.message : 'Something went wrong';
	const stale =
		err instanceof ApiError &&
		(err.status === 409 || err.status === 404) &&
		!err.field;
	return {
		stale,
		message: stale
			? `${message}. The page now shows the latest data.`
			: message,
	};
};
