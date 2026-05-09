# Security Specification - Triumph Yearbook Portal

## Data Invariants
1. A user profile must have a valid role (STUDENT, ADMIN, PHOTOGRAPHER, LAYOUT, FINANCE).
2. Students can only see their own documents and appointments.
3. Admins can see all users, documents, and appointments.
4. Finance staff can see receipts and documents of type RECEIPT/PAYMENT.
5. Audit logs are write-only for the system (client can append) and read-only for Admins/Finance.
6. Appointments can only be created by students for themselves, or by admins.
7. Terminal states (e.g., status 'APPROVED' for docs, or 'COMPLETED' for appointments) cannot be reverted by students.

## The Dirty Dozen Payloads (Conceptual Test Cases)
1. **Identity Spoofing**: Student trying to list `/users`.
2. **Identity Spoofing**: User A trying to `get` `/users/B` (restricted to `isSignedIn` but `list` is restricted).
3. **Privilege Escalation**: Student trying to `update` their own `role` to `ADMIN`.
4. **State Shortcutting**: Student trying to `update` a document status to `APPROVED`.
5. **Orphaned Write**: Creating an appointment for a non-existent student UID.
6. **Shadow field**: Adding `isAdmin: true` to a document submission.
7. **Resource Poisoning**: Document ID with 10KB junk string.
8. **Malicious Query**: Listing `/users` without a role filter as a student.
9. **PII Leak**: Unauthorized `get` on a user document containing private info (role etc is fine, but email should be protected).
10. **Timestamp Spoofing**: Sending a client-side `submittedAt` that is in the future.
11. **Mass Delete**: Student trying to `delete` an appointment they don't own.
12. **Audit Bypass**: Modifying an existing audit log entry.

## The Test Runner (Conceptual)
All the above should return `PERMISSION_DENIED`.
