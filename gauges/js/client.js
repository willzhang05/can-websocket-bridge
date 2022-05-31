var url = "ws://" + window.location.hostname + ":8080/ws";
var socket;
var gauge = new LinearGauge({
    renderTo: "gauge",
    width: 400,
    height: 150,
    minValue: 0,
    maxValue: 100,
    highlights: [
        {
            "from": 0,
            "to": 100,
            "color": "rgba(0, 0, 0, 0)"
        }
    ],
    majorTicks: [
        "0",
        "20",
        "40",
        "60",
        "80",
        "100",
    ],
    minorTicks: 0,
    strokeTicks: true,
    borderShadowWidth: 0,
    borders: false,
    barBeginCircle: false,
    tickSide: "left",
    needle: false,
    needleSide: "left",
    needleType: "line",
    needleWidth: 3,
    numberSide: "left",
    colorMajorTicks: "#fff",
    colorMinorTicks: "#fff",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    colorPlate: "#000",
    colorNeedle: "#ff0000",
    colorNeedleEnd: "#222",
    colorBarProgress: "#f44336",
    animationDuration: 1000,
    animationRule: "linear",
    animationTarget: "plate",
    barWidth: 5,
    ticksWidth: 10,
    ticksWidthMinor: 15
}).draw();

connectToServer();

function updateGUI(toUpdate) {
    if ("motorRPM" in toUpdate) {
        // 460-470mm wheel diameter
        // ~18.3inches
        let speed = toUpdate.motorRPM * 18.3 * Math.PI * 60.0 / 63360.0;
        document.getElementById("speed").innerHTML = Math.floor(speed);
    }
    if ("throttle" in toUpdate) {
        //document.getElementById("gauge").setAttribute("data-value", toStrintoUpdate.throttle);
        gauge.update({value: toUpdate.throttle});
    }
    if ("forwardEnable" in toUpdate && "reverseEnable" in toUpdate) {
        let gearDisplay = document.getElementById("gear");
        //console.log(gearDisplay.children[0]);
        let selectFontSize = "3rem";
        let unselectFontSize = "2rem";
        let selectColor = "#fff";
        let unselectColor = "#757575";
        if (toUpdate["forwardEnable"] == toUpdate["reverseEnable"]) {
            gearDisplay.children[0].style.fontSize = unselectFontSize;
            gearDisplay.children[1].style.fontSize = selectFontSize;
            gearDisplay.children[2].style.fontSize = unselectFontSize;
            gearDisplay.children[0].style.color = unselectColor;
            gearDisplay.children[1].style.color = selectColor;
            gearDisplay.children[2].style.color = unselectColor;
        } else {
            if (toUpdate["forwardEnable"] > 0) {
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
        //console.log(video.getAttribute("hidden"));
        if (video.getAttribute("hidden") != null) {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("enabling webcam");
                navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                })
                .catch(function (err0r) {
                    console.log("Something went wrong!");
                });
                gauges.style.visibility = "hidden";
                gauges.style.display = "none";
                video.removeAttribute("hidden");
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
    let result = JSON.parse(msg);
    //console.log(result);
    // wheel diameter: 460-470mm = ~18.3 inches
    id = parseInt(result.id, 16);
    let nodeID = id & 0xf;
    //console.log("Node ID: ", nodeID);
    let counter = id & 0xf0;
    //console.log("Counter: ", counter);
    let messageType = id & 0xf00;
    //console.log("Message Type: ", messageType);
    let values = {};
    if (id == 0x201) {
        //console.log(hex2bin(result.data));
        //console.log(result.data);
        var throttle = result.data >>> 23;
        if (throttle > 256) {
            throttle = 256;
        }
        values.throttle = Math.floor(100 * throttle / 256);
        //throttle = Math.floor(values.throttle * 100 / 256);
        //console.log(hex2bin(result.data));
        var regen = (result.data >>> 14) & 0x1ff;
        if (regen > 256) {
            regen = 256;
        }
        values.regen = Math.floor(100 * regen / 256);;
        values.cruiseSpeed = (result.data >>> 6) & 0xff;
        values.cruiseEnable = (result.data >>> 5) & 0x1;
        values.forwardEnable = (result.data >>> 4) & 0x1;
        values.reverseEnable = (result.data >>> 3) & 0x1;
        values.motorOn = (result.data >>> 2) & 0x1;
        //setWebcam(values.reverseEnable);
    } else if (id == 0x301) {
        //console.log(hex2bin(result.data));
        values.hazards = (result.data >>> 7) & 0x1;
        values.brakelights = (result.data >>> 6) & 0x1;
        values.headlights = (result.data >>> 5) & 0x1;
        values.left_turn_signal = (result.data >>> 4) & 0x1;
        values.right_turn_signal = (result.data >>> 3) & 0x1;
        //console.log(values);
    } else if (id == 0x325) {
        values.batteryVoltage = result.data >>> 54;
        //console.log(values.batteryVoltage);
        values.batteryCurrent = (result.data >>> 45) & 0x1ff;
        values.batteryCurrentDir = (result.data >>> 44) & 0x1;
        values.motorCurrent = (result.data >>> 34) & 0x3ff;
        values.motorTemp = (result.data >>> 29) & 0x1f;
        values.motorRPM = (result.data >>> 17) & 0xfff;
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

