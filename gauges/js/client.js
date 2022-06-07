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

var turnSignalToggle = false;
var turnSignalMode = 0;
var turnSignalInterval;
var turnSignals = document.getElementById("turn-signals").children;
var leftTurnSignal = turnSignals[0];
var rightTurnSignal = turnSignals[1];

function turnSignalsBlink(mode) {
    let onTurnSignalColor = "#00ff00";
    let offTurnSignalColor = "#fff";
    if (mode != turnSignalMode) {
        clearInterval(turnSignalInterval);
        turnSignalInterval = setInterval(function () {
            console.log(turnSignalToggle);
            if (turnSignalToggle) {
                if (turnSignalMode == 1 || turnSignalMode == 2) {
                    leftTurnSignal.style.color = onTurnSignalColor;
                    rightTurnSignal.style.color = offTurnSignalColor;
                }
                if (turnSignalMode == 1 || turnSignalMode == 3) {
                    leftTurnSignal.style.color = offTurnSignalColor;
                    rightTurnSignal.style.color = onTurnSignalColor;
                }
            } else {
                leftTurnSignal.style.color = offTurnSignalColor;
                rightTurnSignal.style.color = offTurnSignalColor;
            }
            turnSignalToggle = !turnSignalToggle;
        }, 750);
        turnSignalMode = mode;
    }
}


function updateGUI(toUpdate) {
    // 0x201
    if ("throttle" in toUpdate) {
        gauge.update({value: toUpdate.throttle});
    }
    // 0x301
    if ("hazards" in toUpdate) {

        if (toUpdate.hazards == 1) {
            turnSignalsBlink(1);
        } else if (toUpdate.left_turn_signal == 1) {
            turnSignalsBlink(2);
        } else if (toUpdate.right_turn_signal == 1) {
            turnSignalsBlink(3);
        } else {
            turnSignalIntervalMode = 0;
            clearInterval(turnSignalInterval);
        }
    }
    // 0x325
    if ("motor_rpm" in toUpdate) {
        // 460-470mm wheel diameter
        // ~18.3inches
        let speed = toUpdate.motor_rpm * 18.3 * Math.PI * 60.0 / 63360.0;
        document.getElementById("speed").innerHTML = Math.floor(speed);
    }
    // 0x315
    if ("motor_status" in toUpdate) {
        let gearDisplay = document.getElementById("gear");
        //console.log(gearDisplay.children[0]);
        let selectFontSize = "3rem";
        let unselectFontSize = "2rem";
        let selectColor = "#fff";
        let unselectColor = "#757575";
        switch(toUpdate.motor_status) {
            case 2:
                // forward indicator
                gearDisplay.children[0].style.fontSize = selectFontSize;
                gearDisplay.children[0].style.color = selectColor;
                gearDisplay.children[1].style.fontSize = unselectFontSize;
                gearDisplay.children[1].style.color = unselectColor;
                gearDisplay.children[2].style.fontSize = unselectFontSize;
                gearDisplay.children[2].style.color = unselectColor;
                break;
            case 3:
                // reverse indicator
                gearDisplay.children[0].style.fontSize = unselectFontSize;
                gearDisplay.children[0].style.color = unselectColor;
                gearDisplay.children[1].style.fontSize = unselectFontSize;
                gearDisplay.children[1].style.color = unselectColor;
                gearDisplay.children[2].style.fontSize = selectFontSize;
                gearDisplay.children[2].style.color = selectColor;
                break;
            default:
                // neutral indicator
                gearDisplay.children[0].style.fontSize = unselectFontSize;
                gearDisplay.children[0].style.color = unselectColor;
                gearDisplay.children[1].style.fontSize = selectFontSize;
                gearDisplay.children[1].style.color = selectColor;
                gearDisplay.children[2].style.fontSize = unselectFontSize;
                gearDisplay.children[2].style.color = unselectColor;
        }
    }
}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}


function setWebcam(motorStatus) {
    video = document.getElementById("webcam");
    gauges = document.getElementById("gauges");
    if (motorStatus == 3) {
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
    if ("throttle" in result) {
        result.throttle = Math.floor(100 * result.throttle / 256);
        result.regen = Math.floor(100 * result.regen / 256);
    } else if ("power_mode" in result) {
        //setWebcam(result["motor_status"]);
    } else if ("battery_voltage" in result) {
        result.battery_voltage *= 0.5;
        result.fet_temperature *= 5;
        result.pwm_duty *= 0.5;
        result.lead_angle *= 0.5;
    }
    updateGUI(result);
}

function connectToServer() {
    if (socket == null) {
        socket = new WebSocket(url);
        // Connection opened
        socket.addEventListener("open", function (event) {
           console.log("Connected to", url);
           command = {"subscribe": [0x201, 0x301, 0x315, 0x325]}

           sendCommand(JSON.stringify(command));
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
        socket.send(command);
        console.log("Sent command", command); 
    }
}

connectToServer();
