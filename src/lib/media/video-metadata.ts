/**
 * Video metadata extraction, aspect ratio classification, and validation utilities.
 * Supports fast browser-side HTML5 video probing and server-side metadata inspection.
 */

export type VideoOrientation = "vertical" | "horizontal" | "square" | "custom";
export type ClassifiedAspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "4:3" | "custom";

export interface VideoMetadata {
  width: number;
  height: number;
  durationSec: number;
  aspectRatio: ClassifiedAspectRatio;
  aspectRatioValue: number; // width / height
  orientation: VideoOrientation;
  formattedDuration: string;
  sizeBytes?: number;
  bitrateKbps?: number;
  fps?: number;
  isLinkedInRatioValid: boolean;
  isExtremeVertical: boolean;
}

/**
 * Classifies numerical aspect ratio into standard social media format tags.
 * Allows slight tolerance (within 5%) for common camera resolutions.
 */
export function classifyAspectRatio(width: number, height: number): {
  aspectRatio: ClassifiedAspectRatio;
  orientation: VideoOrientation;
  aspectRatioValue: number;
  isLinkedInRatioValid: boolean;
  isExtremeVertical: boolean;
} {
  if (width <= 0 || height <= 0) {
    return {
      aspectRatio: "custom",
      orientation: "custom",
      aspectRatioValue: 1,
      isLinkedInRatioValid: true,
      isExtremeVertical: false,
    };
  }

  const ratio = width / height;

  // Tolerances
  const is9x16 = Math.abs(ratio - 9 / 16) < 0.08; // ~0.5625 (0.48 - 0.64)
  const is16x9 = Math.abs(ratio - 16 / 9) < 0.15; // ~1.777 (1.62 - 1.92)
  const is1x1 = Math.abs(ratio - 1.0) < 0.08;    // ~1.00 (0.92 - 1.08)
  const is4x5 = Math.abs(ratio - 4 / 5) < 0.06;  // ~0.80 (0.74 - 0.86)
  const is4x3 = Math.abs(ratio - 4 / 3) < 0.10;  // ~1.33 (1.23 - 1.43)

  let aspectRatio: ClassifiedAspectRatio = "custom";
  if (is9x16) aspectRatio = "9:16";
  else if (is16x9) aspectRatio = "16:9";
  else if (is1x1) aspectRatio = "1:1";
  else if (is4x5) aspectRatio = "4:5";
  else if (is4x3) aspectRatio = "4:3";

  let orientation: VideoOrientation = "custom";
  if (ratio < 0.92) {
    orientation = "vertical";
  } else if (ratio > 1.08) {
    orientation = "horizontal";
  } else {
    orientation = "square";
  }

  // LinkedIn requires ratio between 1:2.4 (0.416) and 2.4:1 (2.40)
  const isLinkedInRatioValid = ratio >= 0.40 && ratio <= 2.45;
  const isExtremeVertical = ratio < 0.40;

  return {
    aspectRatio,
    orientation,
    aspectRatioValue: Math.round(ratio * 100) / 100,
    isLinkedInRatioValid,
    isExtremeVertical,
  };
}

export function formatVideoDuration(durationSec: number): string {
  if (!Number.isFinite(durationSec) || durationSec < 0) return "0:00";
  const totalSeconds = Math.round(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Probe a File, Blob, or object URL in the browser using HTML5 Video element.
 * Timeout defaults to 10 seconds to avoid hanging on corrupt files.
 */
export function probeVideoMetadataClient(
  source: File | Blob | string,
  timeoutMs = 10000
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("probeVideoMetadataClient must be run in the browser"));
    }

    const sizeBytes = typeof source !== "string" && source ? source.size : undefined;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    let url: string;
    let shouldRevoke = false;

    if (typeof source === "string") {
      url = source;
      video.crossOrigin = "anonymous";
    } else {
      url = URL.createObjectURL(source);
      shouldRevoke = true;
    }

    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Video metadata probe timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      const durationSec = video.duration || 0;

      const { aspectRatio, orientation, aspectRatioValue, isLinkedInRatioValid, isExtremeVertical } =
        classifyAspectRatio(width, height);
      const formattedDuration = formatVideoDuration(durationSec);

      const bitrateKbps =
        durationSec > 0 && sizeBytes
          ? Math.round((sizeBytes * 8) / (durationSec * 1000))
          : undefined;

      cleanup();
      resolve({
        width,
        height,
        durationSec,
        aspectRatio,
        aspectRatioValue,
        orientation,
        formattedDuration,
        sizeBytes,
        bitrateKbps,
        isLinkedInRatioValid,
        isExtremeVertical,
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video metadata (unsupported format or corrupt file)"));
    };

    video.src = url;
  });
}
