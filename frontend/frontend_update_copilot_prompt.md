# Frontend Update: Organizer System, Verification, and Super Admin — Copilot Build Prompt

## CRITICAL — READ FIRST

You are updating the **existing frontend application** for Ximacent, a Ghana-based voting platform. The backend API has already been extended with a full organizer registration/verification system, election approval workflow, email + phone (OTP) verification, password reset, and a super_admin role tier. **None of this exists in the UI yet.**

**DO NOT modify anything in the `api` folder (the backend).** If, at any point, you believe a change to the backend is required to complete this work — a missing endpoint, a field that doesn't exist, a response shape that doesn't fit — **stop and ask me before touching it.** Do not silently add, remove, or rename any backend route, DTO, or entity field to make the frontend easier to build. The backend is a separate, already-reviewed system.

**DO NOT rewrite unrelated code.** This is an existing, working application. Preserve existing:
- Design system / component library / styling approach
- State management approach (whatever is already used — don't introduce a new one)
- Routing structure and conventions
- API client / fetch wrapper pattern already in place
- Existing voter-facing pages and flows (browsing elections, voting, payment) — untouched unless explicitly listed below

**Work in phases, in the order listed below. After each phase, stop and show me what you built before starting the next phase.** Do not run ahead and build everything in one pass — I want to review and raise concerns phase by phase, the same way we built the backend.

**Engineering bar for every phase:**
- Responsive on mobile, tablet, and desktop — test all three, don't just resize the browser once
- Loading states for every async action (buttons show a spinner/disabled state while a request is in flight — never a dead click)
- Error states that show the actual backend error message where one exists (see "API response shape" below) — never a silent failure or a generic "something went wrong" when the API gave you something more specific
- No unnecessary re-renders, no blocking the main thread, no layout shift from images/content loading in
- Accessible: proper form labels, keyboard navigation, focus states, sufficient color contrast
- At the end of the LAST phase, do a performance pass: check bundle size impact of anything new you added, confirm no unnecessary client-side data over-fetching, confirm images (Ghana Card previews, banners) are properly sized/lazy-loaded, and report back what you checked.

---

## PHASE 0 — Inspect First, Don't Code Yet

Before writing anything, inspect the existing frontend codebase and tell me:

1. What framework/meta-framework is this (Next.js? Vite+React? Something else), and what routing convention does it use?
2. What's the existing design system — a component library (shadcn, MUI, Chakra, custom), and what are the established patterns for forms, buttons, modals, tables, and toasts/notifications?
3. How does the app currently store and attach the auth token to requests? (localStorage, cookies, a context/provider?)
4. What does the existing admin dashboard currently look like — list its pages/sections, since several phases below will extend or adjust it rather than build from scratch.
5. Is there an existing pattern for role-based route protection (e.g., redirecting a non-admin away from `/admin/*`)? Show me how it currently works.
6. Is there an existing API client wrapper (e.g., a `fetchApi()` helper, an Axios instance, React Query/SWR hooks)? Show me the pattern so new code matches it exactly rather than introducing a second, inconsistent way of calling the API.

**Give me this summary and wait for my confirmation before starting Phase 1.**

---

## API REFERENCE — Everything New, Grouped by Area

All responses follow this envelope (confirm this matches what you see in the existing client — if the existing app already unwraps this, use the same pattern):
```json
{
  "success": true,
  "code": "XMC_S2000",
  "message": "Operation done successfully",
  "data": { /* ... */ },
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```
Auth: `Authorization: Bearer <accessToken>` header on every authenticated request. Public endpoints are marked explicitly.

### Auth & Registration
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{ firstName, lastName, email, password, phone, role }` | `role` is `"voter"` or `"organizer"`. Anything else silently becomes `"voter"` — validate on the client so users don't hit this surprise. Returns `accessToken`/`refreshToken` immediately — the user is logged in right after registering, before verifying anything. |
| POST | `/auth/login` | public | `{ email, password }` | Returns `user.emailVerified`, `user.phoneVerified`, `user.role` — use these to route the user correctly after login. |

### Email Verification
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/verify-email` | public | `{ email, otp }` | 6-digit code, 10 min expiry. |
| POST | `/auth/resend-verification` | public | `{ email }` | Always returns success even if the email doesn't exist — don't treat this as confirmation the email exists. |

### Phone Verification
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/request-phone-verification` | authenticated | none | Sends OTP to the logged-in user's own phone. No phone number is passed in the body — it uses whatever's on the account. |
| POST | `/auth/verify-phone` | authenticated | `{ otp }` | |

### Password
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/change-password` | authenticated | `{ currentPassword, newPassword }` | For a logged-in user changing their own password (e.g. from a profile/settings page). |
| POST | `/auth/request-password-reset` | public | `{ email }` | "Forgot password" entry point. |
| POST | `/auth/reset-password` | public | `{ email, otp, newPassword }` | |

### User Profile (self) & Admin User Management
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| GET | `/users/:id` | self, or admin/super_admin viewing anyone | none | Use `:id` = the logged-in user's own id for "my account" views. |
| PATCH | `/users/:id` | self, or admin-tier managing a non-admin target | `{ firstName?, lastName?, phone? }` | Self-editable fields only — role can never be changed here. |
| PATCH | `/users/:id/verify-email` | admin/super_admin | none | Manual override — no OTP. Support-tool use case, put it somewhere in an admin user-detail view, not prominent. |
| PATCH | `/users/:id/role` | **super_admin only** | `{ role: "voter" \| "organizer" \| "admin" \| "super_admin" }` | Promote or demote — same endpoint either direction. Can fail with a specific error if it would leave zero super_admin accounts — surface that message clearly, don't let the user think it silently failed. |
| GET | `/users` | admin/super_admin | query: `?search=&phone=&role=&isVerified=&page=&limit=` | |
| POST | `/users` | admin (voter/organizer only) / super_admin (any role) | `{ firstName, lastName, email, password, phone, role }` | A regular admin gets a 403 if they try `role: "admin"` or `"super_admin"` here — surface that error clearly rather than letting the form silently fail. |
| DELETE | `/users` | admin-tier, with restrictions | `{ ids: [...] }` | Regular admin gets 403 if the batch includes any admin/super_admin account — **the whole batch is rejected, not partially applied.** Build the UI so a failed bulk-delete clearly shows nothing was deleted, not "some were deleted." |

### Organizer — Self-Service (this is the core of the new organizer dashboard)
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| GET | `/organizers/me` | organizer | none | Full profile. |
| GET | `/organizers/me/status` | any authenticated | none | Lightweight: `{ role, emailVerified, verificationStatus, canCreateElection, rejectionReason }`. **Poll/fetch this to drive the entire organizer dashboard's gating logic** — what to show, what to enable, what banners to display. |
| PATCH | `/organizers/me` | organizer | JSON **or** multipart/form-data | JSON body: `{ organizationName?, organizationType?, region?, city?, organizationPhone?, website?, socialMediaUrl?, description?, ghCardNumber? }`. `organizationType` is an enum: `individual \| company \| ngo \| school \| church \| government \| other`. **Or** send `multipart/form-data` with the same fields as form entries PLUS a `ghCardImage` file field, to submit the whole profile + Ghana Card photo in one request. Blocked (400) once `verificationStatus` is `approved` or `suspended`. |
| PATCH | `/organizers/me/gh-card-image` | organizer | multipart/form-data, field `ghCardImage` (file) | Image-only update, for replacing just the photo later without resubmitting text fields. |
| POST | `/organizers/me/submit` | organizer | none | Submits for admin review. **Fails with a 400 listing exactly what's missing** if the profile is incomplete OR if `emailVerified`/`phoneVerified` aren't both true yet — e.g. `"Complete the following before submitting: phone verification, ghCardNumber"`. Parse and display this list item-by-item, don't just show the raw message. |

**Organizer verification states** (`verificationStatus` on the profile): `not_started → pending → approved | rejected` (rejected can resubmit → back to `pending`), `approved → suspended` (admin action). Build distinct UI treatment for each state — see Phase 4.

### Organizer — Admin Review
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| GET | `/organizers` | admin/super_admin | query: `?verificationStatus=pending&search=&page=&limit=` | List/queue view. |
| GET | `/organizers/:id` | admin/super_admin | none | Full detail, including the Ghana Card image URL and number — for the admin to actually look at during review. |
| PATCH | `/organizers/:id/approve` | admin/super_admin | none | |
| PATCH | `/organizers/:id/reject` | admin/super_admin | `{ rejectionReason }` | **Required, non-empty.** Make this a required textarea in the UI, don't let the button submit without it. |
| PATCH | `/organizers/:id/suspend` | admin/super_admin | none | |
| PATCH | `/organizers/:id/override-status` | **super_admin only** | `{ verificationStatus, reason }` | Bypasses the normal flow entirely — can jump straight from any status to any other. This is a "fix a mistake" tool, not a normal review action — see Phase 8 for how to present this so it isn't confused with the normal approve/reject buttons. |

### Elections — Creation & Management
| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| GET | `/elections` | any authenticated | query: `?title=&status=&createdById=&page=&limit=` | For an organizer's "my elections" view, pass `createdById` = their own user id. |
| POST | `/elections` | organizer (must be `approved`) or admin-tier | `{ title, description?, startDate, endDate, pricePerVote }` | `createdBy` is always the logged-in user — never send it. If the organizer isn't approved yet, this 403s — the UI should already prevent reaching this action (gate the "Create Election" button on `canCreateElection` from the status endpoint) rather than relying on the error. |
| GET | `/elections/:id` | any authenticated | none | |
| PATCH | `/elections/:id` | owning organizer (while `approved`) or admin-tier | `{ title?, description?, startDate?, endDate?, pricePerVote? }` | **Only editable while status is `draft` or `rejected`** — the backend rejects edits at any other status; disable the edit form accordingly rather than letting the user fill it out and then fail. |
| DELETE | `/elections` | admin/super_admin | `{ ids: [...] }` | |
| PATCH | `/elections/:id/banner` | admin/super_admin | multipart/form-data | Unchanged — still admin-only, organizers cannot set their own election banner currently (flag this to me if you think that's wrong; don't just add organizer access to it yourself). |

### Elections — Status Workflow
One endpoint, different allowed values depending on who's calling:
| Method | Path | Access | Body |
|---|---|---|---|
| PATCH | `/elections/:id/status` | owning organizer or admin-tier | `{ status, rejectionReason? }` |

**State machine** — build the UI to only ever offer the actions that are actually valid from the current state:
```
draft          -> pending_review          (organizer "Submit for Review" button)
pending_review -> approved | rejected      (admin only -- "Approve" / "Reject" buttons)
rejected       -> pending_review           (organizer edits, then "Resubmit" button)
approved       -> active                   (admin only -- "Launch" button)
active         -> closed                   (admin only -- "Close" button)
```
`rejectionReason` is required when setting `status: "rejected"`. There is **no** `draft -> active` transition for anyone — don't build a "publish directly" shortcut, it will always fail.

| Method | Path | Access | Body |
|---|---|---|---|
| PATCH | `/elections/:id/override-status` | **super_admin only** | `{ status, reason }` |

Same "fix a mistake" pattern as the organizer override — bypasses the state machine entirely.

### Audit Log
| Method | Path | Access | Body |
|---|---|---|---|
| GET | `/audit-logs` | **super_admin only** | query: `?actorUserId=&action=&entityType=&entityId=&page=&limit=` |

Returns a paginated list of every tracked action across the platform (organizer approvals, election status changes, role changes, etc.), each with `actorUserId`/actor name, `action`, `entityType`, `entityId`, `metadata`, `createdAt`. This is a **super_admin-exclusive oversight tool** — see Phase 8.

### Existing endpoints, unchanged behavior, but now also accept super_admin
`/categories`, `/nominees`, `/dashboard` and their sub-routes are unchanged in shape — just confirm any hardcoded `role === 'admin'` checks in the existing frontend also accept `'super_admin'`, or they'll incorrectly block a super admin from using pages a regular admin can already access.

---

## PHASE 1 — Landing Page & Auth Entry Points

- Add an **"Organizer Log In"** (or "Become an Organizer" / "Organizer Portal" — use your judgment on exact wording, but it needs to be a distinct, visible entry point from the main landing page, not buried) that leads to a registration/login flow where `role: "organizer"` is set.
- Registration form: collect `firstName, lastName, email, password, phone`, with role implicitly `"organizer"` on this entry point (don't show a role dropdown here — a separate voter signup flow presumably already exists; don't touch it).
- After successful registration, redirect straight into the organizer dashboard (they're already logged in per the API response) — don't force a separate login step.
- Login form: after success, route based on `user.role` — `organizer` -> organizer dashboard, `admin`/`super_admin` -> admin dashboard, `voter` -> wherever voters currently land (don't change this).

**Stop here and show me this phase before continuing.**

---

## PHASE 2 — Verification Flows

Build a verification flow that appears right after an organizer registers/logs in if `emailVerified` or `phoneVerified` is false:

- Email OTP entry screen: 6-digit input, "Verify" button, "Resend code" link/button (rate-limited server-side — handle the 429 response gracefully with a clear "please wait" message, ideally with a countdown using the retry-after info if you can derive it, otherwise just a disabled state for a reasonable interval).
- Phone OTP entry screen: same pattern, using `/auth/request-phone-verification` and `/auth/verify-phone`.
- Show both as steps the organizer can complete in either order, not necessarily forced sequentially — the backend doesn't require one before the other.
- Once both are true, let them proceed into the rest of the dashboard. Don't hard-block navigation elsewhere in the dashboard if they skip this — just show a persistent banner/reminder (e.g., "Verify your phone to continue your application") since submission itself will be blocked server-side regardless with a clear message.

**Stop here and show me this phase before continuing.**

---

## PHASE 3 — Password (Change & Forgot)

- Add a "Forgot password?" link on the login form -> request-reset (email input) -> reset (OTP + new password) flow, public, no auth required.
- Add a "Change password" section somewhere sensible in account settings (current password + new password fields) for logged-in users of any role — this isn't organizer-specific.

**Stop here and show me this phase before continuing.**

---

## PHASE 4 — Organizer Dashboard: Profile & Application

Build the organizer's profile/application section:
- A form for all `OrganizerProfile` fields (see PATCH `/organizers/me` above), including `ghCardImage` upload with a preview of the selected image before submitting.
- Clear status indicator matching `verificationStatus`: `not_started` (prompt to complete profile), `pending` (awaiting review, no action needed), `approved` (green, unlocked), `rejected` (red, show `rejectionReason` prominently, allow editing + resubmit), `suspended` (red, explain they've lost election privileges, no edit allowed — matches the backend's edit-lock).
- The form fields themselves should be disabled/read-only once `approved` or `suspended`, matching the backend's actual restriction — don't let someone fill out a form that will just 400 on submit.
- "Submit Application" button — call `/organizers/me/submit`, and if it 400s with a "missing: ..." list, parse it and highlight the specific missing fields in the form rather than just toasting the raw error string.

**Stop here and show me this phase before continuing.**

---

## PHASE 5 — Organizer Dashboard: Election Management

Build (or adapt from existing admin election-management UI, if one already exists and the components are reusable):
- "My Elections" list, scoped to the organizer's own (`createdById` = self).
- Create election form — only reachable/enabled if `canCreateElection` is true from the status endpoint; otherwise show why not (e.g., "Your organizer account must be approved first").
- Edit election form — only enabled while `status` is `draft` or `rejected`.
- Category and nominee management for their own elections (existing admin functionality, likely reusable — confirm the existing category/nominee endpoints don't have an ownership check yet; if they don't, an organizer editing categories on someone else's election would currently succeed at the API level, so the frontend should only ever construct these requests using the organizer's own election ids as a practical safeguard, but **flag this to me** — this may need a backend fix, don't add one yourself).
- Status action buttons that match the state machine exactly: "Submit for Review" (draft/rejected -> pending_review) is the only status action an organizer can take — no "Launch"/"Close"/"Approve" buttons should ever appear on the organizer side, those are admin-only.
- Show `rejectionReason` clearly if an election comes back rejected, same pattern as the organizer profile rejection.

**Stop here and show me this phase before continuing.**

---

## PHASE 6 — Organizer Dashboard: Overview / Analytics

Reference the existing admin dashboard's overview page for the general pattern (metric cards, charts, top-performer lists) — build the organizer equivalent, scoped to only their own elections:
- Total votes / revenue across their elections
- Per-election breakdown (votes, revenue, days remaining)
- Top nominees across their elections (by votes)
- Election status breakdown (how many draft/pending/active/closed)

If the existing `/dashboard` endpoint doesn't support filtering by `createdById` or an organizer-scoped view, **don't modify it yourself** — tell me, and I'll extend the backend if needed.

**Stop here and show me this phase before continuing.**

---

## PHASE 7 — Admin Dashboard Adjustments

- Add an **organizer review queue** page: list from `GET /organizers?verificationStatus=pending`, with approve/reject (reason required)/suspend actions, and a detail view showing the full profile including the Ghana Card image for the admin to actually look at.
- Update the existing election review UI to match the new state machine — `pending_review` is now a real state elections sit in before an admin can approve/reject them; `approved` is a distinct state from `active`. If the current admin UI treats `draft -> active` as a single "publish" action, that flow no longer matches the backend and needs updating to the two-step approve-then-launch flow.
- Confirm every existing admin-only page/action also works for `super_admin` (see the note at the end of the API reference above) — a super admin shouldn't be locked out of anything a regular admin can already do.

**Stop here and show me this phase before continuing.**

---

## PHASE 8 — Super Admin Exclusive Capabilities

These are net-new UI, only visible/reachable for `role === 'super_admin'`:
- **User role management**: a way to view a user and change their role via `PATCH /users/:id/role`. Surface the "would leave zero super admins" error clearly if it happens — this is a real safety rail, not a bug, so the copy should explain why, not just say "failed."
- **Audit log viewer**: a searchable/filterable table (by actor, action, entity type, entity id, paginated) backed by `GET /audit-logs`. This is the actual point of the super_admin tier — make it genuinely usable for "what has this specific admin been doing," not just a raw dump.
- **Override actions**: on an organizer detail page and an election detail page, a clearly-separated "Override Status" control (super_admin only) that's visually distinct from the normal approve/reject buttons — e.g. in a collapsed "Advanced" section, a different color, a confirmation modal — since this bypasses the normal safety rails and should never be reachable by accident. Require the `reason` field, non-empty, before the action is enabled.

**Stop here and show me this phase before continuing.**

---

## PHASE 9 — Account/Profile Menu (applies to admin, super_admin, AND organizer dashboards)

Right now there's no way for a logged-in admin to get to their own profile from the dashboard at all. Fix this for every authenticated dashboard, not just admin:
- Add a profile menu — avatar/name in the top corner (match whichever corner is consistent with the existing design system's conventions, top-right is the more common pattern but check what this app already does elsewhere first), opening a dropdown/menu with at minimum: **My Profile** (view/edit name, phone — via `GET/PATCH /users/:id` with their own id), **Change Password**, **Logout**.
- This same component should be shared across organizer, admin, and super_admin dashboards — don't build three separate versions.

**Stop here and show me this phase before continuing.**

---

## PHASE 10 — Performance & Final QA Pass

Once all phases above are built and I've reviewed them:
1. Check bundle size impact — is anything unnecessarily heavy (large libraries pulled in for something small, images not optimized)?
2. Confirm no page does more API calls than necessary (e.g., don't call `/organizers/me/status` on every render if it's already in a shared context/store).
3. Confirm loading and error states exist on literally every async action introduced across all phases above — do a full pass and list any you find missing.
4. Run through mobile, tablet, and desktop breakpoints for every new page and report any responsiveness issues found and fixed.
5. Report back a summary: what was built, any concerns/tech debt introduced, and anything you think should be flagged back to the backend (list it, don't fix it).

---

**Reminder: work through Phase 0 first, wait for my sign-off, then proceed phase by phase — stop after each one for my review. Do not batch multiple phases into one pass.**
