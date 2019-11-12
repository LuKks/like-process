const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  return;
}

//only for native cluster, reload in case of failure like uncaught exception:
like.fallback = true; //default true -> like.reload() and false -> like.exit()

// default exit code when there is a uncaught exception
like.exitCode.exception = 1; // default 1, set as false to disable exit code setting
/*
normally when you do process.on('uncaughtException', ...) the exit code becomes zero
because you are handling the exception so "there is no error"
in that case, if you want to exit as failure you need to set the exit code manually

but when you do like.handle('uncaughtException', ...) with default settings
the exit code will be setted as 1 to keep the right behaviour

if you want to keep the original behaviour of node just do:
like.exitCode.exception = false;
*/

// default exit code when there is a uncaught exception
like.exitCode.rejection = 1; // default 1, set as false to disable exit code setting
/*
unhandled rejection occurs when a promise fail without catch, you see from node something like:
"Unhandled promise rejections are deprecated. In the future,
promise rejections that are not handled will terminate the Node.js process with a non-zero exit code."
in other words: in the future, unhandled rejection will act same as uncaught exception

for the moment doing process.on('unhandledRejection', ...) just catch promises

but when you do like.handle('unhandledRejection', ...) with default settings
the exit code will be setted as 1 to keep the right behaviour

if you want to keep the original behaviour of node just do:
like.exitCode.rejection = false;
*/

const app = require('express')();

app.get('/', (req, res) => {
  res.set('connection', 'close');
  res.send('short with ' + process.pid);
});

setTimeout(() => {
  const serverA = app.listen(3000, () => console.log('listening', process.pid));
  like.handle(serverA);
}, 500);

setTimeout(() => {
  const serverB = app.listen(3001, () => console.log('listening', process.pid));
  like.handle(serverB, (evt, arg1) => {
    //console.log(evt === 'server'); //true
    //console.log(arg1 === serverB); //true
  });
}, 500);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
  setTimeout(() => console.log(NAME, process.pid, 'cleanup async'), 500);
});

like.handle('uncaughtException', (evt, arg1) => {
  console.error(arg1);
});

setTimeout(() => {
  this_var_not_exists;
  //also try changing fallback to false
}, 3000);

//also can remove default listeners
//process.removeListener('SIGTERM', like.exit);
//process.removeListener('SIGINT', like.exit); //only on pm2 cluster
//process.removeListener('SIGHUP', like.reload);
