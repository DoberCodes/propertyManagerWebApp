const express = require('express');

const app = express();
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(require('./routes/authentication'));
// get driver connection
const dbo = require('./db/conn');
app.listen(port, () => {
	// perform a database connection when server starts
	dbo.connectToServer(function (err) {
		if (err) console.error(err);
	});
	console.log(`Server is running on port: ${port}`);
});

// const { MongoClient, ServerApiVersion } = require('mongodb');

// const uri =
// 	'mongodb+srv://austdobe:Contour98@mypropertymanager.mdchcmf.mongodb.net/?retryWrites=true&w=majority';

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
// 	serverApi: {
// 		version: ServerApiVersion.v1,
// 		strict: true,
// 		deprecationErrors: true,
// 	},
// });
// const payload = {
// 	email: 'austin.dober@gmail.com',
// 	password: 'Testing123',
// };

// async function run() {
// 	try {
// 		// Connect the client to the server	(optional starting in v4.7)
// 		await client.connect();
// 		console.log('Connected to Server');

// 		const db = client.db('Authentication');

// 		const users = await db.collection('users');

// 		const docs = await users
// 			.find({ email: 'austin.dober@gmail.com', password: 'Testing123' })
// 			.limit(1)
// 			.toArray((err, docs) => {
// 				console.log('Found the following user');
// 				console.log(docs);
// 			});
// 		console.log(docs);
// 	} catch (e) {
// 		console.error(e);
// 	} finally {
// 		// Ensures that the client will close when you finish/error
// 		await client.close();
// 	}
// }

// run().catch(console.dir);
