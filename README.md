# Lost & Found Management System

Production-ready full-stack monorepo scaffold for a university Lost & Found system.

Tech stack:
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MySQL
- Architecture: RESTful API with strict client-server separation

## 1) Architecture Explanation

### 3-layer architecture
- Client layer: React SPA handles UI, route protection, data fetch, local state, and interaction workflows.
- API layer: Express service handles JWT auth, RBAC, business workflows, matching logic, moderation, and analytics aggregation.
- Data layer: MySQL relational schema with foreign keys and indexes for integrity, search, and analytics performance.

### Data flow
1. User authenticates via /auth/login and receives JWT.
2. Frontend stores token and sends it in Authorization header on protected requests.
3. API middleware verifies token and role, then routes request to controller -> service -> model.
4. Model executes parameterized SQL through mysql2 pool.
5. API responds in a consistent JSON envelope.
6. Frontend updates Zustand state and re-renders feature pages.

### API communication model
- Axios instance with interceptors for token injection and 401 handling.
- All responses follow: { success, message, data }.
- Role-restricted routes are guarded by server middleware.

### Authentication flow (simulated SSO with JWT)
1. User logs in with email/password (seeded demo accounts included).
2. Password verified with bcrypt.
3. JWT signed with user id, role, email, name.
4. Protected endpoints validate token and attach request.user.
5. Role middleware enforces admin-only capabilities.

### Matching system logic
For each approved post, the service scores opposite-type approved posts:

score = keyword_similarity + tag_match + location_match + time_proximity

Components:
- keyword_similarity: token overlap similarity between title+description.
- tag_match: intersection ratio of tags.
- location_match: same location bonus.
- time_proximity: decays by time difference (nearer time gets higher score).

Top-N matches are stored in matches and exposed via /matches.

## 2) Folder Structure

```
/project-root
  /client
    /src
      /pages
      /components
      /hooks
      /services/api
      /store
      /styles
      /types
  /server
    /src
      /controllers
      /routes
      /models
      /services
      /middleware
      /config
      /validators
      /utils
    /uploads
  /database
    schema.sql
    seed.sql
```

## 3) Database Schema (MySQL)

Implemented in database/schema.sql with all requested core tables:
- users
- posts
- categories
- locations
- messages
- reports
- notifications
- items (DSA warehouse)
- matches

Supporting table:
- conversations

Design highlights:
- Primary keys and foreign keys across all relationships.
- Indexes on lookup/filter columns (status, created_at, role, location, event_time).
- Fulltext index on posts title+description for keyword search.
- Unique constraints for identity and relationship consistency.
- JSON columns for tags and match scoring details.

Seed data in database/seed.sql:
- Categories, locations
- Demo user + admin
- Sample lost/found posts

Demo credentials:
- student@univ.edu / bacon123
- admin@univ.edu / bacon123

## 4) Backend (Express) Overview

Core backend capabilities:
- JWT auth and bcrypt password verification
- RBAC middleware (user/admin)
- Input validation with Zod
- SQL injection prevention via parameterized queries
- File upload with multer (local storage) and static URL serving
- Matching service with scoring formula
- Notifications for message, matching, and post status updates
- Report and moderation workflows
- Warehouse item management
- Analytics aggregation endpoints

Required endpoints implemented:
- POST /auth/login
- GET /users/me
- POST /posts
- GET /posts
- GET /posts/recommendations
- GET /posts/:id
- PUT /posts/:id
- DELETE /posts/:id
- GET /search
- GET /messages/:conversationId
- POST /messages
- POST /admin/approve-post
- POST /admin/lock-user
- GET /matches

Additional endpoints:
- POST /auth/register
- GET /users/me/history
- GET /messages/conversations
- POST /messages/:conversationId/confirm-return
- GET/PATCH /notifications
- POST/GET /reports
- Admin reports/users/items management
- GET /analytics
- GET /lookup/categories and /lookup/locations

## 5) Frontend (React) Overview

Pages implemented:
- Login
- Home feed (search/filter/sort)
- Post detail
- Create post
- Profile
- Chat (REST polling)
- Admin dashboard

Frontend architecture:
- React Router protected routes + admin route guard
- Zustand for auth and app state
- Axios API layer modules per domain
- Responsive UI with custom visual language and non-default theme

Security UX rule implemented:
- Phone is not exposed in public post views.
- Chat page explicitly represents protected contact flow.

## 6) Setup Instructions

Prerequisites:
- Node.js 20+
- MySQL 8+

### Install and run
1. Install dependencies:
   npm install

2. Copy environment files:
   - server/.env.example -> server/.env
   - client/.env.example -> client/.env

3. Start MySQL service.

4. Run development mode:
   npm run dev

Notes:
- Server auto-bootstraps schema + seed at startup when AUTO_SETUP_DB=true and DB credentials are valid.
- If MySQL is not running, server startup will fail with connection refused.
- To allow requests from ngrok tunnel domains, set ALLOW_NGROK_ORIGINS=true in server/.env.

### Build for production
- npm run build
- npm run start

## 7) Test Scenarios

### Auth and RBAC
1. Login as student and verify access to user pages.
2. Login as admin and verify admin dashboard access.
3. Try admin endpoints as student and confirm 403.

### Posts and moderation
1. Student creates post -> moderation_status should be pending.
2. Admin approves post -> post appears to non-owner feed.
3. Student edits post -> moderation resets to pending.

### Search and filters
1. Search by keyword returns relevant title/description hits.
2. Filter by tag and type (lost/found) works.
3. Sort newest/relevance changes ordering.

### Matching logic
1. Create related lost/found posts with same location/time/tags.
2. Approve both posts and verify /matches returns scored candidates.
3. Confirm score components in detail_json.

### Chat and return lifecycle
1. Start chat from post detail.
2. Send text and image URL message.
3. Confirm return via match id and verify statuses become returned.

### Notifications
1. Send message and verify receiver gets new_message notification.
2. Approve/reject post and verify owner gets post_status notification.
3. Check match notifications from matching flow.

### Reports and safety
1. Report a post/user.
2. Verify admin sees report queue.
3. Verify public post data does not expose phone.

### Analytics
1. Verify total posts metric.
2. Verify return success rate updates after confirm-return.
3. Verify lost-items by location and hour datasets.

## 8) Source Code Documentation

### Monorepo overview
- Root orchestrates both apps with workspace scripts for install/build/dev.
- client is a React + Vite SPA responsible for UI, route guards, API calls, and local state.
- server is an Express + TypeScript API responsible for auth, business workflows, moderation, matching, and persistence.
- database contains schema and seed data for MySQL bootstrap.

### Frontend module map
- Entry and routing:
  - client/src/main.tsx mounts the app and BrowserRouter.
  - client/src/App.tsx defines top-level routes.
  - client/src/components/ProtectedRoute.tsx enforces auth/admin route protection.
- Pages:
  - client/src/pages/HomePage.tsx feed, filters, and sorting.
  - client/src/pages/PostDetailPage.tsx post detail + chat initiation.
  - client/src/pages/CreatePostPage.tsx post creation with multipart upload.
  - client/src/pages/ChatPage.tsx conversation and polling updates.
  - client/src/pages/ProfilePage.tsx current user profile/history.
  - client/src/pages/AdminDashboardPage.tsx moderation/admin operations.
- State and data access:
  - client/src/store/authStore.ts authentication state + token lifecycle.
  - client/src/store/appStore.ts global app-side state.
  - client/src/services/api/*.ts axios client and domain API modules.
  - client/src/hooks/usePolling.ts reusable polling behavior for near-real-time UX.

### Backend module map
- Bootstrap and middleware:
  - server/src/server.ts bootstraps DB checks and starts HTTP server.
  - server/src/app.ts composes middleware (helmet, cors, logging, parsers, rate limit) and mounts routes.
  - server/src/middleware/*.ts handles auth, role checks, validation, and error handling.
- API layer:
  - server/src/routes/*.ts defines endpoint contracts and middleware chaining.
  - server/src/controllers/*.ts handles request/response mapping.
  - server/src/validators/*.ts validates body/query payloads with Zod.
- Domain/business layer (OOP target):
  - server/src/domain/entities.ts defines class-based domain models (User, Post, Message, Match, Report, Item, etc.).
  - server/src/services/*.ts implements business rules (auth, posts, messaging, matching, analytics, admin).
  - server/src/models/*.ts encapsulates SQL operations with mysql2 pool.
- Infrastructure/config:
  - server/src/config/env.ts environment parsing and typed config.
  - server/src/config/db.ts connection pool + optional schema/seed bootstrap.
  - server/src/config/jwt.ts token helpers.
  - server/src/config/multer.ts upload storage strategy.

### Key request flow
1. Frontend sends request with JWT via axios interceptor.
2. Route middleware validates auth/role/body/query.
3. Controller forwards normalized input to service.
4. Service executes business logic and calls model methods.
5. Model runs parameterized SQL and returns rows.
6. Service/controller returns JSON envelope `{ success, message, data }`.

## 9) Class Inventory

### Domain classes (OOP)
All domain classes below are declared in server/src/domain/entities.ts.

- User
  - Purpose: user domain object with profile/auth/admin projections.
  - Used in: server/src/services/authService.ts, server/src/services/userService.ts, server/src/services/adminService.ts.
- AuthSession
  - Purpose: encapsulates auth response (`token` + `user`) as an object.
  - Used in: server/src/services/authService.ts.
- Post
  - Purpose: post entity mapping and API/recommendation projections.
  - Used in: server/src/services/postService.ts.
- Conversation
  - Purpose: conversation entity for messaging API payloads.
  - Used in: server/src/services/messageService.ts.
- Message
  - Purpose: message entity for chat payload normalization.
  - Used in: server/src/services/messageService.ts.
- Match
  - Purpose: match entity and detail_json parsing into structured details.
  - Used in: server/src/controllers/matchController.ts.
- Notification
  - Purpose: notification entity with read-state projection.
  - Used in: server/src/controllers/notificationController.ts.
- Report
  - Purpose: report entity (user + admin list views).
  - Used in: server/src/controllers/reportController.ts, server/src/services/adminService.ts.
- Item
  - Purpose: warehouse item entity mapping.
  - Used in: server/src/services/adminService.ts.
- Category
  - Purpose: lookup category entity.
  - Used in: server/src/controllers/lookupController.ts.
- Location
  - Purpose: lookup location entity.
  - Used in: server/src/controllers/lookupController.ts.
- UserPostHistory
  - Purpose: profile post-history entity.
  - Used in: server/src/services/userService.ts.
- UserReturnHistory
  - Purpose: profile return-history entity.
  - Used in: server/src/services/userService.ts.
- AnalyticsTotals
  - Purpose: wraps platform totals metrics.
  - Used in: server/src/services/analyticsService.ts.
- AnalyticsSummary
  - Purpose: aggregates analytics response object.
  - Used in: server/src/services/analyticsService.ts.

### Infrastructure class
- AppError (server/src/utils/http.ts)
  - Purpose: custom HTTP exception class with status code.
  - Used in auth/validation/role middleware and core services.

### Built-in constructors used in source
- Date: used across client UI date rendering and server matching/recommendation scoring.
- Set: used in CORS allowlist and matching token/tag operations.
- Map: used in recommendation scoring counters.
- FormData: used in post creation/update flows on client.
- Error: used for environment configuration failures.

### OOP status
- Backend now uses explicit domain classes for core entities (User class, Post class, Match class, etc.).
- Services/controllers instantiate classes and return view models through class methods.
- Frontend remains function-component based (React hooks), with no class components.
