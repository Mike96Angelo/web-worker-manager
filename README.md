web-worker-manager
==================

Have long running tasks that you want to perform without blocking your main process?

Use: web-worker-manager

    The manager with handle all the scaryness of "threading" or using "Web Workers".
    Just created a worker file that has all your long runing tasks on it.  The manager
    will supply a woker object that will handle all thread communications, just use
    "worker.on(taskName, taskFunction);" in your worker file to redgestor your tasks.

To use web-worker-manager:

    inclued web-worker-manager.js in your web projects

Documentation:

    var manager = new Manager(workerFilename, workerLimit)

        workerFilename: String{file path to worker file}
        workerLimit:    Number{maximun number of worker}

        properties:

            manager.workers:       Number{number of worker}
            manager.activeWorkers: Number{number of worker doing tasks}
            manager.tasks:         Number{number of unfinished tasks}

        methods:

            manager.send(taskName, [...data], [callback])
                arguments:
                    taskName: String{name given to task in worker file}
                    data:     Arguments{arguments supplied to worker task}
                    callback: Function{what gets called when task is completed}
                        args: err, data, mess
                            err:  Error{if worker has error completing task}
                            data: Returns{what the worker task returns}
                            mess: Object{full details of task at hand}
                returns:
                    Number{id assigned to task by manager}

                does:
                    creates a new task and sends it to a worker to be done, calls
                    the callback give on task completetion.

            manager.clear(taskId)
                arguments:
                    taskId: Number{id assigned to task by manager}

                returns:
                    Boolean{true if task was cleared false otherwise}

Example Web Worker file: 'worker.js'

    worker.on('add', function (a, b) {
        return a + b;
    });

    worker.on('minus', function (a, b) {
        return a - b;
    });

Example in app file:

    var manager = new Manager('worker.js', 10);

    manager.send('add', [2, 4], function (err, data, mess) {
        if (err) {
            // handle errors here
            console.log(err);
        } else {
            // do stuff with data here
            console.log(data, mess);
        }
    });

    manager.send('minus', [2, 4], function (err, data, mess) {
        if (err) {
            // handle errors here
            console.log(err);
        } else {
            // do stuff with data here
            console.log(data, mess);
        }
    });


Created By:

    Michaelangelo Jong