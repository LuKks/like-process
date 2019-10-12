# like-process

Handle events for gracefully exit with 100% uptime (cluster compatible)

![](https://img.shields.io/npm/v/like-process.svg) [![](https://img.shields.io/maintenance/yes/2019.svg?style=flat-square)](https://github.com/LuKks/like-process) ![](https://img.shields.io/github/size/lukks/like-process/index.js.svg) ![](https://img.shields.io/npm/dt/like-process.svg) ![](https://img.shields.io/github/license/LuKks/like-process.svg)

```javascript
const like = require('like-process');

setTimeout(() => this_var_not_exists, 2000);

let count = 0;
let intervalId = setInterval(() => {
  console.log('count', count++);
}, 500);

like.on('cleanup', () => {
  console.log('cleanup at', count);
  clearInterval(intervalId);
});

like.handle('uncaughtException', (evt, arg1) => {
  process.stderr.write(arg1.stack + '\n');
});
```

## Install
```
npm i like-process
```

## Features
#### Handled signals by default:
- SIGTERM exit for swarm, k8s, etc.
- SIGINT exit only when pm2 cluster.
- SIGHUP reload for native cluster.

Reload or SIGHUP in single process will just exit.

#### Handle resources (interval, timeout, etc) with:
- `'terminate'` and `'cleanup'` event.
- `like.terminated` and `like.cleanup` states.

`terminate`: process want to exit due signal, uncaught ex., like.exit/reload(), etc.\
`cleanup`: servers closed, worker disconnected, beforeExit or exit (whatever comes first).

`cleanup` event and state are only for single process or worker but not master.

#### Fallback start-first redundancy with:
- Native cluster module.
- PM2 fork + native cluster.
- Container + native cluster.

Also can use pm2 cluster or containers with single process but\
need enough workers/containers for good redundancy in case of failures.

#### Description
It was made to combine with [like-server](https://www.npmjs.com/like-server).\
Extremely useful when have deployment with docker, pm2, k8s, etc.\
Should be enough for all the cases using the different events and states.\
`'terminate'` and `'cleanup'` are async except against `process.exit()`.\
Using pm2 will send the ready signal when all servers are listening.\
Using cluster module there is also an internal ready signal.

## Examples
In the folder [examples](https://github.com/LuKks/like-process/blob/master/examples) there is a lot of cases.\
Also check the [examples/config_and_flexibility.js](https://github.com/LuKks/like-process/blob/master/examples/config_and_flexibility.js).

Almost all the examples has an uncaught exception, `like.reload()`, etc\
in that way the process reload or exit for demonstration purposes.

## Example server with native cluster
```javascript
const like = require('like-process');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  return;
}

setTimeout(() => this_var_not_exists, 2000);

const app = require('express')();
app.get('/', (req, res) => {
  res.set('connection', 'close');
  res.send('short with ' + process.pid);
});
const serverA = app.listen(3000, () => console.log('listening', process.pid));

like.on('cleanup', () => {
  setTimeout(() => console.log(NAME, process.pid, 'cleanup async'), 200);
});

like.handle([serverA, 'uncaughtException'], (evt, arg1) => {
  if(evt === 'server') {
    //console.log(arg1 === serverA, arg1); //true, server object
  }

  if(evt === 'uncaughtException') {
    process.stderr.write(arg1.stack + '\n');
  }
});
```

## Example with PM2 cluster mode
Take the previous example and remove the timeout with `this_var_not_exists;`\
Start as cluster: `pm2 start example.js -i 2 --wait-ready`\
Reload when you want: `pm2 reload example`

## Tests
```
There are no tests yet
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-process/blob/master/LICENSE).
