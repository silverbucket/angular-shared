angular.module('ngRemoteStorage', ['ngCommandQueue']).

value('RemoteStorageConfig', {
  modules: []
}).

factory('RS', ['$rootScope', '$q', '$timeout', 'cQueue',
function ($rootScope, $q, $timeout, cQueue) {

  var ready = false;

  function isConnected() {
    return remoteStorage.remote.connected;
  }

  remoteStorage.on('ready', function () {
    ready = true;
  });

  function callRS(job) {
    console.log('callRS:', job);
    remoteStorage[job.methods[0]][job.methods[1]].apply(null, job.params).
      then(function (res) {
        if (res) {
          $rootScope.$apply(function () {
            if (job.defer) {
              job.defer.resolve(res);
            }
          });
        }
      }, function (err) {
        $rootScope.$apply(function () {
          if (job.defer) {
            job.defer.reject(err);
          } else {
            throw new Error(err);
          }

        });
      });
  }

  var queue = cQueue.init(callRS);

  return {
    isConnected: isConnected,
    queue: function (module, func, params) {
      console.log('RS.queue(' + module + ', ' + func + ', params):', params);
      queue.add({
        methods: [module, func],
        params: params,
        defer: false,
        timeout: 0,
        condition: isConnected
      });
    },
    call: function (module, func, params, failTimeout) {
      var defer = $q.defer();
      console.log('RS.call(' + module + ', ' + func + ', params):', params);
      if ((typeof params === 'object') &&
          (typeof params[0] === 'undefined')) {
        defer.reject('RS.call params must be an array');
      } else {
        // put request onto queue
        queue.add({
          methods: [module, func],
          params: params,
          defer: defer,
          timeout: failTimeout,
          condition: isConnected
        });
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
