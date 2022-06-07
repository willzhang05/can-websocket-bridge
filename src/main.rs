#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

use std::env;
use std::ptr;
use std::process;
use std::mem::MaybeUninit;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use futures::{FutureExt, StreamExt};
use warp::{Filter, filters::ws};

use serde::{Serialize, Deserialize};
use serde_json::Value;

use tokio_socketcan::{CANSocket, CANFrame};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tokio::sync::mpsc;


#[derive(Serialize, Deserialize, Debug)]
struct CANMessage {
    id: String,
    err: String,
    data: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ClientCommand {
    subscribe: Vec<u32>
}

fn parse_command(msg: &str, subscribed_ids: &mut HashSet<u32>) {
    let v: HashMap<String, Value> = serde_json::from_str(msg).unwrap();
    if v.contains_key("subscribe") {
        for i in v["subscribe"].as_array().unwrap() {
            subscribed_ids.insert(i.as_u64().unwrap() as u32);
        }
    }
}

fn decode_frame_data(frame: CANFrame) -> String {
    //let frame_to_str = serde_json::to_string(&frame_obj).unwrap();
    //eprintln!("frame_to_str: {:?}", frame_to_str);
    if frame.id() == 0x325 {
        let data = frame.data();
        //pub fn motor_controller_motor_controller_power_status_unpack(dst_p: *mut motor_controller_motor_controller_power_status_t, src_p: *const u8, size: size_t)

        let decoded_test_to_str;

        unsafe {
            let mut decoded_test: motor_controller_motor_controller_power_status_t = { MaybeUninit::zeroed().assume_init() };
            let _unpack = motor_controller_motor_controller_power_status_unpack(ptr::addr_of_mut!(decoded_test), ptr::addr_of!(data[0]), data.len().try_into().unwrap());

            decoded_test_to_str = serde_json::to_string_pretty(&decoded_test).unwrap();
            //length = decoded_test_to_str.len();
            //println!("Test {:?}", decoded_test.fet_temperature);
        }
        //println!("Test: {:?}", decoded_test_to_str);
        decoded_test_to_str
        //safe_copy_decoded
    } else {
        "".to_string()
    }
}

async fn handle_websocket(ws: ws::WebSocket) {

    let (ws_tx, mut ws_rx) = ws.split();
    let (to_ws_tx, to_ws_rx) = mpsc::unbounded_channel();
    let to_ws_rx = UnboundedReceiverStream::new(to_ws_rx);

    let subscribed_ids = Arc::new(Mutex::new(HashSet::new()));
    
    let sub_ids = Arc::clone(&subscribed_ids);
    // Thread for receiving incoming websocket messages
    tokio::spawn(async move {
         while let Some(result) = ws_rx.next().await {
            let msg = match result {
                Ok(msg) => msg,
                Err(e) => {
                    eprintln!("websocket error {}", e);
                    break;
                },
            };
            let mut sub_ids_lock = sub_ids.lock().unwrap();
            let _parse_result = parse_command(msg.to_str().unwrap(), &mut sub_ids_lock);
            println!("Subscribed to IDs {:?}", sub_ids_lock);
            //subscribed_ids.append(parse_result);
            //println!("Command {:?}", parse_result);
        }
    });

    // Thread for forwarding message over websocket
    tokio::spawn(to_ws_rx.forward(ws_tx).map(|result| { 
        if let Err(e) = result {
            eprintln!("websocket error: {:?}", e);
        }
    }));

    let args: Vec<String> = env::args().collect();
    let iface = &args[1];
    let mut socket = CANSocket::open(iface).unwrap();
    println!("Initialized CAN interface {}", iface);

    let sub_ids = Arc::clone(&subscribed_ids);
    while let Some(Ok(frame)) = socket.next().await {
        /*
        let frame_obj;
        if frame.is_error() {
            frame_obj = CANMessage {
                id: format!("0x{:x}", frame.id()),
                err: format!("0x{:x}", frame.err()),
                data: format!("0x{}", hex::encode(frame.data())),
            };
        } else {
            frame_obj = CANMessage {
                id: format!("0x{:x}", frame.id()),
                err: format!(""),
                data: format!("0x{}", hex::encode(frame.data())),
                //data: frame.data().to_vec().iter().map(|x| format!("{:x}", x)).collect::<Vec<String>>(),
            };
        }*/
        let sub_ids_lock = sub_ids.lock().unwrap();
        if sub_ids_lock.contains(&frame.id()) {
            let result = decode_frame_data(frame);
            if result.len() > 0 {
                println!("{}", result);
                //let ws_message = ws::Message::text(frame_to_str);
                let ws_message = ws::Message::text(result);
                //eprintln!("ws_message: {:?}", ws_message);
                to_ws_tx.send(Ok(ws_message)).expect("Failed to send message");
                //eprintln!("send_result: {:?}", send_result);
            }
        }
    }
}


#[tokio::main]
async fn main() {
    //pretty_env_logger::init();
    if env::args().len() <= 1 {
        eprintln!("Not enough arguments");
        process::exit(1);
    }

    let routes = warp::path("ws")
            .and(warp::ws())
            .map(
                move |ws: warp::ws::Ws| {
                    ws.on_upgrade(|websocket| handle_websocket(websocket))
                },
            );
    
    warp::serve(routes).run(([0, 0, 0, 0], 8080)).await;
}
