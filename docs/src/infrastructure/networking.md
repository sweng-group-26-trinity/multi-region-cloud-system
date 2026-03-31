# Networking Architecture

> How DineHub nodes communicate securely across regions

## Philosophy

Traditional network security relies on perimeter-based firewalls: block everything from the outside, trust everything on the inside. This model breaks down in cloud environments where:

- Services span multiple regions and cloud providers
- Containers and VMs come and go dynamically
- Internal traffic must still be protected

DineHub adopts **zero-trust networking**: encrypt everything, authenticate every connection, verify every request—regardless of whether it's "internal" or "external."

## The Tailscale Mesh

### What is Tailscale?

Tailscale is a mesh VPN built on [WireGuard](https://www.wireguard.com/), a modern, high-performance VPN protocol. Unlike traditional VPNs that tunnel all traffic through a central gateway, Tailscale creates direct, encrypted connections between every pair of nodes.

### Why Self-Hosted?

We use **Headscale**, an open-source implementation of the Tailscale control server:

- **No vendor dependency**: We control the coordination server
- **Private infrastructure**: No data flows through Tailscale's SaaS
- **Custom policies**: Define our own access rules and ACLs
- **Cost**: No per-user licensing fees

### Mesh Topology

```
                    ┌─────────────────────┐
                    │     Internet        │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │   Ingress Node      │
                    │   (nginx :443)      │
                    └──────────┬──────────┘
                               │
              ╔════════════════╪═════════════════╗
              ║   Tailscale Mesh Network (100.x) ║
              ║   All traffic encrypted via      ║
              ║   WireGuard                      ║
              ╚════════════════╪═════════════════╝
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Backend-US   │◀────▶│  Backend-EU   │◀────▶│   Headscale   │
│               │      │               │      │   Control     │
│ • Port 8080   │      │ • Port 8080   │      │ • Port 443    │
│ • No public IP│      │ • No public IP│      │• No public IP │
└───────┬───────┘      └───────┬───────┘      └───────────────┘
        │                      │
        └──────────────────────┼──────────────────────┐
                               │                      │
                               ▼                      ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │DB Coordinator   │    │  DB Worker      │
                    │• Port 5432      │    │  • Port 5432    │
                    │• No public IP   │    │  • No public IP │
                    └─────────────────┘    └─────────────────┘
```

## Network Segmentation

### Security Zones

We organize infrastructure into security zones based on exposure:

**Public Zone** (Ingress only)

- Exposed to internet on ports 80/443
- nginx reverse proxy terminates TLS
- All traffic forwarded to private zone via Tailscale

**Private Zone** (Application layer)

- Backend servers in multiple regions
- Only accessible via Tailscale (100.x.x.x addresses)
- No public IPs, no inbound firewall rules

**Data Zone** (Database layer)

- Citus coordinator and workers
- Same Tailscale-only access as private zone
- Additional PostgreSQL authentication

**Control Plane** (Headscale)

- Manages Tailscale authentication
- No user-facing services
- Minimal attack surface

## Communication Patterns

### Request Flow

When a customer places an order:

1. **Browser → Ingress**: HTTPS over public internet
2. **Ingress → Backend**: HTTP over Tailscale (encrypted by WireGuard)
3. **Backend → Database**: PostgreSQL protocol over Tailscale
4. **Coordinator → Workers**: Internal Citus protocol over Tailscale

Every hop is authenticated and encrypted—even traffic between nodes in the same data center.

### Inter-Region Communication

When a US-based backend queries a database in EU:

1. Backend sends query to Citus coordinator (via Tailscale)
2. Coordinator routes to appropriate worker (may be in EU)
3. Worker processes query, returns results
4. Coordinator aggregates and returns to backend

Tailscale automatically establishes the most direct path, potentially bypassing the public internet entirely if nodes are in the same cloud provider's backbone.

## Service Discovery

### DNS Resolution

Tailscale provides **MagicDNS**, automatically assigning DNS names to nodes:

- `backend-us.internal` → 100.64.0.1
- `db-coordinator.internal` → 100.64.0.2
- `db-worker-1.internal` → 100.64.0.3

Services reference each other by stable DNS names rather than IP addresses, simplifying configuration changes.

### Health-Based Routing

nginx upstream configuration dynamically adjusts based on backend health:

- Health checks verify backends respond correctly
- Failed backends automatically removed from rotation
- New backends automatically added when healthy
- Geographic affinity: prefer local region when possible

## Access Control

### Tailscale ACLs

Access control lists define who can talk to whom:

```
Groups:
- ingress-nodes: ingress-01, ingress-02
- backend-nodes: backend-us, backend-eu
- database-nodes: db-coord, db-worker-1, db-worker-2

Rules:
- ingress-nodes → backend-nodes: allowed
- backend-nodes → database-nodes: allowed
- database-nodes → backend-nodes: denied
- public-internet → anything: denied (except ingress :443)
```

This "default deny" approach means new nodes can't communicate until explicitly permitted.

### Authentication

Tailscale uses cryptographic identity:

- **Node authentication**: Each node has a unique private key
- **User authentication**: Nodes associated with user identity
- **Multi-factor auth**: Headscale can require MFA for node enrollment
- **Certificate rotation**: Keys automatically rotated

## Performance Considerations

### Latency

Tailscale adds minimal overhead:

- **WireGuard encryption**: ~1-2ms latency increase
- **Direct connections**: No central hub to traverse
- **Protocol optimization**: UDP-based, handles NAT traversal

For cross-region traffic, geographic latency dominates—Tailscale doesn't add meaningful overhead.

### Bandwidth

WireGuard is efficient:

- **Small overhead**: ~60 bytes per packet (vs. 150+ for IPSec)
- **Modern crypto**: ChaCha20-Poly1305 optimized for mobile/embedded
- **No head-of-line blocking**: UDP transport

Typical throughput exceeds 1 Gbps between cloud instances.

### Reliability

The mesh topology provides natural redundancy:

- **No single point of failure**: If Headscale is down, existing connections continue
- **Automatic reconnection**: Nodes reconnect if paths change
- **Path optimization**: Routes around failed intermediate hops

## Firewall Configuration

### Minimal Rules

Because Tailscale handles authentication and encryption, firewall rules are simple:

**Ingress Node:**

- Inbound: 80/tcp, 443/tcp, 41641/udp (Tailscale)
- Outbound: All (for Tailscale mesh)

**All Other Nodes:**

- Inbound: 41641/udp (Tailscale only)
- Outbound: All (for Tailscale mesh)

No rules for application ports (8080, 5432)—Tailscale provides the connectivity.

### Why This Works

Traditional firewall rules would require:

- Opening port 5432 between specific IP ranges
- Managing security groups per region
- Updating rules when topology changes

With Tailscale:

- Single UDP port for all connectivity
- Identity-based rather than IP-based rules
- Automatic updates as nodes join/leave

## Troubleshooting

### Common Issues

- **Nodes not connecting**: Check if enrolled in Tailscale network
- **DNS not resolving**: Verify MagicDNS enabled
- **High latency**: Check if direct connection established (relayed traffic is slower)
- **Certificate errors**: Node may need re-authentication

### Diagnostic Commands

```bash
# Check Tailscale status
tailscale status

# Test connectivity to another node
tailscale ping backend-us

# View network map
tailscale netcheck

# Debug connection issues
tailscale bug-report
```

## Future Enhancements

- **IPv6 support**: Native IPv6 addressing within mesh
- **Subnet routers**: Extend Tailscale to legacy infrastructure
- **Access request workflows**: Temporary access grants
- **Audit logging**: Comprehensive connection logs
- **Network policies**: Kubernetes-style micro-segmentation
