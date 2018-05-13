const _ = require('lodash');
const express = require('express');
const lighthouse = require('./modules/lighth');

const app = express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/results', (req, res) => {
	const url = req.query.url;
	if (_.isEmpty(url)) {
		res.status(400).send('Bad request');
	}

	lighthouse.run(url).then(results => {
		res.status(200).send(results);
	}).catch();
});

app.listen(3000, function () {
	console.log('Server started at port 3000');
});
