# Tickets list (T3.1)

`GET /api/tickets` returns a page of tickets. It needs a Bearer token.

## Query parameters

| Parameter  | Default          | Rules                                                                                                    |
| ---------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `page`     | `1`              | whole number, at least 1                                                                                 |
| `limit`    | `10`             | whole number, 1 to 50                                                                                    |
| `status`   | none             | `open`, `in_progress` or `closed`                                                                        |
| `priority` | none             | `low`, `medium` or `high`                                                                                |
| `tag`      | none             | exact tag, up to 30 characters (for example `bug`)                                                       |
| `q`        | none             | text searched in title and description, up to 100 characters                                             |
| `sort`     | `createdAt:desc` | `field:direction`; fields `createdAt`, `updatedAt`, `priority`, `status`, `title`, `id`; `asc` or `desc` |

- Filters combine with AND. An empty value (`?q=&status=`) means "no filter".
- Unknown parameters and invalid values return 400 in the unified error format.
- `priority` and `status` sort by their enum order (`low` < `medium` < `high`; `open` < `in_progress` < `closed`).
- Every sort adds `id DESC` as a tiebreaker, so pages never overlap or skip rows when sort values repeat.

## Response

```json
{
  "items": [
    {
      "id": 12,
      "title": "...",
      "status": "closed",
      "priority": "low",
      "tags": [],
      "createdById": 2,
      "assigneeId": 2,
      "createdAt": "...",
      "updatedAt": "...",
      "description": "..."
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

`total` counts all matching tickets across pages. No match gives `"items": [], "total": 0`. A page past the
end gives `"items": []` with the real `total`.

## Roles

An `agent` sees every ticket; a `user` only tickets they created. The restriction is applied in the query
before any filter, and there is no parameter that changes it.

## Search details

`q` uses `LIKE` on title and description. `%`, `_` and `\` in the text are escaped, so searching `100%` finds
the literal text. The `utf8mb4_unicode_ci` collation makes the search case-insensitive for Latin and Cyrillic
text, and emoji are searchable.

`tag` uses `JSON_CONTAINS` on the `tags` JSON array, so it matches a whole tag, not part of one.

## Verification done

Results were compared with SQL on the seed data: totals and ids for each role, pagination across three pages,
every filter and their combinations, search (including Cyrillic, emoji and the `%`/`_` wildcards), the sort
options, and all validation errors (`limit=51`, `page=0`, unknown enum, bad `sort`, unknown parameter).
