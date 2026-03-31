# Backend Architecture

> Design philosophy and architectural patterns for the service layer

## Philosophy

The backend follows **domain-driven design** principles with a focus on type safety, explicit contracts, and defensive programming. We prioritize compile-time safety over runtime flexibility, using Java's type system to prevent errors before they reach production.

## Technology Choices

### Why Spring Boot?

Spring Boot provides an opinionated framework that balances productivity with flexibility:

1. **Ecosystem maturity**: Comprehensive libraries for security, data access, and testing
2. **Production-ready**: Built-in metrics, health checks, and configuration management
3. **Community standards**: Wide adoption means extensive documentation and tooling

### Why GraalVM Native Image?

We compile the backend to a **native executable** rather than running on the JVM:

- **Startup time**: Sub-second startup vs. JVM warmup time, critical for auto-scaling scenarios
- **Memory efficiency**: Smaller memory footprint enables running on smaller instances
- **Self-contained**: Single executable file with no runtime dependencies
- **Container-friendly**: Smaller Docker images and faster cold starts

The trade-off is longer build times and some reflection limitations, which we mitigate with explicit configuration.

### Why PostgreSQL with Citus?

Our database choice reflects the multi-region requirements:

- **PostgreSQL**: Proven reliability, ACID compliance, and extensive feature set
- **Citus extension**: Enables horizontal scaling by distributing data across multiple nodes
- **Compatibility**: Standard PostgreSQL protocol works with all existing tools

## Domain Architecture

The backend organizes code around **business domains** rather than technical layers:

### Domain Structure

Each domain (User, Restaurant, Order) contains:

- **Entity**: JPA-mapped data model
- **Repository**: Data access abstraction
- **Controller**: HTTP request handling
- **DTOs**: Data transfer objects for API contracts

This structure keeps related code together, making it easier to understand domain boundaries and modify functionality.

### Entity Relationships

The domain model centers around three main entities:

1. **User**: Authentication and identity
2. **Restaurant**: Business listings with ownership
3. **Order**: Transactions linking users to restaurants

The relationships are:

- User owns Restaurants (one-to-many)
- User places Orders (one-to-many)
- Restaurant receives Orders (one-to-many)
- Order contains OrderItems (embedded collection)

### Value Objects vs Entities

We distinguish between **entities** (have identity and lifecycle) and **value objects** (defined by attributes):

- **Entities**: User, Restaurant, Order (have UUID identity)
- **Value Objects**: OrderItem (no identity, belongs to Order)

This distinction guides persistence decisions—entities get their own tables, value objects are embedded.

## Security Architecture

### Authentication Model

The system uses **JWT (JSON Web Tokens)** for stateless authentication:

- Tokens are signed with a server-side secret
- Tokens contain user identity and expiration
- Clients send tokens in Authorization header
- Server validates signature without database lookup

This stateless approach scales horizontally without session affinity requirements.

### Authorization Patterns

Authorization follows **role-based access control (RBAC)**:

- **ROLE_USER**: Standard customer permissions
- **ROLE_RESTAURANT_OWNER**: Can manage owned restaurants and view their orders
- **ROLE_ADMIN**: Full system access

Roles are checked at the controller method level using Spring Security's method security annotations.

### Security Boundaries

The security model defines clear boundaries:

- **Public endpoints**: No authentication required (login, registration, restaurant listing)
- **Authenticated endpoints**: Valid JWT required (order placement)
- **Ownership endpoints**: JWT + resource ownership check (order modification)
- **Admin endpoints**: JWT + ROLE_ADMIN required (system management)

## API Design Principles

### RESTful Conventions

The API follows REST conventions with some pragmatic exceptions:

- **Resources** map to domain entities (/restaurants, /orders)
- **HTTP verbs** indicate action (GET, POST, PUT, DELETE)
- **Status codes** convey outcome (200, 201, 400, 401, 403, 404)
- **Plural nouns** for collections (/restaurants not /restaurant)

### Request/Response Contracts

API contracts are defined through DTOs (Data Transfer Objects):

- **Input DTOs**: Define valid request shape and validation rules
- **Output DTOs**: Control what data is exposed
- **Validation annotations**: Jakarta Bean Validation for input sanitization

This DTO pattern decouples the internal domain model from the public API, allowing independent evolution.

### Error Handling

Error responses follow a consistent structure:

- HTTP status code indicates error category
- Response body contains human-readable message
- Validation errors include field-level details

The GlobalExceptionHandler translates exceptions to appropriate HTTP responses, ensuring clients receive consistent error formats.

## Data Access Patterns

### Repository Abstraction

Data access follows the **Repository pattern** through Spring Data JPA:

- Interfaces extend JpaRepository for CRUD operations
- Method names derive queries automatically (findByIsActiveTrue)
- Custom queries use @Query annotation for complex SQL
- Pagination returns Spring's Page abstraction

This abstraction means controllers work with domain objects rather than SQL, making the code more testable and database-agnostic.

### Transaction Boundaries

Transactions are managed at the service layer:

- Spring's @Transactional annotation marks business operations
- Read operations use read-only transactions for optimization
- Write operations ensure atomicity across multiple database calls

### Validation Strategy

Input validation occurs at multiple layers:

1. **DTO annotations**: Jakarta Bean Validation (@NotNull, @Email, etc.)
2. **Controller**: @Valid annotation triggers validation
3. **Service layer**: Business rule validation
4. **Database constraints**: Final integrity enforcement

This defense-in-depth approach catches errors as early as possible.

## Order Lifecycle Design

### State Machine

Orders follow a defined state machine with six states:

- **PENDING**: Initial state when order is created
- **CONFIRMED**: Restaurant has acknowledged the order
- **PREPARING**: Food is being prepared
- **READY**: Order is ready for pickup/delivery
- **DELIVERED**: Order has been delivered to customer
- **CANCELLED**: Order was cancelled

### State Transition Rules

Not all transitions are valid:

- PENDING can transition to CONFIRMED, PREPARING, or CANCELLED
- CONFIRMED can transition to PREPARING
- PREPARING can transition to READY
- READY can transition to DELIVERED
- CANCELLED is terminal

These rules are enforced in the service layer, preventing invalid state changes.

### Permission by State

Different states have different permissions:

- **PENDING orders**: Customer can cancel or modify
- **Non-PENDING orders**: Only restaurant owner or admin can modify
- **Status changes**: Only restaurant side can advance status

This reflects real-world business rules where customers have limited control after order confirmation.

## Testing Strategy

### Test Pyramid

Testing follows the pyramid model:

- **Unit tests**: Fast, isolated, test individual functions
- **Integration tests**: Test database interactions and API contracts
- **End-to-end tests**: Full request/response cycles (property-based with jqwik)

### Test Slices

Spring Boot's test slices allow targeted testing:

- **@WebMvcTest**: Test controllers in isolation
- **@DataJpaTest**: Test repositories with in-memory database
- **@SpringBootTest**: Full integration tests

### Test Data

Tests use dedicated test data rather than production data:

- Factory methods create valid entities
- Builders allow flexible test data construction
- Each test starts with clean database state

## Documentation Requirements

### Javadoc Standards

All public APIs require Javadoc:

- Class-level description explains purpose
- Method-level documentation describes behavior
- Parameter and return value documented
- Exceptions and preconditions noted

The build enforces this via the `Xdoclint:missing` flag, failing builds with missing documentation.

### OpenAPI Generation

The API documentation is generated from:

- SpringDoc annotations on controllers
- DTO schemas from class definitions
- Security scheme definitions

This ensures API docs stay synchronized with implementation.

## Deployment Architecture

### Native Binary

The application compiles to a native binary that:

- Contains the Spring Boot application + embedded Tomcat
- Includes all dependencies statically linked
- Runs without JVM installation
- Starts in milliseconds

### Service Configuration

The binary runs as a systemd service:

- Automatic restart on failure
- Environment variables for configuration
- Health check endpoint for load balancers
- Graceful shutdown handling

### Database Migrations

Schema changes are managed through:

- Flyway migrations in version control
- Automatic execution on startup
- Rollback scripts for recovery
- Compatibility with distributed Citus schema
