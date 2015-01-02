var chatApp = angular.module( 'chatApp', ['ngRoute'] );

getSize = function( object ) {
	return Object.keys( object ).length;
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
		socket.emit( "changeTopic", 0 );
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
	$scope.addTopic = function( name ) {
		if( name ) {
			socket.emit( "addTopic", {name: name} );
			$scope.name = "";
		}
	}
	$scope.changeTopic = function( topic ) {
		socket.emit( "changeTopic", topic.id );
	}
	$scope.changeNotify = function( context ) {
		context.notify = !context.notify;
		event.stopPropagation();
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
	socket.on( "initUser", function( user ) {
		$scope.user = user;
	} );
	socket.on( "initData", function( data ) {
		$scope.users = data.users;
		$scope.topics = data.topics;
		$scope.all = getSize( data.users );
	} );
	socket.on( "addUser", function( user ) {
		$scope.users[user.ip] = user;
		$scope.all++;
		$scope.topics[user.topic.id].users++;
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
		$scope.topics[user.topic.id].users--;
	} );
	socket.on( "addMsg", function( msg ) {
		// add msg
		if( $scope.user.topic.id == msg.topic ) {
			// $scope.topics[msg.topic].msgs[msg.id] = msg;
			$scope.user.topic.msgs[msg.id] = msg;
		}
		// mark topic in topic list
		else {
			
		}
		// notifiy if msg belongs to favorite user or topic
		if( $scope.users[msg.userIP].notify || $scope.topics[msg.topic].notify ) {
			notify( msg, 5000 );
		}
	} );
	socket.on( "removeMsg", function( msg ) {
		// delete $scope.topics[msg.topic].msgs[msg.id];
		delete $scope.user.topic.msgs[msg.id];
	} );
	socket.on( "addTopic", function( topic ) {
		$scope.topics[topic.id] = topic;
	} );
	socket.on( "updateTopic", function( topic ) {
		topic.notify = $scope.topics[topic.id].notify;
		$scope.topics[topic.id] = topic;
	} );
	socket.on( "changeTopic", function( topic ) {
		topic.notify = $scope.topics[topic.id].notify;
		$scope.user.topic = topic;
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
