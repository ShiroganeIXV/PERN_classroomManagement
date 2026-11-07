# PERN Classroom Management

A classroom management application built with PostgreSQL, Express, React, and Node.js. It includes email/password authentication, Student and Teacher registration, a statistics dashboard, departments, subjects, a faculty directory, classes, and enrollment by invite code.

## Project structure

```text
PERN_classroomManagement/
├── backend_classroom/     # Express API, authentication, database schema and seed data
│   ├── src/db/schema/     # Drizzle table definitions
│   ├── drizzle/           # Versioned SQL migrations
│   └── seed/              # Sample data and seed script
└── frontend_classroom/    # React application
    └── src/               # Pages, components, authentication and data providers
```

The backend and frontend are separate npm projects. Install dependencies and run commands inside the appropriate folder; there is no root-level application script.

## Prerequisites

- [Git](https://git-scm.com/downloads).
- [Node.js 24 LTS](https://nodejs.org/en/about/previous-releases) with npm.
- A [Neon account](https://console.neon.tech/) for the PostgreSQL database.
- A [Cloudinary account](https://cloudinary.com/) for profile photos and class banners. You can start the application without it, but image uploads require configuration.

Clone the repository:

```bash
git clone https://github.com/ShiroganeIXV/PERN_classroomManagement.git
cd PERN_classroomManagement
```

## Backend

### Technology stack

| Technology | Purpose |
| --- | --- |
| Node.js, TypeScript, Express 5 | REST API |
| PostgreSQL on Neon | Hosted database |
| Drizzle ORM and Drizzle Kit | Table definitions, queries and migrations |
| Neon serverless driver | Database access over HTTP |
| Better Auth | Email/password signup, login and sessions |
| dotenv | Load backend environment variables |
| tsx | Development server and seed script |
| Arcjet | Bot protection, rate limiting and request protection; middleware is currently disabled |
| Site24x7 APM Insight | Performance monitoring integration |

### 1. Install dependencies

From the repository root:

```bash
cd backend_classroom
npm ci
```

Run the remaining backend commands from `backend_classroom/` so dotenv can find its `.env` file.

### 2. Create your own Neon database

1. Sign in to the [Neon Console](https://console.neon.tech/), choose **New Project**, and name it, for example, `classroom-management`.
2. Choose a region near you or your backend server and create the project. Neon provisions a PostgreSQL database, a role, and a default branch. You can use the provided database, commonly named `neondb`.
3. Open **Connect** and select the branch, database, and role you want this application to use. For a separate development environment, create a development branch and select that branch here.
4. Copy the PostgreSQL connection string. Use the complete URI, including its password and SSL query parameters, as `DATABASE_URL` in the backend `.env` file. Copy only the URI, without a surrounding `psql` command.

For example, the shape of the URI is:

```text
postgresql://ROLE:PASSWORD@ep-YOUR-ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require
```

Use the actual URI from your console. A pooled URI containing `-pooler` is also valid for the application's Neon driver. See [creating a Neon project](https://neon.com/docs/manage/projects) and [finding your connection string](https://neon.com/docs/connect/connect-from-any-app).

This application manages authentication through its own Better Auth instance and tables. No Neon Auth setup or Neon API key is needed.

### 3. Configure environment variables

Create `backend_classroom/.env`:

```dotenv
DATABASE_URL="postgresql://ROLE:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require"
FRONTEND_URL="http://localhost:5173"
BETTER_AUTH_SECRET="replace-with-a-generated-secret"

# Optional: explicit backend origin for Better Auth
BETTER_AUTH_URL="http://localhost:8000"

# Optional: only needed if you enable the Arcjet middleware
# ARCJET_KEY="ajkey_your_key"
# ARCJET_ENV="development"
```

| Variable | Required? | How to get or choose it |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Copy the connection URI from Neon **Connect**, as described above. |
| `FRONTEND_URL` | Yes for browser access | The frontend origin allowed by CORS and Better Auth. Use `http://localhost:5173` locally or your frontend's HTTPS origin when deployed, without a path. |
| `BETTER_AUTH_SECRET` | Yes | Generate a random secret locally using the command below. Keep it stable between restarts. No Better Auth account is required. |
| `BETTER_AUTH_URL` | Optional | An explicit backend origin, such as `http://localhost:8000`. Better Auth reads this variable itself; otherwise it infers the URL from requests. |
| `ARCJET_KEY` | Only when enabling Arcjet | Create an account in the [Arcjet console](https://console.arcjet.com/), add a site, and copy its key. See the [Arcjet setup guide](https://docs.arcjet.com/get-started). |
| `ARCJET_ENV` | Optional | Use `development` for local Arcjet development. |
| `NODE_ENV` | Optional | Set to `production` on a deployed backend. The security middleware skips protection when this is `test`. |

Generate a secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Copy the output into `BETTER_AUTH_SECRET`. Better Auth requires a high-entropy secret of at least 32 characters; see its [installation guide](https://www.better-auth.com/docs/installation).

Arcjet's import and `app.use(securityMiddleware)` are commented out in `src/index.ts`, so an Arcjet key is unnecessary for the current server. To activate protection, configure the key and uncomment both lines.

The Site24x7 integration uses `backend_classroom/apminsightnode.json`, while the frontend monitoring snippet is in `frontend_classroom/index.html`. Monitoring is not required for database or authentication setup; replace the monitoring configuration with your own account's settings or disable the integration when running your own copy.

Keep backend credentials in `backend_classroom/.env`; `.env` files are ignored by Git. Never copy `DATABASE_URL`, `BETTER_AUTH_SECRET`, or private service keys into frontend variables.

### 4. Create the database tables

After saving `.env`, run:

```bash
npm run db:migrate
```

This applies the committed migration in `drizzle/0000_flat_purifiers.sql` to the database selected by `DATABASE_URL`. It creates the tables, enums, indexes, and foreign keys, and records the applied migration. You do not need to generate a new migration for the first setup.

| Table | Contents | How it gets populated |
| --- | --- | --- |
| `user` | Names, email addresses, roles and profile images | Better Auth signup, or the sample seeder |
| `account` | Authentication provider and password hash | Better Auth signup |
| `session` | Login sessions | Better Auth signup/login |
| `verification` | Verification tokens | Better Auth flows that need tokens; it can remain empty in the current email/password setup |
| `departments` | Academic departments | Application form, SQL, or seeder |
| `subjects` | Subjects belonging to departments | Application form, SQL, or seeder |
| `classes` | Subject, teacher, capacity, invite code and schedules | Application form, SQL, or seeder |
| `enrollments` | Student-to-class relationships | Application enrollment/join flow or SQL |

To inspect these tables, open your project in Neon, go to **SQL Editor**, and select the same branch and database used in `.env`. Run SQL there using **Run**. See the [Neon SQL Editor guide](https://neon.com/docs/get-started/query-with-neon-sql-editor).

For future schema changes, first correct the existing schema path in `backend_classroom/drizzle.config.ts`:

```ts
schema: "./src/db/schema/index.ts",
```

The current value, `./src/db/schema/index.tsx.ts`, points to a nonexistent file and prevents migration generation. After correcting it and editing the table definitions, use:

```bash
npm run db:generate
npm run db:migrate
```

Use migrations to initialize a new database rather than pasting the migration into the SQL Editor, so Drizzle can track which migrations have been applied.

### 5. Run the backend

```bash
npm run dev
```

The API listens on **http://localhost:8000**. Opening that address should return `Backend server is running!`.

The port is currently hardcoded to `8000` in `src/index.ts`; setting a `PORT` environment variable does not change it.

| URL | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth endpoints |
| `/api/departments` | Department data |
| `/api/subjects` | Subject data |
| `/api/users` | Users and faculty |
| `/api/classes` | Class data |
| `/api/enrollments` | Create an enrollment |
| `/api/enrollments/join` | Join using an invite code |
| `/api/stats` | Dashboard statistics |

### 6. Populate the tables with your own data

For working login accounts, use the application's registration flow. Complete the [frontend setup](#frontend), leave both servers running, and then:

1. Open **http://localhost:5173/register**. Register a Teacher with, for example, `teacher@example.com` and a password of at least eight characters.
2. Sign out and register a Student with, for example, `student@example.com`. Signup automatically signs the new user in.
3. Sign in and create a department, then a subject in that department, then a class assigned to the Teacher. Class creation requires a banner upload, so configure Cloudinary first.
4. Use **Enrollments** to assign a student to a class, or open `/enrollments/join` and enter the class's invite code as a Student.

Better Auth fills `user`, `account`, and `session` automatically. Create login accounts through signup so the password is hashed correctly. Public registration supports Student and Teacher roles. To make one of your own registered accounts an Admin, run this in the Neon SQL Editor, replacing the email:

```sql
UPDATE "user"
SET role = 'admin', updated_at = now()
WHERE email = 'your-registered-email@example.com';
```

Sign out and sign in again to refresh that account's session and displayed role.

#### Populate academic tables using SQL instead

After registering the Teacher and Student above, you can run the following in Neon's SQL Editor. Replace the example emails if you registered different ones. This creates a department, a subject, a class, and an enrollment in dependency order without requiring a banner upload.

```sql
INSERT INTO departments (code, name, description)
VALUES ('CS', 'Computer Science', 'Computing and software courses')
ON CONFLICT (code) DO NOTHING;

INSERT INTO subjects (department_id, name, code, description)
SELECT id, 'Introduction to Programming', 'CS101', 'Programming fundamentals'
FROM departments
WHERE code = 'CS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO classes (
    subject_id, teacher_id, invite_code, name,
    capacity, description, status, schedules
)
SELECT s.id, u.id, 'cs101-demo', 'Programming - Section A',
       30, 'Example programming class', 'active', '[]'::jsonb
FROM subjects AS s
CROSS JOIN "user" AS u
WHERE s.code = 'CS101'
  AND u.email = 'teacher@example.com'
  AND u.role = 'teacher'
ON CONFLICT (invite_code) DO NOTHING;

INSERT INTO enrollments (student_id, class_id)
SELECT u.id, c.id
FROM "user" AS u
CROSS JOIN classes AS c
WHERE u.email = 'student@example.com'
  AND u.role = 'student'
  AND c.invite_code = 'cs101-demo'
  AND NOT EXISTS (
      SELECT 1 FROM enrollments AS e
      WHERE e.student_id = u.id AND e.class_id = c.id
  );
```

The class and enrollment inserts depend on the registered accounts. If an insert affects zero rows, check the account emails and roles. PostgreSQL generates the numeric IDs; the queries look up related rows so you do not need to guess those IDs.

Verify the resulting data:

```sql
SELECT 'user' AS table_name, count(*) AS row_count FROM "user"
UNION ALL SELECT 'account', count(*) FROM account
UNION ALL SELECT 'session', count(*) FROM session
UNION ALL SELECT 'verification', count(*) FROM verification
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'subjects', count(*) FROM subjects
UNION ALL SELECT 'classes', count(*) FROM classes
UNION ALL SELECT 'enrollments', count(*) FROM enrollments;
```

#### Optional: load the repository's sample dataset

The repository also includes [seed/data.json](backend_classroom/seed/data.json) and [seed/seed.ts](backend_classroom/seed/seed.ts). Use this only on a disposable development database, before registering accounts you want to keep: **the seed script deletes all existing enrollments, classes, subjects, departments, sessions, accounts, and users before inserting data**. The process is not wrapped in a transaction.

From `backend_classroom/`, after migrating:

```bash
npm run db:seed
```

The current script inserts **18 users, 4 departments, 18 subjects, and 18 classes**, plus account rows. Its current limitations are:

- It stores the JSON passwords as plaintext and uses provider ID `credentials`. Better Auth's email/password provider expects `credential` and a password hash, so these seeded accounts cannot sign in through the current authentication flow. Register a new account with a different email for a working login.
- Although the JSON contains 27 enrollments, the script currently does not insert them. Add enrollments through the UI or SQL after seeding.
- Classes receive an empty schedules array, and their banner images use external URLs.

For example, after seeding, this inserts one enrollment using the dataset's stable user ID and class invite code:

```sql
INSERT INTO enrollments (student_id, class_id)
SELECT 'student_1', c.id
FROM classes AS c
WHERE c.invite_code = 'cs101-a'
  AND NOT EXISTS (
      SELECT 1 FROM enrollments AS e
      WHERE e.student_id = 'student_1' AND e.class_id = c.id
  );
```

To customize the sample JSON, keep references consistent: a subject's `departmentCode` must exist in `departments`, a class's `subjectCode` and `teacherId` must exist in `subjects` and `users`, and enrollment references must point to existing students and class invite codes. Editing the JSON does not change the seeder's authentication and enrollment limitations described above.

### Backend scripts and production build

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with automatic restart on source changes |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm test` | Run the authentication and frontend-origin tests |
| `npm run db:migrate` | Apply committed database migrations |
| `npm run db:generate` | Generate migrations after correcting the schema path described above |
| `npm run db:seed` | Replace development data with the sample dataset, with the limitations above |

Build and run the compiled backend:

```bash
npm run build
node dist/index.js
```

The current `npm start` script points to `dist/server.js`, but the compiler emits `dist/index.js`. Use the command above, or update `scripts.start` in `backend_classroom/package.json` to `node dist/index.js` before using `npm start` or deploying with that script.

## Frontend

### Technology stack

| Technology | Purpose |
| --- | --- |
| React 19 and TypeScript | Application UI |
| Vite 6 and Refine CLI | Development server and build tooling |
| Refine 5 | Resources, data fetching and authentication integration |
| React Router 7 | Client-side routing |
| Tailwind CSS 4, shadcn/ui and Radix UI | Styling and reusable UI components |
| React Hook Form and Zod | Forms and validation |
| TanStack React Table and Recharts | Data tables and dashboard charts |
| Better Auth client | Signup, login and session management |
| Cloudinary SDK and Upload Widget | Image uploads and delivery |
| Lucide React and Sonner | Icons and notifications |

### 1. Install dependencies

In a second terminal, from the repository root:

```bash
cd frontend_classroom
npm ci --legacy-peer-deps
```

The legacy peer-dependency flag is needed because this project uses React 19 and date-fns 4, while `react-day-picker@8` declares peer support for older versions. It allows npm to install the dependency versions recorded in the existing lockfile.

### 2. Configure environment variables

Create `frontend_classroom/.env` with:

```dotenv
VITE_BACKEND_BASE_URL=http://localhost:8000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

You can also start from `.env.example`, which currently contains only the backend URL, and add the Cloudinary variables.

| Variable | Required? | How to get or choose it |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | Yes | Your backend URL **including `/api`**. Use `http://localhost:8000/api` locally. |
| `VITE_CLOUDINARY_CLOUD_NAME` | For images | Copy the cloud name for your product environment from the Cloudinary Console. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | For uploads | Create an unsigned upload preset in Cloudinary and copy its name; see below. |

`src/constants/index.ts` also declares `VITE_CLOUDINARY_UPLOAD_URL`, `VITE_API_URL`, `VITE_ACCESS_TOKEN_KEY`, and `VITE_REFRESH_TOKEN_KEY`, but the current application does not use those constants for its active upload or authentication flows. You do not need to configure them.

Vite exposes `VITE_*` values to the browser and embeds them at build time. Use only public configuration here. Restart the development server after editing `.env`, and rebuild/redeploy after changing production variables.

### 3. Set up Cloudinary uploads

1. Sign in to the [Cloudinary Console](https://console.cloudinary.com/) and select your product environment. Copy its **cloud name** into `VITE_CLOUDINARY_CLOUD_NAME`.
2. Open **Settings → Upload → Upload presets**, and add a preset.
3. Set its signing mode to **Unsigned**, give it a name such as `classroom_uploads`, and save it. Set `VITE_CLOUDINARY_UPLOAD_PRESET` to that exact name.
4. Allow the image formats used by the widget: JPG, JPEG, PNG, and WebP. The current widget accepts a single file with a maximum size of **500,000 bytes**, despite the larger limit shown in its UI text.
5. Restart the frontend and test a profile photo or class banner upload.

The widget uploads directly from the browser using the cloud name and unsigned preset; a Cloudinary API secret is not required. See [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets) and [client-side uploading](https://cloudinary.com/documentation/client_side_uploading).

### 4. Run the frontend

With the backend already running:

```bash
npm run dev
```

Open **http://localhost:5173**. If Vite selects another port because `5173` is busy, free that port or update the backend's `FRONTEND_URL` to match and restart the backend.

The frontend sends resource requests to `VITE_BACKEND_BASE_URL`. Authentication requests use `/api/auth` on the frontend origin; `vite.config.ts` proxies this path to the backend during development. Keep `localhost` consistent in both applications instead of mixing it with `127.0.0.1`.

For a first local run, the order is: migrate the database, start the backend, start the frontend, register accounts, then populate academic data using the UI or SQL from the backend section.

### Frontend scripts and deployment

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend into `dist/` |
| `npm start` | Preview the built frontend locally |
| `npm run refine` | Run the Refine CLI |

To generate and preview the build:

```bash
npm run build
npm start
```

`npm start` runs Vite's local preview, normally at `http://localhost:4173`, and inherits the auth proxy from the Vite configuration. To test login there, set the backend's `FRONTEND_URL` to that preview origin and restart the backend. Restore `http://localhost:5173` when returning to the development server. A deployed static site needs its own `/api/auth/*` reverse proxy as described below.

For Vercel:

1. Set the project root to `frontend_classroom`.
2. Use `npm ci --legacy-peer-deps` as the install command, `npm run build` as the build command, and `dist` as the output directory.
3. Set the three frontend environment variables above. Point `VITE_BACKEND_BASE_URL` to your own deployed backend, including `/api`.
4. Update the `/api/auth/:path*` rewrite destination in `frontend_classroom/vercel.json` to your backend's `/api/auth/:path*`. The committed destination currently points to the original Railway deployment; changing the environment variable alone does not change that rewrite.
5. Set the backend's `FRONTEND_URL` to your deployed frontend origin, then restart/redeploy the backend and redeploy the frontend.

On another hosting provider, serve `dist/`, route client-side page URLs to `index.html`, and proxy `/api/auth/*` to the backend before applying the page fallback.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `DATABASE_URL is not defined` or `DATABASE_URL is not set` | Create `backend_classroom/.env` and run backend commands inside `backend_classroom/`. |
| Database connection or password error | Copy a fresh URI from Neon **Connect**, keep its SSL parameters, and confirm the selected branch, database, and role. |
| `relation ... does not exist` | Run `npm run db:migrate` against the database used by the backend. |
| Migration generation cannot find schema files | Correct `schema` to `./src/db/schema/index.ts` in `drizzle.config.ts`. |
| Frontend installation fails with `ERESOLVE` | Use `npm ci --legacy-peer-deps` inside `frontend_classroom/`. |
| CORS or untrusted-origin error | Match `FRONTEND_URL` to the browser's exact origin, including scheme and port, and restart the backend. |
| Signup/login fails only after deployment | Check the same-origin `/api/auth` rewrite, its backend destination, and the backend's `FRONTEND_URL`. |
| Sample users cannot log in | The current seeder stores incompatible credentials. Register a new user through `/register` with a different email. |
| Cloudinary upload fails | Check the cloud name, exact preset name, unsigned mode, allowed formats, and the widget's 500,000-byte limit. |
| `npm start` cannot find `dist/server.js` on the backend | Build first, then use `node dist/index.js`, or correct the start script. |

## License

This repository is licensed under the [MIT License](LICENSE).

