// build.rs
extern crate bindgen;

use std::env;
use std::path::PathBuf;

use bindgen::{CargoCallbacks, callbacks::ParseCallbacks};

#[derive(Debug)]
struct CustomCallbacks;

impl ParseCallbacks for CustomCallbacks {
    fn add_derives(&self, _name: &str) -> Vec<String> {
        vec!["Serialize".into(), "Deserialize".into()]
    }
}

fn main() {
    println!("hi");
    cc::Build::new()
        .file("CAN-messages/rivanna2.c")
        .file("CAN-messages/bps.c")
        .file("CAN-messages/motor_controller.c")
        .file("CAN-messages/mppt.c")
        .compile("rivanna2");

    // Tell cargo to look for shared libraries in the specified directory
    println!("cargo:rustc-link-search=.");

    // Tell cargo to tell rustc to link the system bzip2
    // shared library.
    println!("cargo:rustc-link-lib=rivanna2");

    // Tell cargo to invalidate the built crate whenever the wrapper changes
    println!("cargo:rerun-if-changed=wrapper.h");

    // The bindgen::Builder is the main entry point
    // to bindgen, and lets you build up options for
    // the resulting bindings.
    
    //let callback: Box<CargoCallbacks> = Box::new(CargoCallbacks.add_derives("Deserialize"));
    let bindings = bindgen::Builder::default()
        // The input header we would like to generate
        // bindings for.
        .header("wrapper.h")
        // Tell cargo to invalidate the built crate whenever any of the
        // included header files changed.
        .parse_callbacks(Box::new(CargoCallbacks))
        .parse_callbacks(Box::new(CustomCallbacks))
        // Finish the builder and generate the bindings.
        .generate()
        // Unwrap the Result and panic on failure.
        .expect("Unable to generate bindings");

    // Write the bindings to the $OUT_DIR/bindings.rs file.
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
