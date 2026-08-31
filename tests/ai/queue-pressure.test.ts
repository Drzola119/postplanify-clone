import { describe, it, expect } from "vitest";
import { calculateCaptionDeadlines, estimateQueuePressure, getPressureLeadMs } from "@/lib/ai/fair-scheduler";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";

describe("lib/ai/fair-scheduler - Queue Pressure & Deadlines", () => {
  it("computes correct pressure lead for low, medium, and high pressure", () => {
    expect(getPressureLeadMs("low")).toBe(30 * 60_000);
    expect(getPressureLeadMs("medium")).toBe(90 * 60_000);
    expect(getPressureLeadMs("high")).toBe(4 * 3600_000);
  });

  it("dynamically estimates queue pressure based on pending count", () => {
    expect(estimateQueuePressure(0)).toBe("low");
    expect(estimateQueuePressure(25)).toBe("low");
    expect(estimateQueuePressure(31)).toBe("medium");
    expect(estimateQueuePressure(100)).toBe("medium");
    expect(estimateQueuePressure(101)).toBe("high");
    expect(estimateQueuePressure(500)).toBe("high");
  });

  it("applies 4-hour lead when queue pressure is high", () => {
    const scheduledAt = new Date(Date.now() + 24 * 3600_000);
    const lowResult = calculateCaptionDeadlines(scheduledAt, "low");
    const highResult = calculateCaptionDeadlines(scheduledAt, "high");

    const targetBufferMs = CAPTION_CONFIG.TARGET_BUFFER_MINUTES * 60_000;
    const expectedDeadline = scheduledAt.getTime() - targetBufferMs;

    expect(highResult.generationDeadline.getTime()).toBe(expectedDeadline);
    expect(highResult.generationRecommendedAt.getTime()).toBe(expectedDeadline - 4 * 3600_000);
    expect(lowResult.generationRecommendedAt.getTime()).toBe(expectedDeadline - 30 * 60_000);

    // High pressure starts 3.5 hours earlier than low pressure
    expect(lowResult.generationRecommendedAt.getTime() - highResult.generationRecommendedAt.getTime()).toBe(
      3.5 * 3600_000
    );
  });

  it("applies 90-minute lead when queue pressure is medium", () => {
    const scheduledAt = new Date(Date.now() + 24 * 3600_000);
    const medResult = calculateCaptionDeadlines(scheduledAt, "medium");

    const targetBufferMs = CAPTION_CONFIG.TARGET_BUFFER_MINUTES * 60_000;
    const expectedDeadline = scheduledAt.getTime() - targetBufferMs;

    expect(medResult.generationRecommendedAt.getTime()).toBe(expectedDeadline - 90 * 60_000);
  });
});
