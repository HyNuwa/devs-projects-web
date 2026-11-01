# Spec Delta

## Purpose

Autorizar acciones con el rol vigente de cada cuenta y hacer trazables los cambios administrativos sin permitir escaladas de privilegios.

## ADDED Requirements

### Requirement: Explicit action permissions
The system SHALL deny a protected action unless the authenticated account has every required permission. Unknown permissions and roles SHALL grant no access. Existing role-protected routes SHALL retain their restrictions during adoption.

#### Scenario: Student attempts course management
- **WHEN** a USER requests a course creation or administrative Drive operation
- **THEN** the API returns 403 before any database write or Drive request

#### Scenario: Missing permission in a combined requirement
- **WHEN** an action requires two permissions and the account has only one
- **THEN** the API returns 403

### Requirement: Current account authorization
Authorization SHALL use the current database role and suspension state rather than trusting the role in an issued token. A missing account or active suspension SHALL invalidate authenticated access; a muted account SHALL be denied contribution actions under the existing sanctions policy.

#### Scenario: Demoted administrator has a valid token
- **WHEN** an ADMIN becomes USER and requests an administrative operation with the previous token
- **THEN** access is denied without waiting for token expiry or refresh

#### Scenario: Suspended account reads private course files
- **WHEN** a suspended account with an unexpired token requests a private course file
- **THEN** authentication is refused before Drive is contacted

### Requirement: Safe role assignment
Only ADMIN and SUPERADMIN SHALL change another account's role. ADMIN SHALL only move accounts among VISITOR, USER and MODERATOR. Only SUPERADMIN SHALL manage ADMIN or SUPERADMIN accounts or assign those roles. Self changes SHALL be refused. The last SUPERADMIN SHALL NOT be demoted, including by concurrent requests.

#### Scenario: Administrator attempts to become superadministrator
- **WHEN** an ADMIN assigns SUPERADMIN to any account, or changes their own role
- **THEN** the API returns 403 and no role changes

#### Scenario: Concurrent demotions
- **WHEN** two requests would together remove the remaining SUPERADMIN accounts
- **THEN** at least one is rejected with 409 and a SUPERADMIN remains

### Requirement: Validated and audited role changes
A role change SHALL accept only a known role and a nonempty reason of 10–500 characters. It SHALL atomically record actor, target, previous role, new role, reason and time with the change. Unknown targets SHALL return 404. Audit records SHALL NOT contain credentials or tokens.

#### Scenario: Invalid role supplied
- **WHEN** an authorized actor supplies an unknown role, missing reason or unexpected fields
- **THEN** the API returns 400 without modifying the account

#### Scenario: Audit persistence fails
- **WHEN** the audit record cannot be persisted during a role change
- **THEN** the role change is rolled back

### Requirement: Permission discovery
Authenticated accounts SHALL be able to retrieve their current role and effective permissions. Only ADMIN and SUPERADMIN SHALL retrieve the role-permission catalog. These responses SHALL NOT include credentials, personal data of other users or private Drive identifiers.

#### Scenario: Student inspects available actions
- **WHEN** a USER requests their effective permissions
- **THEN** the response includes course reading and self-enrollment permissions without course-management or role-management permissions
