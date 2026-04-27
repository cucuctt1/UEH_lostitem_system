# SQL Injection Assessment (Server)

Date: 2026-04-23
Scope: `server/src/**/*.ts`

## Executive Summary

No confirmed SQL injection vulnerabilities were identified in the current server codebase.

All request-influenced values observed during this review are passed to MySQL through parameter placeholders (`?`) rather than concatenated directly into SQL text.

## Reviewed Dynamic SQL Hotspots

These locations use template literals or dynamic fragments, but are not currently exploitable for SQL injection based on code flow and input validation:

1. `server/src/models/postModel.ts:147`
   - Query builds `WHERE ${where.join(" AND ")}`.
   - Safety reason: `where` is built from hardcoded SQL fragments only; user data is bound through placeholders in `values`.

2. `server/src/models/postModel.ts:224`
   - Query builds `UPDATE posts SET ${fields.join(", ")}`.
   - Safety reason: `fields` only contains fixed column assignments added by explicit property checks; user input is bound via placeholders.

3. `server/src/models/userModel.ts:58`
   - Query builds `UPDATE users SET ${fields.join(", ")}`.
   - Safety reason: `fields` is populated from a fixed allowlist (`full_name`, `bio`, `avatar_url`), and values are parameterized.

4. `server/src/models/reportModel.ts:49`
   - Query builds `WHERE ${where}`.
   - Safety reason: `where` is assembled from constant fragments (`1=1`, `r.reporter_id = ?`, `AND r.status = ?`) and user data is bound through placeholders.

5. `server/src/models/matchModel.ts:46`
   - Query builds `UPDATE matches SET ${returnedAt} status = ?`.
   - Safety reason: `returnedAt` is a constant branch output (`"returned_at = CURRENT_TIMESTAMP,"` or empty string), not user-controlled SQL.

6. `server/src/models/tagModel.ts:23`, `server/src/models/tagModel.ts:58`, `server/src/models/tagModel.ts:108`
   - Dynamic placeholder list generation (`${placeholders}`).
   - Safety reason: only the number of placeholders is dynamic; actual tag values are passed separately as bound parameters.

## Input Validation Evidence

Input validation further constrains query parameters used in search/list endpoints:

1. `server/src/routes/postRoutes.ts:24` and `server/src/routes/searchRoutes.ts:9`
   - Both routes enforce `validateQuery(postSearchSchema)`.

2. `server/src/validators/postValidators.ts:23-31`
   - `postSearchSchema` restricts `sort` to `newest|relevance`, `locationId` to positive integers, and typed date filters.

## Notes

1. This review did not find a SQL injection issue that warrants a CVE entry at this time.
2. If future changes allow user-controlled SQL identifiers (column names, table names, raw ORDER BY strings) into template literals, the same hotspots could become vulnerable.
