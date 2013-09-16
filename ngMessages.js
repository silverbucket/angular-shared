/**
 * directive: message
 */
angular.module('ngMessages', [])

.directive('message',
['$rootScope', '$timeout',
function ($rootScope, $timeout) {
  return {
    restrict: 'A',
    template: '<div class="alert alert-{{ m.type }}" ng-show="haveMessage">'+
              '  <strong>{{m.title}}</strong> ' +
              '  <span>{{m.message}}</span>' +
              '</div>',
    link: function (scope) {
      scope.haveMessage = false;
      scope.m = {type: '', title: '', message: ''};

      var presets = {
        'remotestorage-connect': {
          type: 'danger',
          title : 'Connect to remoteStorage',
          message: 'First things first. You must connect to your remoteStorage'
        },
        'sockethub-config': {
          type: 'danger',
          title: 'Sockethub configuration needed',
          message: 'You must fill in your Sockethub connection details'
        },
        'sockethub-connect': {
          type: 'danger',
          title: 'Sockethub connection error',
          message: 'Unable to connect to Sockethub please check your configuration and try again'
        },
        'sockethub-register': {
          type: 'danger',
          title: 'Sockethub registration problem',
          message: 'We were unable to register with your Sockethub instance'
        },
        'xmpp-connect': {
          type: 'danger',
          title: 'XMPP connection failed',
          message: 'There was a problem connecting to the XMPP server, please verify you settings'
        },
        'unknown': {
          type: 'danger',
          title: 'An unknown error has occurred',
          message: ''
        }
      };


      $rootScope.$on('message', function (event, e) {
        console.log('message event: ', e);

        // default values for some options
        var timeout = (typeof e.timeout === 'boolean') ? e.timeout : true;
        //var important = (typeof e.important === 'boolean') ? e.important : false;

        scope.haveMessage = false;

        if (typeof e === 'undefined') {
          e = 'no error specified';
        }

        if (e.type === 'clear') {
          scope.haveMessage = false;
          scope.m = {type: '', title: '', message: ''};
          return;
        } else if (typeof presets[e.message] !== 'undefined') {
          scope.m = presets[e.message];
        } else if (typeof e.message === 'string') {
          if (e.type === 'success') {
            scope.m.title = 'Success';
          } else if (e.type === 'info') {
            scope.m.title = 'Info';
          } else {
            scope.m.title = "Error";
          }
          scope.m.message = e.message;
          scope.m.type = e.type;
        }
        //console.log('done processing: ', scope.m);

        scope.haveMessage = true;
        if (timeout) {
          $timeout(function () {
            scope.haveMessage = false;
            scope.m = {type: '', title: '', message: ''};
          }, 4000);
        }
      });
    }
  };
}]);
