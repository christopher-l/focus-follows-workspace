#!/usr/bin/env bash

set -e

PACK_FILE="focus-follows-workspace@christopher.luebbemeier.gmail.com.shell-extension.zip"

function compile() (
    glib-compile-schemas schemas/
    echo "Compiled schemas"
)

function pack() (
    gnome-extensions pack --force
    echo "Packed $PACK_FILE"
)

function install() (
    gnome-extensions install --force "$PACK_FILE"
    echo "Installed $PACK_FILE"
)

function main() (
    compile
    pack
    while getopts i flag; do
        case $flag in
        i) install ;;
        esac
    done
)

main "$@"
