const { MongoClient } = require('mongodb');
const Db = process.env.ATLAS_URI;
const client = new MongoClient(Db, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

let _db;
let _db2;

module.exports = {
	connectToServer: async function (callback) {
		try {
			await client.connect();
		} catch (e) {
			console.error(e);
		}

		_db = client.db('Authentication');
		_db2 = client.db('Properties');

		return _db === undefined && _db2 === undefined ? false : true;
	},
	getAuthDb: function () {
		return _db;
	},
	getPropertyDb: function () {
		return _db2;
	},
};
