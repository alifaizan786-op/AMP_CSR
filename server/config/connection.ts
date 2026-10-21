import dns from 'dns';
import 'dotenv/config';
import mongoose from 'mongoose';

// Opt-in workaround for networks whose DNS can't resolve Atlas SRV records (seen on some
// Windows setups). Off unless DNS_SERVERS is set, so production uses the host's resolver.
if (process.env.DNS_SERVERS) {
	dns.setServers(process.env.DNS_SERVERS.split(','));
}

const uri = process.env.MONGODB_URI;
if (!uri)
	throw new Error(
		'MONGODB_URI is not set. Copy .env.example to .env and fill it in.',
	);

mongoose.connect(uri);

export default mongoose.connection;
