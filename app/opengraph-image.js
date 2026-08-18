import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#171717',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 32,
            background: '#FF5B33',
            color: 'white',
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -3,
            marginBottom: 40,
          }}
        >
          AE
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -1,
            marginBottom: 16,
          }}
        >
          ADVOCAT-Easy
        </div>
        <div
          style={{
            display: 'flex',
            color: '#9CA3AF',
            fontSize: 30,
            fontWeight: 500,
          }}
        >
          Understand your rights instantly.
        </div>
      </div>
    ),
    { ...size }
  );
}
