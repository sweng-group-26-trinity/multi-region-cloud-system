# Deployment Process

> How we deploy DineHub across multiple regions with confidence

## Philosophy

Our deployment process follows the principle of **immutable infrastructure**: once deployed, servers are never modified in place. Instead, we build new systems from scratch and atomically switch traffic to them. This eliminates "configuration drift" and makes deployments predictable and reversible.

## The NixOS Approach

Traditional deployment processes often involve:

- SSHing into servers to run commands
- Patching files in place
- Hoping the application restarts correctly
- Manual rollback procedures when things go wrong

NixOS eliminates these risks through **declarative configuration**:

1. **Describe the desired state** in Nix expressions
2. **Build the system** locally or in CI
3. **Activate atomically** — either the new system works completely, or the old system remains
4. **Rollback automatically** if health checks fail

## Deployment Pipeline

### Stage 1: Build

Every deployment starts with building the new system configuration:

```
Developer Machine          CI/CD (Garnix)              Binary Cache
     │                           │                           │
     │── nix flake check ───────▶│                           │
     │                           │── build packages ────────▶│
     │                           │                           │── cache builds
     │                           │◀── success/failure ───────│
     │◀── build results ─────────│                           │
```

The build process:

- Compiles the backend to a GraalVM native image
- Bundles the frontend with Bun
- Runs all tests (unit, integration, property-based)
- **Validates OpenAPI spec** with Schemathesis property-based testing
- Validates NixOS configurations
- Caches successful builds for reuse

### OpenAPI Validation

As part of the build pipeline, we validate that our implementation matches the OpenAPI specification:

- **Specification-first**: The OpenAPI spec in `specs/openapi.yaml` defines the API contract
- **Auto-generation**: Spring Boot controllers generate OpenAPI documentation from code
- **Schemathesis testing**: Property-based testing verifies implementation matches spec
- **Linting**: Redocly validates the spec for correctness and consistency

This ensures API consumers can rely on the documented behavior.

### Stage 2: Test

Before deploying to production, we validate in isolated environments:

- **VM Tests**: Full system integration tests in NixOS VMs
- **Staging Environment**: Identical to production but with synthetic data
- **Health Checks**: Automated probes verify endpoints respond correctly

### Stage 3: Deploy

Deployments use **deploy-rs**, which provides atomic activation:

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Build system closure locally                            │
│     └─ All packages + dependencies computed                 │
│                                                             │
│  2. Upload to target node                                   │
│     └─ Nix copy-closure sends only missing packages         │
│                                                             │
│  3. Activate new configuration                              │
│     └─ System switches to new generation                    │
│                                                             │
│  4. Run activation hook                                     │
│     └─ Services restart with new configuration              │
│                                                             │
│  5. Verify health checks                                    │
│     └─ Confirm services respond correctly                   │
│                                                             │
│  6. On failure: automatic rollback                          │
│     └─ Previous generation restored                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Rolling Deployments

When deploying to multiple backend servers, we use a **rolling deployment** strategy:

1. Take one server out of the load balancer
2. Deploy new version to that server
3. Verify health checks pass
4. Return server to load balancer
5. Repeat for remaining servers

This ensures:

- **Zero downtime**: At least some servers always available
- **Gradual rollout**: Issues caught before affecting all traffic
- **Easy rollback**: Can revert individual servers if problems arise

## Configuration Management

### Secrets Handling

Sensitive configuration (database passwords, JWT keys) is managed separately from code:

- **Encrypted at rest**: Secrets stored encrypted in the repository using agenix
- **Decrypted at deploy**: Only the target machine can decrypt its secrets
- **Never in Nix store**: Unencrypted secrets never touch the world-readable Nix store
- **Access controlled**: Each secret specifies which users/services can read it

### Environment-Specific Configuration

Different environments (dev, staging, production) have different needs:

- **Development**: Local database, debug logging, hot reloading
- **Staging**: Production-like but isolated, synthetic data
- **Production**: Multiple regions, real data, optimized settings

These differences are captured in Nix expressions rather than environment variables scattered across systems.

## Disaster Recovery

### Backup Strategy

The distributed database provides natural redundancy:

- **Citus workers**: Store shards across multiple nodes
- **Cross-region replicas**: Critical data replicated to other regions
- **Point-in-time recovery**: PostgreSQL WAL archiving enables restoration to any moment

### Recovery Procedures

If a region fails completely:

1. **Traffic rerouting**: DNS or ingress configuration points to healthy regions
2. **Database promotion**: Replica in healthy region promoted to primary
3. **Re-provisioning**: Failed region rebuilt from Nix configuration
4. **Data reconciliation**: When failed region recovers, data synchronized

## Monitoring Deployments

### Deployment Metrics

We track deployment health through:

- **Success rate**: Percentage of deployments that activate without rollback
- **Time to deploy**: Duration from build start to activation complete
- **Error rates**: API errors, 5xx responses, failed health checks
- **Resource usage**: Memory, CPU, disk during and after deployment

### Observability Integration

Deployments integrate with the monitoring stack:

- **Prometheus**: Metrics scraped before/after deployment
- **Loki**: Log aggregation to detect errors
- **Grafana**: Dashboards showing deployment impact
- **Alerts**: Automatic notifications for failed deployments

## Continuous Deployment

### Automated Pipeline

Changes flow automatically from commit to production:

```
Git Commit → CI Build → Tests Pass → Staging Deploy → Prod Deploy
                │           │              │             │
                ▼           ▼              ▼             ▼
            Build      Integration    Smoke Tests   Rolling
            Packages   Tests          Validation    Rollout
```

### Safety Mechanisms

Automation includes safety checks:

- **Required checks**: Build must pass before deployment
- **Manual gates**: Production deployments may require approval
- **Canary analysis**: New version serves small percentage of traffic first
- **Automatic rollback**: Failed health checks trigger immediate rollback

## Development vs Production

### Key Differences

| Aspect                 | Development      | Production                |
| ---------------------- | ---------------- | ------------------------- |
| **Process management** | process-compose  | systemd                   |
| **Database**           | Local PostgreSQL | Citus distributed cluster |
| **Networking**         | localhost        | Tailscale mesh            |
| **Secrets**            | Plain text files | agenix encrypted          |
| **Updates**            | Hot reloading    | Atomic deployment         |
| **Monitoring**         | Console logs     | Prometheus/Grafana        |

Despite these differences, the **same Nix expressions** describe both environments. The differences are parameterized rather than being separate code paths.

## Troubleshooting Deployments

### Common Issues

- **Build failures**: Missing dependencies, compilation errors
- **Health check failures**: Services start but don't respond correctly
- **Configuration errors**: Secrets or environment variables missing
- **Network issues**: Tailscale connectivity problems between nodes

### Debug Commands

When deployments fail:

- Check service status: `systemctl status backend`
- View logs: `journalctl -u backend -f`
- Test health endpoints: `curl localhost:8080/actuator/health`
- Verify Tailscale: `tailscale status`
- Rollback if needed: `nixos-rebuild switch --rollback`

## Future Improvements

- **Blue/Green deployments**: Instant cutover with ability to rollback
- **Feature flags**: Deploy code disabled, enable gradually
- **Chaos engineering**: Intentionally break things to test resilience
- **Automated capacity scaling**: Add/remove nodes based on load
