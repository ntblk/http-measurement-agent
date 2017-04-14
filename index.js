var url = require('url');
var http = require('http');
var https = require('https');
var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors');
var Timer = require('./timer');
//var agentBase = require('agent-base');

// TODO: Try to support these standards...
// PerformanceResourceTiming: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
// HAR: http://www.softwareishard.com/blog/har-12-spec/#timings


function hookCallback (obj, member, pre_cb) {
  var orig_fn = obj[member];
  obj[member] = function () {
    var args = Array.prototype.slice.call(arguments);
    // FIXME: args.length or args.length-1?
    var n = typeof args[args.length-1] === 'function' ? 1 : 0;
    var orig_cb = args[args.length-n];
    args[args.length-n] = () => {
      pre_cb();
      if (orig_cb)
        return orig_cb.apply(this, arguments);
    };
    return orig_fn.apply(this, args);
  };
}

exports.wrap = function createHttp(httpModule) {
  var httpModule = httpModule;
  var MeasureHttp = Object.create(httpModule);
  mixin(MeasureHttp, EventEmitter.prototype);
  MeasureHttp.request = request;
  MeasureHttp.get = get;
  //MeasureHttp.mixin = patchMethods;
  //MeasureHttp.unmix = unpatchMethods;

  return MeasureHttp;

  function request (options, onResponse) {
    var uri = getUriFromOptions(options);
    var timer = new Timer();
    timer.mark('start');
    var req = httpModule.request(options, onResponse);
    req.http_timer = timer;
    //if(!usingPatched(httpModule.request)) {
      setupTimerForRequest(timer, req, uri);
    //}
    return req;
  }

  function get (options, onResponse) {
    var req = request(options, onResponse);
    req.end();
    return req;
  }

  function getUriFromOptions (options) {
    var uri = options;
    if(typeof uri === 'string') uri = url.parse(uri);
    if(uri.uri) uri = uri.uri
    return uri;
  }

  function getIdent(socket) {
    return {
      date: Date.now(),
      //address: [socket.localAddress, socket.remoteAddress],
      //port: [socket.localPort, socket.remotePort],
      local: [socket.localAddress, socket.localPort],
      remote: [socket.remoteAddress, socket.remotePort],
    };
  }

  function setupTimerForRequest (timer, req, uri) {
    hookCallback(req, 'end', timer.mark.bind(timer, 'sent'));

    //req.socket.on('abort', timer.mark.bind(timer, 'abort')); // ?

    req.on('socket', (socket) => {
      timer.mark('socket');

      //console.log('socket.agent');
      //console.log(socket.address());
      // Keep-Alive
      var alreadyConnected = !(socket._connecting || socket.connecting);
      if (!alreadyConnected) {
        req.socket.on('lookup', timer.mark.bind(timer, 'lookup'));
        req.socket.on('connect', timer.mark.bind(timer, 'connect'));
        req.socket.on('secureConnect', timer.mark.bind(timer, 'ssl_connect'));
      }
      //req.socket.once('data', timer.mark.bind(timer, 'response'));

      req.socket.on('error', () => {
        console.log('ERR');
      });

      timer.ident = getIdent(socket);

      req.socket.on('connect', () => {
        // _sockname: { address: '192.168.1.83', family: 'IPv4', port: 53028 }
        // _peername: { address: '172.217.17.78', family: 'IPv4', port: 443 } }
        timer.ident = getIdent(socket);
        MeasureHttp.emit('socket-connect', timer.ident);
      });

      /*
      socket._handle.TLSWrap:
      onhandshakestart: [Function],
onhandshakedone: [Function],
onocspresponse: [Function],
*/

      if (0)
      req.socket.on('secureConnect', () => {
        console.log(req.socket);
        var ps = req.socket.getPeerCertificate();
        console.log(ps);
      });
    });

    req.on('open', timer.mark.bind(timer, 'open'));
    req.on('close', timer.mark.bind(timer, 'close'));
    req.on('error', timer.mark.bind(timer, 'error'));

    req.on('abort', timer.mark.bind(timer, 'abort')); // ?
    req.on('abort', () => { console.log('ABORT'); }); // ?

    req.on('response', function(response) {
      timer.mark('response');
      response.on('end', timer.mark.bind(timer, 'end'));

      response.on('end', function() {
        var stats = timer.stats();
        stats.statusCode = response.statusCode;
        stats.method = req.method || 'GET';
        MeasureHttp.emit('stat', stats, uri);
      });
    });
  }
};

/// http://www.softwareishard.com/blog/har-12-spec/#pageTimings
exports.toHAR = function (t) {
  return {
    blocked: t.socket - t.start,
    dns: t.lookup - t.start,
    connect: t.connect - t.socket,
    ssl: t.ssl_connect - t.connect,
    firstByte: t.response - t.connect,
    receive: t.end - t.response,

    total: t.end - t.start
  };
}

exports.create = function () {
  return {
    http: exports.wrap(http),
    https: exports.wrap(https)
  };
};
