use futures::{FutureExt, StreamExt};
use warp::Filter;

#[tokio::main]
async fn main() {
    pretty_env_logger::init();

    let routes = warp::path("test")
        .and(warp::ws())
        .map(|ws: warp::ws::Ws| {
            ws.on_upgrade(|websocket| {
                let (tx, rx) = websocket.split();
                rx.forward(tx).map(|result| {
                    if let Err(e) = result {
                        eprintln!("websocket error: {:?}", e);
                    }
                })
            })
        });
    warp::serve(routes).run(([127, 0, 0, 1], 8080)).await;
}
