# CircleMUD Docker Compose

This setup builds CircleMUD 3.1 from the official source archive and runs it on port 4000.

## Run

```sh
docker compose up --build
```

Connect with a MUD client, telnet, or netcat:

```sh
telnet localhost 4000
```

The `circlemud-lib` Docker volume stores persistent game data, including player files and world state.
