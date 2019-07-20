/*
 like-process (https://npmjs.com/package/like-process)
 Copyright 2019 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-process)
*/

'use strict';

let like = new (require('events'))();

like.terminated = false;
like.cleanup = false;

const debug = require('debug');
const log = debug('like-process');
//debug.enable('like-process');

const cluster = require('cluster');
like.isCluster = cluster.isWorker; //is worker or master with at least 1 fork
like.isMaster = cluster.isMaster;
like.isWorker = cluster.isWorker;

like.cluster = function(count, env) {
  if(cluster.isMaster) {
    return;
  }

  count = count === true ? require('os').cpus().length : (Number(count) || 1);

  for(let i = 0; i < count; i++) {
    like.fork(env);
  }

  return true;
}

like.fork = function(env) {
  if(!cluster.isMaster) {
    return;
  }

  let worker = cluster.fork(env);
  worker.$env = env;

  worker.process.on('internalMessage', function onTerminate(msg) {
    if(msg.cmd === 'NODE_LIKE_PROCESS' && (msg.action === 'exit' || msg.action === 'reload')) {
      log('worker want to', msg.action);

      //worker.process.removeListener('internalMessage', onTerminate);
      like[msg.action](undefined, worker);
    }
  });

  like.isCluster = true;

  return worker;
}

like.exit = terminate.bind(null, 'exit');
like.reload = terminate.bind(null, 'reload');

function terminate(action, code, worker) {
  worker = typeof worker === 'object' ? worker : undefined;

  //temp fix; I don't like when I do a ctrl+c and doesn't exit instantly
  //but SIGINT it's for pm2 so we only check if process.send not exists
  if(code/*signal*/ === 'SIGINT' && !process.send) {
    return process.exit(1);
  }

  //single process or worker
  if(!like.isCluster || cluster.isWorker) {
    if(isFinite(code)) {
      process.exitCode = code;
    }
  }

  //avoid multiple executions
  if(like.terminated || worker && worker.$terminated) {
    log('terminate: called again', action);
    return;
  }

  //single process or worker
  if(!like.isCluster || cluster.isWorker) {
    log('terminate: saving process/worker action', action);

    like.terminated = true;
    like.emit('terminate');
  }
  //master to specific worker object
  else if(worker) {
    log('terminate: saving master-worker action', action);

    worker.$terminated = true;
    like.emit('terminate', worker);
  }

  //single process
  if(!like.isCluster) {
    log('is not cluster', action, code);
    return exit();
  }
  //master
  else if(cluster.isMaster) {
    if(worker) {
      log('is master to worker', action, code);
      return action === 'exit' ? exit(worker) : reload(worker);
    }
    else {
      log('is master to all', action, code);

      for(let id in cluster.workers) {
        log('master to worker with', action, code);
        terminate(action, code, cluster.workers[id]);
      }
    }
  }
  //worker
  else if(cluster.isWorker) {
    log('is worker', action, code);
    process.connected && process.send({ cmd: 'NODE_LIKE_PROCESS', action });
  }

  return true;
}

let servers = [];

function exit(worker) {
  log('exit process', worker ? worker.process.pid : process.pid);

  //master to specific worker object
  if(worker) {
    log('disconnecting worker');
    return worker.disconnect();
  }
  //single process
  else {
    for(let i = 0; i < servers.length; i++) {
      servers[i].close();
    }
  }
}

function reload(worker) {
  log('reload process', process.pid);

  let newer = like.fork(worker.$env);

  newer.process.on('internalMessage', function onReady(msg) {
    if(msg.cmd === 'NODE_LIKE_PROCESS' && msg.action === 'ready') {
      log('newer started, disconnecting old worker');

      newer.process.removeListener('internalMessage', onReady);
      exit(worker);
    }
  });
}

like.ready = function() {
  log('its ready', process.pid);
  process.send && process.send(cluster.isWorker ? { cmd: 'NODE_LIKE_PROCESS', action: 'ready' } : 'ready');
}

let wait_listening = false;
let immediateReady;

like.handle = function(events, callback) {
  if(!callback) {
    callback = (evt, arg1) => {};
  }

  log('handle', cluster.isMaster ? 'master' : 'worker', events.map(v => typeof v !== 'object' ? v : 'server'));

  for(let k in events) {
    //server/s object (multi listening ready and server close event)
    if(typeof events[k] === 'object') {
      let server = events[k];

      if(servers.indexOf(server) === -1) {
        log('server push');
        servers.push(server);

        if(!server.listening) {
          log('waiting for listening');
          wait_listening = true;
          server.once('listening', multi_listening_ready);
        }
      }

      server.once('close', handler.bind(null, callback, 'server', server));
    }
    //process event
    else {
      process.on(events[k], handler.bind(null, callback, events[k]));
    }
  }

  _ready(!wait_listening);
}

function handler(callback, event, arg1, arg2) {
  log('event', typeof event === 'object' ? 'its server object' : event);

  //server closed
  if(event === 'server') {
    servers.splice(servers.indexOf(arg1), 1);
  }
  
  //wasn't manually, for example, was an uncaught exception
  if(!like.terminated) {
    log('wasnt manually');
    !like.isCluster ? like.exit() : like.reload();
  }

  //the first event without servers listening or forced exit will turn cleanup
  if(!like.cleanup && (!servers.length || event === 'exit')) {
    log('turning cleanup');

    like.cleanup = true;
    like.emit('cleanup');
  }

  //
  callback.call(null, event, arg1, arg2);
}

function multi_listening_ready() {
  for(let i = 0; i < servers.length; i++) {
    if(!servers[i].listening) {
      return;
    }
  }

  log('all servers listening');
  _ready(true);
}

function _ready(set) {
  clearImmediate(immediateReady);

  if(set) {
    immediateReady = setImmediate(like.ready);
  }
}

process.once('SIGTERM', like.exit); //swarm, k8s, systemd, etc
process.once('SIGINT', like.exit); //pm2
process.once('SIGUSR2', like.reload); //pm2 fork, systemd, custom, etc

/*
disable signal:
process.removeListener('SIGTERM', like.exit);
process.removeListener('SIGINT', like.exit);
process.removeListener('SIGUSR2', like.reload);
*/

module.exports = like;
