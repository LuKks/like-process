const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  return;
}

//only for native cluster, reload in case of failure like uncaught exception:
like.fallback = true; //default true -> like.reload() and false -> like.exit()

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
