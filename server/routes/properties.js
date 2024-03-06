const express = require('express');

const propertyRoutes = express.Router();

const dbo = require('../db/conn');

const ObjectId = require('mongodb').ObjectId;

propertyRoutes.route('/properties/:id').get(async (req, res) => {
	let db_connect = dbo.getPropertyDb();
	console.log('Triggered');
	let query = { UserId: req.params.id };
	try {
		const homes = await db_connect.collection('homes').findOne(query);
		console.log(homes);
		if (homes) {
			res.json(homes);
		} else {
			res.status(404);
		}
	} catch (e) {
		console.log(e);
	}
});

propertyRoutes.route('/properties').post(async (req, res) => {
	let db_connect = dbo.getPropertyDb();
	let query = { email: req.body.email, password: req.body.password };
	try {
		const user = await db_connect.collection('users').findOne(query);
		if (user !== null) {
			const id = { UserId: user._id.toString() };
			const today = new Date();
			const activation = {
				$set: {
					UserId: user._id.toString(),
					token: token(),
					modifiedDate: new Date(today.setDate(today.getDate() + 1)),
				},
			};
			try {
				const userToken = await db_connect.collection('token').findOne(id);
				console.log('Found Token!!!! ', userToken);
				if (userToken) {
					await db_connect
						.collection('token')
						.updateOne(id, activation, (err) => {
							if (err) throw err;
							res.status(200);
						});
				} else {
					await db_connect.collection('token').insertOne(activation, (err) => {
						if (err) throw err;
						res.status(200);
					});
				}
			} catch (e) {
				console.log('Error', e);
			}
			res.status(200);
			res.json({
				username: user.name,
				UserId: activation.$set.UserId,
				token: activation.$set.token,
				modifiedDate: activation.$set.modifiedDate,
			});
		} else {
			res.status(400);
		}
	} catch (e) {
		console.log('Error ', e);
	}
});

propertyRoutes.route('/properties/create').post((req, res) => {
	let db_connect = dbo.getPropertyDb();

	let newUser = {
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
	};

	db_connect.collection('users').insertOne(newUser, (err, response) => {
		if (err) throw err;
		res.json(response);
	});
});

propertyRoutes.route('/properties/update/:id').post((req, res) => {
	let db_connect = dbo.getPropertyDb();

	let query = { _id: ObjectId(req.params.id) };

	let updatedUser = {
		$set: {
			username: req.body.username,
			email: req.body.email,
			password: req.body.password,
		},
	};

	db_connect
		.collection('users')
		.updateOne(query, updatedUser, (err, response) => {
			if (err) throw err;
			res.json(response);
		});
});

propertyRoutes.route('/properties/:id').delete((req, res) => {
	let db_connect = dbo.getPropertyDb();

	let query = { _id: ObjectId(req.params.id) };

	db_connect.collection('users').deleteOne(query, (err, response) => {
		if (err) throw err;
		res.json(response);
	});
});
propertyRoutes.route('/tasks/:id').get(async (req, res) => {
	let db_connect = dbo.getPropertyDb();
	console.log('Triggered req.body ', req.params);
	let query = { houseId: req.params.id };
	console.log('Tasks Query ', query);
	try {
		const tasks = await db_connect.collection('tasks').find(query).toArray();
		console.log('Tasks home response', tasks);
		if (tasks) {
			res.json(tasks);
		} else {
			res.status(404);
		}
	} catch (e) {
		console.log(e);
	}
});

module.exports = propertyRoutes;
