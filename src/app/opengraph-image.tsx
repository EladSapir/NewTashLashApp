import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #fff7fb, #f7e7ef)",
          color: "#3a2d34",
          fontFamily: "Arial, sans-serif",
          padding: 48,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            margin: "auto",
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "1px",
              fontFamily: "Arial, sans-serif",
              background: "linear-gradient(135deg, #f5a8c7, #8a4a67)",
            }}
          >
            TL
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: 68, fontWeight: 700, color: "#7e3e48" }}>
              Tash Lashes
            </div>
            <div
              lang="he"
              dir="rtl"
              style={{
                fontSize: 42,
                color: "#3a2d34",
                direction: "rtl",
                unicodeBidi: "bidi-override",
                textAlign: "right",
                display: "flex",
              }}
            >
              {"\u202Bקביעת תורים\u202C"}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
