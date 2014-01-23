var Manager = function Manager(man, max) {
    max = typeof max === 'number' ? max : 10;
    var manager = this,
        workers = [],
        working,
        current=0,
        addWorker = function () {
            var w = new Worker(man);
            w.jobs = 0;
            w.status = 'ready';
            w.lastUsed = Date.now();
            w.work = function(mes,callback) {
                var that = this;
                this.jobs += 1;
                this.status = 'busy';
                this.lastUsed = Date.now();
                this.postMessage(mes);
                this.onmessage = function(res) {
                    that.jobs -= 1;
                    that.status =  that.jobs === 0 ? 'ready' : 'busy';
                    callback(res.data);
                };
            };
            workers.push(w);
            clearInterval(working);
            working = setInterval(function(){
                killWorkers();
            },1000);
            manager.workers = workers.length;
        },
        idleWorker = function (i) {
            var ready = !!(workers[i].status === 'ready'),
                idle  = !!(Date.now()-workers[i].lastUsed > 5000);
            return !!(ready && idle);
        },
        killWorkers = function () {
            for(var i=workers.length-1; i>=0; i-=1) {
                if (idleWorker(i)) {
                    workers[i].terminate();
                    workers.splice(i,1);
                }
            }
            if (workers.length === 0) {
                clearInterval(working);
            }
            manager.workers = workers.length;
        },
        work = function work(mes, callback) {
            if (workers.length === 0) {
                addWorker();
            }
            for(var i=0; i<workers.length; i+=1) {
                if (workers[i].status === 'ready') {
                    break;
                }
            }
            if (i<workers.length) {
                workers[i].work(mes, callback);
            } else if (workers.length < max) {
                addWorker();
                workers[workers.length-1].work(mes, callback);
            } else {
                workers[current].work(mes, callback);
                current += 1;
                current %= workers.length;
            }
        };
    Object.defineProperty(this,'max',{
        get : function(){ return max; },
        set : function(m){ max = typeof m === 'number' ? m : max; }
    });
    Object.defineProperty(this,'workers',{
        get : function(){ return workers.length; },
        set : function(m){}
    });
    Object.defineProperty(this,'work',{
        value: work,
        enumerable : true
    });
};
