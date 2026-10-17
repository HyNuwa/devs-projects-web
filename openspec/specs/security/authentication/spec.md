# security/authentication Specification

## Purpose

Keep sign-in and account recovery from telling anyone which email addresses have an account, and keep those addresses out of the logs.

## Requirements

### Requirement: Credential checks do not reveal accounts
Sign-in and «Apelar esta suspensión» SHALL do the same password check whether or not an account exists for the email. For an unknown email, the submitted password SHALL be checked against a fixed stand-in hash with the same cost as real password hashes, prepared once and not per request. The answer for an unknown email SHALL be identical to the answer for a wrong password: same status, same body, same headers.

#### Scenario: Unknown email
- **WHEN** someone signs in with an email that has no account
- **THEN** the password is still checked against the stand-in hash, and the answer is the same 401 «Credenciales inválidas» as for a wrong password

#### Scenario: Appeal with an unknown email
- **WHEN** someone submits «Apelar esta suspensión» with an email that has no account
- **THEN** the password is still checked against the stand-in hash, and the answer is the same as for a wrong password

### Requirement: Authentication logs hold no email addresses
Sign-in, sign-up, password recovery, email verification and «Apelar esta suspensión» SHALL NOT write a user-supplied email address to the logs, in any environment. A log entry SHALL record only the event and whether an account was found. Where a security log needs to correlate requests, it SHALL use a keyed hash of the normalized email, never the address. Mail delivery errors SHALL be logged without their recipient.

#### Scenario: Recovery for an unknown email
- **WHEN** someone asks to recover the password of an email with no account
- **THEN** the log records a recovery request with no account found, and the address appears nowhere in the logs

#### Scenario: Mail delivery fails
- **WHEN** sending a recovery email fails
- **THEN** the error is logged without the recipient's address
