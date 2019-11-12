const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  return;
}

setTimeout(() => this_var_not_exists, 2000);

let intervalId = setInterval(() => {
  console.log('count');
}, 500);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
  clearInterval(intervalId);
});

like.handle(['disconnect', 'uncaughtException'], (evt, arg1) => {
  if(evt === 'uncaughtException') {
    console.error(arg1);
  }
});
