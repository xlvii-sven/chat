var chatApp = angular.module( 'chatApp', ['ngRoute'] );

getSize = function( object ) {
	return Object.keys( object ).length;
}

notify = function( msg, timeout ) {

	if ( !Notification || Notification.permission === "denied" ) {
		return;
	}

	if ( Notification.permission === "granted" ) {
		createNotification( msg, timeout );
	}

	if ( Notification.permission === "default" ) {
		Notification.requestPermission( function( permission ) {
			if ( permission === "granted" ) {
				createNotification( msg, timeout );
			}
		});
	}

}

createNotification = function( msg, timeout ) {

	var notification = new Notification( msg.user, {
	// icon: null,
	// sound: null,
	// dir: "auto",
	// lang: null,
	// tag: null,
	 body : msg.text
	// data: null,
	// renotify: false,
	// silent: false,
	// noscreen: false,
	// sticky: false
	});

	notification.onshow = function() {
		if ( timeout ) {
			setTimeout( function() {
				notification.close();
			}, timeout );
		}
	}
	notification.onclose = function() {
	}
	notification.onerror = function() {
	}
	notification.onclick = function() {
	}

}

chatApp.config( function( $routeProvider ) {
	$routeProvider
	.when( "/", {
		templateUrl : 'chat.html',
		controller : "chatCtrl"
	} )
	.otherwise( {
		redirectTo: "/"
	} );
} );

chatApp.controller( 'chatCtrl', function( $scope, socket ) {
	document.title = "Chat";
	// functions
	$scope.login = function( name ) {
		if( name ) {
			socket.emit( "login", name );
			$scope.name = "";
		}
	}
	$scope.logout = function() {
		socket.emit( "logout" );
	}
	$scope.sendMsg = function( text ) {
		if( text ) {
			socket.emit( "addMsg", {text: text} );
			$scope.text = "";
		}
	}
	$scope.removeMsg = function( msg ) {
		socket.emit( "removeMsg", msg );
	}
	$scope.getSize = function( object, filter ) {
		var size = 0;
		angular.forEach( object, function( value ) {
			if( !filter || filter( value ) ) size++;
		} );
		return size;
	}
	$scope.isLoggedIn = function( user ) {
		return !!user.name;
	}
	// events
	socket.on( "init", function( data ) {
		$scope.user = data.user;
		$scope.users = data.users;
		$scope.msgs = data.msgs;
		$scope.all = getSize( data.users );
	} );
	socket.on( "addUser", function( user ) {
		$scope.users[user.ip] = user;
		$scope.all++;
	} );
	socket.on( "updateUser", function( user ) {
		$scope.users[user.ip] = user;
		if( user.id == $scope.user.id ) {
			$scope.user = user;
		}
	} );
	socket.on( "removeUser", function( user ) {
		delete $scope.users[user.ip];
		$scope.all--;
	} );
	socket.on( "addMsg", function( msg ) {
		$scope.msgs[msg.id] = msg;
		notify( msg, 5000 );
	} );
	socket.on( "removeMsg", function( msg ) {
		delete $scope.msgs[msg.id];
	} );
} );

chatApp.factory( 'socket', function( $rootScope ) {
	var socket = io.connect();
	return {
		on : function( eventName, callback ) {
			socket.on( eventName, function() {
				var args = arguments;
				$rootScope.$apply( function() {
					callback.apply( socket, args );
				} );
			} );
		},
		emit : function( eventName, data, callback ) {
			if ( typeof data == 'function' ) {
				callback = data;
				data = {};
			}
			socket.emit( eventName, data, function() {
				var args = arguments;
				$rootScope.$apply( function() {
					if ( callback ) {
						callback.apply( socket, args );
					}
				} );
			} );
		}
	};
} );

chatApp.filter( 'array', function() {
	return function( object ) {
		var array = [];
		angular.forEach( object, function( value ) {
			array.push( value );
		} );
		return array;
	}
} );
