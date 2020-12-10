var address = "localhost:8080/test";
var socket;

function connectToServer() {
    socket = new WebSocket("ws://" + address);
    // Connection opened
    socket.addEventListener("open", function (event) {
       console.log("Connected to", address);
       sendCommand("hello");
    });
    // Listen for messages
    socket.addEventListener("message", function (event) {
       console.log("Message from server", event.data);
    });
}

function disconnectFromServer() {
    socket.close();
    socket = null;
    console.log("Disconnected from websocket server!");
}


function sendCommand(command) {
    if (socket == null) {
	console.log("Not connected to websocket server!");
    } else {
        socket.send(JSON.stringify({"command": command}));
	console.log("Sent command", command); 
    }
}

