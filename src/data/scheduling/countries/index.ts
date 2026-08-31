import {
  ALGERIA_CONFIG,
  ALGERIA_BENCHMARKS,
  type CountryConfig,
  type PlatformDaySchedule,
} from "./algeria";

export * from "./algeria";

const COUNTRIES: Record<string, { config: CountryConfig; benchmarks: PlatformDaySchedule[] }> = {
  DZ: {
    config: ALGERIA_CONFIG,
    benchmarks: ALGERIA_BENCHMARKS,
  },
};

export function getCountryConfig(id: string): CountryConfig | undefined {
  return COUNTRIES[id.toUpperCase()]?.config;
}

export function listSupportedCountries(): CountryConfig[] {
  return Object.values(COUNTRIES)
    .map((c) => c.config)
    .filter((c) => c.supported);
}

export function getDefaultCountry(): CountryConfig {
  return ALGERIA_CONFIG;
}

export function getCountryBenchmarks(countryId: string): PlatformDaySchedule[] {
  return COUNTRIES[countryId.toUpperCase()]?.benchmarks ?? ALGERIA_BENCHMARKS;
}
