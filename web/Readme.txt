# SDS Web App

SDS Web App is the web frontend and serverless API layer of the SDS Direct Sales System.

This project is designed to replace the original spreadsheet-based workflow with a structured web application connected to Supabase.

The system handles:

- Member registration
- Sponsor / genealogy relationships
- Regional Manager assignment
- Bonus distribution
- Product and package sales
- Cash and product redemption workflow
- Reporting dashboards
- Role-based access (Super Admin, Admin, RM, Member)

==================================================
1. HIGH-LEVEL ARCHITECTURE
==================================================

Frontend:
React + Vite + Tailwind CSS

Backend:
Vercel-style serverless API routes inside web/api

Database:
Supabase PostgreSQL

Business Logic:
Mostly enforced in API routes and PostgreSQL / RPC functions

Flow:

React UI
  ↓
web/api/*
  ↓
Supabase PostgreSQL
  ↓
Tables + SQL functions (RPC)

IMPORTANT:
This folder (web/) contains both:
- the frontend React app
- the deployed API route layer

==================================================
2. ACTUAL PROJECT STRUCTURE
==================================================

web/
├── README.md
├── Readme.txt
├── api
│   ├── auth.js
│   ├── bonus-ledger
│   │   └── list.js
│   ├── debug-env.js
│   ├── health.js
│   ├── members.js
│   ├── products.js
│   ├── redemptions.js
│   ├── registration-codes.js
│   ├── reports.js
│   ├── rm-rebates.js
│   └── sales.js
├── dist
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
│   └── vite.svg
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── assets
│   │   └── react.svg
│   ├── index.css
│   ├── main.jsx
│   └── pages
│       ├── BonusLedger.jsx
│       ├── Dashboard.jsx
│       ├── Login.jsx
│       ├── MemberReport.jsx
│       ├── Members.jsx
│       ├── MyBonuses.jsx
│       ├── ProductCatalog.jsx
│       ├── Profile.jsx
│       ├── RMRebates.jsx
│       ├── Redemptions.jsx
│       ├── RegionalReport.jsx
│       ├── Registration.jsx
│       ├── RegistrationCodes.jsx
│       ├── Reports.jsx
│       └── SalesEntry.jsx
├── tailwind.config.js
└── vite.config.js

==================================================
3. ROOT-LEVEL FILES
==================================================

README.md
- General markdown readme for the web app
- Can be used for GitHub landing page

Readme.txt
- Plain-text documentation
- Intended for internal understanding, transfer to another device, or onboarding

eslint.config.js
- ESLint configuration for code quality

index.html
- Main Vite HTML file
- Contains the root element where React mounts

package.json
- Project metadata
- Frontend dependencies
- Scripts such as dev/build/preview

package-lock.json
- Locks installed dependency versions

postcss.config.js
- PostCSS configuration
- Used together with Tailwind CSS

tailwind.config.js
- Tailwind CSS configuration

vite.config.js
- Vite bundler configuration

==================================================
4. BUILD OUTPUT
==================================================

dist/
- Generated build output
- Created when the frontend is built
- Not source code

Contents usually include:
- bundled JS
- bundled CSS
- production HTML

IMPORTANT:
This folder should not be treated as the source of truth.
The source of truth is in src/ and api/.

==================================================
5. PUBLIC ASSETS
==================================================

public/
- Static files served directly by Vite / frontend build
- Currently contains vite.svg

src/assets/
- Frontend asset files imported by React components
- Currently contains react.svg

==================================================
6. FRONTEND ENTRY FILES
==================================================

src/main.jsx
- React application entry point
- Mounts the App component into the DOM

src/App.jsx
- Main application shell
- Handles:
  - auth check on load
  - role-based navigation
  - sidebar layout
  - page switching
- This is the main UI controller of the system

src/App.css
- Additional app-specific CSS

src/index.css
- Global CSS
- Usually includes Tailwind base layers and shared styling

==================================================
7. FRONTEND PAGES
==================================================

All pages are under:
src/pages/

----------------------------------
Dashboard.jsx
----------------------------------
Purpose:
- Main landing page after login

Behavior:
- For admin/super admin:
  - acts as admin overview dashboard
- For rm/normal:
  - acts as personal dashboard

Typical content:
- member summary
- balances
- recent sales / hierarchy overview

----------------------------------
Login.jsx
----------------------------------
Purpose:
- Login page

Behavior:
- submits credentials to /api/auth
- stores authenticated session via cookie
- redirects to main app layout after success

----------------------------------
Registration.jsx
----------------------------------
Purpose:
- Register a new member

Behavior:
- collects name, contact, email, membership type, address
- handles sponsor selection
- handles package selection
- requires registration code
- for privileged users:
  - sponsor may be SDS
  - RM may need to be manually selected
- for RM/normal:
  - sponsor is locked to the logged-in linked member

Important:
- registration calls /api/members
- registration is expected to be atomic

----------------------------------
Members.jsx
----------------------------------
Purpose:
- Display member list

Behavior:
- shows member data for admin/super admin
- used for monitoring and future editing workflow

Typical fields:
- member_id
- name
- membership_type
- sponsor_name
- regional_manager
- package_name
- created_at

----------------------------------
BonusLedger.jsx
----------------------------------
Purpose:
- Display all bonus ledger entries

Behavior:
- audit trail of bonus distribution
- useful for validation and debugging

----------------------------------
SalesEntry.jsx
----------------------------------
Purpose:
- Submit product and package sales

Behavior:
- supports both products and packages
- role-aware:
  - admin can choose members
  - RM/normal are restricted to their linked member
- writes through /api/sales

Important:
- item_type and item selection are part of the flow
- pricing is derived from membership type

----------------------------------
ProductCatalog.jsx
----------------------------------
Purpose:
- Manage products and packages

Behavior:
- add/edit product catalog items
- supports both item types:
  - product
  - package

Access:
- intended for super admin

----------------------------------
RegistrationCodes.jsx
----------------------------------
Purpose:
- Manage registration codes

Behavior:
- create, list, and monitor codes
- codes are used during member onboarding

Access:
- intended for super admin

----------------------------------
Reports.jsx
----------------------------------
Purpose:
- General reporting entry page

Behavior:
- consolidated reporting UI
- may link to detailed member/regional reports

----------------------------------
MemberReport.jsx
----------------------------------
Purpose:
- Member-level report

Behavior:
- shows bonus totals
- shows redemption effect on balances
- likely uses /api/reports?type=member

Important:
- should respect redemption status logic
- rejected redemptions should not reduce balance

----------------------------------
RegionalReport.jsx
----------------------------------
Purpose:
- Regional Manager-level report

Behavior:
- downline summary
- cash bonus / product bonus / rebates visibility
- likely uses /api/reports?type=regional

----------------------------------
Redemptions.jsx
----------------------------------
Purpose:
- Redemption workflow UI

Behavior for RM / Member:
- submit redemption request
- view own history and status

Behavior for Admin / Super Admin:
- view all requests
- approve
- release
- reject

Types:
- Cash
- Product

Expected statuses:
- pending
- approved
- released
- rejected

Important:
- rejected should not deduct balance
- pending/approved/released should count against balance

----------------------------------
RMRebates.jsx
----------------------------------
Purpose:
- View RM rebate records

Behavior:
- shows rebate history
- primarily for admin/super admin visibility

----------------------------------
MyBonuses.jsx
----------------------------------
Purpose:
- Personal bonus view for RM / Member

Behavior:
- shows self-only bonus data
- intended for restricted account roles

----------------------------------
Profile.jsx
----------------------------------
Purpose:
- Personal account / member profile page

Behavior:
- shows linked account information
- likely reads member data using member_id from auth session

==================================================
8. API ROUTES
==================================================

All backend API files are under:
api/

These routes act as the backend layer used by the React frontend.

----------------------------------
api/auth.js
----------------------------------
Purpose:
- Authentication endpoint

Responsibilities:
- login
- logout
- current session check

Important behavior:
- uses JWT
- stores token in cookie
- returns role and linked member_id

----------------------------------
api/members.js
----------------------------------
Purpose:
- Member read and member registration endpoint

GET:
- list members
- fetch member by member_id

POST:
- register a member
- validate sponsor flow
- validate RM rules
- call RPC function for atomic creation

Important:
- handles role-aware sponsor restrictions
- handles manual RM selection for privileged SDS registration flow

----------------------------------
api/products.js
----------------------------------
Purpose:
- Product and package catalog endpoint

Responsibilities:
- fetch product list
- fetch package list
- create/update product catalog entries depending on implementation

Important:
- item_type is used to distinguish:
  - product
  - package

----------------------------------
api/sales.js
----------------------------------
Purpose:
- Sales API

GET:
- read sales records
- restricted users only see their own

POST:
- submit sales entry
- supports both products and packages
- uses item_id/item lookup
- computes pricing based on membership type

Important:
- writes to sales_ledger
- item_type should be stored correctly

----------------------------------
api/redemptions.js
----------------------------------
Purpose:
- Redemption API

GET:
- list redemptions
- restricted users see only their own records
- admin can view all

POST:
- submit redemption request

PUT:
- admin / super admin status actions:
  - approve
  - release
  - reject

Important:
- redemption status affects balance logic
- rejected records should not count against balance

----------------------------------
api/reports.js
----------------------------------
Purpose:
- Reporting API

Responsibilities:
- member reports
- regional reports
- bonus and redemption aggregation

Important:
- must subtract only valid redemption states:
  - pending
  - approved
  - released
- must ignore rejected

----------------------------------
api/registration-codes.js
----------------------------------
Purpose:
- Registration code management endpoint

Responsibilities:
- create codes
- list codes
- manage active/used status

----------------------------------
api/rm-rebates.js
----------------------------------
Purpose:
- RM rebate API

Responsibilities:
- fetch rebate records
- support RM rebate reporting

----------------------------------
api/bonus-ledger/list.js
----------------------------------
Purpose:
- Return bonus ledger records

Responsibilities:
- list ledger entries for auditing and UI display

----------------------------------
api/health.js
----------------------------------
Purpose:
- Health check endpoint

Responsibilities:
- confirm API is alive

Useful for:
- deployment testing
- environment verification

----------------------------------
api/debug-env.js
----------------------------------
Purpose:
- Debug environment variables / backend config

Useful for:
- troubleshooting deployment
- confirming Supabase variables are loaded

IMPORTANT:
- should not remain exposed publicly in production unless intentionally protected

==================================================
9. DATABASE TABLES USED BY THIS WEB APP
==================================================

Main tables referenced by the current system include:

members
- member profile / hierarchy data

app_accounts
- login accounts and roles

registration_codes
- onboarding code inventory and usage

product_catalog or products
- product and package master data

sales_ledger
- sales records

bonus_ledger
- bonus transaction records

redemptions
- redemption requests and status history

rm_rebates_ledger
- RM rebate transactions

IMPORTANT:
Exact table names should match the current Supabase schema.
If schema changes, this documentation should be updated too.

==================================================
10. CORE BUSINESS RULES
==================================================

----------------------------------
Registration
----------------------------------
- registration requires package + registration code
- registration should be atomic
- if any part fails:
  - no member should be created
  - no account should remain partially created
  - no code should be consumed

----------------------------------
Sponsor rules
----------------------------------
- RM / normal users cannot freely choose sponsor
- sponsor is locked to their linked member
- admin / super admin may register under SDS

----------------------------------
Regional Manager rules
----------------------------------
- if sponsor is SDS and membership type is not Regional Manager:
  - RM must be manually selected by admin/super admin
- if membership type is Regional Manager:
  - RM should resolve to self

----------------------------------
Sales rules
----------------------------------
- supports both products and packages
- pricing depends on membership type
- restricted users submit only for themselves

----------------------------------
Redemption rules
----------------------------------
- RM / normal can submit
- admin / super admin manage statuses
- only pending / approved / released count against balance
- rejected should restore or not deduct balance

==================================================
11. SETUP ON A NEW DEVICE
==================================================

Step 1:
Install dependencies

From project root:
npm install

From web folder:
npm install

Step 2:
Set environment variables

Required:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SDS_AUTH_SECRET

Step 3:
Run development server

Typical command:
npm run dev

==================================================
12. RESETTING DATA FOR FRESH TESTING
==================================================

Use with caution in development only.

Typical reset pattern:

set session_replication_role = replica;

truncate table
  public.redemptions,
  public.sales_ledger,
  public.bonus_ledger,
  public.members,
  public.app_accounts,
  public.registration_codes
restart identity cascade;

set session_replication_role = default;

IMPORTANT:
This deletes all accounts too, including admin/super_admin.

==================================================
13. ACCOUNT CREATION NOTES
==================================================

Passwords must use bcrypt.

Do NOT use:
- SQL crypt()

Use:
- bcryptjs hash generation in Node

Example workflow:
1. generate bcrypt hash
2. insert into app_accounts

System-level admin accounts typically use:
- member_id = null

That means:
- they can log in
- they are not part of member genealogy

==================================================
14. COMMON TROUBLESHOOTING
==================================================

Login fails
- password likely not hashed with bcrypt
- account may be inactive

Registration fails
- registration code missing / inactive / already used
- package missing
- RM missing when sponsor is SDS
- RPC function signature mismatch

Sales insert fails
- item_type column missing
- item_id invalid
- member linkage missing

Redemption page fails
- redemptions table missing required status / audit columns
- role restrictions not satisfied

Balances look wrong
- reports.js likely still subtracts rejected redemptions

==================================================
15. IMPORTANT DEVELOPMENT NOTES
==================================================

- dist/ is generated output, not source code
- source code lives in src/ and api/
- App.jsx controls page rendering and role-based navigation
- documentation must be updated whenever:
  - a new API file is added
  - a new page is added
  - schema changes
  - business rules change

==================================================
16. SUMMARY
==================================================

This web app is the operational UI + API layer of the SDS Direct Sales System.

It provides:
- role-based access
- member onboarding
- sales
- bonuses
- redemptions
- reports

The main goal is to replace manual spreadsheet operations with a scalable and maintainable web system.
