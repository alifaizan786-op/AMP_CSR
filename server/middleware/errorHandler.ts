import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import HttpError from '../utils/HttpError';

// Turns every error into a consistent { message } response with the right status code.
// Express 5 forwards errors thrown in async handlers here,
// so controllers don't need try/catch.
const errorHandler = (
	error: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (error instanceof HttpError) {
		return res.status(error.status).json({ message: error.message });
	}

	// express.json() rejected the body: it isn't valid JSON, or it's over the 100kb default limit
	if (typeof error === 'object' && error !== null && 'type' in error) {
		if (error.type === 'entity.parse.failed') {
			return res
				.status(400)
				.json({ message: 'Request body is not valid JSON' });
		}
		if (error.type === 'entity.too.large') {
			return res.status(413).json({ message: 'Request is too large' });
		}
	}

	// Schema validation failed, e.g. a malformed email or phone
	if (error instanceof mongoose.Error.ValidationError) {
		const messages = Object.values(error.errors).map(
			(fieldError) => fieldError.message,
		);
		return res.status(400).json({ message: messages.join('. ') });
	}

	// Someone else saved this customer between our load and our save (see optimisticConcurrency)
	if (error instanceof mongoose.Error.VersionError) {
		return res.status(409).json({
			message:
				'This account was just changed by someone else. Refresh and try again.',
		});
	}

	// MongoDB duplicate key error, e.g. an email that already belongs to another customer
	if (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 11000
	) {
		return res
			.status(409)
			.json({ message: 'That email is already in use by another customer' });
	}

	console.error(error);
	res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

export default errorHandler;
