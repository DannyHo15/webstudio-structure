import { DocSection } from '../types';

export const DOCS_DATA: DocSection[] = [
  {
    id: 'architecture',
    title: '1. Architecture Overview',
    pages: [
      {
        id: 'system-architecture',
        title: '1.1 System Architecture',
        content: [
          { type: 'header', value: 'High-Level Overview' },
          { type: 'text', value: 'WebStudio follows a modern monorepo architecture using Turborepo. It strictly separates the "Builder" (editing environment) from the "Runtime" (published sites), ensuring high performance for end-users regardless of editor complexity.' },
          { type: 'mermaid', value: `graph TD
    subgraph "Edge / Public"
      User[End User]
      Edge["Cloudflare/Vercel Edge"]
    end

    subgraph "Builder Environment (apps/builder)"
      Editor[Content Creator]
      BuilderUI["Builder UI (Remix)"]
      Canvas["Canvas Iframe"]
    end

    subgraph "Core Services"
      API["tRPC API"]
      Collab["Collaboration Server"]
      DB[(PostgreSQL)]
    end

    subgraph "Shared Logic (packages/)"
      SDK["React SDK"]
      CSS["CSS Engine"]
      Prisma["Prisma Client"]
    end

    User --> Edge
    Edge --> SDK
    Editor --> BuilderUI
    BuilderUI --> Canvas
    BuilderUI --> API
    BuilderUI --> Collab
    API --> Prisma
    Prisma --> DB
    Canvas --> SDK` },
          { type: 'header', value: 'Monorepo Structure' },
          { type: 'text', value: 'The codebase is organized to maximize code sharing between the builder and the runtime SDKs.' },
          { type: 'code', language: 'text', value: `root
├── apps
│   ├── builder          # Main visual editor (Remix App)
│   ├── dashboard        # Project management dashboard
│   └── website          # Marketing website
├── packages
│   ├── css-engine       # CSS compilation core
│   ├── react-sdk        # Runtime renderer for sites
│   ├── prisma-client    # Database layer
│   ├── project-build    # Build pipeline logic
│   ├── asset-uploader   # S3/R2 upload handling
│   ├── design-system    # Internal UI kit
│   └── collaboration    # Yjs sync logic` }
        ]
      },
      {
        id: 'core-patterns',
        title: '1.2 Core Patterns',
        content: [
          { type: 'header', value: 'State Management' },
          { type: 'text', value: 'We utilize a "Split State" architecture. Transient UI state (modals, panels) lives in React context. Persistent Project state (the component tree) lives in NanoStores, which synchronizes with Yjs for real-time collaboration.' },
          { type: 'mermaid', value: `flowchart LR
    UserOp[User Operation] --> Command[Command Handler]
    Command --> NanoStore[NanoStore Atom]
    NanoStore --> ReactComp[React Component]
    NanoStore --> Yjs[Yjs Document]
    Yjs --> WS[WebSocket Provider]
    WS <--> Server[Collab Server]
    
    subgraph "Optimistic UI"
    NanoStore
    ReactComp
    end` }
        ]
      },
      {
        id: 'deployment-arch',
        title: '1.3 Deployment Architecture',
        content: [
          { type: 'text', value: 'WebStudio supports multi-target deployment. The build system abstracts the output format.' },
          { type: 'mermaid', value: `sequenceDiagram
    participant User
    participant Builder
    participant BuilderService
    participant Adapter
    participant Vercel
    participant Netlify

    User->>Builder: Publish Project
    Builder->>BuilderService: POST /build
    BuilderService->>BuilderService: Fetch Project JSON
    BuilderService->>Adapter: Generate Build Assets
    alt Target: Vercel
        Adapter->>Vercel: Deploy via Vercel API
    else Target: Netlify
        Adapter->>Netlify: Deploy via Netlify API
    end
    BuilderService-->>Builder: Deployment URL` }
        ]
      }
    ]
  },
  {
    id: 'execution-flows',
    title: '2. Execution Flows',
    pages: [
      {
        id: 'visual-editing',
        title: '2.1 Visual Editing Flow',
        content: [
          { type: 'header', value: 'The Editing Loop' },
          { type: 'text', value: 'When a user drags a component or changes a style, the following flow executes:' },
          { type: 'mermaid', value: `sequenceDiagram
    participant User
    participant CanvasIframe
    participant BuilderHost
    participant Store
    participant CSSEngine

    User->>CanvasIframe: Drag Component
    CanvasIframe->>BuilderHost: postMessage(UPDATE_COORDS)
    BuilderHost->>Store: Update Instance Position
    Store->>BuilderHost: Trigger Re-render
    BuilderHost->>CanvasIframe: postMessage(SYNC_TREE)
    
    User->>BuilderHost: Change Color (Panel)
    BuilderHost->>Store: Update Style Prop
    Store->>CSSEngine: Generate Atomic Class
    CSSEngine->>Store: Return Class Name
    Store->>CanvasIframe: Inject "<style>"` }
        ]
      },
      {
        id: 'publishing-flow',
        title: '2.2 Publishing Flow',
        content: [
          { type: 'text', value: 'The transformation from a dynamic JSON tree to a static optimized site.' },
          { type: 'mermaid', value: `graph TD
    JSON[Project JSON] --> Validator[Schema Validator]
    Validator --> TreeGen[Component Tree Gen]
    Validator --> StyleGen[CSS Gen]
    
    TreeGen --> Remix[Remix Route Gen]
    StyleGen --> CSSFiles[CSS Files]
    
    Remix --> Bundler[Vite Build]
    Bundler --> Assets[Static Assets]
    Assets --> Deploy[Deployment Provider]` }
        ]
      },
      {
        id: 'data-flows',
        title: '2.3 Data Flows',
        content: [
          { type: 'header', value: 'tRPC & Prisma Flow' },
          { type: 'text', value: 'All data mutations go through tRPC procedures which wrap Prisma transactions.' },
          { type: 'code', language: 'typescript', value: `// Data Query Flow
export const projectRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Authorization Check
      await ctx.canViewProject(input.id);
      
      // Database Query
      return ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: { pages: true }
      });
    })
});` }
        ]
      }
    ]
  },
  {
    id: 'modules',
    title: '3. Module Deep Dives',
    pages: [
      {
        id: 'builder-app',
        title: '3.1 Builder Application',
        content: [
          { type: 'header', value: 'apps/builder' },
          { type: 'text', value: 'The builder application orchestrates the entire editing experience. It manages the two-pane layout (Editor vs Canvas).' },
          { type: 'header', value: 'Canvas Bridge' },
          { type: 'text', value: 'The critical piece is the communication bridge between the editor UI and the user\'s site running in an iframe.' },
          { type: 'code', language: 'typescript', value: `// apps/builder/app/canvas/use-canvas-bridge.ts
useEffect(() => {
  const handleMessage = (event) => {
    if (event.data.type === 'COMPONENT_SELECTED') {
      setSelectedInstance(event.data.instanceId);
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);` }
        ]
      },
      {
        id: 'css-engine',
        title: '3.2 CSS Engine',
        content: [
          { type: 'header', value: 'packages/css-engine' },
          { type: 'text', value: 'Compiles JSON style objects into CSS strings. It supports both Atomic CSS (for performance) and Semantic CSS (for readability).' },
          { type: 'mermaid', value: `graph LR
    StyleObj["{ color: 'red', margin: '10px' }"] --> Parser
    Parser --> AST
    AST --> Transformer
    Transformer --> Compiler
    Compiler --> CSS[".c-123 { color: red } .m-456 { margin: 10px }"]` }
        ]
      },
      {
        id: 'react-sdk',
        title: '3.3 React SDK',
        content: [
          { type: 'header', value: 'packages/react-sdk' },
          { type: 'text', value: 'The runtime engine. It takes the project JSON and renders React components. It handles hydration and event binding.' },
          { type: 'code', language: 'typescript', value: `// packages/react-sdk/src/components/component-renderer.tsx
export const ComponentRenderer = ({ instance }) => {
  const Component = getComponent(instance.component);
  const props = resolveProps(instance.props);
  const styles = resolveStyles(instance.id);
  
  return <Component {...props} className={styles} />;
}` }
        ]
      },
      {
        id: 'sdk-components',
        title: '3.4 SDK Components',
        content: [
          { type: 'header', value: 'packages/sdk-components-*' },
          { type: 'text', value: 'We maintain multiple component libraries:' },
          { type: 'list', value: [
            'sdk-components-react: Basic HTML primitives (Box, Text, Link).',
            'sdk-components-react-radix: Interactive components (Dialog, Tabs, Tooltip).',
            'sdk-components-react-remix: Framework specific (Link, Form).'
          ] },
          { type: 'header', value: 'Component Metadata' },
          { type: 'text', value: 'Every component exports a metadata definition used by the builder to generate the properties panel.' },
          { type: 'code', language: 'typescript', value: `export const meta: ComponentMeta = {
  props: {
    target: {
      type: 'string',
      options: ['_self', '_blank']
    }
  }
}` }
        ]
      },
      {
        id: 'build-system',
        title: '3.5 Build System',
        content: [
          { type: 'header', value: 'packages/project-build' },
          { type: 'text', value: 'Handles the logic of converting a project tree into a buildable Remix app.' },
          { type: 'mermaid', value: `graph TD
    Input[Project Tree] --> RouteGen[Route Generator]
    RouteGen --> FileSys[Virtual File System]
    FileSys --> Esbuild["Esbuild/Vite"]
    Esbuild --> Output[Dist Folder]` }
        ]
      },
      {
        id: 'database',
        title: '3.6 Database Layer',
        content: [
          { type: 'header', value: 'packages/prisma-client' },
          { type: 'text', value: 'We use Prisma with PostgreSQL. The schema relies heavily on JSONB columns to store the flexible component tree structure.' },
          { type: 'code', language: 'prisma', value: `model Project {
  id        String   @id @default(cuid())
  ownerId   String
  assets    Asset[]
  // The entire page structure is versioned
  tree      Json
  styles    Json
}` }
        ]
      },
      {
        id: 'api-layer',
        title: '3.7 API Layer',
        content: [
          { type: 'header', value: 'API Architecture' },
          { type: 'text', value: 'The API layer facilitates communication between the client, the builder, and the database. It is split into type-safe RPC calls and standard REST endpoints.' },
          { type: 'header', value: 'tRPC Interface (packages/trpc-interface)' },
          { type: 'text', value: 'Defines the router, procedures, and types shared between the backend and frontend.' },
          { type: 'mermaid', value: `graph LR
    Client["Client App"] --> Proxy["tRPC Proxy"]
    Proxy --> Router["App Router"]
    Router --> Middleware["Auth Middleware"]
    Middleware --> Procedure["Procedure"]
    Procedure --> Prisma["Prisma Client"]` },
          { type: 'header', value: 'PostgREST (packages/postgrest)' },
          { type: 'text', value: 'Provides an auto-generated REST API over the PostgreSQL database for CRUD operations that do not require complex business logic.' },
          { type: 'header', value: 'HTTP Client (packages/http-client)' },
          { type: 'text', value: 'A robust fetch wrapper that handles authentication headers, retries, and error parsing.' }
        ]
      },
      {
        id: 'supporting-packages',
        title: '3.8 Supporting Packages',
        content: [
          { type: 'header', value: 'packages/asset-uploader' },
          { type: 'text', value: 'Manages file uploads to object storage (S3/Cloudflare R2). It handles file validation, image optimization, and generating public URLs.' },
          { type: 'code', language: 'typescript', value: `// Upload Flow
export const uploadAsset = async (file: File) => {
  const optimized = await optimizeImage(file);
  const key = generateUniqueKey(file.name);
  await s3Client.putObject({ Key: key, Body: optimized });
  return getPublicUrl(key);
};` },
          { type: 'header', value: 'packages/design-system' },
          { type: 'text', value: 'A shared UI component library based on Radix UI and Tailwind CSS. It ensures consistency across the Builder, Dashboard, and internal tools.' },
          { type: 'header', value: 'packages/icons' },
          { type: 'text', value: 'Centralized management for SVG icons. Optimizes SVGs and provides React components for easy usage.' },
          { type: 'header', value: 'packages/fonts' },
          { type: 'text', value: 'Handles Google Fonts integration and custom font uploads. It parses font metadata to generate CSS @font-face rules.' },
          { type: 'header', value: 'packages/domain' },
          { type: 'text', value: 'Contains logic for validating and configuring custom domains, including DNS record verification.' },
          { type: 'header', value: 'packages/project' },
          { type: 'text', value: 'Domain-specific logic for Project entities, including validation schemas (Zod) and serialization utilities.' },
          { type: 'header', value: 'packages/authorization-token' },
          { type: 'text', value: 'Manages API token generation, hashing, and validation for authenticated access to the API.' }
        ]
      },
      {
        id: 'cli-tools',
        title: '3.9 CLI Tools',
        content: [
          { type: 'header', value: 'packages/cli' },
          { type: 'text', value: 'The primary CLI for WebStudio developers. It supports scaffolding new projects, running local development environments, and managing deployments.' },
          { type: 'code', language: 'bash', value: `webstudio create my-project
webstudio dev
webstudio deploy` },
          { type: 'header', value: 'packages/sdk-cli' },
          { type: 'text', value: 'A specialized tool for component developers. It helps in creating new SDK components, generating metadata, and building component libraries.' }
        ]
      }
    ]
  },
  {
    id: 'dependency-analysis',
    title: '4. Dependency Analysis',
    pages: [
      {
        id: 'dep-graph',
        title: '4.1 Dependency Graph',
        content: [
          { type: 'mermaid', value: `graph BT
    cli["apps/cli"] --> build["packages/project-build"]
    builder["apps/builder"] --> sdk["packages/react-sdk"]
    builder --> css["packages/css-engine"]
    builder --> prisma["packages/prisma-client"]
    builder --> collab["packages/collaboration"]
    
    sdk --> css
    sdk --> design["packages/design-system"]
    
    build --> sdk
    build --> css` }
        ]
      },
      {
        id: 'external-deps',
        title: '4.2 External Dependencies',
        content: [
          { type: 'list', value: [
            'Remix: The metaframework.',
            'NanoStores: Tiny state manager.',
            'Immer: Immutable state updates.',
            'Yjs: CRDT for collaboration.',
            'Radix UI: Headless UI components.',
            'Prisma: Database ORM.'
          ]}
        ]
      }
    ]
  },
  {
    id: 'visual-diagrams',
    title: '5. Visual Diagrams',
    pages: [
      {
        id: 'sequence-diagrams',
        title: '5.2 Sequence Diagrams',
        content: [
          { type: 'header', value: 'Project Creation' },
          { type: 'mermaid', value: `sequenceDiagram
    participant User
    participant Dashboard
    participant API
    participant DB

    User->>Dashboard: Click "New Project"
    Dashboard->>API: POST /project/create
    API->>DB: Insert Project (Default Template)
    DB-->>API: Project ID
    API-->>Dashboard: Redirect URL
    Dashboard->>User: Redirect to Builder` }
        ]
      },
      {
        id: 'class-diagrams',
        title: '5.3 Class Structure',
        content: [
          { type: 'mermaid', value: `classDiagram
    class Instance {
        +id: string
        +component: string
        +children: Instance[]
        +props: Map
        +styleId: string
    }
    class Style {
        +id: string
        +rules: Map
        +breakpoint: string
    }
    class Project {
        +id: string
        +root: Instance
        +assets: Asset[]
    }
    Project *-- Instance
    Project *-- Style` }
        ]
      }
    ]
  },
  {
    id: 'development',
    title: '7. Development Guidelines',
    pages: [
      {
        id: 'local-dev',
        title: '7.1 Local Development',
        content: [
          { type: 'header', value: 'Setup' },
          { type: 'code', language: 'bash', value: `git clone https://github.com/webstudio-is/webstudio.git
pnpm install
# Start infrastructure
docker-compose up -d
# Run migrations
pnpm prisma migrate dev
# Start dev server
pnpm dev` }
        ]
      },
      {
        id: 'contributing',
        title: '7.2 Contributing',
        content: [
          { type: 'text', value: 'We follow trunk-based development. Feature branches should be short-lived.' }
        ]
      }
    ]
  }
];
