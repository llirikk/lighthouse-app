const _ = require('lodash');
const express = require('express');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

function launchChromeAndRunLighthouse(url, opts, config = null) {
    return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
    	opts.port = chrome.port;
    	return lighthouse(url, opts, config).then(results => {
        	// The gathered artifacts are typically removed as they can be quite large (~50MB+)
      		delete results.artifacts;
      		return chrome.kill().then(() => results)
    	});
  	});
}

const app = express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/results', (req, res) => {
	const url = req.query.url;
	if (_.isEmpty(url)) {
		res.status(400).send('Bad request');
	}

	const opts = {
	  chromeFlags: ['--show-paint-rects', '--headless']
	};

	launchChromeAndRunLighthouse(url, opts).then(results => {
	  res.status(200).send(results)
	}); 


});

app.listen(3000, function () {
	console.log('Server started at port 3000');
});
