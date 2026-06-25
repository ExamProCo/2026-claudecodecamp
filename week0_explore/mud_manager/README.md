# MudManager

The MudManager has the following responsibilities:

- manages long-lived telnet sessions
- manages the multi-step process of logging back in
- provides generic primitives for MUD commands

## Build the Gem

From this directory:

```sh
gem build mud_manager.gemspec
gem install ./mud_manager-0.1.0.gem
```

Expected output:

```text
MudManager
```

## Uninstall

```sh
gem uninstall mud_manager
```

## Examples

Test the live session:

```sh
MUD_NAME=YourCharacterName MUD_PASSWORD=yourpassword ruby mud_manager/examples/live_session_test.rb
```

If you are already inside the `mud_manager` directory, run:

```sh
MUD_NAME=YourCharacterName MUD_PASSWORD=yourpassword ruby examples/live_session_test.rb
```
