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
			packStats["SOC"] = 0.5 * data[7];
			packStats["SOH"] = 0.5 * data[6];
			packStats["voltage"] = 0.01 * ((data[5] << 8) + data[4]);
			packStats["current"] = ((data[3] ^ 0b10000000) << 8) + data[2];
			if (data[3] & 0b10000000) {
				packStats["current"] = ~packStats["current"] + 1;
			}
			packStats["current"] *= 0.01

			if (data[1] & 0b10000000) {
				packStats["max_temp"] = ~data[1] + 1;
			} else {
				packStats["max_temp"] = data[1];
			}

			if (data[0] & 0b10000000) {
				packStats["avg_temp"] = ~data[0] + 1;
			} else {
				packStats["avg_temp"] = data[0];
			}
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

