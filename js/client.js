var url = "ws://localhost:8080/test";
var socket;

var packStats = {}

$(document).ready(function() {
	$("#pack-status").DataTable({
		columns: [
			 { data: 'SOC' },
			 { data: 'SOH' },
			 { data: 'voltage' },
			 { data: 'current' },
			 { data: 'max_temp' },
			 { data: 'avg_temp' }
		]
	});
});

function updateGUI() {
	$("#pack-status").DataTable().clear();
	$("#pack-status").DataTable().rows.add([packStats]).draw();
	console.log(packStats);
}

function parseCANMessage(msg) {
	var result = JSON.parse(msg);
	//console.log(result);
	id = parseInt(result.id, 16);

	if (id & 0x1) {
		var msgID = id >> 1;
		if (msgID == 0) {
			var data = [];
			for (var i = 0; i < result.data.length; i++) {
				data.push(parseInt(result.data[i], 16));
			}
			//console.log(data);
			packStats["SOC"] = data[0];
			packStats["SOH"] = data[1];
			packStats["voltage"] = (data[2] << 8) & data[3];
			packStats["current"] = ((data[4] ^ 0b10000000) << 8) & data[5];
			if (result.data[4] & 0b10000000) {
				packStats["current"] = ~packStats["current"] + 1;
			}
			packStats["max_temp"] = data[6];
			packStats["avg_temp"] = data[7];
			//console.log(packStats);
			updateGUI();
		}
	}
}

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
           //console.log("Message from server", event.data);
	   parseCANMessage(event.data);
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

