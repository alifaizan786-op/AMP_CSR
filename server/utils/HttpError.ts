// An error that carries the HTTP status to respond with,
// so controllers can just `throw`
class HttpError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export default HttpError;
