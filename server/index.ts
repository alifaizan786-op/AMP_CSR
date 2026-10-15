import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import db from './config/connection';
import errorHandler from './middleware/errorHandler';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

// Unknown API routes get a JSON 404 instead of falling through to the React app below
app.use('/api', (req, res) => {
	res.status(404).json({ message: 'Not found' });
});

// In production one service serves both the API and the built React app (same origin, no CORS).
// In development Vite serves the client and proxies /api here instead.
if (process.env.NODE_ENV === 'production') {
	// Compiled server runs from server/dist, so the client build is two levels up
	const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
	app.use(express.static(clientDist));

	// React Router owns paths like /customers/123; send index.html so a refresh doesn't 404
	app.get('/{*splat}', (req, res) => {
		res.sendFile(path.join(clientDist, 'index.html'));
	});
}

app.use(errorHandler);

db.once('open', () => {
	app.listen(PORT, () =>
		console.log(`API running on http://localhost:${PORT}`),
	);
});
