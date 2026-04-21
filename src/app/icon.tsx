import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5a8c7, #8a4a67)",
          borderRadius: "9999px",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.5px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        TL
      </div>
    ),
    size,
  );
}
