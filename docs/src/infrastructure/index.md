# Infrastructure

> Designing for resilience, security, and scale.

This section documents how we deploy and operate the DineHub restaurant ordering system across multiple cloud regions.

---

## At a Glance

| Aspect         | Our Solution                               |
| -------------- | ------------------------------------------ |
| **Compute**    | AWS EC2 with NixOS                         |
| **Networking** | Tailscale mesh (self-hosted via Headscale) |
| **Database**   | Citus (distributed PostgreSQL)             |
| **Ingress**    | nginx reverse proxy                        |
| **Deployment** | NixOS modules + deploy-rs                  |

---

## Documentation

- [**System Architecture**](./architecture.md) — Complete system design with diagrams and component overview
- [**Deployment Process**](./deployment.md) — How we deploy, rollback, and manage infrastructure changes
- [**Networking**](./networking.md) — Zero-trust mesh networking with Tailscale
- [**Database**](./database.md) — Distributed PostgreSQL with Citus for horizontal scaling
- [**Security**](./security.md) — Defense in depth across all layers
