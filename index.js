/*
 like-process (https://npmjs.com/package/like-process)
 Copyright 2019 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-process)
*/

'use strict';

const cluster = require('cluster');
const EventEmitter = require('events');

let like = new EventEmitter();

like.terminated = false;
like.cleanup = false;
like.fallback = true;
like.exitCode = {
  exception: 1,
  rejection: 1
};
like.isMaster = cluster.isMaster;
like.isWorker = cluster.isWorker;
like.isCluster = cluster.isWorker; // is worker or master with at least 1 fork

let servers = [];
let immediateReadyId;

like.fork = function (env) {
  if (!cluster.isMaster) return;
  like.isCluster = true;

  env = Object.assign({
    LIKE_PROCESS_FORK: true
  }, env);

  let worker = cluster.fork(env);
  worker.$env = env;

  worker.process.on('internalMessage', (msg) => {
    if (msg.cmd !== 'NODE_LIKE_PROCESS') return;
    if (msg.action === 'exit') like.exit(undefined, worker);
    else if (msg.action === 'reload') like.reload(undefined, worker);
  });

  return worker;
};

like.exit = terminate.bind(null, 'exit');
like.reload = terminate.bind(null, 'reload');

function terminate (action, code, worker) {
  worker = typeof worker === 'object' ? worker : undefined;

  if ((!like.isCluster || cluster.isWorker) && isFinite(code)) {
    process.exitCode = code;
  }

  if (like.terminated || worker && worker.terminated) {
    return;
  }

  if (!like.isCluster || cluster.isWorker) {
    like.terminated = true;
    like.emit('terminate');
  } else if (worker) {
    worker.terminated = true;
    like.emit('terminate', worker);
  }

  if (!like.isCluster) {
    exit();
  } else if (cluster.isMaster) {
    if (worker) {
      action === 'exit' ? exit(worker) : reload(worker);
    } else {
      for (let id in cluster.workers) {
        terminate(action, code, cluster.workers[id]);
      }
    }
  } else if (cluster.isWorker) {
    if (process.env.LIKE_PROCESS_FORK) {
      process.connected && process.send({ cmd: 'NODE_LIKE_PROCESS', action });
    } else {
      exit(cluster.worker);
    }
  }
}

function exit (worker) {
  if (worker) {
    worker.disconnect();
  } else {
    for (let i = 0; i < servers.length; i++) {
      servers[i].close();
    }
  }
}

function reload (worker) {
  if (!worker.$env) return;

  if (worker.$env.LIKE_PROCESS_FORK) {
    let newer = like.fork(worker.$env);

    // wait ready signal from new worker then exit old worker
    newer.process.on('internalMessage', function onReady (msg) {
      if (msg.cmd === 'NODE_LIKE_PROCESS' && msg.action === 'ready') {
        newer.process.removeListener('internalMessage', onReady);
        exit(worker);
      }
    });
  }
}

like.handle = function (events, callback) {
  if (!Array.isArray(events)) events = [events];
  if (!callback) callback = (evt, arg1) => {};

  for (let k in events) {
    if (typeof events[k] === 'object') {
      let server = events[k];

      if (servers.indexOf(server) === -1) {
        servers.push(server);

        if (!server.listening) {
          server.once('listening', immediateReady);
        }
      }

      server.once('close', handler.bind(null, callback, 'server', server));
    } else {
      process.on(events[k], handler.bind(null, callback, events[k]));
    }
  }

  immediateReady();
};

function handler (callback, event, arg1, arg2) {
  if (process.exitCode === undefined) {
    if (event === 'uncaughtException' && typeof like.exitCode.exception === 'number') {
      process.exitCode = like.exitCode.exception;
    }

    if (event === 'unhandledRejection' && typeof like.exitCode.rejection === 'number') {
      process.exitCode = like.exitCode.rejection;
    }
  }

  // server closed
  if (event === 'server') {
    servers.splice(servers.indexOf(arg1), 1);
  }
  
  // wasn't manually, for example, was an uncaught exception
  if (!like.terminated) {
    !like.isCluster || !like.fallback ? like.exit() : like.reload();
  }

  // the first event without servers listening or forced exit will turn cleanup
  if (!like.cleanup && (!servers.length || event === 'exit')) {
    like.cleanup = true;
    like.emit('cleanup');
  }

  callback(event, arg1, arg2);
}

function immediateReady () {
  for (let i = 0; i < servers.length; i++) {
    if (!servers[i].listening) {
      return;
    }
  }
  clearImmediate(immediateReadyId);
  immediateReadyId = setImmediate(sendReady);
}

function sendReady () {
  if (!cluster.isWorker || !process.connected) return;
  
  if (process.env.LIKE_PROCESS_FORK) {
    process.send({ cmd: 'NODE_LIKE_PROCESS', action: 'ready' });
  }
  if (process.env.PM2_HOME && process.env.wait_ready) {
    process.send('ready');
  }
}

process.on('SIGTERM', like.exit); // swarm, k8s, systemd, etc
if (process.env.PM2_HOME && process.env.exec_mode === 'cluster_mode') {
  process.on('SIGINT', like.exit); // pm2 cluster
}
process.on('SIGHUP', like.reload); // native cluster, systemd, etc

module.exports = like;
