const _ = require('lodash');
const express = require('express');
const lighthouse = require('./modules/lighth');
const config = require('./conf/default.json')

const app = express();

app.get('/results', (req, res) => {
	const url = req.query.url;
	if (_.isEmpty(url)) {
		res.status(400).send('Bad request');
	}
    // should validate url before sending to lighthouse
	console.info(`Starting request processing for ${url}`);
	start = Date.now();
	lighthouse.run(url).then(results => {
		end = Date.now();
		diff = new Date(end - start).getSeconds()
		console.info(`Processed request on ${url} for ${diff} seconds`)
		res.status(200).send(results);
	}).catch((error) => {
		console.error(error)
		res.status(500).send(JSON.stringify(error))
	});
});

app.listen(config.server.port, () => {
	console.log(`Server started at port ${config.server.port}`);
});
