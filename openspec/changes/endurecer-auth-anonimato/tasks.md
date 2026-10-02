## 1. Credential checks

- [ ] 1.1 Write Vitest unit tests for `PasswordHasher`: the stand-in hash is created once in `onModuleInit` (not per call) with `PASSWORD_HASH_ROUNDS`, `verify(password, null)` runs `bcrypt.compare` against it and returns `false`, `verify` with a real hash matches and rejects correctly. Implement it in the auth module and export it; verify the tests pass
- [ ] 1.2 Write Vitest unit tests that `validateUser` and the suspension appeal compare the password for an unknown email through `verify(password, null)`. Switch `validateUser`, `register`, the password reset and `SuspensionAppealController` to `PasswordHasher`; verify the unit tests pass
- [ ] 1.3 Write a Vitest e2e test that sign-in and «Apelar esta suspensión» answer an unknown email and a wrong password with the same status, body and headers (apart from date and request id); verify it passes together with the existing auth and rate-limiting e2e tests

## 2. Logs without emails

- [ ] 2.1 Write Vitest unit tests that a recovery request for an unknown email and a failed recovery or verification email log no email address (checked across every logger call), and that the development mail sink prints `<destinatario oculto>`. Change `requestPasswordReset`, the mail error logging and `MailService.send`; verify the tests pass

## 3. Usuarios actions never take a caso

- [ ] 3.1 Write Vitest e2e tests that warn, mute and suspension proposal from Usuarios with a `caseId` answer the same 400 for the caso's author and for another account, and record no sanción or proposal in either case. Remove `caseId` from `SanctionReasonDto`, `ProposeSuspensionDto`, the controller and `SuspensionProposalsService.propose`; verify the tests pass
- [ ] 3.2 Move the existing tests that create a sanción from a caso over HTTP (`history-anonymity.e2e.test.ts`, `sanctions-conflict.e2e.test.ts` «Naming another caso», `appeals-review.e2e.test.ts` if any) to the caso decision with «Advertir también», or to direct Prisma setup, keeping what each one checks; verify backend Vitest e2e and Jest pass

## 4. No hint about the hidden author

- [ ] 4.1 Write a Vitest test that `warnSuggested` is `false` on an anonymous caso whose author's history would suggest an advertencia, and still `true` on a signed caso. Implement it in `CasesService.detail`; verify the tests pass
- [ ] 4.2 Write Vitest e2e tests: a MODERATOR's Usuarios list («suggested», «sanctioned» and search), counts, status, paso sugerido and file for the author are identical before and after the retiro of their anonymous reseña with «Advertir también», while an ADMIN sees the retiro and the advertencia. Add the `anonymous` option to `loadHistories`, apply it to the candidates, the file's sanciones and `publishedCount` for MODERATOR; verify the tests and the existing Usuarios tests pass

## 5. Appeals of sanciones from anonymous casos

- [ ] 5.1 Write Vitest unit tests on the appeal access and Vitest e2e tests: a student's appeal of an advertencia from an anonymous caso is listed for another MODERATOR read-only with «Autor oculto» and no username anywhere in the body, answering it is 403 for a moderator, and an ADMIN sees the username and answers it. Set `anonymousContent` for those SANCTION appeals in list, detail, answer and count, and hide the appellant for MODERATOR; verify the tests pass
- [ ] 5.2 Make Apelaciones render a hidden appellant on a sanción appeal («Advertencia · Autor oculto»), with a frontend Vitest test; verify the frontend tests pass

## 6. Docs and verification

- [ ] 6.1 Update `README_MODERACION` (§6 Usuarios, §7 appeals, §9, replacing the accepted risk) and `README_SECURITY` (credential checks, logs, the sign-up 409 and the recovery writes as known limits); verify the docs describe the behavior of groups 1–5
- [ ] 6.2 Fresh code review by an Opus subagent that did not implement the change, focused on anonymity oracles and credential timing; fix what it finds and rerun the affected tests
- [ ] 6.3 Run the auth and anonymity regressions and the full verification: backend Jest (unit `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build; frontend tests, lint, design tokens and build, with logs in `.audit-logs/`; then `graphify update .`. Verify everything passes and report only the summaries
