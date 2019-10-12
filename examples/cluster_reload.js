const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  return;
}

setTimeout(() => like.reload(/*optional exitCode*/), 2000);

let count = 0;
let intervalId = setInterval(() => {
  console.log('count', count++);
}, 500);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup at', count);
  clearInterval(intervalId);
});

like.handle('disconnect');
