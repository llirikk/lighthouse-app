const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');
const config = require('./../conf/default.json');


class Lighthouse {
	constructor(flags, config) {
		this.flags = flags
		this.config = config;
	}

	run(url) {
		return chromeLauncher.launch(this.flags).then(chrome => {
			let flags = this.flags;
			flags.port = chrome.port;

    		return lighthouse(url, flags, this.configJson).then(results => {
        		// The gathered artifacts are typically removed as they can be quite large (~50MB+)
      			delete results.artifacts;
      			return chrome.kill().then(() => results)
    		});
  		});
	}
}


module.exports = new Lighthouse(config.lighthouse.flags, config.lighthouse.config);
