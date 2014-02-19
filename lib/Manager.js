var Manager = function Manager(filename, max) {
    'use strict';
    max = typeof max === 'number' ? max : 5;
    var workers = [],
        readyWorkers = [],
        jobQueue = [],
        workerBlobFile,
        idUsed,
        nextId = function () {
            idUsed = idUsed === undefined ? 0 : idUsed + 1;
            idUsed %= Number.MAX_VALUE;
            return idUsed;
        },
        send = function (name, data, callback) {
            var id = nextId(),
                task;

            if (name && data && callback) {
                task = new Job(id, name, data, callback);
                jobQueue.push(task);
            }
            if (readyWorkers.length > 0) {
                return workers[readyWorkers.shift()].send();
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
            }
            for (i = 0; i < jobQueue.length; i += 1) {
                if (jobQueue[i].id === id) {
                    jobQueue.splice(i, 1);
                    return true;
                }
            }
            return false;
        },
        createWorkers = function () {
            var i,
                onready = function (worker, mess) {
                    if (jobQueue.length === 0) {
                        readyWorkers.push(worker.id);
                    } else {
                        worker.send(jobQueue.shift());
                    }
                },
                onerror = function (err) {
                    throw err;
                };
            for (i = 0; i < max; i += 1) {
                workers[i] = new FileWorker(workerBlobFile);
                workers[i].id = i;
                workers[i].onready = onready;
                workers[i].onerror = onerror;
                readyWorkers.push(workers[i].id);
            }
            while (jobQueue.length > 0 && readyWorkers.length > 0) {
                send();
            }
        },
        workerBlob = function (filename) {
            var WorkerFile = function FileWorker() {
                    var tasks = {},
                        on = function (name, callback) {
                            tasks[name] = callback;
                        };
                    self.onmessage = function (event) {
                        var mess = JSON.parse(event.data);

                        mess['time-started'] = Date.now();
                        try {
                            mess.data = tasks[mess.name].apply(tasks[mess.name], mess.data);
                        } catch (err) {
                            mess.data = undefined;
                            mess.error = err;
                        }
                        mess['time-finished'] = Date.now();
                        mess['task-time'] = mess['time-finished']
                                                - mess['time-started'];
                        self.postMessage(JSON.stringify(mess));
                    };

                    Object.defineProperty(this, 'on', {value: on});
                },
                xmlhttp;
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();

                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                        workerBlobFile = URL.createObjectURL(new Blob([
                            "var WorkerFile = " + WorkerFile.toString()
                                + "\n\n\nvar worker = new WorkerFile();\n\n\n"
                                + xmlhttp.responseText
                        ], { type: "text/javascript" }));
                        createWorkers();
                    }
                };
                xmlhttp.open("GET", filename, true);
                xmlhttp.send();
            }
        };

    workerBlob(filename);

    Object.defineProperty(this, 'send', {value: send});
    Object.defineProperty(this, 'clear', {value: clear});
    Object.defineProperty(this, 'workers', {
        get : function () { return workers.length; }
    });
    Object.defineProperty(this, 'activeWorkers', {
        get : function () { return workers.length - readyWorkers.length; }
    });
    Object.defineProperty(this, 'readyWorkers', {
        get : function () { return readyWorkers.length; }
    });
    Object.defineProperty(this, 'tasks', {
        get : function () {
            return jobQueue.length + workers.length - readyWorkers.length;
        }
    });
};