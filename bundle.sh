#!/usr/bin/env bash

set -e

PACK_FILE="focus-follows-workspace@christopher.luebbemeier.gmail.com.shell-extension.zip"

function compile_schemas() (
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
   	while getopts his flag; do
		case $flag in
		s) schemas=1 ;;
		i) install=1 ;;
		esac
	done
	if [ -n "$schemas" ]; then
        compile_schemas
	fi
    pack
    if [ -n "$install" ]; then
		install
	fi
)

main "$@"
