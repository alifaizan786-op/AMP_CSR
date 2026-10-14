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

	// Schema validation failed, e.g. a malformed email or phone
	if (error instanceof mongoose.Error.ValidationError) {
		const messages = Object.values(error.errors).map(
			(fieldError) => fieldError.message,
		);
		return res.status(400).json({ message: messages.join('. ') });
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
