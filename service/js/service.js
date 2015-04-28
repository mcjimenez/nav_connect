(function(exports) {

  'use strict';

  function debug(str) {
    console.log('CJC -*-: ' + str);
  }

  function isAllowed(url) {
    debug('SERVICE::isAllowed url :' + url);
    return true;
  }

  debug('SERVICE --> loaded');
  exports.utils = {
    isAllowed: isAllowed
  };

})(window);
