const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

setTimeout(() => this_var_not_exists, 2000);

let count = 0;
let intervalId = setInterval(() => {
  console.log('count', count++);
}, 500);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup at', count);
  clearInterval(intervalId);
});

like.handle('uncaughtException', (evt, arg1) => {
  process.stderr.write(arg1.stack + '\n');
});
