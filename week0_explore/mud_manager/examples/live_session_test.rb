# frozen_string_literal: true

require "minitest/autorun"
require "securerandom"

require_relative "../lib/mud_manager"

# Live examples for a CircleMUD-compatible server running on localhost:4000.
#
# Run:
#   ruby mud_manager/examples/live_session_test.rb
#
# Optional login-backed examples:
#   MUD_NAME=Example MUD_PASSWORD=secret ruby mud_manager/examples/live_session_test.rb
#
# Optional movement probe, after login:
#   MUD_NAME=Example MUD_PASSWORD=secret MUD_EXAMPLE_MOVE=1 ruby mud_manager/examples/live_session_test.rb
class LiveSessionTest < Minitest::Test
  HOST = ENV.fetch("MUD_HOST", MudManager::Session::DEFAULT_HOST)
  PORT = Integer(ENV.fetch("MUD_PORT", MudManager::Session::DEFAULT_PORT))
  TIMEOUT = Float(ENV.fetch("MUD_TIMEOUT", "10"))
  NAME = ENV["MUD_NAME"]
  PASSWORD = ENV["MUD_PASSWORD"]

  REVERSE_DIRECTION = {
    "north" => "south",
    "south" => "north",
    "east" => "west",
    "west" => "east",
    "up" => "down",
    "down" => "up"
  }.freeze

  def test_connects_and_reads_name_prompt
    with_open_session do |session|
      prompt = session.read_until(/name.*\?/i, timeout: TIMEOUT)

      assert_match(/name.*\?/i, prompt)
    end
  end

  def test_login_and_read_only_player_commands
    skip "set MUD_NAME and MUD_PASSWORD to run login examples" unless credentials?

    with_logged_in_session do |session|
      command_examples = [
        MudManager::Primitives.look,
        MudManager::Primitives.info_self("exits"),
        MudManager::Primitives.info_self("inventory"),
        MudManager::Primitives.info_self("equipment"),
        MudManager::Primitives.info_self("score"),
        MudManager::Primitives.info_world("who"),
        MudManager::Primitives.info_world("help", filter: "look")
      ]

      command_examples.each do |command|
        output = send_and_read(session, command)

        assert_output_for(command, output)
      end
    end
  end

  def test_reports_wrong_password_as_login_error
    skip "set MUD_NAME to run login error example" unless present?(NAME)

    with_open_session do |session|
      error = assert_raises(MudManager::Session::LoginError) do
        session.login(NAME, "wrong-#{SecureRandom.hex(8)}", timeout: TIMEOUT)
      end

      assert_match(/wrong password|invalid character name|unknown character|did not present a password prompt/i, error.message)
    end
  end

  def test_optional_movement_probe_and_return
    skip "set MUD_NAME and MUD_PASSWORD to run login examples" unless credentials?
    skip "set MUD_EXAMPLE_MOVE=1 to run movement example" unless ENV["MUD_EXAMPLE_MOVE"] == "1"

    with_logged_in_session do |session|
      exits_output = send_and_read(session, MudManager::Primitives.info_self("exits"))
      direction = first_available_direction(exits_output)

      skip "current room did not advertise a reversible exit" unless direction

      outbound = MudManager::Primitives.move(direction)
      outbound_output = send_and_read(session, outbound)

      refute_match(/alas, you cannot go that way|closed|can't/i, outbound_output)

      return_command = MudManager::Primitives.move(REVERSE_DIRECTION.fetch(direction))
      return_output = send_and_read(session, return_command)

      assert_output_for(return_command, return_output)
    end
  end

  private

  def credentials?
    present?(NAME) && present?(PASSWORD)
  end

  def present?(value)
    !value.to_s.strip.empty?
  end

  def with_open_session
    session = MudManager::Session.new(host: HOST, port: PORT)
    session.open
    yield session
  rescue MudManager::Session::ConnectionError => e
    skip "#{HOST}:#{PORT} is not accepting connections: #{e.message}"
  ensure
    session&.close
  end

  def with_logged_in_session
    with_open_session do |session|
      begin
        welcome = session.login(NAME, PASSWORD, timeout: TIMEOUT)
      rescue MudManager::Session::LoginError => e
        skip "login failed for #{NAME.inspect}: #{e.message}"
      end

      refute_empty normalize(welcome)
      yield session
    end
  end

  def send_and_read(session, command)
    sent = session.send_command(command)

    assert_equal command.raw, sent

    session.read_until_quiet(0.35, max_wait: TIMEOUT)
  end

  def assert_output_for(command, output)
    normalized = normalize(output)

    refute_empty normalized, "expected output for #{command.raw.inspect}"
    refute_match(/huh\?!|unknown command|is not a command/i, normalized)
  end

  def normalize(output)
    output.to_s.gsub(/\e\[[0-9;]*[A-Za-z]/, "").strip
  end

  def first_available_direction(exits_output)
    normalized = normalize(exits_output).downcase

    REVERSE_DIRECTION.keys.find do |direction|
      normalized.match?(/\b#{Regexp.escape(direction)}\b/)
    end
  end
end
