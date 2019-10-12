const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

console.log('start', Date.now());
setTimeout(() => {
  console.log('end', Date.now());
}, 2000);

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
});

like.handle('beforeExit');
