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
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 165,
              backgroundColor: "#fffdf6",
              border: "8px solid #f4cd59",
            }}
          >
            <svg width="270" height="270" viewBox="0 0 240 240">
              <g opacity={0.94}>
                <circle cx="59" cy="103" r="5" fill="#e8177d" />
                <circle cx="72" cy="84" r="4" fill="#f1cf2f" />
                <circle cx="91" cy="72" r="4" fill="#158cd1" />
                <circle cx="148" cy="70" r="5" fill="#ef4939" />
                <circle cx="169" cy="82" r="4" fill="#a23bc5" />
                <circle cx="181" cy="101" r="5" fill="#10a98c" />
                <circle cx="62" cy="137" r="4" fill="#118fd0" />
                <circle cx="176" cy="141" r="5" fill="#ffd32e" />
                <circle cx="81" cy="162" r="5" fill="#ef167f" />
                <circle cx="158" cy="163" r="4" fill="#159aaf" />
              </g>
              <path d="M120 67 133 94 163 91 143 113 153 143 120 128 89 146 97 114 75 94 106 92Z" fill="#168cd2" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
              <path d="m120 67 13 27-13 14-17-16Z" fill="#f5d432" />
              <path d="m133 94 30-3-20 22h-23Z" fill="#e72b75" />
              <path d="m143 113 10 30-33-15v-15Z" fill="#16a9a0" />
              <path d="m120 128-31 18 8-32 23-3Z" fill="#178dd1" />
              <path d="m97 114-22-20 31-2 14 13Z" fill="#9b3fc3" />
              <path d="m106 92 14-25v41Z" fill="#f05a35" />
              <path d="M116 102 128 99 136 110 127 122 114 119 108 110Z" fill="#e73382" stroke="#fff" strokeWidth="2" />
            </svg>
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
                display: "flex",
                flexDirection: "column",
                marginTop: 22,
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: -3,
              }}
            >
              <span>Caribbean</span>
              <span>Star Store</span>
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
