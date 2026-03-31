# Frontend Architecture

> Design philosophy and architectural patterns for the user interface layer

## Philosophy

The frontend follows a **modern React SPA architecture** designed for developer productivity, type safety, and runtime performance. We prioritize declarative UI patterns, compile-time optimizations, and minimal runtime overhead.

## Technology Choices

### Why Bun?

We chose **Bun** over Node.js for three primary reasons:

1. **Unified toolchain**: Bun replaces the npm/webpack/babel toolchain with a single, fast executable. This reduces configuration complexity and ensures all tools (bundler, test runner, package manager) work together seamlessly.

2. **Performance**: Bun's bundler is significantly faster than webpack or Vite for our use case, reducing development feedback loops.

3. **Built-in TypeScript**: No additional compilation step required—TypeScript is first-class.

### Why React 19?

React 19 brings several architectural improvements:

- **Concurrent rendering by default**: Better perceived performance through prioritized updates
- **Automatic batching**: Fewer re-renders without manual optimization
- **Server components**: Foundation for future server-side rendering if needed
- **Actions**: Simplified form handling and mutations

### Why Tailwind CSS v4?

Tailwind v4 represents a significant architectural shift:

- **PostCSS-free**: No build-time CSS processing pipeline, reducing build complexity
- **CSS-first configuration**: Theme configuration lives in CSS rather than JavaScript
- **Zero-runtime**: All styles are generated at build time
- **Predictable bundle size**: Only used utilities are included

## Application Structure

The frontend organizes code by **responsibility** rather than by file type:

### API Layer

The API layer follows a **repository pattern** abstraction. Rather than making raw HTTP calls throughout components, we provide domain-specific API objects that encapsulate:

- Endpoint paths and HTTP methods
- Request/response type definitions
- Error handling conventions
- Authentication header injection

This pattern means components work with semantic methods like `restaurantsApi.create(data)` rather than raw `fetch()` calls, making the codebase more maintainable and easier to test.

### State Management

We use a **hybrid state approach**:

- **Server state** (data from API): Managed by TanStack Query, which handles caching, background refetching, and optimistic updates automatically
- **Client state** (UI-only state): Managed by React's built-in `useState` and Context API
- **Authentication state**: Global context provider that persists to `localStorage`

This separation prevents the common anti-pattern of over-fetching or storing server data in global state where it can become stale.

### Component Architecture

Components are organized into three tiers:

1. **Page components**: Route-level components that compose domain-specific UI
2. **Feature components**: Reusable components specific to a domain (e.g., RestaurantCard)
3. **UI primitives**: Generic, unstyled components from shadcn/ui (Button, Card, Input)

This three-tier architecture ensures separation of concerns: pages handle routing and data fetching, feature components handle domain logic, and primitives handle accessibility and styling.

## Routing Architecture

The routing layer implements **route guards** for authentication:

- **Public routes**: Accessible to all users (landing page, login, signup)
- **Protected routes**: Require valid JWT token (dashboard, order placement)
- **Guest-only routes**: Redirect authenticated users away (login page when already logged in)

Route guards are implemented as wrapper components that check authentication state and redirect accordingly. This keeps authentication logic centralized and reusable.

## Authentication Flow

The authentication system uses **JWT tokens stored in localStorage** with the following flow:

1. User submits credentials via login form
2. Backend validates and returns JWT + user metadata
3. Token is stored in `localStorage` and Context state
4. Subsequent API calls include token in Authorization header
5. Protected routes check for token presence before rendering

The token has a 24-hour expiration. On app load, the Context provider checks for an existing token and restores the authentication state, providing a seamless user experience.

## Build System Design

The build system is designed around **Bun's native bundler** with a custom wrapper script that:

- Discovers entry points automatically (HTML files in `src/`)
- Applies Tailwind CSS transformation
- Generates linked sourcemaps for debugging
- Copies static assets to the output directory
- Reports bundle sizes for optimization visibility

The key architectural decision here is **convention over configuration**: the build script automatically finds entry points rather than requiring a configuration file, making the build process easier to understand and modify.

## Styling Philosophy

Our styling approach follows **utility-first CSS** with semantic theming:

### Utility-First

Instead of writing custom CSS classes, we compose utility classes directly in the JSX. This approach:

- Eliminates the need to name CSS classes
- Makes styling changes explicit in version control
- Prevents unused CSS from accumulating
- Enables rapid prototyping

### Dark Mode

Dark mode is implemented via CSS custom properties and Tailwind's `dark:` variants. The theme toggle adds/removes a `dark` class on the document root, which triggers CSS custom property updates throughout the component tree.

### Component Styling

UI primitives (from shadcn/ui) are built on **Radix UI** for accessibility and **Tailwind** for styling. They accept a `className` prop for composition, allowing parent components to override or extend styles without modifying the primitive.

## Data Fetching Patterns

Data fetching follows a **stale-while-revalidate** pattern:

1. Component mounts and requests data
2. TanStack Query checks the cache first
3. If cached data exists (even if stale), it's shown immediately
4. Background request fetches fresh data
5. UI updates with fresh data when available

This pattern provides instant UI feedback while ensuring data freshness, eliminating loading spinners for cached data.

## Animation Strategy

Animations are implemented with **Framer Motion** for:

- Page transitions: Smooth fade/slide between routes
- Micro-interactions: Button hover states, loading indicators
- Layout animations: List reordering, expanding panels

We avoid CSS animations for complex sequences and JavaScript animations for simple hover states—Framer Motion provides the right abstraction for component-level animations while deferring to CSS for simple transitions.

## Error Handling

Error handling follows a **progressive enhancement** model:

1. **API layer**: Catches HTTP errors and throws typed Error objects
2. **TanStack Query**: Catches errors and provides error state to components
3. **Components**: Display error UI or retry controls
4. **Global boundary**: Unhandled errors caught by error boundary showing fallback UI

This layered approach ensures errors are handled at the appropriate level of abstraction.

## Development Experience

The frontend architecture prioritizes developer experience through:

- **Hot reloading**: Bun's dev server provides instant updates
- **Type safety**: Full TypeScript coverage with strict mode
- **IDE integration**: Tailwind IntelliSense provides autocomplete for utility classes
- **Consistent formatting**: treefmt enforces formatting across the codebase
