const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

setTimeout(() => this_var_not_exists, 2000);

let intervalId = setInterval(() => {
  console.log('count');
}, 500);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
  clearInterval(intervalId);
});

like.handle('uncaughtException', (evt, arg1) => {
  console.error(arg1);
});
