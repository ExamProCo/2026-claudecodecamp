#!/bin/sh
set -eu

if [ ! -e /opt/circlemud/lib/.initialized ]; then
  cp -a /opt/circlemud/lib.dist/. /opt/circlemud/lib/
  touch /opt/circlemud/lib/.initialized
fi

exec "$@"
