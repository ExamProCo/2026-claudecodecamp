require "socket"
require "thread"

module MudManager
  # Long-lived telnet connection to a CircleMUD server.
  #
  # A background thread continuously drains the socket into an internal
  # buffer, stripping telnet IAC negotiation bytes. The agent loop sends a
  # command and then calls `read_until_quiet` (or `read_until` for a known
  # prompt) to collect both the command's response and any async chatter
  # that arrived in the meantime.
  class Session
    DEFAULT_HOST    = "localhost"
    DEFAULT_PORT    = 4000
    DEFAULT_TIMEOUT = 10.0

    # Telnet protocol bytes we recognise. We don't negotiate — we just
    # consume and discard IAC sequences so they don't pollute the buffer.
    IAC  = 0xFF
    DONT = 0xFE
    DO   = 0xFD
    WONT = 0xFC
    WILL = 0xFB
    SB   = 0xFA
    SE   = 0xF0

    class Error          < StandardError; end
    class ConnectionError < Error; end
    class LoginError     < Error; end
    class Timeout        < Error; end

    attr_reader :host, :port

    def initialize(host: DEFAULT_HOST, port: DEFAULT_PORT, timeout: DEFAULT_TIMEOUT)
      @host       = host
      @port       = port
      @timeout    = timeout
      @socket     = nil
      @reader     = nil
      @buffer     = String.new.force_encoding(Encoding::UTF_8)
      @buffer_mu  = Mutex.new
      @buffer_cv  = ConditionVariable.new
      @closed     = false
      @last_recv_at = nil
    end

    def open
      raise Error, "already open" if @socket
      @socket = TCPSocket.new(@host, @port)
      @closed = false
      start_reader
      self
    rescue SystemCallError => e
      raise ConnectionError, "connect #{@host}:#{@port} failed: #{e.message}"
    end

    def open?
      @socket && !@closed
    end

    def close
      return if @closed
      @closed = true
      begin
        @socket&.close
      rescue StandardError
        # already closed / broken — fine
      end
      @reader&.join(1)
      @socket = nil
      @reader = nil
    end

    # Send a command. Accepts a String, a Primitives::Command, or anything
    # that responds to #raw or #to_s. A trailing newline is appended.
    def send_command(command)
      raise Error, "session not open" unless open?
      line =
        if command == :return || command == :enter
          ""
        elsif command.respond_to?(:raw)
          command.raw
        else
          command.to_s
        end
      @socket.write(line + "\r\n")
      line
    end
    alias_method :send, :send_command

    # Drain whatever is currently buffered and return it. Non-blocking.
    def drain
      @buffer_mu.synchronize do
        out, @buffer = @buffer, String.new.force_encoding(Encoding::UTF_8)
        out
      end
    end

    # Block until `quiet_seconds` have elapsed with no new bytes arriving,
    # or `timeout` total seconds pass. Returns whatever accumulated.
    # This is the workhorse for "send a command, get the full response".
    def read_until_quiet(quiet_seconds = 1.0, timeout: nil)
      raise Error, "session not open" unless open?
      deadline = monotime + (timeout || @timeout)
      @buffer_mu.synchronize do
        loop do
          remaining_total = deadline - monotime
          break if remaining_total <= 0

          if @last_recv_at && (monotime - @last_recv_at) >= quiet_seconds && !@buffer.empty?
            break
          end

          wait_for = if @last_recv_at && !@buffer.empty?
                       quiet_seconds - (monotime - @last_recv_at)
                     else
                       remaining_total
                     end
          wait_for = [wait_for, remaining_total].min
          break if wait_for <= 0
          @buffer_cv.wait(@buffer_mu, wait_for)
        end
        out, @buffer = @buffer, String.new.force_encoding(Encoding::UTF_8)
        out
      end
    end

    # Block until the buffer contains the given pattern (String or Regexp),
    # then return everything up to and including the match. Raises Timeout
    # if `timeout` seconds pass without a match.
    def read_until(pattern, timeout: nil)
      raise Error, "session not open" unless open?
      regexp = pattern.is_a?(Regexp) ? pattern : Regexp.new(Regexp.escape(pattern))
      deadline = monotime + (timeout || @timeout)
      @buffer_mu.synchronize do
        loop do
          if (m = regexp.match(@buffer))
            cut = m.end(0)
            out = @buffer[0...cut]
            @buffer = @buffer[cut..] || String.new
            @buffer.force_encoding(Encoding::UTF_8)
            return out
          end
          remaining = deadline - monotime
          raise Timeout, "read_until #{pattern.inspect} after #{timeout}s" if remaining <= 0
          raise ConnectionError, "socket closed while waiting" if @closed
          @buffer_cv.wait(@buffer_mu, remaining)
        end
      end
    end

    # CircleMUD terminates every command response with a prompt that ends in
    # "> " (greater-than space). Waiting for that sentinel is faster and more
    # deterministic than relying on a silence window — it returns as soon as
    # the server signals it has finished processing the command.
    #
    # Falls back to draining the buffer if the prompt is never seen within
    # the timeout (e.g. during combat when extra async lines may slip in).
    PROMPT_SENTINEL = "> "

    def read_until_prompt(timeout: nil)
      read_until(PROMPT_SENTINEL, timeout: timeout)
    rescue Timeout
      warn "[MudManager::Session] prompt not detected within timeout; returning buffered content"
      drain
    end

    # Walk the CircleMUD login dance:
    def login(username, password)
      self.read_until(/By what name do you wish to be known.*\?/i)

      # Enter Username
      self.send_command(username)

      # Expect Password Prompt
      self.read_until(/Password/i)

      # Enter Password
      self.send_command(password)

      output = self.read_until(/Welcome|Reconnecting|Wrong password/i)
      if output =~ /Reconnecting/i
        # already in-world, skip menu
      elsif output =~ /Welcome/i
        # fresh login, handle menu
        self.send_command(:return) # enter for main menu
        self.send_command(1)       # enter the game
        self.read_until_quiet
      elsif output =~ /Wrong password/i
        raise LoginError, "wrong password"
      end
    end

    # ----- internals -----

    private

    def start_reader
      @reader = Thread.new do
        begin
          loop do
            chunk = @socket.readpartial(4096)
            break if chunk.nil? || chunk.empty?
            text = strip_iac(chunk)
            unless text.empty?
              @buffer_mu.synchronize do
                @buffer << text.force_encoding(Encoding::UTF_8)
                @last_recv_at = monotime
                @buffer_cv.broadcast
              end
            end
          end
        rescue EOFError, IOError, Errno::ECONNRESET
          # remote closed — fall through
        rescue StandardError => e
          warn "[MudManager::Session] reader error: #{e.class}: #{e.message}"
        ensure
          @buffer_mu.synchronize do
            @closed = true
            @buffer_cv.broadcast
          end
        end
      end
      @reader.report_on_exception = false
    end

    # Telnet protocol IAC stripper. The MUD may interleave:
    #   IAC (WILL|WONT|DO|DONT) <option>            — 3 bytes
    #   IAC SB <option> ... IAC SE                  — variable
    #   IAC IAC                                     — literal 0xFF byte
    # We discard all of them. CircleMUD's negotiation is mostly echo
    # toggling around the password prompt, which we don't honor.
    def strip_iac(bytes)
      out = String.new(capacity: bytes.bytesize)
      bs  = bytes.bytes
      i   = 0
      while i < bs.length
        b = bs[i]
        if b == IAC
          nxt = bs[i + 1]
          case nxt
          when nil
            break
          when IAC
            out << 0xFF.chr
            i += 2
          when WILL, WONT, DO, DONT
            i += 3
          when SB
            j = i + 2
            j += 1 while j < bs.length && !(bs[j] == IAC && bs[j + 1] == SE)
            i = j + 2
          else
            i += 2
          end
        else
          out << b.chr
          i += 1
        end
      end
      out
    end

    def monotime
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
