(function(window) {
  'use strict';

  var origin = document.location.origin;
  var _btoInstallClt = document.getElementById('installClt');
  var _btoInstallSvr1 = document.getElementById('installSvr1');
  var _btoInstallSvr2 = document.getElementById('installSvr2');
  var I = 'nav_connect';

  function install(what) {
    var origin = document.location.origin;
    // Could get this from the href but not really worth the hassle
    var realPath = origin + '/' + I + '/' + what + '/manifest.webapp';
console.log('CJC:' + realPath);
    navigator.mozApps.install(realPath);
  }

  window.addEventListener('load', function() {
    _btoInstallClt.addEventListener('click', install.bind(null, 'client'));
    _btoInstallSvr1.addEventListener('click',
                                     install.bind(null, 'service'));
    _btoInstallSvr2.addEventListener('click',
                                     install.bind(null, 'service2'));
  });

})(window);
