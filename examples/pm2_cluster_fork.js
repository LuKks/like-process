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
    console.error(arg1);
  }
});

// [cluster]
// start as cluster:
// pm2 start pm2_cluster_fork.js -i 2 --wait-ready

// reload when you want:
// pm2 reload pm2_cluster_fork.js

// [fork]
// start as fork:
// pm2 start pm2_cluster_fork.js --kill-timeout 300000

// restart when you want:
// pm2 restart pm2_cluster_fork.js

// pm2 enforces a kill-timeout that we don't want
// so you should set it high like 300000ms (5 minutes)
