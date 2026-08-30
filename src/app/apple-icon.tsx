import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0A192F 0%, #030B17 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '40px',
        }}
      >
        {/* Glow ambient light */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background: 'radial-gradient(circle at 50% 30%, rgba(0, 194, 255, 0.45), transparent 65%)',
          }}
        />

        {/* Outer metallic ring */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '34px',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: 'inset 0 0 20px rgba(0, 126, 167, 0.5)',
          }}
        />

        {/* Central 3D Badge Shield */}
        <div
          style={{
            width: '108px',
            height: '108px',
            borderRadius: '26px',
            background: 'linear-gradient(135deg, rgba(0, 126, 167, 0.95) 0%, rgba(0, 52, 89, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            position: 'relative',
          }}
        >
          {/* Neon Lightning Bolt SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 194, 255, 0.8))',
            }}
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="url(#appleBoltGrad)"
              stroke="#FFFFFF"
              strokeWidth="0.75"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="appleBoltGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.5" stopColor="#E0F7FF" />
                <stop offset="1" stopColor="#00C2FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Tiny financial spark dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            right: '28px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 10px #10B981',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
