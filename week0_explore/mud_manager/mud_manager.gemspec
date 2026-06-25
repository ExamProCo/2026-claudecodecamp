Gem::Specification.new do |spec|
  spec.name        = "mud_manager"
  spec.version     = "0.1.0"
  spec.summary     = "MudManager — CircleMUD session management and command primitives"
  spec.description = "Provides MudManager::Session (a long-lived telnet connection with " \
                     "background buffering and IAC stripping) and MudManager::Primitives " \
                     "(a stateless library of typed CircleMUD command builders)."
  spec.authors     = ["Andrew Brown"]
  spec.email       = ["andrew@exampro.co"]
  spec.license     = "MIT"

  spec.required_ruby_version = ">= 3.0"

  spec.files = Dir["lib/**/*.rb"]

  # No external dependencies — socket and thread are stdlib.
end
