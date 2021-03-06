web-worker-manager
==================

Have long running tasks that you want to perform without blocking your main process?

Use: web-worker-manager

    The manager will handle all the scariness of "threading" or using 
    "Web-Workers".  Just created a worker file that has all your long
    running tasks on it.  The manager will supply a worker object that 
    will handle all thread communications, just use "worker.on" method
    in your worker file to register your tasks.

To use web-worker-manager:

    include web-worker-manager.js in your web projects

Documentation
=============

Create a Manager object:

```javascript
var manager = new Manager(workerFilename, workerLimit)

    workerFilename: String{file path to worker file}
    workerLimit:    Number{maximum number of worker}
```

Properties:

```javascript
manager.workers:       Number{number of worker}
manager.activeWorkers: Number{number of worker doing tasks}
manager.tasks:         Number{number of unfinished tasks}
```

Methods:

```javascript
manager.send(taskName, [...data], [callback])

    taskName: String{name given to task in worker file}
    data:     Arguments{arguments supplied to worker task}
    callback: Function{what gets called when task is completed}

        err:  Error{if worker has error completing task}
        data: Returns{what the worker task returns}
        mess: Object{full details of task at hand}

    returns:
        Number{id assigned to task by manager}

    does:
        creates a new task and sends it to a worker to be done,
        calls the callback given on task completion.

manager.clear(taskId)

    taskId: Number{id assigned to task by manager}

    returns:
        Boolean{true if task was cleared false otherwise}

    does:
        clears task if task hasn't being completed.
```

Example Web Worker file: 'worker.js'

```javascript
worker.on('add', function (a, b) {
    return a + b;
});

worker.on('minus', function (a, b) {
    return a - b;
});
```

Example in app file:

```javascript
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
```

Created By:

    Michaelangelo Jong