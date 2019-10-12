const like = require('../index.js');
const NAME = like.isMaster ? 'master' : 'worker';
console.log(NAME, process.pid, 'started');

if(like.isMaster) {
  like.fork();
  like.on('terminate', worker => console.log('worker want to terminate'));
  return;
}

setTimeout(() => {
  console.log(NAME, process.pid, 'manual reload');
  like.reload(/*optional exitCode*/);
  //like.exit(/*optional exitCode*/);

  //process.exit(); //cleanup won't be async
}, 3000);

like.on('terminate', () => {
  //at this moment like.terminated is and it keep as true
  console.log(NAME, process.pid, 'terminate');
  //normally not need this event but, for example, can implement a timeout
});

like.on('cleanup', () => {
  //at this moment like.cleanup is and it keep as true
  console.log(NAME, process.pid, 'cleanup'); //close db, etc
  setTimeout(() => console.log(NAME, process.pid, 'cleanup async'), 250);
});

like.handle([/*serverA, */'disconnect', 'uncaughtException', 'exit'], (evt, arg1) => {
  console.log(NAME, process.pid, 'handle', evt);

  /*if(evt === 'server') {
    //console.log(NAME, process.pid, arg1); //server object
  }*/
 
  if(evt === 'uncaughtException') {
    process.stderr.write(/*err*/arg1.stack + '\n');
  }
 
  if(evt === 'exit') {
    console.log(NAME, process.pid, 'exited (' + /*code*/arg1 + ')', '\n');
  }
});
