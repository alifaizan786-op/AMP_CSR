const dns = require('dns');
const mongoose = require('mongoose');

// Node on some Windows networks can't resolve Atlas SRV records with the default DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(process.env.MONGODB_URI);

module.exports = mongoose.connection;
