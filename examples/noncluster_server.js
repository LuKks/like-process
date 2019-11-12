const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

setTimeout(() => this_var_not_exists, 2000);

const app = require('express')();
app.get('/', (req, res) => {
  res.set('connection', 'close');
  res.send('short [' + process.pid + ']');
});
const serverA = app.listen(3000, () => console.log('listening', process.pid));

like.on('cleanup', () => {
  console.log(NAME, process.pid, 'cleanup');
});

like.handle([serverA, 'uncaughtException'], (evt, arg1) => {
  if(evt === 'server') {
    //console.log(arg1 === serverA, arg1); //true, server object
  }

  if(evt === 'uncaughtException') {
    console.error(arg1);
  }
});
