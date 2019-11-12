const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

setTimeout(() => this_var_not_exists, 2000);

let intervalId = setInterval(() => {
  if (like.cleanup) {
    console.log(NAME, process.pid, 'cleanup');
    setTimeout(() => console.log(NAME, process.pid, 'cleanup async'), 250);
    clearInterval(intervalId);
    return;
  }

  console.log('count');
}, 500);

like.handle('uncaughtException', (evt, arg1) => {
  console.error(arg1);
});
