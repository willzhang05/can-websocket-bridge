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
    if ("throttle" in result) {
        result.throttle = Math.floor(100 * result.throttle / 256);
        result.regen = Math.floor(100 * result.regen / 256);
    } else if ("power_mode" in result) {
        console.log(result);
    } else if ("battery_voltage" in result) {
        result.battery_voltage *= 0.5;
        result.fet_temperature *= 5;
        result.pwm_duty *= 0.5;
        result.lead_angle *= 0.5;
    }
    // wheel diameter: 460-470mm = ~18.3 inches
    //setWebcam(values.reverseEnable);
    //updateGUI(values);
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

