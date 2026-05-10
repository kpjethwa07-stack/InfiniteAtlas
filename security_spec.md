# Security Spec - Traveloop

## Data Invariants
1. A trip must belong to an authenticated user (`ownerId`).
2. Stops, Activities, PackingItems, and Notes are tied to a `tripId`. Access to these sub-collections is derived from the parent trip's `ownerId` or if the trip `isPublic`.
3. Users can only edit/delete their own trips.
4. Public trips allow `read` access to everyone, but `write` access only to the owner.
5. All IDs must be validated.
6. Timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Creating a trip with a different `ownerId` than the authenticated user.
2. Updating a trip's `ownerId` to hijack it.
3. Injecting a 1MB string into `title`.
4. Deleting a trip owned by another user.
5. Creating a stop for a trip the user doesn't own.
6. Reading a private trip as an unauthenticated or different user.
7. Modifying `createdAt` during update.
8. Setting `isPublic` to true on a trip owned by someone else.
9. Injecting script tags or non-alphanumeric characters into IDs.
10. Rapidly updating a trip (write amplification).
11. Setting a negative `budgetLimit`.
12. Appending 10,000 items to a sub-collection (protected by single-item write logic).

## Security Audit Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|--------------------|
| users      | Blocked (isOwner) | N/A               | Blocked (size)     |
| trips      | Blocked (isOwner) | Blocked (enum)    | Blocked (size)     |
| stops      | Blocked (parent)  | N/A               | Blocked (size)     |
| activities | Blocked (parent)  | Blocked (enum)    | Blocked (size)     |
| packing    | Blocked (parent)  | N/A               | Blocked (size)     |
| notes      | Blocked (parent)  | N/A               | Blocked (size)     |
