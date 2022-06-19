#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

use std::collections::{HashMap, HashSet};
use std::env;
use std::mem::MaybeUninit;
use std::ptr;
use std::sync::{Arc, Mutex};

use futures::{FutureExt, StreamExt};
use warp::filters::ws;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use tokio::sync::mpsc;
use tokio_socketcan::{CANFrame, CANSocket};
use tokio_stream::wrappers::UnboundedReceiverStream;

pub fn parse_command(msg: &str, subscribed_ids: &mut HashSet<u32>) {
    let v: HashMap<String, Value> = serde_json::from_str(msg).unwrap();
    if v.contains_key("subscribe") {
        for i in v["subscribe"].as_array().unwrap() {
            subscribed_ids.insert(i.as_u64().unwrap() as u32);
        }
    }
}

pub fn decode_frame_data(frame: CANFrame) -> String {
    let data = frame.data();
    match frame.id() {
        0x106 => unsafe {
            let mut decoded: bps_bps_error_t = { MaybeUninit::zeroed().assume_init() };
            bps_bps_error_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x123 => unsafe {
            let mut decoded: rivanna2_power_aux_error_t = { MaybeUninit::zeroed().assume_init() };
            rivanna2_power_aux_error_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x201 => unsafe {
            let mut decoded: rivanna2_ecu_motor_commands_t =
                { MaybeUninit::zeroed().assume_init() };
            rivanna2_ecu_motor_commands_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x301 => unsafe {
            let mut decoded: rivanna2_ecu_power_aux_commands_t =
                { MaybeUninit::zeroed().assume_init() };
            rivanna2_ecu_power_aux_commands_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x315 => unsafe {
            let mut decoded: motor_controller_motor_controller_drive_status_t =
                { MaybeUninit::zeroed().assume_init() };
            motor_controller_motor_controller_drive_status_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x325 => unsafe {
            let mut decoded: motor_controller_motor_controller_power_status_t =
                { MaybeUninit::zeroed().assume_init() };
            motor_controller_motor_controller_power_status_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x406 => unsafe {
            let mut decoded: bps_bps_pack_information_t = { MaybeUninit::zeroed().assume_init() };
            bps_bps_pack_information_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x416 => unsafe {
            let mut decoded: bps_bps_cell_voltage_t = { MaybeUninit::zeroed().assume_init() };
            bps_bps_cell_voltage_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x426 => unsafe {
            let mut decoded: bps_bps_cell_temperature_t = { MaybeUninit::zeroed().assume_init() };
            bps_bps_cell_temperature_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x434 => unsafe {
            let mut decoded: rivanna2_solar_current_t = { MaybeUninit::zeroed().assume_init() };
            rivanna2_solar_current_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x444 => unsafe {
            let mut decoded: rivanna2_solar_voltage_t = { MaybeUninit::zeroed().assume_init() };
            rivanna2_solar_voltage_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x454 => unsafe {
            let mut decoded: rivanna2_solar_temp_t = { MaybeUninit::zeroed().assume_init() };
            rivanna2_solar_temp_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        0x464 => unsafe {
            let mut decoded: rivanna2_solar_photo_t = { MaybeUninit::zeroed().assume_init() };
            rivanna2_solar_photo_unpack(
                ptr::addr_of_mut!(decoded),
                ptr::addr_of!(data[0]),
                data.len().try_into().unwrap(),
            );
            serde_json::to_string(&decoded).unwrap()
        },
        _ => String::new(),
    }
}

pub async fn handle_websocket(ws: ws::WebSocket) {
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
                }
            };
            let mut sub_ids_lock = sub_ids.lock().unwrap();
            let _parse_result = parse_command(msg.to_str().unwrap(), &mut sub_ids_lock);
            println!("Subscribed to IDs {:?}", sub_ids_lock);
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
        let sub_ids_lock = sub_ids.lock().unwrap();
        if sub_ids_lock.contains(&frame.id()) {
            let result = decode_frame_data(frame);
            if result.len() > 0 {
                //println!("{}", result);
                let ws_message = ws::Message::text(result);
                //eprintln!("ws_message: {:?}", ws_message);
                to_ws_tx
                    .send(Ok(ws_message))
                    .expect("Failed to send message");
                //eprintln!("send_result: {:?}", send_result);
            }
        }
    }
}
