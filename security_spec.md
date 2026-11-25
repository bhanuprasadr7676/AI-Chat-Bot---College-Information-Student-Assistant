# Security Specification & Payload Invariants

## 1. Data Invariants
1. **Identity Isolation (Users)**: Only an authenticated owner (`request.auth.uid == userId`) or a verified Admin can read a `users/{userId}` document. Non-admins cannot list `users`.
2. **Self-Assigned Role Prevention**: On creating `users/{userId}`, non-admin users must only create `role: "student"` and cannot escalate `role` to `"admin"` during create or update.
3. **Attendance & Fee Ownership**: Students can only read or query (`list`) `attendance` and `fees` documents where `resource.data.userId == request.auth.uid`, unless the caller is an Admin.
4. **Campus Catalog Integrity**: `faculty`, `timetable`, `timings`, `notices`, `scholarships`, `placements`, and `settings` can only be created, updated, or deleted by verified Admins. Non-admin list queries only access documents where `resource.data.isPublished == true`.
5. **Strict Schema & Size Bounds**: Every write validates exact allowed keys (`hasAll` + `hasOnly`), field types, string max lengths, and server timestamp checks (`request.time`) on `createdAt`/`updatedAt`.
6. **Path ID Hardening**: All document IDs in single-doc operations match `^[a-zA-Z0-9_\-]+$` with length <= 128.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Promotion on Sign-up**: `{ "uid": "u1", "role": "admin", ... }` written by non-admin to `/users/u1`.
2. **Privilege Escalation on Update**: `{ "role": "admin" }` updated by student on `/users/u1`.
3. **Ghost Field Shadow Write**: `{ "displayName": "Alice", "isSuperAdmin": true, "updatedAt": SERVER_TIME }` on `/users/u1`.
4. **Unverified Email Spoof**: Request with `email: "bhanuprasadrbhanuprasadr@gmail.com"` and `email_verified: false`.
5. **Cross-Student PII Read**: Student A calling `get` on `/users/studentB`.
6. **Blanket User List Scraping**: Student A calling `list` on `/users`.
7. **Cross-Student Attendance Tampering**: Student A creating/updating `/attendance/rec1` with `userId: "studentB"` or inflating `attendedClasses`.
8. **Fake Fee Clearance**: Student A updating `/fees/fee1` with `amount: 0` or `paidAmount: 999999` or changing `userId`.
9. **Unauthorized Notice Injection**: Student A creating `/notices/n1` pretending to be Dean.
10. **Settings Tampering**: Student A updating `/settings/campus_config` with `aiAssistantEnabled: false`.
11. **1MB Resource Poisoning**: Writing a 20,000-character string to `displayName` or `title` or an invalid path ID `../admin`.
12. **Client Timestamp Forgery**: Creating `/users/u1` with a backdated client timestamp instead of `request.time`.
