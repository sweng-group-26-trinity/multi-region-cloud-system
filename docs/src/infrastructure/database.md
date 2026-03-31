# Database Architecture

> Distributed data storage with Citus and PostgreSQL

## Philosophy

Traditional monolithic databases eventually hit scalability limits—either they run out of storage or can't handle concurrent query volume. Scaling vertically (bigger servers) has practical limits and creates single points of failure.

DineHub adopts **horizontal database scaling**: distribute data across multiple servers, with each server handling a subset of the data. This provides both capacity and performance scaling.

## Why Citus?

### The Problem with Single Databases

As data grows, a single PostgreSQL server faces challenges:

- **Storage limits**: Hardware can only hold so much data
- **Query performance**: Large tables become slow to scan
- **Concurrent load**: Limited CPU/memory for parallel queries
- **Availability**: Single server failure means downtime

### Citus Solution

Citus extends PostgreSQL to distribute tables across multiple servers:

- **Horizontal scaling**: Add servers as data grows
- **Query parallelization**: Complex queries execute across workers
- **High availability**: Replicas provide fault tolerance
- **PostgreSQL compatible**: Standard SQL, tools, and drivers work

## Architecture

### The Coordinator

The **coordinator** is the entry point for all database queries:

- **Receives queries**: Applications connect here like normal PostgreSQL
- **Plans execution**: Determines which workers hold relevant data
- **Routes requests**: Sends sub-queries to appropriate workers
- **Aggregates results**: Combines worker responses into final result

From the application perspective, the coordinator looks like a standard PostgreSQL server.

### The Workers

**Workers** store actual data and execute queries:

- **Hold shards**: Each worker contains portions of distributed tables
- **Process queries**: Execute SQL against local data
- **Return results**: Send partial results back to coordinator

Workers are standard PostgreSQL servers with Citus extension installed.

### Data Distribution

```
                    ┌─────────────────────┐
                    │     Coordinator     │
                    │  (Query planner &   │
                    │   result aggregator)│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │    Worker 1     │ │    Worker 2     │ │    Worker 3     │
    │                 │ │                 │ │                 │
    │  Restaurants    │ │  Restaurants    │ │  Restaurants    │
    │  ID: 1-1000     │ │  ID: 1001-2000  │ │  ID: 2001-3000  │
    │                 │ │                 │ │                 │
    │  Orders         │ │  Orders         │ │  Orders         │
    │  (same shard)   │ │  (same shard)   │ │  (same shard)   │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Sharding Strategy

### Distribution Column

Tables are distributed by a **distribution column**:

- **Restaurants**: Distributed by `restaurant_id`
- **Orders**: Also distributed by `restaurant_id` (co-located with restaurant)
- **Users**: Distributed by `user_id`

This "co-location" means a restaurant's orders reside on the same worker as the restaurant itself, making join queries efficient.

### Shard Assignment

Citus uses consistent hashing to assign shards to workers:

- Hash of distribution column determines shard
- Each shard assigned to one primary worker
- Replicas may exist on other workers for availability

### When to Distribute

Not all tables should be distributed:

**Distribute (large tables):**

- Restaurants (millions of rows expected)
- Orders (billions of rows expected)
- Order items (billions of rows expected)

**Reference tables (replicated to all workers):**

- Cuisine types (small, lookup data)
- Configuration (rarely changes)

Reference tables are replicated to every worker, making joins fast but updates expensive.

## Query Execution

### Simple Queries

Single-row lookups by distribution column are fast:

```sql
SELECT * FROM orders WHERE restaurant_id = 42;
```

Coordinator hashes `42`, determines which worker holds the shard, and routes directly to that worker.

### Complex Queries

Aggregations and joins may involve multiple workers:

```sql
SELECT region, COUNT(*) FROM restaurants GROUP BY region;
```

Execution:

1. Coordinator sends query to all workers
2. Each worker counts local restaurants
3. Workers return partial counts
4. Coordinator sums results and returns final count

This parallel execution provides near-linear speedup with added workers.

### Cross-Shard Joins

Joins between distributed tables require care:

**Efficient (co-located join):**

```sql
SELECT * FROM restaurants r
JOIN orders o ON r.id = o.restaurant_id
WHERE r.id = 42;
```

Both tables share distribution column, so data is on same worker.

**Less efficient (repartition join):**

```sql
SELECT * FROM orders o
JOIN users u ON o.customer_id = u.id;
```

Different distribution columns require data movement between workers.

## High Availability

### Replication Strategy

Each shard has replicas on different workers:

- **Primary**: Handles reads and writes
- **Standby**: Receives streaming replication, takes over if primary fails
- **Cross-region**: Replicas in other regions for disaster recovery

### Failover Process

If a worker fails:

1. **Detection**: Health checks notice unresponsive worker
2. **Promotion**: Standby replica promoted to primary
3. **Reconfiguration**: Coordinator routes queries to new primary
4. **Recovery**: Failed worker repaired, rejoins as replica

This process is automatic—applications don't need to change connection strings.

### Split-Brain Prevention

Citus uses consensus mechanisms to prevent split-brain scenarios:

- Only one primary per shard at a time
- Writes blocked until consensus achieved
- Clients may see brief unavailability during failover

## Performance Optimization

### Query Planning

The coordinator analyzes queries to optimize distribution:

- **Pushdown**: Move filters and aggregations to workers
- **Pruning**: Skip workers that can't have relevant data
- **Parallelization**: Split work across multiple workers

### Index Strategy

Index recommendations change with distribution:

- **Distribution column**: Always indexed (used for routing)
- **Join columns**: Index if frequently joined
- **Filter columns**: Index if selective filters common
- **Coordinator**: May need indexes for final aggregation

### Monitoring

Key metrics for distributed databases:

- **Shard imbalance**: Are workers evenly loaded?
- **Query latency**: Coordinator vs worker time breakdown
- **Replication lag**: Standby replicas behind primary?
- **Connection pooling**: Managing thousands of connections

## Operational Considerations

### Adding Workers

Scale out by adding workers:

1. Provision new worker nodes
2. Run `citus_add_node()` to add to cluster
3. Existing data doesn't automatically redistribute
4. New data uses new workers
5. Optional: Rebalance shards for even distribution

### Schema Changes

Schema modifications propagate to all workers:

```sql
-- This runs on coordinator and all workers
ALTER TABLE restaurants ADD COLUMN rating FLOAT;
```

Citus handles distribution automatically—DDL just works.

### Backup and Recovery

Backup strategies for distributed data:

- **Logical backups**: pg_dump on coordinator captures distributed schema
- **Per-worker backups**: Physical backups of each worker's data
- **Point-in-time recovery**: WAL archiving for granular recovery
- **Cross-region replicas**: Live replicas for disaster recovery

## Trade-offs

### Benefits

- **Scalability**: Add capacity by adding servers
- **Performance**: Parallel query execution
- **Availability**: Replicas provide fault tolerance
- **PostgreSQL compatible**: Familiar SQL and tooling

### Complexity

- **Query planning**: Must consider distribution in query design
- **Operational overhead**: More servers to monitor and maintain
- **Transaction limitations**: Cross-shard transactions have overhead
- **Migration**: Existing applications may need modification

### When Not to Use

Citus may be overkill for:

- Small datasets (< 100GB)
- Simple workloads (mostly single-row lookups)
- Strong consistency requirements across shards (use single PostgreSQL)

DineHub's expected scale (thousands of restaurants, millions of orders) justifies the complexity.

## Future Enhancements

- **Citus MX**: Multi-coordinator for higher availability
- **Columnar storage**: Analytics queries on compressed columnar data
- **Automatic rebalancing**: Dynamic shard redistribution
- **Read replicas**: Offload read traffic to standbys
- **Global indexes**: Cross-shard indexes for unique constraints
