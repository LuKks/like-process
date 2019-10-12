const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

const cluster = require('cluster');

if(like.isMaster) {
  like.fork();
  return;
}

console.log('start', Date.now());
setTimeout(() => {
  console.log('end', Date.now());
  cluster.worker.disconnect();
}, 2000);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
});

like.handle('disconnect');
