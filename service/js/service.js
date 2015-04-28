(function(sw) {

  'use strict';

  function debug(str) {
    console.log('CJC -*-: ' + str);
  }

  function isAllowed(url) {
    debug('SERVICE::isAllowed url :' + url);
    debug('SERVICE --> config:' + JSON.stringify(sw.config.allowedFrom));
    return true;
  }

  debug('SERVICE --> loaded');
  sw.utils = {
    isAllowed: isAllowed
  };

})(self);
