# Nix Build System

> Philosophy and architectural patterns for reproducible builds and declarative infrastructure

## Philosophy

Nix is not just a package manager—it's a fundamentally different approach to software construction. We treat the entire system as a **pure function**: given the same inputs (source code + dependencies), we always produce the same outputs (binaries + configurations).

## Core Concepts

### What is Reproducibility?

Traditional build systems produce different outputs based on:

- System libraries installed on the build machine
- Environment variables and PATH
- Network state during dependency resolution
- Implicit dependencies not declared in the build file

Nix eliminates these variables by:

- **Isolating builds** in clean environments with only declared dependencies
- **Locking all inputs** including transitive dependencies and their hashes
- **Content-addressable storage** where outputs are named by their content hash
- **No global state**—each build starts from a pristine environment

### The Flake Paradigm

A **flake** is a self-contained, versioned package description:

- **Declarative**: Build instructions written in Nix expression language
- **Reproducible**: `flake.lock` pins every dependency to exact versions
- **Composable**: Other flakes can depend on your flake
- **Hermetic**: No access to the outside world during builds

This means a build that succeeds on one developer's machine will succeed identically on CI and production.

## Architecture Layers

The Nix architecture separates concerns into four layers:

### Layer 1: Package Definitions

**Purpose**: Describe how to build software from source

Packages define:

- Source location (Git repository, local path, etc.)
- Build dependencies (compilers, libraries, tools)
- Build script (configure, make, install equivalents)
- Runtime dependencies (libraries needed at runtime)

Key insight: Packages are **values** in a functional language. They don't execute—they describe what would be built.

### Layer 2: Development Environment

**Purpose**: Provide a shell with all tools needed for development

The devShell provides:

- Exact versions of compilers and build tools
- Project-specific utilities (formatters, linters)
- Environment variables and shell hooks
- Isolation from host system packages

When you run `nix develop`, you enter a subshell where `java`, `bun`, and other tools are exactly as specified—regardless of what's installed on your laptop.

### Layer 3: Process Composition

**Purpose**: Orchestrate multi-service local development

Process-compose replaces Docker Compose for local development:

- Declares which processes to run (backend, frontend, database)
- Manages dependencies between services
- Provides unified logging and monitoring
- Restart policies for failed processes

Unlike Docker, processes run natively on the host—no virtualization overhead, faster startup, and easier debugging.

### Layer 4: System Configuration

**Purpose**: Define entire NixOS machines

NixOS modules describe:

- Operating system configuration (users, networking, services)
- Service definitions with systemd units
- Security hardening and firewall rules
- Secrets management integration

These configurations are deployed to create reproducible infrastructure—prod server #1 is identical to prod server #2 because both are built from the same expression.

## Dependency Management

### Lock Files

Nix flakes generate `flake.lock` files that pin:

- Direct flake inputs (nixpkgs version)
- Transitive dependencies (libraries your dependencies use)
- Git revisions and content hashes

This means even if nixpkgs updates a library, your build continues using the pinned version until you explicitly update the lock file.

### Supply Chain Security

Nix provides multiple layers of supply chain protection:

1. **Source verification**: Dependencies are fetched by content hash, not just URL
2. **Reproducible builds**: Same source always produces same output
3. **Binary caches**: Signed pre-built binaries reduce compilation time
4. **Sandboxing**: Builds cannot access the network or modify files outside their directory

If a dependency's content doesn't match the expected hash, the build fails rather than accepting a potentially compromised package.

## Build Isolation

### The Sandbox

Nix builds run in **isolated environments** that:

- Have no network access
- See only explicitly declared dependencies
- Start with an empty filesystem (except the source)
- Cannot write outside their output directory

This isolation catches missing dependencies that would work on your laptop (where you have tools installed) but fail in CI.

### Pure Functions

Builds are **pure functions**—they depend only on their inputs:

```
buildPackage(source, dependencies, buildScript) => output
```

The same inputs always produce the same output, enabling:

- **Caching**: If inputs haven't changed, reuse previous output
- **Sharing**: Multiple users can share the same built package
- **Verification**: Rebuild and verify outputs match expectations

## Development Workflow

### Entering the Environment

When you run `nix develop`, Nix:

1. Evaluates the devShell expression
2. Builds any missing tools
3. Sets up environment variables
4. Spawns a new shell with modified PATH
5. Runs shell hooks (e.g., setting FLAKE_ROOT)

The resulting shell has exactly the tools needed—no more, no less.

### Incremental Builds

During development, Nix provides:

- **Incremental compilation**: Only changed files rebuild
- **Development shells**: Different shells for different tasks
- **Direnv integration**: Automatically enter devShell when entering project directory

### Testing Changes

The `nix flake check` command runs the full CI pipeline locally:

1. Builds all packages (backend, frontend, docs)
2. Runs unit and integration tests
3. Checks formatting compliance
4. Validates NixOS configurations
5. Runs VM-based integration tests

This means "works on my machine" is actually meaningful—the exact same checks run locally and in CI.

## Deployment Architecture

### NixOS Systems

NixOS is a Linux distribution where everything is configured through Nix expressions:

- **System packages**: Installed via Nix, not apt/yum
- **System services**: Defined as systemd units in Nix
- **Configuration files**: Generated by Nix templates
- **Users and groups**: Declared in Nix, not useradd

A NixOS machine is built by evaluating a Nix expression that returns a complete system configuration.

### Deploy-rs

Deploy-rs is the deployment tool that:

1. Builds the system configuration locally
2. Copies closure (package + dependencies) to remote machine
3. Activates the new system configuration
4. If activation fails, automatically rolls back
5. Confirms success or triggers rollback

This means failed deployments are atomic—the system either fully activates or reverts to the previous state.

### Secrets Management

Secrets are managed separately from configuration:

- **Encrypted at rest**: Secrets stored encrypted in Git
- **Decrypted at activation**: Age/ragenix decrypts on target machine
- **Available as files**: Services read secrets from filesystem
- **Never in Nix store**: Unencrypted secrets never touch the world-readable store

This separation means configuration can be public while secrets remain encrypted.

## Networking and Infrastructure

### Tailscale Mesh

The infrastructure uses **Tailscale** for private networking:

- **Mesh topology**: Every node connects to every other node directly
- **WireGuard encryption**: All traffic encrypted with modern crypto
- **Headscale control**: Self-hosted coordination server
- **MagicDNS**: Private DNS resolution for internal services

This architecture means services communicate over encrypted tunnels without public IPs or complex firewall rules.

### Service Discovery

Services find each other through:

- **DNS names**: headscale provides internal DNS
- **Static IPs**: Tailscale assigns stable IPs in the 100.x.x.x range
- **NixOS module coordination**: Services configured to know about each other

No load balancers or service meshes required—just direct encrypted connections.

## CI/CD Integration

### The Check Pipeline

`nix flake check` is the universal CI command:

1. **Build verification**: All packages compile successfully
2. **Test execution**: Unit, integration, and property-based tests
3. **Formatting validation**: All code follows project standards
4. **Linting**: Static analysis catches potential issues
5. **VM tests**: Full system integration tests in VMs

### Caching Strategy

Nix provides multiple caching layers:

- **Local store**: Already-built packages on your machine
- **Binary cache**: Shared cache (Garnix, Cachix) for common packages
- **Build cache**: CI artifacts reused between builds

This means builds are incremental—you only rebuild what changed, not the world.

## Troubleshooting and Debugging

### Build Failures

When builds fail, Nix provides:

- Complete build logs with all commands executed
- Environment variable dumps
- Option to keep failed build directory for inspection
- `--show-trace` for detailed evaluation traces

### Development Mode

For debugging build issues:

- `nix develop` enters the build environment
- `genericBuild` runs the build phases interactively
- Failed phases can be re-run with modifications

### Why Reproducibility Matters

Reproducibility isn't just a nice property—it enables:

- **Bisecting**: Git bisect works because old commits still build
- **Security auditing**: Rebuild and verify package contents
- **Disaster recovery**: Infrastructure rebuilt from Git in minutes
- **Team consistency**: Everyone uses exact same tools
- **CI confidence**: Local build success predicts CI success

## When to Use Nix

Nix excels when you need:

- **Reproducible builds** across environments
- **Declarative configuration** that can be versioned
- **Hermetic builds** that don't depend on system state
- **Atomic upgrades** with rollback capability
- **Cross-language projects** with unified tooling

Nix adds complexity when:

- Simple projects with few dependencies
- Teams unfamiliar with functional programming
- Need for rapid iteration over reproducibility
- Integration with non-Nix build systems

For this project, the complexity is justified by the multi-language nature (Java + TypeScript + Nix) and the production deployment requirements.
