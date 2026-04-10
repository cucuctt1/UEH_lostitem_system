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

## 10) Detailed API Contract

This section documents connection type, authentication, payload, and response shape for all active APIs.

### Base connection model
- Protocol: HTTP REST (typically HTTP/1.1; deploy with HTTPS in production).
- Base URL (dev): `http://localhost:4000`
- Auth type: `Authorization: Bearer <JWT>` for protected endpoints.
- Request content types:
  - `application/json` for most endpoints.
  - `multipart/form-data` for file upload endpoints.
- Global response envelope (success):

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

- Global error envelope:

```json
{
  "success": false,
  "message": "Error reason"
}
```

- Rate limit: 400 requests / 15 minutes per IP.

### Public utility endpoints

#### GET /health
- Auth: none
- Connection/Payload: no body
- Success `data`:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

#### GET /uploads/:filename
- Auth: none
- Connection type: static file response (image/file bytes)
- Notes:
  - CORP header is set to `cross-origin` to support cross-origin image rendering.

### Authentication APIs

#### POST /auth/login
- Auth: none
- Content-Type: `application/json`
- Payload:

```json
{
  "email": "student@univ.edu",
  "password": "bacon123"
}
```

- Success `data`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "student@univ.edu",
    "fullName": "Student",
    "role": "user",
    "avatarUrl": null,
    "bio": null
  }
}
```

#### POST /auth/register
- Auth: none
- Content-Type: `application/json`
- Payload:

```json
{
  "email": "new-user@univ.edu",
  "password": "bacon123",
  "fullName": "New User"
}
```

- Success `data`: same shape as `/auth/login`.

### User APIs

#### GET /users/me
- Auth: Bearer JWT (`user` or `admin`)
- Connection/Payload: no body
- Success `data`:

```json
{
  "id": 1,
  "email": "student@univ.edu",
  "fullName": "Student",
  "phone": null,
  "role": "user",
  "avatarUrl": null,
  "bio": null,
  "createdAt": "2026-01-01T10:00:00.000Z"
}
```

#### PUT /users/me
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `application/json`
- Payload (all fields optional):

```json
{
  "fullName": "Updated Name",
  "bio": "Updated bio",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

- Success `data`: omitted (`null`/empty).

#### GET /users/me/history
- Auth: Bearer JWT (`user` or `admin`)
- Connection/Payload: no body
- Success `data`:

```json
{
  "posts": [
    {
      "id": 12,
      "title": "Lost Backpack",
      "type": "lost",
      "status": "searching",
      "moderation_status": "approved",
      "created_at": "2026-04-08T12:00:00.000Z"
    }
  ],
  "returns": [
    {
      "match_id": 3,
      "lost_post_id": 12,
      "found_post_id": 19,
      "score": 0.84,
      "returned_at": "2026-04-09T13:12:00.000Z"
    }
  ]
}
```

### Post APIs

#### GET /posts
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: query params (`application/json` response)
- Query params (all optional):
  - `keyword: string`
  - `tag: string` (with or without `#`)
  - `locationId: number`
  - `from: ISO datetime`
  - `to: ISO datetime`
  - `sort: newest | relevance`
  - `type: lost | found`
- Success `data`: `Post[]`

```json
{
  "id": 12,
  "userId": 1,
  "type": "lost",
  "title": "Lost Backpack",
  "description": "Black backpack near library",
  "categoryId": 2,
  "categoryName": "Bags",
  "locationId": 4,
  "locationName": "Main Library",
  "eventTime": "2026-04-08T11:00:00.000Z",
  "status": "searching",
  "moderationStatus": "approved",
  "tags": ["backpack", "charger"],
  "imageUrls": ["http://localhost:4000/uploads/1710000_a.jpg"],
  "imageUrl": "http://localhost:4000/uploads/1710000_a.jpg",
  "contactNote": "Please DM",
  "createdAt": "2026-04-08T12:00:00.000Z",
  "updatedAt": "2026-04-08T12:00:00.000Z",
  "owner": {
    "id": 1,
    "fullName": "Student",
    "avatarUrl": null
  }
}
```

#### GET /posts/recommendations
- Auth: Bearer JWT (`user` or `admin`)
- Query params:
  - `limit?: number` (default 8)
- Success `data`: `Post[]` with additional optional fields:
  - `recommendationScore: number`
  - `recommendationReason: string`

#### GET /posts/:id
- Auth: Bearer JWT (`user` or `admin`)
- Connection/Payload: no body
- Success `data`: one `Post` object (same shape as above).

#### POST /posts
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `multipart/form-data`
- Multipart fields:
  - `type` (required): `lost | found`
  - `title` (required)
  - `description` (required)
  - `categoryId` (required number)
  - `locationId` (required number)
  - `eventTime` (required ISO datetime)
  - `tags` (optional, parsed from `#tag` string / JSON / array)
  - `contactNote` (optional)
  - `status` (optional): `searching | found | returned`
  - `images` (optional file[], max 4)
  - `image` (optional file, compatibility)
- Success `data`:

```json
{ "postId": 123 }
```

#### PUT /posts/:id
- Auth: Bearer JWT (`owner` or `admin`)
- Content-Type: `multipart/form-data`
- Payload: partial subset of POST fields + optional new image files.
- Success `data`: omitted.

#### DELETE /posts/:id
- Auth: Bearer JWT (`owner` or `admin`)
- Connection/Payload: no body
- Success `data`: omitted.

#### GET /posts/:id/comments
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `PostComment[]`

```json
{
  "id": 1,
  "postId": 123,
  "userId": 7,
  "content": "I think I saw it near C building",
  "createdAt": "2026-04-09T09:00:00.000Z",
  "author": {
    "fullName": "Alice",
    "avatarUrl": null
  }
}
```

#### POST /posts/:id/comments
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `application/json`
- Payload:

```json
{ "content": "Any update on this item?" }
```

- Success `data`:

```json
{ "commentId": 99 }
```

### Search API

#### GET /search
- Auth: Bearer JWT (`user` or `admin`)
- Query params: same as `GET /posts`
- Success `data`: `Post[]` (same shape as `GET /posts`).

### Messaging APIs

#### GET /messages/conversations
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Conversation[]`

```json
{
  "id": 5,
  "post_id": 123,
  "user_one_id": 1,
  "user_two_id": 7,
  "post_title": "Lost Backpack",
  "user_one_name": "Student",
  "user_two_name": "Alice",
  "last_message_at": "2026-04-09T11:00:00.000Z",
  "created_at": "2026-04-09T10:00:00.000Z"
}
```

#### GET /messages/:conversationId
- Auth: Bearer JWT (`participant only`)
- Success `data`:

```json
{
  "conversation": {
    "id": 5,
    "post_id": 123,
    "user_one_id": 1,
    "user_two_id": 7,
    "post_title": "Lost Backpack",
    "user_one_name": "Student",
    "user_two_name": "Alice",
    "last_message_at": "2026-04-09T11:00:00.000Z",
    "created_at": "2026-04-09T10:00:00.000Z"
  },
  "messages": [
    {
      "id": 88,
      "conversation_id": 5,
      "sender_id": 1,
      "sender_name": "Student",
      "text": "Is this yours?",
      "image_url": null,
      "created_at": "2026-04-09T10:30:00.000Z"
    }
  ]
}
```

#### POST /messages
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `multipart/form-data`
- Multipart fields:
  - `conversationId?: number`
  - `postId?: number` (required when conversationId missing)
  - `receiverId?: number` (required when conversationId missing)
  - `text?: string`
  - `imageUrl?: string` (optional URL fallback)
  - `image?: file` (normal file upload)
- Rule: at least one of text / image / imageUrl must exist.
- Success `data`:

```json
{
  "messageId": 101,
  "conversationId": 5
}
```

#### POST /messages/:conversationId/confirm-return
- Auth: Bearer JWT (`participant only`)
- Content-Type: `application/json`
- Payload:

```json
{ "matchId": 44 }
```

- Behavior:
  - Match must belong to conversation post.
  - Rejected match cannot be confirmed.
  - Already returned match is idempotent (safe no-op).
- Success `data`: omitted.

### Matching API

#### GET /matches
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Match[]`

```json
{
  "id": 44,
  "lostPostId": 12,
  "foundPostId": 19,
  "lostTitle": "Lost Backpack",
  "foundTitle": "Found Black Backpack",
  "score": 0.88,
  "status": "accepted",
  "details": {
    "keyword": 0.4,
    "tags": 0.3,
    "location": 0.1,
    "time": 0.08
  },
  "createdAt": "2026-04-08T13:00:00.000Z"
}
```

### Notification APIs

#### GET /notifications
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Notification[]`

```json
{
  "id": 1,
  "type": "new_message",
  "title": "New message",
  "body": "You received a new message about an item.",
  "is_read": 0,
  "created_at": "2026-04-09T10:00:00.000Z",
  "user_id": 1,
  "reference_type": "conversation",
  "reference_id": 5
}
```

#### PATCH /notifications/:id/read
- Auth: Bearer JWT (`owner only`)
- Content-Type: `application/json` (empty body accepted)
- Success `data`: omitted.

### Report APIs

#### POST /reports
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `application/json`
- Payload:

```json
{
  "targetPostId": 123,
  "targetUserId": 7,
  "reason": "spam",
  "details": "Suspicious repeated posting"
}
```

- Rules:
  - `reason`: `spam | fraud | abuse | unsafe | other`
  - At least one of `targetPostId` or `targetUserId` is required.
- Success `data`:

```json
{ "reportId": 77 }
```

#### GET /reports
- Auth: Bearer JWT (`user` or `admin`)
- Query params:
  - `status?: open | resolved`
- Success `data`: `Report[]`

```json
{
  "id": 77,
  "reporter_id": 1,
  "target_post_id": 123,
  "target_user_id": 7,
  "reason": "spam",
  "details": "Suspicious repeated posting",
  "status": "open",
  "resolved_by": null,
  "resolved_at": null,
  "created_at": "2026-04-09T10:30:00.000Z",
  "reporter_name": "Student",
  "target_user_name": "Alice",
  "target_post_title": "Lost Backpack"
}
```

### Lookup APIs

#### GET /lookup/categories
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Category[]`

```json
{ "id": 1, "name": "Electronics", "created_at": "2026-01-01T00:00:00.000Z" }
```

#### GET /lookup/locations
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Location[]`

```json
{ "id": 1, "name": "Main Library", "details": null, "created_at": "2026-01-01T00:00:00.000Z" }
```

#### GET /lookup/tags/recommendations
- Auth: Bearer JWT (`user` or `admin`)
- Query params:
  - `keyword?: string`
  - `limit?: number` (default 20)
- Success `data`: `TagRecommendation[]`

```json
{
  "id": 3,
  "tag": "#backpack",
  "name": "backpack",
  "useCount": 12,
  "isFrequent": true,
  "isPrebuilt": true
}
```

### Bookmark APIs

#### GET /bookmarks
- Auth: Bearer JWT (`user` or `admin`)
- Success `data`: `Bookmark[]`

```json
{ "id": 11, "postId": 123, "createdAt": "2026-04-09T10:00:00.000Z" }
```

#### POST /bookmarks/:postId
- Auth: Bearer JWT (`user` or `admin`)
- Content-Type: `application/json` (empty body)
- Success `data`:

```json
{ "postId": 123 }
```

#### DELETE /bookmarks/:postId
- Auth: Bearer JWT (`user` or `admin`)
- Connection/Payload: no body
- Success `data`:

```json
{ "postId": 123 }
```

### Admin APIs (admin role required)

All `/admin/*` endpoints require:
- Auth: Bearer JWT with role `admin`

#### POST /admin/approve-post
- Content-Type: `application/json`
- Payload:

```json
{ "postId": 123, "approved": true, "note": "optional" }
```

- Success `data`: omitted.

#### POST /admin/lock-user
- Content-Type: `application/json`
- Payload:

```json
{ "userId": 7, "locked": true, "reason": "optional" }
```

- Success `data`: omitted.

#### GET /admin/users
- Success `data`: `AdminUser[]`

```json
{
  "id": 7,
  "email": "student@univ.edu",
  "full_name": "Student",
  "role": "user",
  "is_locked": 0,
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

#### DELETE /admin/posts/:id
- Success `data`: omitted.

#### GET /admin/reports
- Query params:
  - `status?: open | resolved`
- Success `data`: `Report[]` (same shape as `/reports`).

#### PATCH /admin/reports/:id/resolve
- Content-Type: `application/json` (empty body)
- Success `data`: omitted.

#### GET /admin/items
- Success `data`: `StoredItem[]`

```json
{
  "id": 1,
  "name": "Black Backpack",
  "description": "Stored in shelf A",
  "category_id": 2,
  "category_name": "Bags",
  "location_id": 4,
  "location_name": "Main Library",
  "quantity": 1,
  "status": "stored",
  "post_id": 123,
  "managed_by": 2,
  "created_at": "2026-04-09T12:00:00.000Z",
  "updated_at": "2026-04-09T12:00:00.000Z"
}
```

#### POST /admin/items
- Content-Type: `application/json`
- Payload:

```json
{
  "name": "Black Backpack",
  "description": "Stored in shelf A",
  "categoryId": 2,
  "locationId": 4,
  "quantity": 1,
  "status": "stored",
  "postId": 123
}
```

- Success `data`:

```json
{ "itemId": 51 }
```

#### PATCH /admin/items/:id/status
- Content-Type: `application/json`
- Payload:

```json
{ "status": "claimed" }
```

- Success `data`: omitted.

### Analytics API (admin role required)

#### GET /analytics
- Auth: Bearer JWT with role `admin`
- Connection/Payload: no body
- Success `data`:

```json
{
  "totals": {
    "total_posts": 100,
    "total_returns": 45,
    "total_users": 32
  },
  "returnSuccessRate": 0.45,
  "lostByLocation": [
    { "location_name": "Main Library", "total": 15 }
  ],
  "lostByHour": [
    { "hour_of_day": 13, "total": 6 }
  ]
}
```

### Validation and status code quick map
- `200`: standard successful read/update/delete.
- `201`: resource created (register, create post/comment/message/report/bookmark/item).
- `400`: validation/business rule failure.
- `401`: missing/invalid token.
- `403`: role or ownership restriction.
- `404`: route or resource not found.
- `409`: conflict (for example duplicate email on register).
- `500`: internal server error.
