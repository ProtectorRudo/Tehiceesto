import { ImageResponse } from "next/og";

export const alt = "Te Hice Esto — Tenés algo esperando";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PrivateGiftOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          background: "#060608",
          color: "#f0ebe5",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: 999,
            border: "1px solid rgba(226,182,160,.13)",
            boxShadow:
              "0 0 0 70px rgba(226,182,160,.025), 0 0 0 140px rgba(226,182,160,.012)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: 900,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "sans-serif",
              fontSize: 17,
              letterSpacing: "0.20em",
              color: "#786f76",
              marginBottom: 34,
            }}
          >
            TE HICE ESTO · EXPERIENCIA PRIVADA
          </span>
          <div
            style={{
              display: "flex",
              fontSize: 98,
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
            }}
          >
            Tenés algo
            <br />
            esperando.
          </div>
          <span
            style={{
              marginTop: 34,
              fontFamily: "sans-serif",
              fontSize: 19,
              color: "#887f85",
            }}
          >
            Abrilo cuando tengas un momento.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
