# like-process

Handle resources and events for gracefully exit

![](https://img.shields.io/npm/v/like-process.svg) [![](https://img.shields.io/maintenance/yes/2019.svg?style=flat-square)](https://github.com/LuKks/like-process) ![](https://img.shields.io/github/size/lukks/like-process/index.js.svg) ![](https://img.shields.io/npm/dt/like-process.svg) ![](https://img.shields.io/github/license/LuKks/like-process.svg)

```javascript
const like = require('like-process');

setTimeout(() => this_var_not_exists, 2000);

let intervalId = setInterval(() => {
  console.log('count');
}, 500);

like.on('cleanup', () => {
  console.log('cleanup');
  clearInterval(intervalId);
});

like.handle('uncaughtException', (evt, err) => {
  console.error(err);
});
```

## Install
```
npm i like-process
```

## Features
#### Handled signals by default:
- SIGTERM exit for docker, k8s, etc.
- SIGINT exit only when pm2 cluster.
- SIGHUP reload for native cluster.

Reload or SIGHUP in single process will just exit.

#### Handle resources (interval, timeout, etc) with:
- `'terminate'` and `'cleanup'` event.
- `like.terminated` and `like.cleanup` states.

`cleanup` event and state are only for single process or worker but not master.

#### Fallback start-first redundancy with:
- Native cluster module.
- PM2 fork + native cluster.
- Container + native cluster.

#### Description
It was made to combine with [like-server](https://github.com/LuKks/like-server).\
`'terminate'` and `'cleanup'` are async except against `process.exit()`.\
Using pm2 will send the ready signal when all servers are listening.\
Using native cluster there is also an internal ready signal.\
Handling uncaughtException or unhandledRejection the default exitCode is 1.

#### Properties
```javascript
like.terminated: Boolean
like.cleanup: Boolean
like.fallback: Boolean
like.exitCode: {
  exception: Number
  rejection: Number
}
like.isCluster: Boolean
like.isMaster: Boolean
like.isWorker: Boolean
```

#### Methods
```javascript
like.fork(env?: Object): Object
like.exit(code?: Number, worker?: Object): undefined
like.reload(code?: Number, worker?: Object): undefined
like.handle(events: Array|Object|String, callback?: Function): undefined
```

## Examples
In the folder [examples](https://github.com/LuKks/like-process/blob/master/examples) there is a lot of cases.\
Also check the [examples/config_and_flexibility.js](https://github.com/LuKks/like-process/blob/master/examples/config_and_flexibility.js).

Almost all the examples has an uncaught exception, `like.reload()`, etc\
in that way the process will reload or exit for demonstration purposes.

Most examples uses terminate and cleanup events, examples using states:\
[examples/noncluster_loop.js](https://github.com/LuKks/like-process/blob/master/examples/noncluster_loop.js) and [examples/noncluster_error.js](https://github.com/LuKks/like-process/blob/master/examples/noncluster_error.js)

## How it works?
There are too much ways to use it due cluster and more situations.\
I normally handle the events separately and I use [like-server](https://github.com/LuKks/like-server) obviously.

With the next code you already have all:
```javascript
const like = require('like-process');
require('like-server');
const express = require('express');

const app = express();
app.get('/', (req, res) => {
  res.send('hello');
});
let server = app.listen(3000);
like.handle(server); // can attach more servers, for example, http, ws, etc

like.handle(['uncaughtException', 'unhandledRejection'], (evt, err) => {
  console.error(err);
});
```
You can handle more events like disconnect (cluster), beforeExit and exit.

If an event occurs then:
- `like.terminated` state is setted and `'terminate'` event is emitted
- On cluster: will worker.disconnect() which also close servers
- On non-cluster: all handled servers will server.close()
- When all servers are closed:
- `like.cleanup` state is setted and `'cleanup'` event is emitted
- Here we have the event loop empty so it really gracefully exit

Why I use [like-server](https://github.com/LuKks/like-server)?
- Servers and sockets are also treated as resources because they have:
- At server.close() `'terminate'` event and `terminated` state
- On that way we can clear the event loop instantly

## Tests
```
There are no tests yet
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-process/blob/master/LICENSE).
