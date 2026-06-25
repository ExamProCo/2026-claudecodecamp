require_relative "../lib/mud_manager"

host = 'localhost'
port = 4000
timeout = 10
username = 'dummy'
password = 'helloworld'

session = MudManager::Session.new(host: host, port: port)
session.open

# We can read the output two ways:
# - output = session.read_until(/some kind of text*\?/i, timeout: timeout)
# - output = session.read_until_quiet(0.5, timeout: timeout)

session.login(username,password)

command = MudManager::Primitives.look
puts command
session.send_command(command)

output = session.read_until_quiet
puts output

session.close