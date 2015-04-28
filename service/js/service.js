(function(sw) {

  'use strict';

  function debug(str) {
    console.log('CJC -*-: ' + str);
  }

  function isAllowed(aUrl) {
    debug('SERVICE::isAllowed url :' + aUrl);
    debug('SERVICE --> config:' + JSON.stringify(sw.config.allowedFrom));
    var allowed = false;
    var allowedFrom = sw.config && sw.config.allowedFrom || {};
    var urls = allowedFrom && Object.keys(allowedFrom) || [];

    for (var i = 0, l = urls.length; i < l && !allowed; i++){
      debug('isAllowed --> trata:'+urls[i]);
      allowed = aUrl.startsWith(urls[i]);
    }

    return allowed;
  }

  debug('SERVICE --> loaded');
  sw.utils = {
    isAllowed: isAllowed
  };

})(self);
