## Why

The final review of `moderacion-ajustes` left three problems that existed before it. They get fixed before `feature/moderacion-sanciones` merges, instead of being documented as accepted risks:
- Sign-in and «Apelar esta suspensión» answer faster for an email with no account, because they skip bcrypt. That tells an attacker which emails have accounts.
- Password recovery logs the email address of unknown accounts in plain text.
- A moderator can learn who wrote anonymous content:
  - **Directly:** the Usuarios actions accept an account plus a `caseId`, and refuse with «Ese caso no es sobre esta cuenta» when the account is not the caso's author.
  - **Indirectly, after deciding an anonymous caso:**
    - In Usuarios, the author moves into «Paso sugerido», their retiro count goes up, and their file shows the new advertencia.
    - The preselection of «Advertir también» depends on the hidden author's history.
    - An appeal of a sanción from an anonymous caso shows the appellant next to the reason and time of the retiro.

## What Changes

- **Credential checks in constant work:** for an email with no account, sign-in and «Apelar esta suspensión» still run `bcrypt.compare` against a dummy hash. The hash is computed once, with the same cost as real passwords. The answer stays the same as for a wrong password.
- **No emails in auth logs:**
  - Recovery logs only that a request arrived and whether an account was found, never the address.
  - Mail errors are logged without their recipient.
  - The development mail sink stops printing the recipient.
- **Anonymous authors cannot be tested:**
  - **BREAKING (API):** the Usuarios endpoints (warn, mute, propose suspension) no longer accept `caseId`, so their result never depends on who wrote an anonymous caso. A request that sends it is refused as invalid, whatever the account. The UI never sent it.
  - Sanciones tied to a caso come only from the caso's decision («Advertir también»). The server resolves the author from the caso; the moderator never chooses or sees that account.
  - «Advertir también» is never preselected on an anonymous caso.
  - For MODERATOR, the Usuarios tab ignores retiros of anonymous content and sanciones from anonymous casos: in the list, filters, counts, paso sugerido, status and file. ADMIN and SUPERADMIN still see everything. This reverses the accepted risk of `moderacion-ajustes` (README_MODERACION §9). A moderator who needs anonymous reincidence uses «Ver autor», which is recorded, or leaves it to an admin.
  - An appeal of a sanción from an anonymous caso is answered only by ADMIN or SUPERADMIN. A MODERATOR sees it read-only, with the appellant as «Autor oculto».

## Capabilities

### New Capabilities
- `security/authentication`: credential checks that do not reveal whether an account exists (timing included), and authentication logs without email addresses.

### Modified Capabilities
- `moderation/sanctions`:
  - «Advertencia with a retiro»: no preselection on anonymous casos.
  - «Who can sanction whom»: Usuarios actions never name a caso.
  - «Usuarios tab»: a MODERATOR's view ignores what came from anonymous content.
- `moderation/appeals`:
  - «Someone else reviews the appeal»: appeals of sanciones from anonymous casos go to admins.
  - «Apelaciones tab»: a moderator sees them read-only with «Autor oculto».

## Impact

- **Backend:**
  - `auth.service.ts` (`validateUser`, `requestPasswordReset`), `suspension-appeal.controller.ts`, and a shared dummy-hash helper.
  - `mail.service.ts` logging.
  - `dto/sanction.dto.ts` and `sanctions.controller.ts` (drop `caseId`).
  - `cases.service.ts` (`warnSuggested`).
  - `moderation-users.service.ts` and `escalera-history.ts` (viewer-aware histories).
  - `sanction-rules.ts` `canReview`, `appeals-query.service.ts` and `appeals.service.ts`.
- **Frontend:** Apelaciones renders a hidden appellant on a sanción appeal. No other UI change is expected; the frontend tests cover it.
- **Docs:** `README_MODERACION` (§6, §7, §9) and `README_SECURITY`.
- **No schema change.**
