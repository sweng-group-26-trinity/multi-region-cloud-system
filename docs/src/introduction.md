# DineHub Documentation

> Welcome to DineHub — a resilient, multi-region cloud restaurant ordering system designed for scale.

## What is DineHub?

DineHub is a **distributed restaurant ordering platform** that connects customers with restaurants across multiple geographic regions. It's designed from the ground up for high availability, security, and horizontal scalability.

## Why This Architecture?

Modern cloud applications face three fundamental challenges:

| Challenge        | Traditional Approach              | Our Approach                               |
| ---------------- | --------------------------------- | ------------------------------------------ |
| **Availability** | Single points of failure          | Multi-region with automatic failover       |
| **Security**     | Perimeter-based firewalls         | Zero-trust mesh with encryption everywhere |
| **Scalability**  | Vertical scaling (bigger servers) | Horizontal scaling (more servers)          |

DineHub demonstrates how to build a production-ready system that addresses these challenges through deliberate architectural decisions.

## System Overview

At its core, DineHub consists of three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│                   React + Bun + Tailwind                     │
│         Fast, type-safe, with real-time updates              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│             Spring Boot + GraalVM Native Image               │
│      Stateless, horizontally scalable, sub-second startup  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│         Citus (Distributed PostgreSQL)                     │
│    Data sharded across regions, automatic query routing     │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### For Customers

- Browse restaurants across multiple regions
- Place orders with real-time status tracking
- Secure authentication via JWT or Google OAuth
- Responsive design that works on mobile and desktop

### For Restaurant Owners

- Manage restaurant listings and menus
- View and process incoming orders
- Track order lifecycle from pending to delivered
- Role-based access control for staff

### For Operators

- Deploy to multiple regions with single commands
- Monitor system health via built-in observability
- Scale horizontally by adding nodes
- Zero-downtime deployments with automatic rollback

## Architecture Highlights

### Multi-Region Deployment

Unlike traditional applications deployed to a single data center, DineHub runs across multiple GCP regions, for example:

- **US East** (Virginia) — Primary region for North America
- **EU West** (Ireland) — Primary region for Europe
- **Additional regions** can be added as needed

Each region contains a complete stack: ingress, backend, and database workers. If one region fails, traffic automatically routes to healthy regions.

### Zero-Trust Networking

We don't trust the network—even our own. All internal communication happens over encrypted tunnels:

- **Tailscale mesh**: WireGuard-encrypted connections between all nodes
- **Headscale**: Self-hosted coordination (no dependency on Tailscale SaaS)
- **No public IPs**: Only the ingress node is exposed to the internet
- **Mutual authentication**: Every connection is authenticated at both ends

### Distributed Database

Traditional databases become bottlenecks under load. We use **Citus** to distribute PostgreSQL horizontally:

- **Coordinator node**: Routes queries to appropriate workers
- **Worker nodes**: Store data shards distributed by `restaurant_id`
- **Automatic sharding**: Data automatically distributed as restaurants grow
- **Query parallelization**: Complex queries execute across multiple workers

### Immutable Infrastructure

We treat infrastructure as code—literally. Our Nix configuration:

- **Version controlled**: All changes tracked in Git
- **Reproducible**: Same configuration always produces same system
- **Atomic**: Deployments succeed or roll back completely
- **Testable**: Infrastructure tested in VMs before production

## Technology Choices

### Frontend: Bun + React + Tailwind

- **Bun**: Fast all-in-one JavaScript runtime (10x faster than Node for bundling)
- **React 19**: Concurrent rendering and automatic batching
- **Tailwind v4**: PostCSS-free, CSS-first styling with zero runtime
- **TanStack Query**: Automatic caching and background refetching

Why not Node? Bun provides a unified toolchain without webpack configuration hell.

### Backend: Spring Boot + GraalVM

- **Spring Boot 4**: Mature ecosystem with production-ready defaults
- **GraalVM Native Image**: Compiles to native binary for fast startup and low memory
- **PostgreSQL + Citus**: Proven relational database with horizontal scaling
- **JWT Authentication**: Stateless tokens for horizontal scalability

Why native compilation? Cold starts matter when auto-scaling. A native binary starts in milliseconds, not seconds.

### Infrastructure: Nix + NixOS

- **Nix Flakes**: Reproducible builds with locked dependencies
- **NixOS**: Declarative Linux distribution configured entirely via Nix
- **deploy-rs**: Atomic deployments with automatic rollback
- **Tailscale**: Self-hosted mesh networking without VPN complexity

Why Nix? Traditional configuration management drifts over time. Nix guarantees that what we build today can be rebuilt identically in five years.

### API Design: OpenAPI + Schemathesis

- **OpenAPI Specification**: Single source of truth for API contracts in `specs/openapi.yaml`
- **Schemathesis**: Property-based testing that validates implementation matches specification
- **Redocly**: Documentation generation and spec linting
- **Contract Testing**: API consumers can rely on documented behavior being accurate

This specification-first approach means the API documentation is never out of date—it's automatically validated against the implementation on every build.

## Getting Started

### Prerequisites

You'll need Nix installed (the Determinate Systems installer is recommended):

```bash
curl -fsSL https://install.determinate.systems/nix | sh -s -- install --determinate
```

### Quick Start

1. **Enter the development environment** (installs all tools automatically):

   ```bash
   nix develop
   ```

2. **Start the local development stack** (backend + frontend + database):

   ```bash
   nix run .#compose
   ```

3. **View the documentation** (what you're reading now):

   ```bash
   nix run .#docs.serve
   ```

4. **Run the full test suite**:
   ```bash
   nix flake check -L
   ```

### Project Structure

```
├── frontend/          # Bun + React SPA
├── backend/           # Spring Boot service
├── nix/               # Nix configuration
├── docs/              # This documentation
├── flake.nix          # Nix entry point
└── README.md          # Quick reference
```

## Documentation Guide

This documentation is organized into sections:

### System Architecture

- [**Infrastructure**](./infrastructure/index.md) — How we deploy and operate across regions
- [**Component Architecture**](./architecture/frontend.md) — Design patterns for frontend, backend, and build system

### Component Guides

- [**Frontend**](./architecture/frontend.md) — UI layer design and React patterns
- [**Backend**](./architecture/backend.md) — Service layer architecture and domain model
- [**Nix Build System**](./architecture/nix.md) — Reproducible builds and declarative infrastructure

### API Reference

- [**OpenAPI Documentation**](./openapi/index.md) — Interactive API reference

## Design Principles

Throughout this system, we follow these principles:

1. **Type Safety First**: TypeScript and Java with strict compilation catch errors at build time
2. **Security by Default**: Encryption everywhere, least-privilege access, no secrets in code
3. **Horizontal Scalability**: Design for adding nodes, not bigger nodes
4. **Reproducibility**: Builds and deployments must be repeatable and version-controlled
5. **Observability**: Every component exposes metrics and health checks
6. **Developer Experience**: Complex infrastructure, simple development workflow

## Contributing

This is a university software engineering project. To contribute:

1. Enter the dev shell: `nix develop`
2. Create a branch for your changes
3. Run tests before committing: `nix flake check -L`
4. Format code: `nix fmt`
5. Submit merge request with clear description

## Resources

- **Source Code**: [GitLab Repository](https://gitlab.scss.tcd.ie/sweng-group-26/multi-region-cloud-system)
- **Documentation**: [Live Docs](https://docs-server.main.multi-region-cloud-system.sweng-group-26-trinity.garnix.me/)
- **Issue Tracker**: GitLab Issues
- **CI/CD**: Garnix (via `nix flake check`)

---

_DineHub was built by Trinity College Dublin Software Engineering Group 26 as a software engineering project demonstrating modern cloud architecture patterns._
