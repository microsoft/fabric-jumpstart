'use client';

import React from 'react';

const pulseKeyframes = `
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

function Bar({ width, height, style }: { width: string; height: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '4px',
        animation: 'skeleton-pulse 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export default function SkeletonCard({ isDark, className, style }: { isDark: boolean; className?: string; style?: React.CSSProperties }) {
  const bg = isDark ? '#2a2a30' : '#e0e0e0';

  return (
    <div className={className} style={style}>
      <style>{pulseKeyframes}</style>

      {/* Diagram area placeholder */}
      <div style={{
        width: '100%',
        height: '180px',
        backgroundColor: bg,
        animation: 'skeleton-pulse 1.6s ease-in-out infinite',
      }} />

      {/* Body area */}
      <div style={{
        padding: '36px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8',
        gap: '10px',
      }}>
        {/* Pill row */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <Bar width="60px" height="22px" style={{ borderRadius: '999px', backgroundColor: bg }} />
          <Bar width="80px" height="22px" style={{ borderRadius: '999px', backgroundColor: bg }} />
          <Bar width="70px" height="22px" style={{ borderRadius: '999px', backgroundColor: bg }} />
        </div>

        {/* Title */}
        <Bar width="75%" height="20px" style={{ backgroundColor: bg }} />

        {/* Description lines */}
        <Bar width="100%" height="14px" style={{ backgroundColor: bg }} />
        <Bar width="90%" height="14px" style={{ backgroundColor: bg }} />
        <Bar width="60%" height="14px" style={{ backgroundColor: bg }} />

        {/* Tags row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <Bar width="65px" height="24px" style={{ backgroundColor: bg }} />
          <Bar width="85px" height="24px" style={{ backgroundColor: bg }} />
        </div>

        {/* Bottom stats */}
        <Bar width="80%" height="12px" style={{ backgroundColor: bg, marginTop: 'auto', paddingTop: '12px' }} />
      </div>
    </div>
  );
}
