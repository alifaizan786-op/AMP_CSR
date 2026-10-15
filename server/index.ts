import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import db from './config/connection';
import errorHandler from './middleware/errorHandler';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api',  routes);
app.use(errorHandler);

db.once('open', () => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});