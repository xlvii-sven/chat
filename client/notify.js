
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
		icon: msg.icon,
		body : msg.text
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
