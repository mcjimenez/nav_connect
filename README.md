# FirefoxOS' navigator.connect polyfill

## Why?

This is a tricky question, because there's actually two questions:

### Why do we even need something like navigator.connect?

We're changing FirefoxOS security model for 3.0, and thus we will have
only two security levels for apps where we currently have three:
Signed and unsigned. Signed apps will potentially get access to all
the device capabilities and APIs while unsigned content will be
restricted to the standard web APIs.

While third party developers will be allowed to develop their own
signed applications, doing so it somewhat of a chore:

* The app will have to be packaged (under debate now).
* The package will have to be submitted for review and signature.
* Every time there's a change on the code, a new version will have to
  be submitted to be reviewed and signed.

So it would be good if there was a way to access the device
capabilities on a way that was both:

* Secure.
* Capable of running on any browser (based on standard or
  standarizable APIs).

A way of doing so is implementing on the devices a special kind of
'Service' applications. Those applications will expose access to some
of the underlying capabilities on a web way. Let's see it with an
example:

#### Sample service
Let's assume that the device has a service called SMS that gives
access to reading and sending SMS, for a set of origins and
numbers. This device is configured by a network downloaded (and
signed) json file that holds something like:

##### Configuration
```
{
  'https://www.apopularim.com': {
     'send': ['+34123456789', '+44123456789'],
     'read': ['+34987654231']
   },
  'https://www.findmyphoneplease.com': {
     'send': ['+3445678123', 'setting:myhome.number'],
     'read': ['setting:myhome.number', '+23123123122', 'any:useAuthSetting:myauthpasswd.sms']
   }
}
```

That means the pages from the origin https://www.apopularim.com can
send sms and receive sms from the number specified, and more
interesting, that the site www.findmyphoneplease.com can send sms and
read them from a number that's read from a setting on the device.

##### Client code

So let's suppose we're writing a service that allows the user to
identify their phone via SMS, or to send random SMS to a random
number from a web site, even when loading that site on desktop!
The client code might look like:

```
var SMS_SERVICE = 'https://smsservice.gaiamobile.org/app.pak!//smsworker.js';

navigator.connect(SMS_SERVICE).then(port => {
// Send a SMS from the device.... The actual data will be defined per service!
  port.postMessage({
    command: 'send',
    data: {number: 'setting:myhome.number', smsText: 'Hi from your phone!'}});

  // We could send random SMSs to a random number from our phone!
  // Even from desktop!
  var userPassword = somehowGetThisUserPassword();
  var destNumber = getAUserProvidedNumber();
  var text = getAUserProvidedText();
  port.postMessage({
    command: 'send',
    data: {number: 'any:' + destNumber, auth: userPassword, smsText: text}
  });
  port.onmessage = evt => {
    // Check what's this about...
    if (evt.data.receivedSMS) {
      doSomethingWithTheReceivedSMS(evt.data.receivedSMS);
    }
  };
}).catch(error => {
  // Either the service is not available, or the connection was
  // rejected. Let's assume it was the first one...
  showWarning("You should visit the site https://smsservice.gaiamobile.org" +
              " and configure your access if you want to use this service");
});

```

Note that the client code does not check if it's on a FirefoxOS phone
or not. Because it doesn't matter. Because it should work the same on
*any* browser (that has implemented navigator.connect or uses a
polyfill) on *any* environment.

##### Service code

On https://smsservice.gaiamobile.org/app.pak!//smsworker.js, which
will have to be pre-registered (by some page on
https://smsservice.gaiamobile.org/app.pak, and we're supposing we're
going with the packaged app proposal, although it's really irrelevant
for this:

```
function processRequest(requestData, targetURL, allowedOperations) {
  if (iAmOnFirefoOS()) {
    // Do whatever you need here, locally!
    return sendSMSOrWhatever(requestData, allowedOperations);
  } else {
    // We cannot process this locally, so...
    // sendPushEvent will return a promise that will fulfill when we have
    // an answer from the other side!
    return sendPushEvent(requestData, targetURL);
  }
}

// Let's assume that allowedSites has the previuosly defined json loaded...
var allowedSites = somehowGetTheConfig();
this.onconnect = evt => {
  var shouldAccept = !!allowedSites[evt.client.targetURL];
  evt.acceptConnection(shouldAccept);
  if (shouldAccept) {
    var allowedOperations = allowedSites[evt.client.targetURL];
    evt.source.addEventListener('message', msgEvent => {
      processRequest(msgEvent.data, evt.client.targetURL, allowedOperations).
        then(answer => evt.source.postMessage(answer));
    });
    // And we store this so when we get a push we know where to send the answer...
    if (!iAmOnFirefoxOS()) {
      storeChannel(evt.source);
    }
  }
};

// I have to register a push handler, both on desktop and FFOS! Let's assume
// we already did that!

this.addEventListener('push', evt => {
  if (iAmOnFirefoxOS()) {
    // We could grab the information to process from the push data, or do a 
    // XHR to our server side site to grab it. Then...
    var requestData = somehowGrabTheRequestData(evt);
    var allowedOperations = allowedSites[requestData.targetURL];
    processRequest(requestData.data, requestData.targetURL).
      then(answer => sendAnswerToTheServer(answer));
  } else {
    // if we get a push and we're not on FFOS, then we're getting the answer here!
    var answer = somehowGrabTheAnswer(evt);
    getChannelForAnswer(answer).then(channel => channel.postMessage(answer));
  }
});

```

This code will run on a FFOS browser and/or on a desktop
browser. Again, the code is the same, the only variation is what
happens:

* On a device:

  * If a connection request or a message is received on a service worker
     running on FFOS, then it's executed and answered locally.

  * If a push message is received, check that the operation is
     allowed, execute it locally, and send the answer back to the
     server (https://smsservice.gaiamobile.org)

* On desktop:

  * If a connection request or a message is received then it sees if
  the user has associated (on https://smsservice.gaiamobile.org!) a
  mobile device and it sends the order to the device, using push to
  awaken it.

  * If a push message is received on desktop then it must be the
  answer of a previous petition (or a previously established
  channel). It gets the channel from the push message and sends the
  data to the adequate client.

### Ok, but why navigator.connect?

Because as we said before, part of the reason is having an *standard*
way of calling services. And while navigator.connect is not an
standard, it's at least been implemented in some way by other browser
(chrome) and as such it has one more implementor than IAC. So this was
done as a proof-of-concept of building that kind of services over
navigator.connect.

That said, the idea is the same if the actual API
is navigator.connect, IAC (with origin), XMLHttpRequest, embedded
iframes with postMessage, telepathy or whatever.

## What?

This is a polyfill for a restricted set of the API
navigator.connect, as defined on
http://mkruisselbrink.github.io/navigator-connect/ and implemented on
Chrome on
https://www.chromestatus.com/feature/5709330426888192. Concretely:

* Client side:

 * navigator.connect: Implemented. The returned port is
   not an strict MessagePort though. Specifically, port.close() it's not
   implemented at this point.

 * self.ports: Not implemented currently.

* Server side:

 * onconnect event handler (so far, only as the onconnect method).  

 * onmessage handler for connected ports (all
   functionality). Connected ports are actual MessagePorts only
   if/when MessageChannel is available. 

## How?

Using the InterAppCommunication API (IAC), and some ingenuity to get
around it's limitations, and the limitations of the new APIs on
service workers (like them not working on workers at all if they're
implemented in JS!). The sample code do a lot of moving the data back
and forth between the main thread and the worker thread:

* IAC runs on the main thread,
* the onconnect handler on the service worker thread
* The actual API (settings on the sample) call on the main thread

To be able to execute this on a device you need:

* A FirefoxOS device (emulator should work also) with the following
  preferences set:

```
pref('dom.caches.enabled', true);
pref('dom.serviceWorkers.enabled', true);
pref('network.disable.ipc.security', true);
pref('dom.messageChannel.enabled', true);
pref('dom.serviceWorkers.testing.enabled', true);
pref('dom.apps.developer_mode', true);

```

* Also, since at this point IAC is certified only, either you patch that
out or both the client and service apps have to be certified, which
kinda defeats the whole point.

* If you want to use the version that is on the usemessagechannel branch
(which is way nicer!), you must have a build where Bug 911972 is fixed
or the patch applied
(https://bugzilla.mozilla.org/show_bug.cgi?id=911972).

Connect sequence diagram:
https://drive.google.com/file/d/0B8rKvySkAbANNm85aDdBTHNZak0/view?usp=sharing

![Connect sequence diagram](https://github.com/mcjimenez/nav_connect/blob/usemessagechannel/connectSequenceDiagram.jpg?raw=true)

BTW, thanks :baku for
providing us with a rebased patch! It works beautifully!)

