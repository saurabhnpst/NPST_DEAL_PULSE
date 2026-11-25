# Test Plan — [Feature]

**Scope tag:** [Scope 1 / Scope 2]  
**Owner:** [Role]  
**Environment:** [Local / shared test]

## Scope

[Feature and boundaries.]

## Preconditions

- [Seed data]
- [Roles/users]
- [Documents]
- [Feature flags/config if any]

## Test Matrix

| Case | Actor | Action | Expected state | Expected notification | Audit expected |
|---|---|---|---|---|---|
| Happy path | [role] | [action] | [state] | [event] | [yes/no] |
| Permission denied | [role] | [action] | unchanged | none | [attempt logged] |
| Duplicate submit | [role] | [repeat action] | one pending | one delivery set | duplicate prevented |
| Stale action | [role] | [expired callback] | unchanged | conflict result | rejection logged |
| Missing comment | [role] | Reject/Return without comment | rejected request | none | validation error |
| Channel failure | [system] | Teams or email fails | workflow proceeds | other channel attempted | failure logged |
| Non-200 dependency | [system] | API/event failure | explicit failure state | [TBD] | logged |

## Data Integrity Checks

- [ ] Prior values preserved
- [ ] Versions retained
- [ ] No confirmed value overwritten by draft/suggestion
- [ ] History includes actor and timestamp

## Permission Checks

- [ ] Role
- [ ] Team/territory
- [ ] Product vertical
- [ ] Ownership
- [ ] Assigned task
- [ ] Document

## Verification Commands

- `npm --prefix frontend run build`
- `npm --prefix backend run build`
- `npm --prefix backend test -- --passWithNoTests`

## Open Questions

- [TBD]
