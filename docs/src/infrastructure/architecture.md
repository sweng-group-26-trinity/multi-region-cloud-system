# System Architecture

> **DineHub** - A resilient multi-region cloud restaurant ordering system

This document explains how our system is designed to be highly available, secure, and scalable across multiple cloud regions.

---

## Overview

Our architecture follows three core principles:

| Principle                  | What it means                                                   |
| -------------------------- | --------------------------------------------------------------- |
| **High Availability**      | The system stays online even if a server or entire region fails |
| **Security by Default**    | All internal traffic is encrypted; only web ports are public    |
| **Horizontal Scalability** | We can add more servers to handle increased load                |

---

## System Diagram

```
                         ┌──────────────────┐
                         │    Internet      │
                         │   (customers)    │
                         └────────┬─────────┘
                                  │
                            ports 80/443
                                  │
                    ╔═════════════▼═════════════╗
                    ║      INGRESS NODE         ║
                    ║  ┌─────────────────────┐  ║
                    ║  │   nginx (reverse    │  ║
                    ║  │   proxy + TLS)      │  ║
                    ║  └─────────────────────┘  ║
                    ╚═════════════╤═════════════╝
                                  │
    ══════════════════════════════╪══════════════════════════════
              Tailscale Mesh Network (encrypted, private)
    ══════════════════════════════╪══════════════════════════════
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ╔══════▼══════╗        ╔══════▼══════╗        ╔══════▼══════╗
    ║   BACKEND   ║        ║   BACKEND   ║        ║  HEADSCALE  ║
    ║  Region A   ║        ║  Region B   ║        ║  (control)  ║
    ╚══════╤══════╝        ╚══════╤══════╝        ╚═════════════╝
           │                      │
           └──────────┬───────────┘
                      │
               ╔══════▼══════╗
               ║    CITUS    ║
               ║ COORDINATOR ║
               ╚══════╤══════╝
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    ╔═══▼═══╗     ╔═══▼═══╗     ╔═══▼═══╗
    ║WORKER ║     ║WORKER ║     ║WORKER ║
    ║   1   ║     ║   2   ║     ║   3   ║
    ╚═══════╝     ╚═══════╝     ╚═══════╝
```

---

## Components

### 1. Ingress Layer (nginx)

The ingress node is the **only** part of our system exposed to the internet.

**Responsibilities:**

- Terminates TLS/HTTPS connections
- Load balances requests across backend servers
- Rate limits to prevent abuse

```
Internet → nginx (:443) → Tailscale → Backend servers
```

### 2. Secure Networking (Tailscale + Headscale)

We use **Headscale**, a self-hosted version of Tailscale, to create a private mesh network.

**Why this approach?**

| Traditional Approach          | Our Approach                              |
| ----------------------------- | ----------------------------------------- |
| Complex firewall rules        | Simple: block everything except Tailscale |
| VPN tunnels between regions   | Automatic mesh between all nodes          |
| Public IPs on every server    | Only ingress has public exposure          |
| Manual certificate management | WireGuard encryption built-in             |

**How it works:**

- Every server runs the Tailscale client
- Headscale (our control server) authenticates nodes
- Nodes communicate via private `100.x.x.x` addresses
- All traffic is encrypted with WireGuard

### 3. Backend Servers

Stateless application servers that handle the business logic.

**Key properties:**

- Can be deployed in multiple regions for lower latency
- Horizontally scalable (add more when needed)
- Connect to database over the secure mesh

### 4. Distributed Database (Citus + PostgreSQL)

Citus extends PostgreSQL to distribute data across multiple servers.

```
                    ┌─────────────────────┐
                    │    Coordinator      │
                    │  (receives queries) │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
      ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
      │  Worker 1 │      │  Worker 2 │      │  Worker 3 │
      │ orders    │      │ orders    │      │ orders    │
      │ 1-1000    │      │ 1001-2000 │      │ 2001-3000 │
      └───────────┘      └───────────┘      └───────────┘
```

**How Citus distributes data:**

1. Tables are "sharded" by a key (e.g., `restaurant_id`)
2. Each worker holds a portion of the data
3. Queries are routed to the relevant workers
4. Results are combined and returned

**Example:** When a customer orders from Restaurant #42:

- Coordinator receives the query
- Routes it to the worker holding Restaurant #42's data
- Worker processes and returns the result

---

## Request Flow

Here's what happens when a customer places an order:

```
┌────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│  Customer  │────▶│   nginx     │────▶│   Backend   │────▶│    Citus      │
│  (browser) │     │  (ingress)  │     │  (Region A) │     │  (database)   │
└────────────┘     └─────────────┘     └─────────────┘     └───────────────┘
      │                   │                   │                    │
      │   HTTPS :443      │    Tailscale      │     Tailscale      │
      │   (encrypted)     │    (encrypted)    │     (encrypted)    │
```

1. Customer's browser connects to nginx over HTTPS
2. nginx forwards request to a backend over Tailscale
3. Backend queries Citus coordinator over Tailscale
4. Coordinator fetches data from workers
5. Response flows back through the same path

---

## Cloud Infrastructure

We deploy on AWS EC2 instances running NixOS.

### Instance Sizes

| Role              | Instance  | Why                                   |
| ----------------- | --------- | ------------------------------------- |
| Headscale         | t3.micro  | Low resource needs, just coordination |
| Ingress           | t3.small  | Handles TLS termination               |
| Backend           | t3.medium | Application processing                |
| Citus Coordinator | t3.medium | Query routing                         |
| Citus Workers     | t3.medium | Data storage and queries              |

### Security Groups

Because of Tailscale, our firewall rules are minimal:

**Ingress node:**

```
Inbound:  80 (HTTP), 443 (HTTPS), 41641/UDP (Tailscale)
Outbound: All (for Tailscale)
```

**All other nodes:**

```
Inbound:  41641/UDP (Tailscale only)
Outbound: All (for Tailscale)
```

No database ports, no backend ports exposed to the internet.

---

## Deployment

All infrastructure is defined as **NixOS modules** in our repository.

| Module                 | Purpose                      |
| ---------------------- | ---------------------------- |
| `backend-service.nix`  | Backend application service  |
| `postgres-service.nix` | Citus distributed PostgreSQL |

This means:

- Infrastructure is version controlled
- Deployments are reproducible
- Configuration changes are atomic

---

## Handling Failures

### If a backend server fails:

- nginx detects it via health checks
- Traffic is routed to healthy backends
- No customer impact

### If a database worker fails:

- Queries to that shard will fail temporarily
- Worker can rejoin and resync
- Other shards continue working

### If an entire region fails:

- Traffic shifts to the healthy region
- May need to promote replica workers

---

## Security Summary

| Attack Vector                | Mitigation                                  |
| ---------------------------- | ------------------------------------------- |
| Network sniffing             | All traffic encrypted (WireGuard)           |
| Unauthorized server access   | Tailscale requires authentication           |
| Database exposed to internet | Database only accessible via mesh           |
| DDoS on backend              | Only nginx is public; rate limiting enabled |

---

## Future Work

- [ ] Headscale NixOS module
- [ ] Tailscale client module
- [ ] nginx ingress module
- [ ] Secrets management with sops-nix
- [ ] Prometheus monitoring (stretch goal)
- [ ] Automated database backups
- [ ] deploy-rs for one-command deployments
