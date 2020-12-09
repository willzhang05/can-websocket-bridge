use futures::{FutureExt, StreamExt};
use warp::{Filter, filters::ws};

use serde_json::{Result, Value};


fn parse_command(msg: &str) -> Result<()> {
    let v: Value = serde_json::from_str(msg)?;
    println!("Command {}", v["command"]);
    match v["command"] {
        //"connect" => connect_can_bus(),
        //"disconnect" => disconnect_can_bus(),
        _ => eprintln!("Unknown command {}", v["command"]),
    }
    Ok(())
}

async fn handle_websocket(ws: ws::WebSocket) {
    let (ws_tx, mut ws_rx) = ws.split();
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
    tokio::task::spawn(rx.forward(ws_tx).map(|result| {
        if let Err(e) = result {
            eprintln!("websocket error: {:?}", e);
        }
    }));
	while let Some(result) = ws_rx.next().await {
		let msg = match result {
			Ok(msg) => msg,
			Err(e) => {
				eprintln!("websocket error {}", e);
				break;
			}
		};
        //eprintln!("{}", msg.to_str().unwrap()).expect("Received empty message");
        parse_command(msg.to_str().unwrap());
	}
    ()
}

#[tokio::main]
async fn main() {
    pretty_env_logger::init();
    tokio::spawn(async move {
        let routes = warp::path("test")
            .and(warp::ws())
            .map(|ws: warp::ws::Ws| {
                ws.on_upgrade(move |websocket| {
                    handle_websocket(websocket)
                })
            });
        warp::serve(routes).run(([127, 0, 0, 1], 8080)).await;
    }); 
    loop {
    }
    ()
}
