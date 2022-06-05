#!/bin/sh
bindgen --ctypes-prefix=cty --use-core bindings.h > generated.rs
