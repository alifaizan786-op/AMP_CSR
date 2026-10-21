import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import errorHandler from '../middleware/errorHandler';
import { Customer } from '../models';
import HttpError from '../utils/HttpError';

// A tiny app whose only route throws the given error, wired up like the real server,
// so a request shows exactly what errorHandler sends back
const appThatThrows = (error: unknown) => {
	const app = express();
	app.use(express.json());
	app.post('/', () => {
		throw error;
	});
	app.use(errorHandler);
	return app;
};

describe('errorHandler', () => {
	it('passes an HttpError through with its status and message', async () => {
		const res = await request(
			appThatThrows(new HttpError(409, 'Already cancelled')),
		).post('/');

		expect(res.status).toBe(409);
		expect(res.body).toEqual({ message: 'Already cancelled' });
	});

	// The concurrency guard: a save that lost the race becomes a 409, not a 500
	it('turns a version conflict into a 409', async () => {
		// What Mongoose throws when save() finds a newer version than the one it loaded
		const error = new mongoose.Error.VersionError(new Customer(), 0, []);

		const res = await request(appThatThrows(error)).post('/');

		expect(res.status).toBe(409);
		expect(res.body.message).toMatch(/changed by someone else/);
	});

	it('turns schema validation errors into a 400 listing every problem', async () => {
		// A real validation error from the model, built without touching the database.
		// validate() rejects with the error; .catch hands it back so we can throw it.
		const error = await new Customer({
			firstName: 'Ana',
			lastName: 'Lopez',
			email: 'not-an-email',
			phone: '12',
		})
			.validate()
			.catch((err: unknown) => err);

		const res = await request(appThatThrows(error)).post('/');

		expect(res.status).toBe(400);
		expect(res.body.message).toContain('Please enter a valid email address');
		expect(res.body.message).toContain('Please enter a valid phone number');
	});

	it('turns a duplicate key into a 409', async () => {
		const res = await request(appThatThrows({ code: 11000 })).post('/');

		expect(res.status).toBe(409);
	});

	// A real malformed body, so express.json() produces the error itself
	it('turns invalid JSON into a 400', async () => {
		const res = await request(appThatThrows(new Error('not reached')))
			.post('/')
			.set('Content-Type', 'application/json')
			.send('{ not json');

		expect(res.status).toBe(400);
		expect(res.body).toEqual({ message: 'Request body is not valid JSON' });
	});

	// Over express.json()'s 100kb default limit
	it('turns an oversized body into a 413', async () => {
		const res = await request(appThatThrows(new Error('not reached')))
			.post('/')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify({ note: 'a'.repeat(200_000) }));

		expect(res.status).toBe(413);
		expect(res.body).toEqual({ message: 'Request is too large' });
	});

	it('hides unexpected errors behind a generic 500', async () => {
		// The handler logs unexpected errors; keep the test output clean
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const res = await request(
			appThatThrows(new Error('database exploded')),
		).post('/');

		expect(res.status).toBe(500);
		expect(res.body).toEqual({
			message: 'Something went wrong. Please try again.',
		});
	});
});