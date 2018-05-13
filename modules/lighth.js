module.exports = new Lighthouse();

class Lighthouse {
	constructor {
		this.opts = {
	  		chromeFlags: ['--show-paint-rects', '--headless']
		}
	}

	run(url) {
		return chromeLauncher.launch({chromeFlags: this.opts.chromeFlags}).then(chrome => {
    	opts.port = chrome.port;
    	return lighthouse(url, this.opts, config).then(results => {
        	// The gathered artifacts are typically removed as they can be quite large (~50MB+)
      		delete results.artifacts;
      		return chrome.kill().then(() => results)
    	});
  	});
	}
}