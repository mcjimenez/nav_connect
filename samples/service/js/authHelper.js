(function(sw) {

  'use strict';

  var AUTH_FILE = 'https://mcjimenez.github.io/nav_connect/resources/auth.json';

  var allowedFrom = {
    'https://mcjimenez.github.io/nav_connect' : []
  };

  function debug(str) {
    console.log('CJC -*-: ' + str);
  }

  function isAllowed(aUrl) {
    var allowed = false;
    var urls = Object.keys(allowedFrom) || [];

    for (var i = 0, l = urls.length;
         i < l && !allowed;
         allowed = aUrl.startsWith(urls[i++]));

    return allowed;
  }

  sw.authHelper = {
    isAllowed: isAllowed
  };

})(self);
