# Adding a Country to Smart Geo-Scheduling

This guide describes how to add a new country to the **Smart Geo-Scheduling** engine.

---

## 1. Create the Country Dataset File
Create a new file under `src/data/scheduling/countries/<country-name>.ts` (e.g. `src/data/scheduling/countries/france.ts`):

```typescript
import type { PlatformId } from "@/lib/platforms";
import type { CountryConfig, PlatformDaySchedule } from "./algeria";

export const FRANCE_CONFIG: CountryConfig = {
  id: "FR",
  name: "France",
  localizedName: "France",
  isoCode: "FR",
  flagEmoji: "🇫🇷",
  timezone: "Europe/Paris",
  utcOffsetMinutes: 120,
  observesDST: true,
  supported: true,
  locale: "fr-FR",
};

export const FRANCE_BENCHMARKS: PlatformDaySchedule[] = [
  // Populate all 13 platforms for all 7 days (mon..sun)
];
```

---

## 2. Register in `src/data/scheduling/countries/index.ts`
Add the new country configuration and benchmark dataset to the `COUNTRIES` map in `src/data/scheduling/countries/index.ts`:

```typescript
import { FRANCE_CONFIG, FRANCE_BENCHMARKS } from "./france";

const COUNTRIES: Record<string, { config: CountryConfig; benchmarks: PlatformDaySchedule[] }> = {
  DZ: { config: ALGERIA_CONFIG, benchmarks: ALGERIA_BENCHMARKS },
  FR: { config: FRANCE_CONFIG, benchmarks: FRANCE_BENCHMARKS },
};
```

---

## 3. Verify with Unit Tests
Run the test suite to ensure all 13 platforms and 7 days are fully defined:

```bash
npx vitest run tests/scheduling/smart-schedule.test.ts
```
