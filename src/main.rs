use std::collections::HashMap;

use futures::{FutureExt, StreamExt};
use warp::{Filter, filters::ws};

use serde::{Serialize, Deserialize};
//use serde_json::{Result, Value};

use tokio_socketcan::{CANSocket, CANFrame};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tokio::sync::mpsc;


#[derive(Serialize, Deserialize, Debug)]
pub struct CANMessage {
    id: String,
    err: String,
    data: Vec<String>,
}

fn parse_command(msg: &str) -> serde_json::Value {
    let v: HashMap<String, serde_json::Value> = serde_json::from_str(msg).unwrap();
    if v.contains_key("command") {
        match v["command"] {
            _ => {
                    eprintln!("Received command {}", v["command"]);
                    v["command"].clone()
                },
            //_ => eprintln!("Unknown command {}", v["command"]),
        }
    } else {
        serde_json::json!(null)
    }
}


async fn handle_websocket(ws: ws::WebSocket) {

    let (ws_tx, mut ws_rx) = ws.split();
    let (to_ws_tx, to_ws_rx) = mpsc::unbounded_channel();
    let to_ws_rx = UnboundedReceiverStream::new(to_ws_rx);

    // Receive websocket messages
    tokio::spawn(async move {
         while let Some(result) = ws_rx.next().await {
            let msg = match result {
                Ok(msg) => msg,
                Err(e) => {
                    eprintln!("websocket error {}", e);
                    break;
                },
            };

            let parse_result = parse_command(msg.to_str().expect("Failed to convert message to string"));
            println!("Command {:?}", parse_result);
        }
    });

    // Forward message over websocket
    tokio::spawn(to_ws_rx.forward(ws_tx).map(|result| { 
        if let Err(e) = result {
            eprintln!("websocket error: {:?}", e);
        }
    }));


    let mut socket = CANSocket::open("vcan0").unwrap();
    println!("Initialized CAN interface vcan0");
    while let Some(Ok(frame)) = socket.next().await {
        let frame_obj = CANMessage {
            id: format!("{:x}", frame.id()),
            err: format!("{:x}", frame.err()),
            data: frame.data().to_vec().iter().map(|x| format!("{:x}", x)).collect::<Vec<String>>(),
        };
        let frame_to_str = serde_json::to_string(&frame_obj).unwrap();
        eprintln!("frame_to_str: {:?}", frame_to_str);
        let ws_message = ws::Message::text(frame_to_str);
        //eprintln!("ws_message: {:?}", ws_message);
        to_ws_tx.send(Ok(ws_message)).expect("Failed to send message");
        //eprintln!("send_result: {:?}", send_result);
        
    }

}


#[tokio::main]
async fn main() {
    pretty_env_logger::init();
    //let (to_can_bus_tx, to_can_bus_rx) = tokio::sync::mpsc::unbounded_channel();

    let routes = warp::path("test")
            .and(warp::ws())
            .map(
                move |ws: warp::ws::Ws| {
                    ws.on_upgrade(|websocket| handle_websocket(websocket))
                },
            );
    
    warp::serve(routes).run(([0, 0, 0, 0], 8080)).await;
}
