// build.rs

fn main() {
    println!("hi");
    cc::Build::new()
        .file("src/generated/rivanna2.c")
        .file("src/generated/bps.c")
        .file("src/generated/motor_controller.c")
        .compile("rivanna2");
}
