// Empty in development (Vite proxies /api);
// set to the deployed API's URL in production
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Carries the HTTP status so pages can react differently,
// e.g. show "not found" on a 404
export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

// Sends a request and returns the parsed JSON, or throws an ApiError with the server's message
export const request = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	const response = await fetch(`${API_URL}/api${path}`, {
		...options,
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});

	// A failed request may not have a JSON body (e.g. the server is down), so don't let parsing crash
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(
			data?.message ?? 'Something went wrong. Please try again.',
			response.status,
		);
	}

	return data as T;
};
