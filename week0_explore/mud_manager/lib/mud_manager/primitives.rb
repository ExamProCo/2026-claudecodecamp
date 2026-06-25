module MudManager
  # Stateless generic primitives over the CircleMUD player-facing command
  # surface. Each method validates its enum-typed arguments and returns a
  # Command struct describing the line to send to the MUD. Runtime
  # preconditions (position, skill availability, AFF_* / PRF_* flags, room
  # flags, equipment requirements, etc.) are intentionally NOT checked here
  # — they require live game state and belong to the Agent layer that wraps
  # these primitives as tool calls.
  #
  # See FINDINGS/_synthesis/player-command-surface.md for the source of truth
  # behind every method and its parameter shape.
  module Primitives
    Command = Struct.new(:primitive, :raw, :verb, :args, keyword_init: true) do
      def to_s = raw
    end

    DIRECTIONS    = %w[north east south west up down].freeze
    POSITIONS     = %w[stand sit rest sleep wake].freeze
    ATTACK_STYLES = %w[hit murder kill].freeze
    STRIKE_SKILLS = %w[backstab bash kick rescue assist].freeze
    LOCAL_SAY     = %w[say emote reply].freeze
    TARGETED_SAY  = %w[tell whisper ask].freeze
    CHANNELS      = %w[shout gossip auction grats holler].freeze
    REPORT_KINDS  = %w[bug typo idea].freeze
    DROP_MODES    = %w[drop donate junk].freeze
    EQUIP_OPS     = %w[wear wield grab hold remove].freeze
    CONSUME_MODES = %w[eat taste drink sip].freeze
    LIQUID_MODES  = %w[pour fill].freeze
    DOOR_VERBS    = %w[open close lock unlock pick].freeze
    LOOK_MODES    = %w[look read].freeze
    LOOK_PREPS    = %w[in at north east south west up down].freeze
    INFO_SELF     = %w[score inventory equipment gold exits time weather
                       levels wimpy toggle where].freeze
    INFO_WORLD    = %w[who users help credits news info motd policies
                       version wizlist immlist clear whoami].freeze
    LIST_KINDS    = %w[commands socials].freeze
    COLOR_LEVELS  = %w[off sparse normal complete].freeze
    PREF_FLAGS    = %w[autoexit brief compact noauction nogossip nograts
                       norepeat noshout nosummon notell quest].freeze
    STEALTH_MODES = %w[hide sneak visible].freeze
    SPELL_ITEM    = %w[use quaff recite].freeze
    GROUP_OPS     = %w[group ungroup].freeze
    SHOP_OPS      = %w[buy sell list value offer].freeze
    BANK_OPS      = %w[balance deposit withdraw].freeze
    MAIL_OPS      = %w[mail receive check].freeze

    module_function

    # ---------- Movement & posture ----------

    def move(direction)
      verb = check_enum!(direction, DIRECTIONS, :direction)
      cmd(:move, verb, verb)
    end

    def enter(keyword = nil)
      raw = keyword ? "enter #{keyword}" : "enter"
      cmd(:enter, "enter", raw, target: keyword)
    end

    def leave
      cmd(:leave, "leave", "leave")
    end

    def set_position(pos)
      verb = check_enum!(pos, POSITIONS, :pos)
      cmd(:set_position, verb, verb)
    end

    def follow(leader = nil)
      raw = leader ? "follow #{leader}" : "follow"
      cmd(:follow, "follow", raw, leader: leader)
    end

    def flee
      cmd(:flee, "flee", "flee")
    end

    def track(victim)
      require_str!(victim, :victim)
      cmd(:track, "track", "track #{victim}", victim: victim)
    end

    # ---------- Combat ----------

    def attack(style, target)
      verb = check_enum!(style, ATTACK_STYLES, :style)
      require_str!(target, :target)
      cmd(:attack, verb, "#{verb} #{target}", target: target)
    end

    def skill_strike(skill, target)
      verb = check_enum!(skill, STRIKE_SKILLS, :skill)
      require_str!(target, :target)
      cmd(:skill_strike, verb, "#{verb} #{target}", target: target)
    end

    def order(who, command)
      require_str!(who, :who)
      require_str!(command, :command)
      cmd(:order, "order", "order #{who} #{command}", who: who, command: command)
    end

    def insult(target)
      require_str!(target, :target)
      cmd(:insult, "insult", "insult #{target}", target: target)
    end

    # ---------- Communication ----------

    def say_local(mode, text)
      verb = check_enum!(mode, LOCAL_SAY, :mode)
      require_str!(text, :text)
      cmd(:say_local, verb, "#{verb} #{text}", text: text)
    end

    def say_targeted(mode, target, text)
      verb = check_enum!(mode, TARGETED_SAY, :mode)
      require_str!(target, :target)
      require_str!(text, :text)
      cmd(:say_targeted, verb, "#{verb} #{target} #{text}", target: target, text: text)
    end

    def say_channel(channel, text)
      verb = check_enum!(channel, CHANNELS, :channel)
      require_str!(text, :text)
      cmd(:say_channel, verb, "#{verb} #{text}", text: text)
    end

    def say_group(text)
      require_str!(text, :text)
      cmd(:say_group, "gsay", "gsay #{text}", text: text)
    end

    def say_quest(text)
      require_str!(text, :text)
      cmd(:say_quest, "qsay", "qsay #{text}", text: text)
    end

    def report_player(kind, text)
      verb = check_enum!(kind, REPORT_KINDS, :kind)
      require_str!(text, :text)
      cmd(:report_player, verb, "#{verb} #{text}", text: text)
    end

    def write_note(paper, pen = nil)
      require_str!(paper, :paper)
      raw = pen ? "write #{paper} #{pen}" : "write #{paper}"
      cmd(:write_note, "write", raw, paper: paper, pen: pen)
    end

    # ---------- Inventory & objects ----------

    def get(obj, container: nil, count: nil)
      require_str!(obj, :obj)
      parts = ["get"]
      parts << count.to_s if count
      parts << obj
      parts << container if container
      cmd(:get, "get", parts.join(" "), obj: obj, container: container, count: count)
    end

    def drop(mode, obj, count: nil)
      verb = check_enum!(mode, DROP_MODES, :mode)
      require_str!(obj, :obj)
      parts = [verb]
      parts << count.to_s if count
      parts << obj
      cmd(:drop, verb, parts.join(" "), obj: obj, count: count)
    end

    def put(obj, container, count: nil)
      require_str!(obj, :obj)
      require_str!(container, :container)
      parts = ["put"]
      parts << count.to_s if count
      parts << obj << container
      cmd(:put, "put", parts.join(" "), obj: obj, container: container, count: count)
    end

    def give(obj, target, count: nil)
      require_str!(obj, :obj)
      require_str!(target, :target)
      parts = ["give"]
      parts << count.to_s if count
      parts << obj << target
      cmd(:give, "give", parts.join(" "), obj: obj, target: target, count: count)
    end

    def equip(slot_op, obj, body_loc: nil)
      verb = check_enum!(slot_op, EQUIP_OPS, :slot_op)
      require_str!(obj, :obj)
      raw = body_loc ? "#{verb} #{obj} #{body_loc}" : "#{verb} #{obj}"
      cmd(:equip, verb, raw, obj: obj, body_loc: body_loc)
    end

    def consume(mode, obj)
      verb = check_enum!(mode, CONSUME_MODES, :mode)
      require_str!(obj, :obj)
      cmd(:consume, verb, "#{verb} #{obj}", obj: obj)
    end

    def transfer_liquid(mode, from, to)
      verb = check_enum!(mode, LIQUID_MODES, :mode)
      require_str!(from, :from)
      require_str!(to, :to)
      # pour <from> <to|"out">  /  fill <to> <from>
      raw = verb == "pour" ? "pour #{from} #{to}" : "fill #{to} #{from}"
      cmd(:transfer_liquid, verb, raw, from: from, to: to)
    end

    def split_gold(amount)
      raise ArgumentError, "amount must be a positive integer" unless amount.is_a?(Integer) && amount.positive?
      cmd(:split_gold, "split", "split #{amount}", amount: amount)
    end

    # ---------- Doors ----------

    def door(verb, target, direction: nil)
      direction = nil if direction.to_s.strip.empty?   # "" is truthy in Ruby; treat as absent
      v = check_enum!(verb, DOOR_VERBS, :verb)
      require_str!(target, :target)
      check_enum!(direction, DIRECTIONS, :direction) if direction
      raw = direction ? "#{v} #{target} #{direction}" : "#{v} #{target}"
      cmd(:door, v, raw, target: target, direction: direction)
    end

    # ---------- Perception & info ----------

    def look(mode: "look", target: nil, preposition: nil)
      # Normalize empty strings → nil so callers can pass "" for "no value"
      target      = nil if target.to_s.strip.empty?
      preposition = nil if preposition.to_s.strip.empty?
      verb = check_enum!(mode, LOOK_MODES, :mode)
      check_enum!(preposition, LOOK_PREPS, :preposition) if preposition
      parts = [verb]
      parts << preposition if preposition
      parts << target if target
      cmd(:look, verb, parts.join(" "), target: target, preposition: preposition)
    end

    def examine(target)
      require_str!(target, :target)
      cmd(:examine, "examine", "examine #{target}", target: target)
    end

    def info_self(kind)
      verb = check_enum!(kind, INFO_SELF, :kind)
      cmd(:info_self, verb, verb)
    end

    def info_world(kind, filter: nil)
      verb = check_enum!(kind, INFO_WORLD, :kind)
      raw = filter ? "#{verb} #{filter}" : verb
      cmd(:info_world, verb, raw, filter: filter)
    end

    def consider(target)
      require_str!(target, :target)
      cmd(:consider, "consider", "consider #{target}", target: target)
    end

    def diagnose(target = nil)
      raw = target ? "diagnose #{target}" : "diagnose"
      cmd(:diagnose, "diagnose", raw, target: target)
    end

    def list_commands(kind, player: nil)
      verb = check_enum!(kind, LIST_KINDS, :kind)
      raw = player ? "#{verb} #{player}" : verb
      cmd(:list_commands, verb, raw, player: player)
    end

    # ---------- Character / preferences / lifecycle ----------

    def social(name, target: nil)
      require_str!(name, :name)
      raw = target ? "#{name} #{target}" : name
      cmd(:social, name, raw, target: target)
    end

    def set_title(text)
      require_str!(text, :text)
      raise ArgumentError, "title may not contain parentheses" if text.match?(/[()]/)
      cmd(:set_title, "title", "title #{text}", text: text)
    end

    def set_display(tokens)
      require_str!(tokens, :tokens)
      cmd(:set_display, "display", "display #{tokens}", tokens: tokens)
    end

    def set_color(level)
      verb = check_enum!(level, COLOR_LEVELS, :level)
      cmd(:set_color, "color", "color #{verb}", level: verb)
    end

    def set_wimpy(hp)
      raise ArgumentError, "hp must be a non-negative integer" unless hp.is_a?(Integer) && hp >= 0
      cmd(:set_wimpy, "wimpy", "wimpy #{hp}", hp: hp)
    end

    def toggle_pref(flag)
      verb = check_enum!(flag, PREF_FLAGS, :flag)
      cmd(:toggle_pref, verb, verb, flag: verb)
    end

    def stealth(mode)
      verb = check_enum!(mode, STEALTH_MODES, :mode)
      cmd(:stealth, verb, verb)
    end

    def steal(obj, victim)
      require_str!(obj, :obj)
      require_str!(victim, :victim)
      cmd(:steal, "steal", "steal #{obj} #{victim}", obj: obj, victim: victim)
    end

    def practice(skill = nil)
      raw = skill ? "practice #{skill}" : "practice"
      cmd(:practice, "practice", raw, skill: skill)
    end

    def define_alias(name, replacement)
      require_str!(name, :name)
      raise ArgumentError, "cannot alias 'alias'" if name == "alias"
      require_str!(replacement, :replacement)
      cmd(:define_alias, "alias", "alias #{name} #{replacement}",
          name: name, replacement: replacement)
    end

    def save_char
      cmd(:save_char, "save", "save")
    end

    def quit
      # CircleMUD requires the literal four-letter "quit" for mortals.
      cmd(:quit, "quit", "quit")
    end

    # ---------- Magic ----------

    def cast(spell, target: nil)
      require_str!(spell, :spell)
      raw = target ? "cast '#{spell}' #{target}" : "cast '#{spell}'"
      cmd(:cast, "cast", raw, spell: spell, target: target)
    end

    def use_magic_item(mode, item, target_args: nil)
      verb = check_enum!(mode, SPELL_ITEM, :mode)
      require_str!(item, :item)
      raw = target_args ? "#{verb} #{item} #{target_args}" : "#{verb} #{item}"
      cmd(:use_magic_item, verb, raw, item: item, target_args: target_args)
    end

    # ---------- Group ----------

    def group_manage(op, target: nil)
      verb = check_enum!(op, GROUP_OPS, :op)
      raw = target ? "#{verb} #{target}" : verb
      cmd(:group_manage, verb, raw, target: target)
    end

    def report_hp
      cmd(:report_hp, "report", "report")
    end

    # ---------- Room-procedural (SPEC_PROC-mediated) ----------

    def shop(op, args: nil)
      verb = check_enum!(op, SHOP_OPS, :op)
      raw = args ? "#{verb} #{args}" : verb
      cmd(:shop, verb, raw, args: args)
    end

    def bank(op, amount: nil)
      verb = check_enum!(op, BANK_OPS, :op)
      raw = amount ? "#{verb} #{amount}" : verb
      cmd(:bank, verb, raw, amount: amount)
    end

    def mail(op, recipient: nil)
      verb = check_enum!(op, MAIL_OPS, :op)
      raw = recipient ? "#{verb} #{recipient}" : verb
      cmd(:mail, verb, raw, recipient: recipient)
    end

    def rent
      cmd(:rent, "rent", "rent")
    end

    def house_admin(player = nil)
      raw = player ? "house #{player}" : "house"
      cmd(:house_admin, "house", raw, player: player)
    end

    # ---------- internals ----------

    def cmd(primitive, verb, raw, **args)
      Command.new(primitive: primitive, verb: verb, raw: raw, args: args)
    end
    private_class_method :cmd

    def check_enum!(value, allowed, name)
      v = value.to_s.downcase
      unless allowed.include?(v)
        raise ArgumentError, "invalid #{name}: #{value.inspect} (expected one of #{allowed.join(', ')})"
      end
      v
    end
    private_class_method :check_enum!

    def require_str!(value, name)
      raise ArgumentError, "#{name} is required" if value.nil? || value.to_s.strip.empty?
    end
    private_class_method :require_str!
  end
end
