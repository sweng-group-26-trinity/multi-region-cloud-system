# Testing Strategy

The project uses a layered testing approach:

- **Unit Tests** — JUnit 5 for backend, Bun test runner for frontend
- **Integration Tests** — Spring Boot Test with Testcontainers
- **Property-Based Tests** — jqwik for generative testing, Schemathesis for API contract testing
- **VM Tests** — Full system integration in NixOS virtual machines
