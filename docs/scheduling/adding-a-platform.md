# Adding a Platform to Smart Geo-Scheduling

This guide describes how to add a new social platform to the **Smart Geo-Scheduling** benchmark registry.

---

## 1. Update PlatformId Enum & List
Ensure the new platform is added to `PlatformId` in `src/lib/platforms.ts` and `src/data/scheduling/countries/algeria.ts`.

---

## 2. Add 7-Day Benchmarks in Country Files
In each supported country file (e.g. `src/data/scheduling/countries/algeria.ts`), add entries for the new platform for each day of the week:

```typescript
{
  platform: "new_platform",
  day: "mon",
  sourceType: "benchmark",
  lastUpdated: "2026-08-31",
  slots: [
    { time: "09:00", confidence: "high", rank: 1 },
    { time: "14:00", confidence: "high", rank: 2 },
    { time: "20:00", confidence: "medium", rank: 3 },
  ],
}
```

---

## 3. Verify
Run the scheduler test suite:

```bash
npx vitest run tests/scheduling/smart-schedule.test.ts
```
