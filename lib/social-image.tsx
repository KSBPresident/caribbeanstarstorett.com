import { ImageResponse } from "next/og";

export const socialImageAlt =
  "Caribbean Star Store — Connecting the community across the Caribbean";
export const socialImageSize = { width: 1200, height: 630 };
export const socialImageContentType = "image/png";

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: 70,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#073f4a",
          color: "#fffdf6",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -145,
            bottom: -285,
            width: 620,
            height: 620,
            borderRadius: 310,
            backgroundColor: "#0c5861",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 34,
            width: 1132,
            height: 562,
            border: "2px solid #ffffff33",
            borderRadius: 28,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 46,
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              width: 330,
              height: 330,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 165,
              backgroundColor: "#fffdf6",
              border: "8px solid #f4cd59",
              color: "#073f4a",
            }}
          >
            <span style={{ fontSize: 112, lineHeight: 1, color: "#d83d86" }}>★</span>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>CSS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 650 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#f4cd59",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 3,
              }}
            >
              <span style={{ width: 38, height: 3, backgroundColor: "#f4cd59" }} />
              CARIBBEAN MARKETPLACE
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: -3,
              }}
            >
              Caribbean
              <br />
              Star Store
            </div>
            <div
              style={{
                marginTop: 22,
                color: "#e6f0ea",
                fontSize: 27,
                lineHeight: 1.35,
              }}
            >
              Connecting the community across the Caribbean.
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 24,
              }}
            >
              {["PRODUCTS", "SERVICES", "BUSINESSES", "OPPORTUNITIES"].map((label) => (
                <span
                  key={label}
                  style={{
                    border: "1px solid #ffffff55",
                    borderRadius: 18,
                    padding: "8px 12px",
                    color: "#fffdf6",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...socialImageSize },
  );
}
