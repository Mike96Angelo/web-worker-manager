var Manager = function Manager(filename, max) {
	max = typeof max === 'number' ? max : 5;
	var workers = [],
		readyWorkers = [],
		jobQueue = [],
		workerBlobFile,
		idUsed,
		createWorkers = function () {
			var i;
			for (i = 0; i < max; i += 1) {
				workers[i] = new FileWoker(workerBlobFile);
				workers[i].onready = function () {
					if (jobQueue.length === 0) {
						readyWorkers.push(i);
					} else {
						workers[i].send(jobQueue.shift());
					}
				};
				workers[i].onerror = function (err) {
					throw err;
				};
			};
		},
		nextId = function () {
	        idUsed = idUsed === undefined ? 0 : idUsed += 1;
	        idUsed %= Number.MAX_VALUE;
	        return idUsed;
	    },
	    send = function (name, data, callback) {
	    	var id = nextId()
	    		task = new Job(id, name, data, callback);
	    	jobQueue.push(task);
	    	if (readyWorkers.lenght > 0) {
	    		workers[readyWorkers.shift()].send(jobQueue.shift());
	    	}
	    	return id;
	    },
	    clear = function (id) {
	    	var i;
	    	for (i = 0; i < workers.length; i += 1) {
	    		if (workers[i].task.id === id) {
	    			workers[i].restart();
	    			return true;
	    		}
	    	};
	    	for (i = 0; i < jobQueue.length; i += 1) {
	    		if (jobQueue[i].id === id) {
	    			jobQueue.splice(i, 1);
	    			return true;
	    		}
	    	};
	    	return false;
	    };

	workerBlob(filename, function (err, blob) {
		if (err) {
			throw err;
		} else {
			workerBlobFile = blob;
			createWorkers();
		}
	});

	Object.defineProperty(this, 'send', {value: send});
    Object.defineProperty(this, 'clear', {value: clear});
    Object.defineProperty(this, 'workers', {
        get : function () { return workers.length }
    });
    Object.defineProperty(this, 'activeWorkers', {
        get : function () { return workers.length - readyWorkers.length; }
    });
    Object.defineProperty(this, 'tasks', {
        get : function () { return jobQueue.length + workers.length - readyWorkers.length; }
    });
};