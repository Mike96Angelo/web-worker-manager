var FileWorker = function FileWorker(filename, keepAlive) {
    var onready,
    onerror,
    idleTime,
    killWoker,
    _worker,
    _task,
    task = function () {
        var sendTask = {};
        for (var i in _task) {
            if (i !== 'callback') {
                sendTask[i] = _task[i];
            }
        }
        return sendTask;
    },
    idleFor = function (time) {
        return Date.now() - idleTime > time;
    },
    start = function () {
        _worker = new Worker(filename);
        _worker.onmessage = function(message) {
            message['time-completed'] = Date.now();
            message['total-time'] = message['time-completed'] - message['time-assigned'];
            _task.callback(message.error, message.data, message);
            _task = undefined;
            onready ? onready(message) : undefined;
        });
        _worker.onerror = function(error){
            onerror ? onerror(error) : undefined;
        });
        idleTime = Date.now();
        if (!keepAlive) {
            killWoker = setInterval(function () {
                if (idleFor(5000)) {
                    close();
                    clearInterval(killWoker);
                }
            }, 1000);
        }
    },
    close = function () {
        if (_worker) {
            _worker.kill();
            _worker = undefined;
        }
    },
    send = function (job) {
        if (!_worker) {
            start();
        }
        if(!_task && job) {
            _task = job;
            _worker.send(task());
            return true;
        }
        return false;
    };

    Object.defineProperty(this, 'send', {value: send});
    Object.defineProperty(this, 'close', {value: close});
    Object.defineProperty(this, 'start', {value: start});
    Object.defineProperty(this, 'status', {
        get : function(){ return _task ? 'working' : 'ready'; },
        set : function(m){}
    });
    Object.defineProperty(this, 'task', {
        get : function(){ return _task; },
        set : function(m){}
    });
    Object.defineProperty(this, 'onready', {
        get : function(){ return onready; },
        set : function(m){ onready = typeof m === 'function' ? m : undefined;}
    });
    Object.defineProperty(this, 'onerror', {
        get : function(){ return onerror; },
        set : function(m){ onerror = typeof m === 'function' ? m : undefined;}
    });
};