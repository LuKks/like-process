const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

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
    process.stderr.write(arg1.stack + '\n');
  }
});

//start as cluster: pm2 start pm2_cluster.js -i 2 --wait-ready
//reload when you want: pm2 reload pm2_cluster
