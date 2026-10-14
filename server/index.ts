import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import db from './config/connection';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

// Express 5 forwards errors thrown in async handlers here, so controllers don't need try/catch
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(error);
	res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

db.once('open', () => {
	app.listen(PORT, () =>
		console.log(`API running on http://localhost:${PORT}`),
	);
});
