import { describe, it, expect } from "vitest";
import { fmtScheduled, bucketLabel } from "@/lib/queue/buckets";

const NOW = new Date("2026-03-10T15:00:00Z"); // Tuesday afternoon, UTC

describe("lib/queue/buckets - fmtScheduled", () => {
  it("returns unscheduled for undefined input", () => {
    const r = fmtScheduled(undefined, NOW);
    expect(r.rel).toBe("unscheduled");
    expect(r.label).toBe("Unscheduled");
  });

  it("returns unscheduled for invalid input", () => {
    const r = fmtScheduled("not-a-date", NOW);
    expect(r.rel).toBe("unscheduled");
  });

  it("returns past for a date in the past", () => {
    const r = fmtScheduled("2026-01-01T10:00:00Z", NOW);
    expect(r.rel).toBe("past");
    expect(r.label).toMatch(/Was /);
  });

  it("returns today for a time today", () => {
    const r = fmtScheduled("2026-03-10T20:00:00Z", NOW);
    expect(r.rel).toBe("today");
    expect(r.label).toMatch(/^Today /);
  });

  it("returns tomorrow for tomorrow", () => {
    const r = fmtScheduled("2026-03-11T09:00:00Z", NOW);
    expect(r.rel).toBe("tomorrow");
    expect(r.label).toMatch(/^Tomorrow /);
  });

  it("returns this-week for 3 days out", () => {
    const r = fmtScheduled("2026-03-13T12:00:00Z", NOW);
    expect(r.rel).toBe("this-week");
  });

  it("returns later for 30 days out", () => {
    const r = fmtScheduled("2026-04-10T12:00:00Z", NOW);
    expect(r.rel).toBe("later");
  });

  it("includes year when crossing the calendar year", () => {
    const r = fmtScheduled("2027-03-10T12:00:00Z", NOW);
    expect(r.rel).toBe("later");
    expect(r.label).toMatch(/2027/);
  });
});

describe("lib/queue/buckets - bucketLabel", () => {
  it("maps each bucket to a human label", () => {
    expect(bucketLabel("today")).toBe("Today");
    expect(bucketLabel("tomorrow")).toBe("Tomorrow");
    expect(bucketLabel("this-week")).toBe("This week");
    expect(bucketLabel("later")).toBe("Later");
    expect(bucketLabel("paused")).toBe("Paused");
    expect(bucketLabel("past")).toBe("Past due");
    expect(bucketLabel("unscheduled")).toBe("Unscheduled");
  });
});