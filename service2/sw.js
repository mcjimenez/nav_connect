'use strict';

// This is a very basic sample Service Worker (SW) that  acts as a server for
// navigator.connect. I'm going to mark with a comment where the app MUST
// add some extra code to use the navigator.connect POLYFILL
// So if you just want to know that, search for:
// ADDED FOR POLYFILL

function debug(str) {
  console.log('CJC -*- -->' + str);
}

// ADDED FOR POLYFILL: Import the polyfill script
this.importScripts('/nav_connect/service/polyfill/navigator_connect_sw.js');
// END ADDED FOR POLYFILL

this.importScripts('/nav_connect/service/js/config.js');
this.importScripts('/nav_connect/service/js/service.js');

this.addEventListener('install', function(evt) {
  debug('SW Install event');
});

this.addEventListener('activate', function(evt) {
  debug('SW activate event');
});

this.addEventListener('fetch', function(evt) {
  debug('SW fetch event');
});

this.channelToMT = new Promise((resolve, reject) => {
  this.resolveChannel = resolve;
  this.rejectChannel = reject;
});

this.onconnect = function(msg) {
  debug('SW onconnect: We should have a port here on msg.source. ' +
        (msg.source.postMessage ? 'yes!' : 'no :('));
  // msg.source should have the endpoint to send and receive messages,
  // so we can do:
  debug('SW Trying to connect from: ' + msg.targetURL);
  msg.acceptConnection(this.utils.isAllowed(msg.targetURL));
  msg.source.onmessage = aMsg => {
    debug('SW SETTING msg received:' + JSON.stringify(aMsg.data));
    var setting = aMsg.data.setting;
    if (setting) {
      debug('SW SETTING requested setting:' + setting);
      // In sw APIS do not work!!!! We need to request it to the main thread

      // Since this doesn't work the first time, and we don't want to have to
      // do a reload, we'll work around this by making the main thread pass
      // us a MessageChannel to talk to it
      this.channelToMT.then(channel => {
        // This has a problem... we can't queue messages
        channel.onmessage = evt => {
          msg.source.postMessage(evt.data);
        };
        channel.postMessage({ 'setting': setting });
      });

    } else {
      debug('SW Got a message from one of the accepted connections: ' +
            JSON.stringify(aMsg.data));
      msg.source.postMessage('Hello, client! I got your request: ' +
                             JSON.stringify(aMsg.data));
    }
  };
};

this.messageListener = evt => {
  // This is a hack caused by the lack of dedicated MessageChannels... sorry!
  debug('SW onmessage ---> '+ JSON.stringify(evt.data));
  for (var elem in evt.data) {
    debug('SW ' + elem + ":" + JSON.stringify(evt.data));
  }
  // ADDED FOR POLYFILL
  // Since we're using the same channel to process messages comming from the
  // main thread of the app to the SW, and messages coming from the
  // navigator.connect polyfill, we have to distinguish them here. Sadly we
  // can't remove this even if we have MessageChannels because we have to pass
  // the MessageChannels down (connection messages) somehow.
  if (this.NCPolyfill.isInternalMessage(evt)) {
    debug('SW msg is internal, do not process');
    return;
  }
  // END ADDED FOR POLYFILL

  // Your code here
  // The only message we should get here is a MessageChannel to talk back to
  // the main thread... so...
  if (evt.ports && evt.ports[0]) {
    debug('SW Got a channel from the parent');
    this.resolveChannel(evt.ports[0]);
  } else {
    debug('SW Did not got a channel!');
    this.rejectChannel('I did not got a channel');
  }
  // And I can remove the listener, I don't need this anymore
  this.removeEventListener('message', this.messageListener);

};

this.addEventListener('message', this.messageListener);

