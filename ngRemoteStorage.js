angular.module('ngRemoteStorage', []).

value('RemoteStorageConfig', {
  modules: []
}).

factory('RS', ['$rootScope', '$q', '$timeout',
function ($rootScope, $q, $timeout) {

  var ready = false;

  function isConnected() {
    return remoteStorage.remote.connected;
  }

  remoteStorage.on('ready', function () {
    ready = true;
  });

  return {
    isConnected: isConnected,
    call: function (module, func, params) {
      var defer = $q.defer();
      console.log('RS.call(' + module + ', ' + func + ', params):', params);

      if ((typeof params === 'object') &&
          (typeof params[0] === 'undefined')) {
        defer.reject('RS.call params must be an array');
      } else {

        var delay = 500;
        (function callRS() {
          if (isConnected()) {
            //console.log('RS connected, sending call');
            try {
              remoteStorage[module][func].apply(null, params).
                then(function (res) {
                  $rootScope.$apply(function () {
                    defer.resolve(res);
                  });
                }, function (err) {
                  $rootScope.$apply(function () {
                    defer.reject(err);
                  });
                });
            } catch (e) {
              //console.log('error : ',e);
              console.log(e.stack);
              defer.reject(e.toString());
            }
          } else {
            console.log('RS not connected yet, delaying call ' + delay + 's');
            if (delay < 30000) {
              delay = delay + (delay + 500);
            }
            $timeout(callRS, delay);
          }
        })();
      }
      return defer.promise;
    }
  };
}]).


controller('remoteStorageCtrl',
['RemoteStorageConfig', '$scope',
function (RScfg, $scope) {
  remoteStorage.disableLog();

  $scope.$watch('RScfg.modules', function () {
    console.log('remoteStorageCtrl initializing modules: ', RScfg.modules);

    var mod, key;
    for (key in RScfg.modules) {
      mod = RScfg.modules[key];
      console.log('claim: '+mod[0]+ ' a: '+mod[1]);
      remoteStorage.access.claim(mod[0], mod[1]);
      if ((mod[2]) && (typeof mod[2].cache === 'boolean') && (!mod[2].cache)) {
        // disable caching
        remoteStorage.caching.disable('/'+mod[0]+'/');
      }
    }

    remoteStorage.displayWidget('remotestorage-connect', {
      redirectUri: window.location.protocol + '//' + window.location.host + '/rscallback.html'
    });

    for (key in RScfg.modules) {
      mod = RScfg.modules[key];
      if ((remoteStorage[mod[0]]) && (typeof remoteStorage[mod[0]].init === 'function')) {
        remoteStorage[mod[0]].init();
      }
    }
  });

}]);
