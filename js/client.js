var url = "ws://localhost:8080/test";
var socket;

function connectToServer() {
    if (socket == null) {
        socket = new WebSocket(url);
        // Connection opened
        socket.addEventListener("open", function (event) {
           console.log("Connected to", url);
           sendCommand("hello");
        });
        // Listen for messages
        socket.addEventListener("message", function (event) {
           console.log("Message from server", event.data);
        });
    } else {
	if (socket.url == url) {
	    if (socket.readyState == WebSocket.CONNECTING) {
	        console.log("Already connecting!");
	    } else if (socket.readyState == WebSocket.OPEN) {
	        console.log("Already connected!");
	    }
	}
    }
}

function disconnectFromServer() {
    if (socket == null) {
        console.log("Not connected to anything!");
    } else {
        socket.close();
        socket = null;
        console.log("Disconnected from websocket server!");
    }
}


function sendCommand(command) {
    if (socket == null) {
    console.log("Not connected to websocket server!");
    } else {
        socket.send(JSON.stringify({"command": command}));
    console.log("Sent command", command); 
    }
}

