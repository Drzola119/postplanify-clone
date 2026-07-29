/**
 * video-gen/index.ts
 * Public API surface for the video-gen lib — mirrors image-gen/index.ts.
 */
export { generateVideo } from "./router";
export { estimateVideoCostUsd, estimateJobCostUsd } from "./cost";
export { recordVideoGenUsage, readVideoGenUsage } from "./usage";
export { persistGeneratedVideo } from "./asset-saver";
export { resolveFallbackChain, DEFAULT_VIDEO_FALLBACK_CHAIN } from "./fallback-chain";
export { getAvailableProviders } from "./providers";
export type {
  VideoProviderId,
  VideoProviderIdOrAuto,
  VideoAspectRatio,
  VideoWorkflow,
  VideoMode,
  VideoGenerateInput,
  VideoGenerateOutput,
  VideoGenProvider,
  VideoJobDoc,
  VideoJobStatus,
  VideoClipRecord,
  VideoFinalAsset,
} from "./types";
