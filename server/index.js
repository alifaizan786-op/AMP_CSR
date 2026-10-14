require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/connection');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

db.once('open', () => {
	app.listen(PORT, () =>
		console.log(`API running on http://localhost:${PORT}`),
	);
});
