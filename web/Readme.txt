# SDS Web App

SDS Web App is a Direct Sales System admin panel designed to replace the original Google Sheets / Apps Script workflow with a structured web system backed by Supabase.

The system manages:

- Member registration
- Sponsor / genealogy relationships
- Bonus distribution
- Cash and product balances
- Redemptions
- Reporting dashboards

The architecture consists of:

Frontend (React + Vite)  
API Routes (Vercel Serverless Functions)  
Supabase PostgreSQL Database  
Supabase RPC Functions for business logic

---

# Architecture Overview

Frontend (React + Vite)

↓ API Requests

Vercel API Routes (web/api)

↓ Supabase Client

Supabase Database

↓ SQL Functions (RPC)

PostgreSQL Business Logic

---

# Repository Structure
.
├── package.json
├── package-lock.json
├── server
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── web
    ├── api
    │   ├── bonus-ledger
    │   ├── debug-env.js
    │   ├── health.js
    │   ├── members
    │   │   ├── create.js
    │   │   └── list.js
    │   └── reports
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── public
    │   └── vite.svg
    ├── README.md
    ├── src
    │   ├── App.css
    │   ├── App.jsx
    │   ├── assets
    │   ├── index.css
    │   ├── main.jsx
    │   └── pages
    ├── tailwind.config.js
    └── vite.config.js

---


---

# Root Files

## package.json

Defines metadata and dependencies for the project.

Purpose:

- lists dependencies
- defines scripts
- stores project metadata

Importance:

Without this file Node cannot install dependencies.

---

## package-lock.json

Locks dependency versions.

Purpose:

Ensures all environments install the same versions.

Importance:

Prevents dependency mismatch issues.

---

# Server Folder

This folder contains an Express backend implementation.

⚠️ Note: The deployed system mainly uses the Vercel API routes in `web/api`.

---

## server/package.json

Defines dependencies for the Express backend.

Common dependencies include:

- express
- cors
- pg
- dotenv

Importance:

Allows the backend server to run locally.

---

## server/package-lock.json

Locks dependency versions for the Express server.

---

## server/server.js

Main Express backend server.

Responsibilities:

- Member registration
- Bonus calculation
- Bonus ledger management
- Redemption handling
- Member bonus summary rebuilding

Important functions inside this file:

### nowPH()

Generates formatted timestamps.

Used when inserting records.

---

### q()

Helper for executing PostgreSQL queries.

Simplifies database access.

---

### getNextMemberId()

Generates the next sequential member ID.

Example:

2026EM000001  
2026EM000002

Ensures unique member identifiers.

---

### rebuildMemberBonusSummary(memberName)

Recalculates member bonus statistics.

Calculates:

- total cash issued
- redeemable cash
- redeemed cash
- product bonuses
- balances

Important rule:

Outright bonuses count in total cash  
but are excluded from redeemable balance.

---

### /api/registration

Handles member registration.

Responsibilities:

- validate input
- sponsor lookup
- genealogy level calculation
- regional manager assignment
- bonus distribution to uplines

---

### /api/redemptions

Processes redemption requests.

Checks balances before allowing redemption.

---

### /api/members

Returns list of registered members.

Used by the admin UI.

---

# Web Folder

The web folder contains the **frontend application and API routes**.

---

# API Folder

Contains serverless API endpoints used by the frontend.

These endpoints run on Vercel.

---

## web/api/debug-env.js

Debug endpoint used to check environment variables.

Helps verify:

- Supabase connection
- deployment configuration

Importance:

Useful during development and troubleshooting.

---

## web/api/health.js

Health check endpoint.

Returns a simple response confirming the API is running.

Importance:

Useful for monitoring and deployment checks.

---

# Members API

## web/api/members/create.js

Handles member registration from the website.

Responsibilities:

- receives POST request from frontend
- validates input
- normalizes values
- calls Supabase RPC function `register_member`

Important note:

The actual business logic is implemented inside the database function:

register_member()

Importance:

Acts as the bridge between the frontend form and database logic.

---

## web/api/members/list.js

Returns a list of members.

Used by the Members page.

Responsibilities:

- query Supabase members table
- return sorted member list

---

# Bonus Ledger API

## web/api/bonus-ledger/

Handles bonus ledger queries.

Responsibilities:

- fetch bonus ledger records
- display bonus distribution history

Importance:

Used to audit bonus distribution.

---

# Reports API

## web/api/reports/

Handles report generation.

Examples:

- Member Report
- Regional Report

Responsibilities:

- aggregate bonus ledger data
- calculate totals
- return report data to frontend

---

# Frontend (web/src)

This folder contains the React application.

---

## web/src/main.jsx

Application entry point.

Responsibilities:

- bootstraps the React application
- mounts React to the HTML DOM

---

## web/src/App.jsx

Main application layout.

Responsibilities:

- sidebar navigation
- routing between pages
- global layout structure

---

## web/src/App.css

Global styles used by the main application.

---

## web/src/index.css

Base CSS styles.

Often includes Tailwind base styles.

---

## web/src/assets/

Contains static frontend assets.

Examples:

- icons
- images
- logos

---

# Pages

The `pages` folder contains UI pages used in the admin panel.

Examples may include:

- Dashboard
- Registration
- Members
- Bonus Ledger
- Sales Entry
- Member Report
- Regional Report
- Redemptions

Each page typically:

- fetches data from API routes
- displays tables or reports
- allows admin actions

---

# Frontend Configuration

## web/index.html

Main HTML entry file used by Vite.

Contains the root DOM element where React is mounted.

---

## web/package.json

Defines dependencies used by the frontend.

Examples:

- react
- vite
- tailwind
- supabase-js

---

## web/package-lock.json

Locks frontend dependency versions.

---

## web/tailwind.config.js

Tailwind CSS configuration.

Defines:

- theme
- colors
- utility extensions

---

## web/postcss.config.js

Configures PostCSS processing.

Used by Tailwind CSS.

---

## web/vite.config.js

Vite build configuration.

Controls:

- development server
- build settings
- plugin configuration

---

# Deployment

Frontend and API routes are deployed through Vercel.

Database and RPC logic run on Supabase.

---

# Key Design Principle

Business logic is implemented inside the database.

Example:

register_member()

This ensures:

- atomic operations
- consistent bonus calculations
- safer concurrency handling

---

# Summary

This system replaces manual spreadsheet workflows with a scalable web-based system for managing a direct sales organization.
