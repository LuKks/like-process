const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

setTimeout(async () => {
  throw new Error('db connection failed'); // unhandled rejection here
}, 2000);

setTimeout(() => {
  throw new Error('internal service failed'); // uncaught exception here
}, 2050);

let intervalId = setInterval(() => {
  if (like.cleanup) {
    console.log(NAME, process.pid, 'cleanup');
    setTimeout(() => console.log(NAME, process.pid, 'cleanup async'), 250);
    clearInterval(intervalId);
    return;
  }

  console.log('count');
}, 500);

like.handle(['uncaughtException', 'unhandledRejection'], (evt, arg1) => {
  console.error(arg1);
});
