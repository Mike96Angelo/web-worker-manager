var Manager = function Manager(workerFile, max) {
    max = typeof max === 'number' ? max : 10;
    var workerBlob,
    working,
    idUsed,
    workers = [],
    readyQueue = [],
    jobQueue = [],
    jobIds = [],
    takenJobs = [],
    takenIds = [],
    FileWorker = function FileWorker(workerBlob) {
        var status,
        lastIdle,
        currentJob,
        onready,
        onerror,
        createWorker = function () {
            worker = new Worker(workerBlob);
            worker.onmessage = onjobfinish;
            worker.onerror = onjoberror;
            status = 'ready';
            lastIdle = Date.now();
            currentJob = undefined;
        },
        send = function (job) {
            currentJob = job;
            status = 'working';
            worker.postMessage(JSON.stringify(job));
            return this;
        },
        onjobfinish = function (message) {
            lastIdle = Date.now();
            message = JSON.parse(message.data);
            if (currentJob.id === message.id) {
                status = 'ready';
                currentJob.job.callback(undefined, message.data, message);
                onready ? onready(currentJob) : undefined;
                currentJob = undefined;
            }
        },
        onjoberror = function (err) {
            worker.terminate();
            status = 'error';
            currentJob.job.callback(err);
            currentJob = undefined;
            onerror ? onerror(err, currentJob) : undefined;
        },
        close = function () {
            worker.terminate();
            status = 'closed';
            currentJob = undefined;
        },
        isIdle = function () {
            if (status !== 'working') {
                return Date.now()-lastIdle;
            } else {
                return 0;
            }
        };

        createWorker();

        Object.defineProperty(this, 'status', {
            get : function(){ return status; },
            set : function(m){}
        });
        Object.defineProperty(this, 'lastIdle', {
            get : function(){ return lastIdle; },
            set : function(m){}
        });
        Object.defineProperty(this, 'onready', {
            get : function(){ return onready; },
            set : function(m){ onready = typeof m === 'function' ? m : undefined;}
        });
        Object.defineProperty(this, 'onerror', {
            get : function(){ return onready; },
            set : function(m){ onerror = typeof m === 'function' ? m : undefined;}
        });
        Object.defineProperty(this, 'isIdle', {value: isIdle});
        Object.defineProperty(this, 'send', {value: send});
        Object.defineProperty(this, 'close', {value: close});
        Object.defineProperty(this, 'restart', {
            value: function () {
                close();
                createWorker();
            }
        });
    },
    Job = function Job(id, name, data, callback) {
        Object.defineProperty(this, 'id', {
            value: id,
            enumerable: true
        });
        Object.defineProperty(this, 'name', {
            value: name,
            enumerable: true
        });
        Object.defineProperty(this, 'data', {
            value: data,
            enumerable: true
        });
        Object.defineProperty(this, 'callback', {
            value: callback,
            enumerable: true
        });
        Object.defineProperty(this, 'time-created', {
            value: Date.now(),
            enumerable: true
        });
    },
    loadWorkerFile = function (){
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        }
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200) {
                workerBlob = URL.createObjectURL(new Blob([
                    "var FileWorker = function FileWorker() {\n"
                    + "    var jobs = {},\n"
                    + "    on = function (name, callback) {\n"
                    + "        jobs[name] = callback;\n"
                    + "    };\n"
                    + "    self.onmessage = function (event) {\n"
                    + "        mess = JSON.parse(event.data);\n"
                    + "        mess['start-time'] = Date.now();\n"
                    + "        mess.job.data = jobs[mess.job.name](mess.job.data, mess);\n"
                    + "        mess['end-time'] = Date.now();\n"
                    + "        mess['run-time'] = mess['end-time'] - mess['start-time'];\n"
                    + "        self.postMessage(JSON.stringify(mess));\n"
                    + "    };\n"
                    + "    Object.defineProperty(this, 'on', {value: on});\n"
                    + "};\n"
                    + "var worker = new FileWorker();\n\n\n"
                    + xmlhttp.responseText
                ], { type: "text/javascript" }));
                createWorker();
                sendJob();
            }
        }
        xmlhttp.open("GET", fileWorker, true);
        xmlhttp.send();
    },
    nextId = function () {
        idUsed = idUsed === undefined ? 0 : idUsed += 1;
        idUsed %= Number.MAX_VALUE;
        return idUsed;
    }
    addWorker = function (job) {
        var w = new FileWorker(workerBlob);
        w.onready = function () {
            readyQueue.push(w);
            takenJobs.shift();
            takenIds.shift();
        };
        w.send(job);
        workers.push(w);
        clearInterval(working);
        working = setInterval(function(){
            killWorkers();
        }, 1000);
        return w;
    },
    killWorkers = function () {
        for(var i = workers.length - 1; i >= 0; i -= 1) {
            if (workers[i].isIdle() > 5000) {
                readyQueue.splice(readyQueue.indexOf(workers[i]), 1);
                workers[i].close();
                workers.splice(i,1);
            }
        }
        if (workers.length === 0) {
            clearInterval(working);
        }
    },
    send = function (name, data, callback) {
        var id = nextId(),
        job = new Job(id, name, data, callback),
        worker;
        if (workers.length === 0) {
            worker = addWorker(job);
            takenJobs.push({job: job, worker: workers.indexOf(worker)});
            takenIds.push(job.id);
        } else if (readyQueue.length > 0) {
            worker = readyQueue.shift().send(job);
            takenJobs.push({job: job, worker: workers.indexOf(worker)});
            takenIds.push(job.id);
        } else {
            jobQueue.push(job);
            jobIds.push(job.id);
        }
        return id;
    },
    clear = function (id){
        var takenIndex = takenIds.indexOf(id),
        jobIndex = jobIds.indexOf(id);
        if (takenIndex !== -1) {
            workers[takenJobs[takenIndex].worker].close();
            workers.splice(takenJobs[takenIndex].worker,1);
            return true;
        } else if (jobIndex !== -1) {
            jobQueue.splice(jobIndex,1);
            jobIds.splice(jobIndex,1);
            return true;
        } else {
            return false;
        }
    };

    loadWorkerFile();

    Object.defineProperty(this,'max',{
        get : function(){ return max; },
        set : function(m){ max = typeof m === 'number' ? m : max; }
    });
    Object.defineProperty(this,'workers',{
        get : function(){ return workers.length; },
        set : function(m){}
    });
    Object.defineProperty(this,'jobs',{
        get : function(){ return jobQueue.length + takenJobs.length; },
        set : function(m){}
    });
    Object.defineProperty(this, 'send', {value: send});
    Object.defineProperty(this, 'clear', {value: clear});
};
