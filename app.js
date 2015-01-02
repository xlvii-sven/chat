var express = require( "express" ),
	http = require( "http" ),
	sio = require( "socket.io" ),
	os = require( "os" ),
	app = express(),
	server = http.createServer( app ),
	io = sio( server ),
	port = 80, serverIP;

app.get( "/", function ( req, res ) {
	res.redirect("chat.html");
} );

app.use( "/", express.static( "client" ) );
app.use( "/lib", express.static( "bower_components" ) );

var data = {
		users: {},
		topics: {}
	},
	userIds = 0,
	msgIds = 0,
	topicIds = 0;

var general = { id: topicIds++, name: "general", users: 0, msgs: {} };

data.topics[general.id] = general;

io.on( "connection", function( socket ) {
	
	var ip = getIP( socket ),
		user = data.users[ip];
	
	if( !user ) {
		user = data.users[ip] = { id: userIds++, ip: ip, topic: general };
		general.users++;
	}
	
	console.log( "connect: " + ip );
	socket.emit( "initUser", user );
	socket.emit( "initData", data );
	socket.broadcast.emit( "addUser", user );
	
	socket.on( "login", function( name ) {
		user.name = name;
		io.emit( "updateUser", user );
	} );
	socket.on( "logout", function() {
		user.name = null;
		io.emit( "updateUser", user );
	} );
	
	socket.on( "addMsg", function( msg ) {
		msg.id = msgIds++;
		msg.user = user.name;
		msg.userIP = user.ip;
		msg.date = new Date();
		msg.topic = user.topic.id;
		msg.icon = "icon.png";
		user.topic.msgs[msg.id] = msg;
		io.emit( "addMsg", msg );
	} );
	
	socket.on( "removeMsg", function( msg ) {
		delete user.topic.msgs[msg.id];
		io.emit( "removeMsg", msg );
	} );
	
	socket.on( "addTopic", function( topic ) {
		topic.id = topicIds++;
		topic.users = 0;
		topic.msgs = {};
		data.topics[topic.id] = topic;
		io.emit( "addTopic", topic );
	} );
	
	socket.on( "changeTopic", function( targetId ) {
		var sourceTopic = user.topic, targetTopic = data.topics[targetId];
		sourceTopic.users--;
		targetTopic.users++;
		user.topic = targetTopic;
		socket.emit( "changeTopic", targetTopic );
		io.emit( "updateTopic", sourceTopic );
		io.emit( "updateTopic", targetTopic );
	} );
	
	socket.on( "disconnect", function() {
		console.log( "disconnect: " + ip );
		io.emit( "removeUser", user );
	} );
	
} );

server.listen( port );

console.log( "server started: " + getServerIP() + ":" + port );


function getIP( socket ) {
	return socket.request.connection.remoteAddress;
}

function getServerIP() {
	if( serverIP ) return serverIP;
	var interfaces = os.networkInterfaces();
	for( i in interfaces ) {
		for( a in interfaces[i] ) {
			address = interfaces[i][a];
			if( address.family == "IPv4" && !address.internal ) {
				serverIP = address.address;
				return serverIP;
			}
		}
	}
}