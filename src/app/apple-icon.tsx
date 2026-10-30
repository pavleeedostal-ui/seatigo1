import { ImageResponse } from "next/og";

// `apple-icon` only accepts raster formats, so the mark is rendered to PNG at
// build time from the same geometry and album colours as icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#2432db",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "24%",
            width: "13%",
            height: "42%",
            borderRadius: 999,
            background: "#ffffff",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "60%",
            width: "40%",
            height: "13%",
            borderRadius: 999,
            background: "#ffffff",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "57%",
            top: "29%",
            width: "14%",
            height: "14%",
            borderRadius: 999,
            background: "#ffd43b",
          }}
        />
      </div>
    ),
    size,
  );
}
