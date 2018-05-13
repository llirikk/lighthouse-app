const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');


class Lighthouse {
	constructor() {
		this.flags = {
	  		chromeFlags: ['--show-paint-rects', '--headless']
		}
		this.configJson = null;
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


module.exports = new Lighthouse();