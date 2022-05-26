import WebSocket from 'ws';
const fs = require('fs');
const ws = new WebSocket('ws://0.0.0.0:8080/ws');

ws.on('open', function open() {
    console.log('Connected!');
});

ws.on('message', function message(data) {
    console.log('received: %s', data);
});
