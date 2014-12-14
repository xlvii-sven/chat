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
		msgs: {}
	},
	userIds = 0,
	msgIds = 0;

io.on( "connection", function( socket ) {
	
	var ip = getIP( socket ),
		user = data.users[ip];
	
	if( !user ) user = data.users[ip] = { id: userIds++, ip: ip };
	
	console.log( "connect: " + ip );
	socket.emit( "init", {user: user, users: data.users, msgs: data.msgs} );
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
		msg.date = new Date();
		data.msgs[msg.id] = msg;
		io.emit( "addMsg", msg );
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