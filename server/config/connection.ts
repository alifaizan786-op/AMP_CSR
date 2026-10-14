import dns from 'dns';
import 'dotenv/config';
import mongoose from 'mongoose';

// Node on some Windows networks can't resolve Atlas SRV records with the default DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI;
if (!uri)
	throw new Error(
		'MONGODB_URI is not set. Copy .env.example to .env and fill it in.',
	);

mongoose.connect(uri);

export default mongoose.connection;
