import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "PostPlanify: Social Media Management for Agencies and Teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#7c3aed" />
            <path d="M7 8h10M7 12h7M7 16h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            PostPlanify
          </span>
        </div>
        <span
          style={{
            fontSize: "28px",
            fontWeight: 500,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "600px",
            lineHeight: 1.4,
          }}
        >
          Social Media Management for Agencies and Teams
        </span>
      </div>
    ),
    { ...size },
  );
}
