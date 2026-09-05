# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

LeaveEasy — a Thai-language online leave-request prototype built for the **ADT-RAISE Non-Degree Batch 2, Module 2** course (weeks 6–9). The student works alone in their own fork; the repo is graded week by week against `leaveeasy-spec.md`.

**Read `leaveeasy-spec.md` before making any feature change.** It is the authoritative spec: user roles, data schema, field names, status state machine, seed data, and — critically — **section 8 (weekly scope) and section 9 (explicitly out of scope)**. Do not implement a future week's work early (auth, full CRUD, security rules, AI button, tests) even if it seems like an obvious next step; the spec forbids it because it makes the assignment too big to grade. If asked to build something, check it against spec sections 8–9 first.

## Commands

- `npm run dev` — serves the static site at `http://localhost:3000` (via `serve`). There is no build step, bundler, linter, or test suite — it's plain HTML/CSS/JS served as-is.

## Architecture

**Static multi-page site, no framework, no server code of its own.** Each screen is its own `.html` file paired with one `.js` file of the same name:

| Page | Script |
|---|---|
| `index.html` | (none — static links only) |
| `leave-requests.html` | `js/leave-requests.js` |
| `new-leave-request.html` | `js/new-leave-request.js` |
| `leave-request-detail.html` | `js/leave-request-detail.js` |
| `leave-types.html` | `js/leave-types.js` |
| `seed.html` | `js/seed.js` |

Shared code: `js/nav.js` (renders the top nav bar into `<div id="nav">` on every page) and `js/util.js` (`esc`, `ป้ายสถานะ`, `เวลาตอนนี้`, `ค่าจากURL`) — both are plain scripts that define globals, not modules.

**Mixed module style, by design of the current migration state:** `js/leave-requests.js`, `js/new-leave-request.js`, `js/leave-request-detail.js`, and `js/seed.js` are native ES modules (`import`/`export`, loaded with `type="module"`) that talk to Firestore. The remaining page script (`leave-types.js`) is a plain IIFE that reads/writes `window.LEAVE_DATA` (from `js/data.js`) in memory only — nothing it does persists across a refresh. This is intentional and tracks the course's weekly rollout (see spec §8): as each page gets migrated to real Firestore reads/writes, its script changes from an IIFE over `LEAVE_DATA` to an ES module over `db`. Don't "fix" this inconsistency by migrating every page at once — migrate only the page a given week's task asks for.

**Firebase:** `js/firebase-config.js` exports `db`, a real Firestore instance for a live Firebase project. The `apiKey` embedded there is not a secret (safe to be client-side); actual access control is Security Rules, not yet written (spec §0.2, due week 7–8). `js/seed.js` is a one-time manual seeder (triggered by a button on `seed.html`) that writes the exact sample dataset from spec §7 into Firestore.

**Data model** — table design vs. actual Firestore layout are both documented in spec §5; keep them in sync mentally when editing:
- Collections: `users`, `leaveTypes`, `leaveRequests` (+ subcollection `leaveRequests/{id}/approvals`)
- `leaveRequests` denormalizes related names alongside their ids (`requesterId`+`requesterName`, `approverId`+`approverName`, `leaveTypeId`+`leaveTypeName`) because Firestore has no JOIN — always write both together, never just the id.
- Field names are case-sensitive and must match spec §5.2 exactly (`status`, not `Status`) — Firestore won't error on a typo'd field, it'll just silently create a new one.
- `js/data.js` mirrors this same shape as in-memory fake data (field-for-field identical to what's seeded into Firestore) so pages not yet migrated still render realistic data.

**Status state machine** (spec §6): `รอพิจารณา` (pending) → `อนุมัติ` (approved) or `ไม่อนุมัติ` (rejected), both terminal. Only the `status` field should ever be written during a transition — never overwrite the rest of the document. Setting status to `ไม่อนุมัติ` requires at least one existing `approvals` entry first.

## Code style conventions already in use

- Local variable and function names are Thai (e.g. `กล่อง`, `ใบลา`, `เปลี่ยนสถานะ`, `วาดตาราง`); data field names, collection names, and role values (`employee`/`manager`/`hr`) are always English, matching the spec. Follow this split when adding code — don't switch an existing file to all-English or all-Thai identifiers.
- No comments explaining *what* code does — existing files only comment *why* (course-week context, spec cross-references). Match that sparse style.
- HTML is escaped manually via `esc()` before insertion into `innerHTML` — always route user-supplied or Firestore-supplied strings through it.
