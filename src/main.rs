use std::env;
use std::process;

use can_websocket_bridge::handle_websocket;
use warp::Filter;

#[tokio::main]
async fn main() {
    //pretty_env_logger::init();
    if env::args().len() <= 1 {
        eprintln!("Not enough arguments.");
        eprintln!("Usage: ./can-websocket-bridge <interface>");
        process::exit(1);
    }

    let routes = warp::path("ws")
        .and(warp::ws())
        .map(move |ws: warp::ws::Ws| ws.on_upgrade(|websocket| handle_websocket(websocket)));

    warp::serve(routes).run(([0, 0, 0, 0], 8080)).await;
}
