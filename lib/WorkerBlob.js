var workerBlob = function workerBlob(filename, callback) {
    'use strict';
    var WorkerFile = function FileWorker() {
            var tasks = {},
                on = function (name, callback) {
                    tasks[name] = callback;
                };
            self.onmessage = function (event) {
                var mess = JSON.parse(event.data);
                mess['time-started'] = Date.now();
                try {
                    mess.data = tasks[mess.name](Array.prototype.slice.call(mess.data));
                } catch (err) {
                    mess.data = undefined;
                    mess.error = err;
                }
                mess['time-finished'] = Date.now();
                mess['task-time'] = mess['time-finished'] - mess['time-started'];
                self.postmessage(JSON.stringify(mess));
            };

            Object.defineProperty(this, 'on', {value: on});
        },
        xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    }
    xmlhttp.onreadystatechange = function () {
        var err, blob;
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            console.log('cool')
            blob = URL.createObjectURL(new Blob([
                "var WorkerFile = " + WorkerFile.toString()
                    + "\n\n\nvar worker = new WorkerFile();\n\n\n"
                    + xmlhttp.responseText
            ], { type: "text/javascript" }));
        } else if (xmlhttp.readyState === 4 && xmlhttp.status === 404) {
            err = new Error('file not found');
        }
        callback(err, blob);
    };
    xmlhttp.open("GET", filename, true);
    xmlhttp.send();
};