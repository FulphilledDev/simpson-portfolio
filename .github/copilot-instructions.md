# PhitDev Portfolio — Project Instructions for GitHub Copilot

## Keeping This File Current

**After every significant commit**, review and update:
- New entities → add to Domain Layer entities list
- New controllers → add to API Layer controllers list
- New pages/components → update Frontend Status
- Features completed → update Roadmap statuses
- New "What To Do Next" priorities → replace the list

---

## Business Context

**PhitDev Portfolio** is Phillip Simpson's personal developer portfolio site.  
It replaces the old `simpsonsoftware.site` React portfolio with a modern, dark 3D futuristic glassmorphism aesthetic.

**Goals:**
- Showcase projects with live demos, GIF walkthroughs, and tech stack badges
- Allow potential clients to book consultations directly (appointment system)
- Collect reviews from past clients via tokenized email links
- Owner-only admin dashboard (no public registration — single Google account)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 3D / Animation | Three.js (SSR-disabled canvas) + Framer Motion |
| Real-time | @microsoft/signalr (appointment chat) |
| Backend | .NET 8 (ASP.NET Core Web API) |
| ORM | EF Core 8 + PostgreSQL (Npgsql 8.0.11) |
| Auth | Google OAuth (ID token → custom JWT, single admin email) |
| Cloud | Azure App Service (API) + Vercel (frontend) + Azure Blob (files) |
| Email | MailKit (DevMode: ILogger fallback) |

**No ASP.NET Identity** — single Google admin, no user registration system.

**Design System**: Dark 3D futuristic glassmorphism
- Background: `#0a0a0f`
- Neon Cyan: `#00f5ff`  
- Neon Purple: `#bf00ff`
- Glass: `backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]`

---

## Monorepo Structure

```
phitdev-portfolio/
├── .github/
│   └── copilot-instructions.md   ← this file
├── .gitignore
├── api/                          # .NET 8 Clean Architecture
│   ├── PhitDevPortfolio.slnx
│   └── src/
│       ├── PhitDevPortfolio.Domain/
│       ├── PhitDevPortfolio.Application/
│       ├── PhitDevPortfolio.Infrastructure/
│       └── PhitDevPortfolio.API/
└── client/                       # Next.js 14 App Router
    ├── .env.local.template        # Copy to .env.local with real values
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx           # Public home page
        │   ├── globals.css
        │   ├── admin/
        │   │   └── login/page.tsx
        │   └── [other routes]/
        ├── components/
        │   └── ui/
        │       ├── GlassCard.tsx
        │       ├── GlowButton.tsx
        │       ├── HeroScene.tsx      ← SSR-disabled wrapper
        │       └── HeroSceneCanvas.tsx ← Three.js canvas (client only)
        ├── context/
        │   └── AuthContext.tsx
        ├── lib/
        │   ├── api.ts             # Fetch wrapper + token management
        │   └── signalr.ts         # SignalR connection factory
        └── middleware.ts          # Protects /admin/* routes
```

---

## API Architecture (Clean Architecture)

### Domain Layer — `PhitDevPortfolio.Domain`

**Entities:**
- `AppointmentRequest` — Id, Name, Email, Phone?, ProjectType (enum stored as string), Budget?, Message, Status (enum stored as string), SubmittedAt, RespondedAt?, OwnerNotes?, ClientToken (GUID, unique index), Messages nav, LinkedSlot nav
- `AppointmentMessage` — Id, AppointmentRequestId (FK, cascade delete), Sender (enum stored as string), Content (MaxLength 2000), SentAt, IsReadByOwner, IsReadByClient
- `AvailabilitySlot` — Id, Title, Date (DateOnly), StartTime? (TimeOnly), EndTime? (TimeOnly), Type (enum stored as string), IsPublic, Notes?, GoogleCalendarEventId?, AppointmentRequestId? (FK)
- `BlockedSlot` — Id, Start (DateTimeOffset), End (DateTimeOffset), Reason?
- `Project` — Id, Title, Slug (unique index, URL-safe), ShortDescription, LongDescription?, TechStack (JSON string "[]"), LiveUrl?, GitHubUrl?, ThumbnailUrl, GifDemoUrl?, IsFeatured, IsActive (default true), SortOrder, CreatedAt, UpdatedAt
- `Review` — Id, ReviewerName, ReviewerTitle?, ReviewerCompany?, Content (MaxLength 1000), Rating (1-5), ReviewToken (GUID, unique index), RequestedAt, SubmittedAt? (single-use: null = unused), IsApproved, IsPublished, SortOrder
- `AdminSettings` — singleton (Id=1): Bio, Skills (JSON "[]"), ContactEmail, LinkedInUrl?, GitHubUrl?, TwitterUrl?, ResumeUrl?, ProfilePhotoUrl?, OwnerName, OwnerTitle; seeded with OwnerName="Phillip Simpson", OwnerTitle="Full-Stack Developer"
- `GoogleCalendarConnection` — Id, CalendarId, ConnectedEmail, AccessToken (encrypted), RefreshToken (encrypted), TokenExpiresAt, ConnectedAt, IsActive (indexed), AutoSync

**Enums** (in `Enums/Enums.cs`):
- `AppointmentStatus`: Pending=0, Accepted=1, Denied=2
- `MessageSender`: Owner=0, Client=1, System=2
- `ProjectType`: WebApp=0, API=1, MobileApp=2, Consultation=3, Other=4
- `AvailabilitySlotType`: Consultation=0, FollowUp=1, ProjectReview=2, Other=3

### Application Layer — `PhitDevPortfolio.Application`

**DTOs** (5 files in `DTOs/`):
- `AppointmentDtos.cs`: AppointmentRequestDto, CreateAppointmentRequestDto, RespondToAppointmentDto, AppointmentMessageDto, CreateAppointmentMessageDto, ConversationPreviewDto, ClientChatDto
- `AvailabilityDtos.cs`: AvailabilitySlotDto, UpsertAvailabilitySlotDto, BlockedSlotDto, UpsertBlockedSlotDto
- `ProjectDtos.cs`: ProjectDto (IEnumerable<string> TechStack), CreateProjectDto, UpdateProjectDto, ReorderProjectDto
- `ReviewDtos.cs`: ReviewDto, ReviewSubmitFormDto (IsTokenValid bool), SubmitReviewDto, RequestReviewDto (ReviewerEmail for sending link)
- `AdminDtos.cs`: AdminSettingsDto, UpdateAdminSettingsDto, AuthResultDto (Token+Email+Name), GoogleAuthDto (IdToken), GoogleCalendarStatusDto

**Interfaces** (5 files in `Interfaces/`):
- `IAppointmentService` + `IAppointmentMessageService`
- `IProjectService`
- `IReviewService`
- `IAvailabilityService` + `IBlockedSlotService`
- `IAdminSettingsService`, `ITokenService`, `IGoogleCalendarService`, `IEmailService`, `IBlobStorageService`

**Options** (`Options/AppOptions.cs`): JwtOptions, EmailOptions, AzureOptions, GoogleOptions

### Infrastructure Layer — `PhitDevPortfolio.Infrastructure`

**AppDbContext** inherits `DbContext` (NOT IdentityDbContext — no ASP.NET Identity).

**Services:**
- `AppointmentService` — CreateAsync generates ClientToken GUID, sends owner email + system message; RespondAsync adds system + optional owner message, sends client email
- `AppointmentMessageService` — token expiry: Accepted→120d, Denied→60d from RespondedAt, Pending→90d
- `AvailabilityService` + `BlockedSlotService` — in same file `AvailabilityService.cs`
- `ProjectService` — slug generation (regex + auto-increment for uniqueness); Azure Blob OR DevMode wwwroot upload
- `ReviewService` — single-use token (SubmitAsync returns null if SubmittedAt already set)
- `AdminSettingsService` — GetOrCreateAsync singleton (Id=1)
- `BlobStorageService` — Azure Blob upload with PublicAccessType.Blob
- `EmailService` — glassmorphism HTML emails (dark bg #0a0a0f, neon cyan #00f5ff); DevMode ILogger fallback
- `TokenService` — GoogleJsonWebSignature.ValidateAsync; email must match GoogleOptions.OwnerEmail; JWT Role="Admin"
- `GoogleCalendarService` — OAuth2 flow; auto-refresh 5min before expiry; SyncSlotAsync

### API Layer — `PhitDevPortfolio.API`

**Program.cs:**
- Npgsql with retry-on-failure (3)
- JWT Bearer with SignalR query string support (`access_token` param for `/hubs` paths)
- CORS: AllowedOrigins array + AllowCredentials (required for SignalR)
- 11 scoped services registered
- Auto-migrate on startup in Development
- DevMode: UseStaticFiles for wwwroot/uploads
- Hub mapped: `app.MapHub<AppointmentChatHub>("/hubs/appointment-chat")`

**Controllers:**
- `AuthController` — `POST /api/auth/google` (public)
- `AppointmentsController` — `POST /api/appointments` (public); auth: GET all, GET {id}, PATCH {id}/respond, GET conversations, GET {id}/messages, POST {id}/messages (SignalR broadcast)
- `AppointmentChatController` — `GET /api/appointments/chat/{token}` (public, 410 if expired), `POST /api/appointments/chat/{token}/messages` (public)
- `ProjectsController` — public: `GET /api/projects?featuredOnly=true`, `GET /api/projects/{slug}`; auth: admin GET, POST (50MB multipart), PUT, DELETE (soft), PUT reorder
- `ReviewsController` — public: `GET /api/reviews` (published), `GET/POST /api/reviews/submit/{token}` (410 if used); auth: admin GET, POST request, PUT approve, PUT edit, DELETE
- `AvailabilityController` + `BlockedSlotsController`
- `AdminSettingsController` — `GET /api/settings` (public), auth: PUT, POST photo (5MB)
- `GoogleCalendarController` — auth: connect (redirect), callback, status, disconnect, sync

**Hub:**
- `AppointmentChatHub` — `[Authorize]`; `/hubs/appointment-chat`; groups `appointment-{id}`; `JoinAppointment`/`LeaveAppointment`; broadcasts `NewMessage`

---

## Frontend Architecture

### Auth Flow
1. Google Identity Services button on `/admin/login` receives Google credential (ID token)
2. `AuthContext.login(idToken)` → `POST /api/auth/google` → receives custom JWT
3. JWT stored in `localStorage` + `phitdev_admin_token` cookie
4. `middleware.ts` checks cookie for `/admin/*` routes (except `/admin/login`)
5. `lib/api.ts` reads from localStorage/sessionStorage for `Authorization: Bearer` header

### Design System (Tailwind + globals.css)
- `.glass` — glassmorphism card base (backdrop-blur-xl, border, dark bg)
- `.glass-hover` — glass + hover neon cyan border
- `.text-gradient-hero` — cyan → purple → pink gradient
- `.btn-glow-cyan` / `.btn-glow-purple` — gradient buttons with glow box-shadow
- `.btn-outline-cyan` — transparent outline button
- `GlassCard` component — `hoverable`, `accent="cyan|purple|none"`, `padding="sm|md|lg|none"`
- `GlowButton` component — `variant="cyan|purple|outline-cyan|ghost"`, `size="sm|md|lg"`, `loading`
- `HeroScene` — SSR-disabled wrapper → `HeroSceneCanvas` (Three.js wireframe icospheres + particle field)

### Pages Built
- `/` — Home: Three.js hero + featured projects grid (skeleton) + CTA card
- `/admin/login` — Google Sign-In button via GSI SDK

### Pages To Build
- `/projects` — Public projects grid (fetch `GET /api/projects`)
- `/projects/[slug]` — Project detail with GIF demo, tech stack, links
- `/book` — Appointment booking form → `POST /api/appointments`
- `/appointment/chat/[token]` — Tokenized client chat page
- `/reviews/submit/[token]` — Review submission form
- `/admin` — Dashboard
- `/admin/appointments` — Appointment inbox (list + detail + chat with SignalR)
- `/admin/projects` — Projects CRUD (upload thumbnail/GIF)
- `/admin/reviews` — Review management (approve/publish)
- `/admin/availability` — Availability slots + blocked slots
- `/admin/settings` — Admin settings + profile photo + Google Calendar

---

## Local Development Setup

### Next.js Client
```bash
cd client
cp .env.local.template .env.local   # Fill in real values
npm run dev   # http://localhost:3000
```

### .NET API
```bash
cd api
dotnet run --project src/PhitDevPortfolio.API
# http://localhost:5000 (see launchSettings.json)
```

### Database (PostgreSQL)
Using Neon free tier (or local PostgreSQL).  
Connection string goes in `api/src/PhitDevPortfolio.API/appsettings.Development.json` (gitignored).

To create/apply migrations:
```bash
cd api
dotnet ef migrations add <MigrationName> --project src/PhitDevPortfolio.Infrastructure --startup-project src/PhitDevPortfolio.API
dotnet ef database update --project src/PhitDevPortfolio.Infrastructure --startup-project src/PhitDevPortfolio.API
```

**Initial migration not yet created** — run `dotnet ef migrations add InitialCreate ...` after setting up PostgreSQL connection string.

---

## Key Decisions & Constraints

- **No ASP.NET Identity** — Single owner auth via Google OAuth. No registration, no role system. JWT has `Role="Admin"` claim set directly in `TokenService`.
- **PostgreSQL / Npgsql** — Not SQL Server. EF Core uses `UseNpgsql()`. Neon free tier for hosting.
- **Next.js App Router** — All pages use the `app/` directory. Server Components by default; add `"use client"` only when needed (state, effects, browser APIs, Three.js).
- **Three.js SSR guard** — Always load `HeroSceneCanvas` with `dynamic(..., { ssr: false })` via the `HeroScene` wrapper. Never import Three.js in a Server Component.
- **Review token is single-use** — `SubmittedAt` is null until submitted; once set, `/reviews/submit/{token}` returns 410.
- **Project slugs** — Auto-generated from title via regex; `ProjectService` enforces uniqueness by appending `-2`, `-3`, etc.
- **DevMode file serving** — When `AzureOptions.BlobStorageConnectionString` is empty → files saved to `wwwroot/uploads/`; API serves them as static files (configured in Program.cs).
- **DevMode email** — When `EmailOptions.SmtpServer` is empty → `ILogger.LogInformation` instead of sending email.
- **SignalR auth** — JWT passed via `?access_token=` query param for WebSocket connections (configured in `Program.cs` `OnMessageReceived`).
- **MailKit vulnerability** — `GHSA-9j88-vvj5-vhgr` moderate severity NTLM auth issue. Non-issue for this project (uses standard SMTP username/password). Warning is acceptable.
- **Deployment split** — `client/` → Vercel; `api/` → Azure App Service. CORS configured in `appsettings.json` for both.

---

## What To Do Next

1. **Set up PostgreSQL** — create a Neon free-tier DB, add connection string to `appsettings.Development.json`, run `dotnet ef migrations add InitialCreate`
2. **Google OAuth credentials** — create OAuth 2.0 client in Google Cloud Console, add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local` and `Google:ClientId` to API appsettings
3. **Build `/projects` page** — fetch `GET /api/projects?featuredOnly=false`, render `ProjectCard` components with slug links
4. **Build `/book` page** — appointment booking form (name, email, phone, project type, budget range, message)
5. **Build admin appointments inbox** — list + detail + SignalR chat panel (mirror fire-and-ice-cream booking chat pattern)

---

## Current State

### Backend
- ✅ All Domain entities + Enums
- ✅ All Application DTOs + Interfaces + Options
- ✅ AppDbContext + all DbSets
- ✅ All Infrastructure services (10 files)
- ✅ All API controllers (8 controllers + hub)
- ✅ Program.cs fully configured
- ✅ Build: 0 errors, 4 warnings (acceptable)
- ❌ Initial EF Core migration not yet created (needs PostgreSQL connection)

### Frontend
- ✅ Next.js 14 scaffolded + all packages installed
- ✅ Tailwind dark futuristic theme configured
- ✅ globals.css with glass/glow utilities
- ✅ `lib/api.ts` — fetch wrapper + token management
- ✅ `lib/signalr.ts` — SignalR connection factory
- ✅ `middleware.ts` — admin route protection
- ✅ `GlassCard`, `GlowButton` components
- ✅ `HeroScene` + `HeroSceneCanvas` (Three.js wireframe icospheres)
- ✅ `AuthContext` — Google OAuth → custom JWT flow
- ✅ `/admin/login` page
- ✅ `/` home page (hero + skeleton project grid + CTA)
- ❌ `.env.local` not created (copy from `.env.local.template`)
- ❌ Public pages: `/projects`, `/projects/[slug]`, `/book`, `/appointment/chat/[token]`, `/reviews/submit/[token]`
- ❌ Admin pages: dashboard, appointments, projects, reviews, availability, settings
