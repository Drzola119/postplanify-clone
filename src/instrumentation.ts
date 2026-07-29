export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    const { startQueueWorker } = await import("./lib/queue/worker");
    const { startAutomationWorker } = await import("./lib/queue/automation-worker");
    const { startVideoRenderWorker } = await import("./lib/queue/video-render-worker");
    startQueueWorker();
    startAutomationWorker();
    startVideoRenderWorker();
  }
}
