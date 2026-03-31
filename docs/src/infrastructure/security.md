# Security Architecture

> Defense in depth for a multi-region cloud application

## Philosophy

Security is not a feature you add at the end—it's a property that emerges from careful design at every layer. DineHub follows **defense in depth**: multiple independent security mechanisms, each sufficient on its own, so that if one fails, others still protect the system.

We assume attackers will eventually breach some defenses. The goal is to make that breach useless—to limit what they can access and detect the intrusion quickly.

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 7: Application Security                                │
│ • Authentication (JWT)                                       │
│ • Authorization (RBAC)                                       │
│ • Input validation                                           │
│ • Output encoding                                            │
├──────────────────────────────────────────────────────────────┤
│ Layer 6: API Security                                        │
│ • HTTPS/TLS                                                  │
│ • Rate limiting                                              │
│ • CORS policies                                              │
│ • API versioning                                             │
├──────────────────────────────────────────────────────────────┤
│ Layer 5: Network Security                                    │
│ • Zero-trust mesh (Tailscale)                                │
│ • Firewall rules                                             │
│ • Private IPs only                                           │
│ • No lateral movement                                        │
├──────────────────────────────────────────────────────────────┤
│ Layer 4: Host Security                                       │
│ • Immutable infrastructure                                   │
│ • Minimal attack surface                                     │
│ • Automatic updates                                          │
│ • Read-only filesystems                                      │
├──────────────────────────────────────────────────────────────┤
│ Layer 3: Secrets Management                                  │
│ • Encryption at rest                                         │
│ • No secrets in code                                         │
│ • Rotation policies                                          │
│ • Audit logging                                              │
├──────────────────────────────────────────────────────────────┤
│ Layer 2: Access Control                                      │
│ • Least privilege                                            │
│ • Multi-factor authentication                                │
│ • Role-based permissions                                     │
│ • Session management                                         │
├──────────────────────────────────────────────────────────────┤
│ Layer 1: Physical Security                                   │
│ • Cloud provider guarantees                                  │
│ • Multi-region distribution                                  │
│ • Encrypted storage                                          │
└ ─────────────────────────────────────────────────────────────┘
```

## Application Security

### Authentication

We use **JWT (JSON Web Tokens)** for authentication:

- **Stateless**: No server-side session storage
- **Self-contained**: Token carries user identity
- **Expirable**: Short-lived tokens (24 hours)
- **Revocable**: Token blacklist for logout

JWTs are signed with a server-side secret. Attackers can't forge tokens without the secret, and expired tokens are automatically rejected.

### Authorization

**Role-Based Access Control (RBAC)** defines what users can do:

- **USER**: Browse restaurants, place orders, manage own orders
- **RESTAURANT_OWNER**: All USER permissions + manage owned restaurants + view restaurant orders
- **ADMIN**: Full system access

Permissions are enforced at the API endpoint level. Even if a user knows an endpoint exists, they can't access resources they don't own.

### Input Validation

All user input is treated as untrusted:

- **Type validation**: DTOs with strict typing
- **Range checks**: Numeric values within expected ranges
- **Length limits**: Prevent buffer overflow attempts
- **Format validation**: Emails, UUIDs match expected patterns
- **Sanitization**: Remove or escape dangerous characters

Validation happens at the API boundary, before data reaches business logic.

## Network Security

### Zero-Trust Architecture

We don't trust the network—even our internal network:

- **Encryption everywhere**: All traffic encrypted via WireGuard (Tailscale)
- **Mutual authentication**: Both sides verify each other's identity
- **No implicit trust**: Every connection requires explicit authorization
- **Micro-segmentation**: Services can only talk to required dependencies

### Network Segmentation

Infrastructure divided into security zones:

**Public zone** (ingress only):

- Exposed to internet
- Minimal attack surface (nginx only)
- All traffic forwarded to private zone

**Private zone** (application servers):

- No public IPs
- Access only via Tailscale
- Can only initiate connections to data zone

**Data zone** (databases):

- No external access except from application servers
- Additional PostgreSQL authentication
- Encrypted storage volumes

This segmentation means compromising one zone doesn't automatically grant access to others.

### Firewall Strategy

Traditional firewalls rely on IP whitelisting. We use **identity-based access control**:

- **Single port**: Tailscale uses one UDP port for all connectivity
- **No application ports exposed**: Database and application ports not visible to network
- **Cryptographic identity**: Nodes authenticated by certificates, not IP addresses

## Secrets Management

### Secret Lifecycle

Secrets follow a strict lifecycle:

1. **Generation**: Cryptographically secure random generation
2. **Distribution**: Encrypted transmission to target systems
3. **Storage**: Encrypted at rest, never in version control
4. **Usage**: Runtime injection, not baked into images
5. **Rotation**: Regular rotation with overlap period
6. **Revocation**: Immediate invalidation on compromise

### Storage

Secrets are stored encrypted using **agenix**:

- **Encryption**: Age encryption with recipient public keys
- **Repository**: Encrypted files stored in Git
- **Decryption**: Only target machines can decrypt (private keys on machines)
- **Access**: Each secret specifies authorized users/services

This means:

- Developers can see encrypted blobs but not plaintext
- CI/CD can deploy encrypted secrets but not read them
- Production machines decrypt their own secrets at runtime
- Compromised Git repo doesn't expose secrets

### Secret Types

Different secrets have different handling:

- **Database credentials**: Rotated monthly, stored per-environment
- **JWT signing keys**: Rotated quarterly, symmetric for performance
- **API keys**: Rotated on employee departure, tracked usage
- **TLS certificates**: Auto-renewed via Let's Encrypt

## Host Security

### Immutable Infrastructure

Servers are immutable—never modified after deployment:

- **No SSH access**: Configuration via Nix, not manual commands
- **Read-only root**: Root filesystem mounted read-only
- **Ephemeral storage**: Local state treated as disposable
- **Reproducible builds**: Same Nix expression always produces same system

If a server is compromised, we don't try to clean it—we replace it.

### Attack Surface Reduction

Minimal software installed on each server:

- **Single purpose**: Each server runs one service
- **No shells**: No bash, no sshd (except for debugging)
- **No compilers**: No gcc, no development tools
- **Minimal services**: Only required systemd units

### Automatic Updates

Security patches apply automatically:

- **NixOS updates**: System packages updated via Nix
- **Rolling updates**: New generation activated atomically
- **Rollback**: Automatic fallback if updates fail
- **Rebootless**: Most updates don't require restart

## Secrets in Code

### What Never Goes in Code

These must never be committed to version control:

- Database passwords
- API keys (Stripe, AWS, etc.)
- JWT signing secrets
- TLS private keys
- Encryption keys
- Credentials for external services

### What Can Go in Code

These are safe to commit:

- Public API endpoints
- Non-sensitive configuration (timeouts, limits)
- Default values that get overridden
- Encryption of secrets (public keys)

### Detection

Pre-commit hooks and CI checks scan for:

- High-entropy strings (potential secrets)
- Known secret patterns (AWS keys, JWTs)
- Hardcoded passwords
- Private keys

## Incident Response

### Detection

Security events generate logs:

- **Authentication failures**: Failed login attempts
- **Authorization failures**: Access denied errors
- **Anomalous patterns**: Unusual traffic, query patterns
- **System calls**: Auditd logs for privileged operations

Logs aggregate in Loki for analysis and alerting.

### Response Playbook

If compromise suspected:

1. **Isolate**: Remove compromised nodes from load balancer
2. **Preserve**: Capture logs and memory dumps before termination
3. **Analyze**: Determine scope of compromise
4. **Rotate**: Revoke and regenerate all potentially exposed secrets
5. **Reimage**: Replace compromised servers with fresh instances
6. **Monitor**: Enhanced monitoring for recurrence

### Recovery

Recovery is fast because infrastructure is code:

- **Reprovision**: New servers from Nix configuration in minutes
- **Data restore**: From encrypted backups
- **Secret rotation**: Automated via deploy pipeline
- **Verification**: Health checks confirm clean state

## Compliance Considerations

While not formally certified, DineHub design supports:

### Data Protection

- **Encryption at rest**: Database volumes encrypted
- **Encryption in transit**: TLS 1.3 for all external traffic
- **Access logging**: Audit trails for data access
- **Right to deletion**: Data can be purged per request

### Security Standards

Architecture aligns with:

- **OWASP Top 10**: Addressed through input validation, authentication, etc.
- **CIS Benchmarks**: NixOS configuration follows hardening guidelines
- **NIST Cybersecurity Framework**: Identify, protect, detect, respond, recover

## Threat Model

### Assumed Threats

We design against these threats:

- **External attackers**: Attempting to breach perimeter
- **Insider threats**: Malicious or compromised employees
- **Supply chain**: Compromised dependencies or build tools
- **Cloud provider**: Curious cloud administrators
- **Physical theft**: Stolen laptops with production access

### Not Addressed

Out of scope for this project:

- **Nation-state actors**: Advanced persistent threats with unlimited resources
- **Social engineering**: Phishing, pretexting (user training issue)
- **Denial of wallet**: Resource exhaustion attacks (cloud billing limits)

## Security Checklist

For new features, verify:

- [ ] Input validation on all user-supplied data
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks enforce ownership/roles
- [ ] No secrets in code (use agenix)
- [ ] Database queries parameterized (no SQL injection)
- [ ] Output encoded (XSS prevention)
- [ ] Rate limiting prevents abuse
- [ ] Logging for security-relevant events
- [ ] Tests include security scenarios

## Future Enhancements

- **Web Application Firewall**: Rule-based request filtering
- **Bug bounty program**: External security researchers
- **Penetration testing**: Annual third-party assessment
- **Security headers**: CSP, HSTS, X-Frame-Options
- **Certificate pinning**: Prevent MITM attacks
- **Behavioral analytics**: ML-based anomaly detection
