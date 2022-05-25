var url = "ws://" + window.location.hostname + ":8080/ws";
var socket;
/*   
var gauge = new RadialGauge({
        renderTo: document.getElementById("gauges"),
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
                                "color", "rgba(200, 50, 50, .75)"
                    }],
        colorMajorTicks: "#ddd",
        colorMinorTicks: "#ddd",
        colorTitle: "#eee",
        colorUnits: "#ccc",
        colorNumbers: "#eee",
        colorPlate: "#000",
        colorBorderOuter: "#333",
        colorBorderOuterEnd: "#111",
        colorBorderMiddle: "#222",
        colorBorderMiddleEnd: "#111",
        colorBorderInner: "#111",
        colorBorderInnerEnd: "#333",
        borderShadowWidth: 0,
        borders: false,
        needleType: "line",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: false,
        needleCircleInner: false,
        needle: false,
        animationDuration: 1500,
        animationRule: "linear",
        colorBarProgress: "#ff0000",
        barProgress: true,
        barWidth: 5,
        barStrokeWidth: 5,
        valueBox: false
}).draw();*/
var gauge = new LinearGauge({
    renderTo: "throttle",
    width: 500,
    height: 150,
    minValue: 0,
    maxValue: 100,
    majorTicks: [
        "0",
        "20",
        "40",
        "60",
        "80",
        "100"
    ],
    minorTicks: 10,
    strokeTicks: true,
    colorPlate: "#000",
    colorStrokeTicks: "#fff",
    colorNumbers: "#fff",
    borderShadowWidth: 0,
    borders: false,
    barBeginCircle: false,
    tickSide: "left",
    numberSide: "left",
    needleSide: "left",
    needleType: "line",
    needleWidth: 3,
    colorNeedle: "#222",
    colorNeedleEnd: "#222",
    animationDuration: 1500,
    animationRule: "linear",
    animationTarget: "plate",
    barWidth: 5,
    ticksWidth: 50,
    ticksWidthMinor: 15
}).draw();

connectToServer();

function updateGUI(toUpdate) {
    if ("throttle" in toUpdate) {
        gauge.value = toUpdate["throttle"];
        console.log(gauge.value);
        document.getElementById("speed").innerHTML = toUpdate["throttle"];
    }
    if ("forwardEnable" in toUpdate && "reverseEnable" in toUpdate) {
        var gearDisplay = document.getElementById("gear");
        //console.log(gearDisplay.children[0]);
        var selectFontSize = "3rem";
        var unselectFontSize = "2rem";
        var selectColor = "#fff";
        var unselectColor = "#757575";
        if (toUpdate["forwardEnable"] == toUpdate["reverseEnable"]) {
            gearDisplay.children[0].style.fontSize = unselectFontSize;
            gearDisplay.children[1].style.fontSize = selectFontSize;
            gearDisplay.children[2].style.fontSize = unselectFontSize;
            gearDisplay.children[0].style.color = unselectColor;
            gearDisplay.children[1].style.color = selectColor;
            gearDisplay.children[2].style.color = unselectColor;
        } else {
            if (toUpdate["forwardEnable"] == 1) {
                gearDisplay.children[0].style.fontSize = selectFontSize;
                gearDisplay.children[1].style.fontSize = unselectFontSize;
                gearDisplay.children[2].style.fontSize = unselectFontSize;
                gearDisplay.children[0].style.color = selectColor;
                gearDisplay.children[1].style.color = unselectColor;
                gearDisplay.children[2].style.color = unselectColor;
            } else {
                gearDisplay.children[0].style.fontSize = unselectFontSize;
                gearDisplay.children[1].style.fontSize = unselectFontSize;
                gearDisplay.children[2].style.fontSize = selectFontSize;
                gearDisplay.children[0].style.color = unselectColor;
                gearDisplay.children[1].style.color = unselectColor;
                gearDisplay.children[2].style.color = selectColor;
            }
        }
    }
}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function setWebcam(reverseEnable) {
    video = document.getElementById("webcam");
    gauges = document.getElementById("gauges");
    if (reverseEnable == 1) {
        console.log(video.getAttribute("hidden"));
        if (video.getAttribute("hidden") != null) {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("enabling webcam");
                video.removeAttribute("hidden");
                gauges.style.visibility = "hidden";
                gauges.style.display = "none";
                navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                })
                .catch(function (err0r) {
                    console.log("Something went wrong!");
                });
            } else {
                console.log("Webcam not enabled or detected!");
                video.setAttribute("hidden", "true");
                gauges.style.display = "flex";
                gauges.style.visibility = "visible";
            }
        }
    } else {
        //console.log("disabling webcam");
        if (video.getAttribute("hidden") == null) {
            video.setAttribute("hidden", "true");
            gauges.style.display = "flex";
            gauges.style.visibility = "visible";
        }
    }
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
    var values = {};
    if (id == 0x201) {
        console.log(hex2bin(result.data));
        values.throttle = result.data >> 24;
        values.regen = (result.data >> 12) & 0xff;
        values.forwardEnable = (result.data >> 8) & 0x1;
        values.reverseEnable = (result.data >> 9) & 0x1;
    	setWebcam(values.reverseEnable);
        console.log(values.throttle, values.regen, values.forwardEnable, values.reverseEnable);
    } else if (id == 0x301) {
        //console.log(result.data);
    } else if (id == 0x325) {
        console.log(result.data);
        console.log(hex2bin(result.data));
        values.batteryVoltage = result.data >> 54;
        console.log(values.batteryVoltage);
        values.batteryCurrent = (result.data << 10) >> 45;
        values.batteryCurrentDir = (result.data << 19) >> 44;
        values.motorCurrent = (result.data << 20) >> 34;
        values.motorTemp = (result.data << 30) >> 29;
        values.motorRPM = (result.data << 35) >> 17;
        //console.log(motorCurrent, motorTemp, motorRPM);
    }
    updateGUI(values);
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

