var url = "ws://" + window.location.hostname + ":8080/test";
var socket;
var gauge = new RadialGauge({
        renderTo: document.getElementById("demo"),
        width: 300,
        height: 300,
        units: "MPH",
        minValue: 0,
        maxValue: 70,
        majorTicks: [
                    "0",
                    "10",
                    "20",
                    "30",
                    "40",
                    "50",
                    "60",
                    "70",
                ],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
                    {
                                "from": 60,
                                "to": 70,
                                "color": "rgba(200, 50, 50, .75)"
                    }],
       colorMajorTicks: "#ddd",
        colorMinorTicks: "#ddd",
        colorTitle: "#eee",
        colorUnits: "#ccc",
        colorNumbers: "#eee",
        colorPlate: "#222",
    colorBorderOuter: "#333",
        colorBorderOuterEnd: "#111",
        colorBorderMiddle: "#222",
        colorBorderMiddleEnd: "#111",
        colorBorderInner: "#111",
        colorBorderInnerEnd: "#333",
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
}).draw();

function updateGUI() {
}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function parseCANMessage(msg) {
    var result = JSON.parse(msg);
    //console.log(result);
    // wheel diameter: 460-470mm = ~18.3 inches
    id = parseInt(result.id, 16);
    var nodeID = id & 0xf;
    //console.log("Node ID: ", nodeID);
    var counter = id & 0xf0;
    //console.log("Counter: ", counter);
    var messageType = id & 0xf00;
    //console.log("Message Type: ", messageType);
    if (id == 0x201) {
        var throttle = result.data >> 24;
        var regen = (result.data << 8) >> 16;
        var forwardEnable = (result.data << 16) >> 15;
        var reverseEnable = (result.data << 17) >> 14;
        console.log(throttle, regen, forwardEnable, reverseEnable);
    } else if (id == 0x325) {
        console.log(result.data);
        console.log(hex2bin(result.data));
        var batteryVoltage = result.data >> 54;
        console.log(batteryVoltage);
        var batteryCurrent = (result.data << 10) >> 45;
        var batteryCurrentDir = (result.data << 19) >> 44;
        var motorCurrent = (result.data << 20) >> 34;
        var motorTemp = (result.data << 30) >> 29;
        var motorRPM = (result.data << 35) >> 17;
        //console.log(motorCurrent, motorTemp, motorRPM);
    }
    updateGUI();
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

