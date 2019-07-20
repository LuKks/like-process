# like-process

Handle signals for gracefully exit with 100% uptime (cluster compatible)

![](https://img.shields.io/npm/v/like-process.svg) [![](https://img.shields.io/maintenance/yes/2019.svg?style=flat-square)](https://github.com/LuKks/like-process) ![](https://img.shields.io/github/size/lukks/like-process/index.js.svg) ![](https://img.shields.io/npm/dt/like-process.svg) ![](https://img.shields.io/github/license/LuKks/like-process.svg)

### I'm still working on it.

I made this pre-release to use on my project so it's useful,\
but I want that the library handles all the cases easily.\
I need more time to do some changes, remove useless code, etc.

```javascript
const like = require('like-process');

if(like.isMaster) {
  console.log('master', process.pid);
  like.fork();
  return;
}

console.log('started', process.pid);

const app = require('express')();

app.get('/', (req, res) => {
  res.send('short [' + process.pid + ']');
});

app.get('/long', (req, res) => {
  setTimeout(() => res.send('long [' + process.pid + ']'), 5000);
});

const serverA = app.listen(3000, () => console.log('listening', process.pid));

//error in 1ms and still 100% uptime, even with only 1 worker
setTimeout(() => {
  this_var_not_exists; //will reload if you are clustering otherwise exit

  //like.exit(1); //exit with optional exitCode
  //like.reload(); //reload, also can set an exitCode

  //process.kill(process.pid, 'SIGTERM'); //exit by signal
  //process.kill(process.pid, 'SIGHUP'); //reload by signal

  //process.exit(); //the cleanup can't be async with it
}, 1);

//when you try it, you will see a lot of logs
//just go to http://localhost:3000 and it's up 100%
//wait some seconds and try another request, the pid changed
//it's due the keep-alive, for that you can use like-server
//but means that it's working

like.on('terminate', () => {
  //at this moment like.terminated it's and keep as true
  console.log('terminate', process.pid);

  //commonly you don't need this event but there is some cases
  //anyway, for example, you can implement a timeout
});

like.on('cleanup', () => {
  //at this moment like.cleanup it's and keep as true
  console.log('cleanup', process.pid); //close db, etc
  setTimeout(() => console.log('cleanup async', process.pid), 250);

  //if your app run extra code outside the server like setInterval/setTimeout
  //can use like.terminated or like.cleanup, 'terminate' or 'cleanup' event
  //to know when to clear in the same code
});

//for this example the 'disconnect' and 'beforeExit' are not needed
//but on this way, this same example it's useful for several cases
like.handle([serverA, 'disconnect', 'uncaughtException', 'beforeExit', 'exit'], (evt, arg1) => {
  //console.log('handle', evt);

  if(evt === 'uncaughtException') {
    process.stderr.write(arg1/*err*/.stack + '\n');
  }

  if(evt === 'exit') {
    console.log('exited (' + arg1/*code*/ + ')', process.pid);
  }
});
```

## Install
```
npm i like-process
```

#### Handles signals by default:
- Exit with SIGTERM: swarm, k8s, systemd, etc.
- Exit with SIGINT: pm2.
- Reload with SIGHUP: custom, systemd, etc.

Also can send a signal to specific worker or single process.\
When you do a reload in single process it's equal than doing an exit,\
otherwise will fork a new worker and when it's ready disconnect the old one.

#### Optionally handle resources (interval, timeout, etc) with:
- `'terminate'` and `'cleanup'` event.
- `like.terminated` and `like.cleanup` states.

`terminate`: process want to exit due signal, uncaught ex., like.exit/reload(), etc.\
`cleanup`: servers closed, worker disconnected, beforeExit or exit (whatever comes first).

#### Compatible:
- Single process with replicated containers.
- Single process with pm2 cluster.
- Worker/s with cluster module.

#### Description
It was made to combine with [like-server](https://www.npmjs.com/like-server).\
Extremely useful when you have deployment with Docker, pm2, k8s, etc.\
Should be enough for all the cases using the different events and states.\
Async cleanup when it's possible.\
Using pm2 will send the ready signal when all servers are listening.\
Using cluster module there is also an internal ready signal.

## Examples
It's a pre-release, the usage can change and there is a lot of cases,\
so I did not write more examples for this moment.\
\
I think that only the like.handle() can change a bit\
because I don't like to force the stderr.write manually.\
Also can be problems to easily attach the server object.\
And I need more tests to know that it's apply perfect for all the cases.

## Tests
```
There are no tests yet
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-process/blob/master/LICENSE).
