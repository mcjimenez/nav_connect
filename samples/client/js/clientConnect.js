(function(exports) {

  'use strict';

  function debug(str) {
    console.log("CJC -*-:" + str);
  }

  var _evtSectionEntries = document.getElementById('eventsEntries');
  var _settingsEntries = document.getElementById('settingsEntries');
  var _select = document.getElementById('selectSetting');
  var whatEntry = _evtSectionEntries;

  function changeSelect(evt) {
    whatEntry = _settingsEntries;
    var msg = { setting : _select.options[_select.selectedIndex].value };
    debug('CLIENT sending postMessage:'+ JSON.stringify(msg));
    client.postMessage(msg);
    _removeChildren(_settingsEntries);
    debug("_select.selectedIndex:"+_select.selectedIndex);
    debug("selected:"+_select.options[_select.selectedIndex].value);
  }

  function _removeChildren(aParent) {
    debug('CLIENT removed old elements');
    while (aParent.hasChildNodes()){
      aParent.removeChild(_settingsEntries.childNodes[0]);
    };
  }

  function _addTxt(txt, where) {
    var li = document.createElement('li');
    li.innerHTML = txt;
    //_evtSectionEntries.appendChild(li);
    where.appendChild(li);
  }

  var TXT_MSG = 'Testing message';
  var URL_CONNECT = 'https://testServiceConnect.hostedweb.tid.es/services';
  var NUM_MSG = 2;

  var ClientConnect = function() {
    var self = this;
    debug('CLIENT Vamos a lanzar conexion');
    navigator.connect(URL_CONNECT).then(
      port => {
        self.port = port;
        _addTxt("navigator.connect success. Adding listener!",
                _evtSectionEntries);

        port.onmessage = function(evt) {
          // Handle reply from the service.
          debug('CLIENT msg received --> ' + JSON.stringify(evt.data));
          _addTxt(evt.data ? JSON.stringify(evt.data): "no datas", whatEntry);
        };

        for (var i = 0; i < NUM_MSG; i++) {
          debug('CLIENT Send msg ' + i);
          port.postMessage({'origin': 'client', 'secuence': i});
        }
    });
  };

  ClientConnect.prototype = {
    postMessage: function pm(msg) {
      this.port.postMessage(msg);
    }
  };

  var client = new ClientConnect();
  exports.clientConnect = client;

  window.addEventListener('load', function () {
    _select.addEventListener('change', changeSelect);
    _select.selectedIndex = 0;
  });
})(this);
