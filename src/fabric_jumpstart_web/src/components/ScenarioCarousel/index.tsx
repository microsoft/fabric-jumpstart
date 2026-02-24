'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { tokens } from '@fluentui/react-components';
import { ChevronRightFilled } from '@fluentui/react-icons';
import { useThemeContext } from '@components/Providers/themeProvider';
import scenariosData from '@data/scenarios.json';
import workloadColorsData from '@data/workload-colors.json';
import type { ScenarioCard } from '@scenario/scenario';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

interface WorkloadColor {
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

const difficultyColor: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#dff6dd', fg: '#107c10' },
  intermediate: { bg: '#fff4ce', fg: '#797600' },
  advanced: { bg: '#fde7e9', fg: '#a4262c' },
};

const defaultColors: WorkloadColor = {
  light: '#E8F4FD',
  accent: '#0078D4',
  mid: '#5CB8E6',
  icon: '',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function CardHeader({
  scenario,
  isDark,
}: {
  scenario: ScenarioCard;
  isDark: boolean;
}) {
  const primaryTag = scenario.workloadTags?.[0];
  const wc = primaryTag ? workloadColors[primaryTag] ?? defaultColors : defaultColors;
  const icons = (scenario.workloadTags ?? [])
    .map((t) => workloadColors[t])
    .filter((c): c is WorkloadColor => !!c && !!c.icon);

  const lightAlpha = isDark ? 0.15 : 0.45;
  const midAlpha = isDark ? 0.25 : 0.5;
  const accentAlpha = isDark ? 0.35 : 0.3;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 40%, ${hexToRgba(wc.light, lightAlpha + 0.2)} 0%, transparent 70%),
          linear-gradient(135deg,
            ${hexToRgba(wc.light, lightAlpha)} 0%,
            ${hexToRgba(wc.mid, midAlpha)} 50%,
            ${hexToRgba(wc.accent, accentAlpha)} 100%
          )
        `,
      }}
    >
      {/* Subtle noise overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
      {/* Bottom fade into card body */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: isDark
            ? 'linear-gradient(to bottom, transparent, rgba(30, 30, 36, 0.78))'
            : 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.82))',
        }}
      />
      {/* Workload icons */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        {icons.length > 0 ? (
          icons.map((wc, i) => (
            <div
              key={i}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isDark
                  ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                  : '0 4px 24px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Image
                src={wc.icon}
                alt=""
                width={48}
                height={48}
                style={{ width: '44px', height: '44px' }}
                unoptimized
              />
            </div>
          ))
        ) : (
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ScenarioCarousel() {
  const scenarios = scenariosData as ScenarioCard[];
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  if (scenarios.length === 0) return null;

  const active = scenarios[activeIndex] || scenarios[0];
  const colors = difficultyColor[active.difficulty?.toLowerCase()] || difficultyColor.intermediate;

  return (
    <section style={{ padding: '48px 0 56px', position: 'relative', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '0 8%',
        marginBottom: '12px',
      }}>
        <div>
          <p style={{
            fontSize: tokens.fontSizeBase400,
            color: tokens.colorPaletteBlueForeground2,
            margin: '0 0 4px',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}>
            Explore
          </p>
          <h2 style={{
            fontSize: tokens.fontSizeBase600,
            fontWeight: Number(tokens.fontWeightBold),
            lineHeight: tokens.lineHeightBase600,
            color: tokens.colorNeutralForeground1,
            margin: 0,
          }}>
            Fabric Jumpstart Content Library
          </h2>
        </div>
        <Link
          href="/fabric_jumpstart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '15px',
            fontWeight: 600,
            color: tokens.colorBrandForeground1,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          See all <ChevronRightFilled />
        </Link>
      </div>

      {/* Spotlight frontmatter bar */}
      <div style={{
        padding: '0 8%',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        minHeight: '32px',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: tokens.colorPaletteBlueForeground2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {activeIndex + 1} of {scenarios.length}
        </span>
        <span style={{
          width: '1px',
          height: '16px',
          backgroundColor: tokens.colorNeutralStroke2,
          display: 'inline-block',
        }} />
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: '4px',
          backgroundColor: colors.bg,
          color: colors.fg,
        }}>
          {active.difficulty}
        </span>
        <span style={{
          fontSize: '12px',
          padding: '3px 10px',
          borderRadius: '4px',
          backgroundColor: tokens.colorNeutralBackground3,
          color: tokens.colorBrandForeground1,
        }}>
          {active.type}
        </span>
        <span style={{
          fontSize: '12px',
          color: tokens.colorPaletteBlueForeground2,
        }}>
          ⚡ {active.minutesToDeploy} min deploy
        </span>
        {active.tags.slice(0, 3).map((tag) => {
          const isWorkload = active.workloadTags?.includes(tag);
          return (
            <span key={tag} style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: isWorkload ? '#deecf9' : tokens.colorNeutralBackground3,
              color: isWorkload ? '#0078d4' : tokens.colorNeutralForeground2,
            }}>
              {tag}
            </span>
          );
        })}
      </div>

      {/* Carousel */}
      <div
        className="carousel-viewport"
        style={{ position: 'relative' }}
      >
        <Swiper
          modules={[EffectCoverflow, Navigation, Keyboard]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          keyboard={{ enabled: true }}
          coverflowEffect={{
            rotate: 4,
            stretch: 0,
            depth: 120,
            modifier: 2,
            slideShadows: false,
          }}
          navigation
          loop={scenarios.length > 3}
          onSlideChange={handleSlideChange}
          style={{ padding: '20px 0 40px', overflow: 'visible' }}
        >
          {scenarios.map((scenario) => (
            <SwiperSlide
              key={scenario.id}
              style={{ width: '340px', maxWidth: '85vw' }}
            >
              <Link
                href={`/fabric_jumpstart/${scenario.slug}/`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  className="carousel-card"
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    backgroundColor: isDark ? 'rgba(30, 30, 36, 0.78)' : 'rgba(255, 255, 255, 0.82)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(255, 255, 255, 0.35)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <CardHeader scenario={scenario} isDark={isDark} />
                  <div style={{ padding: '18px 20px 22px' }}>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: 600,
                      color: tokens.colorNeutralForeground1,
                      margin: '0 0 6px',
                      lineHeight: '1.3',
                    }}>
                      {scenario.title}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: tokens.colorNeutralForeground2,
                      margin: 0,
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {scenario.description}
                    </p>
                    <div style={{
                      marginTop: '14px',
                      fontSize: '12px',
                      color: tokens.colorNeutralForeground2,
                    }}>
                      {scenario.itemsInScope.length} Fabric items
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Seamless edge fade + active/inactive slide treatment */}
      <style jsx global>{`
        .carousel-viewport {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .swiper-slide {
          transition: filter 0.4s ease, opacity 0.4s ease;
          filter: blur(2px) brightness(${isDark ? '0.45' : '0.65'});
          opacity: 0.6;
        }
        .swiper-slide-active {
          filter: blur(0) brightness(1);
          opacity: 1;
        }

        .swiper-slide-active .carousel-card {
          border-color: ${isDark ? 'rgba(100, 180, 255, 0.3)' : 'rgba(0, 120, 212, 0.35)'} !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
        }

        .swiper-button-next,
        .swiper-button-prev {
          color: var(--colorBrandForeground1, #0078d4) !important;
          width: 40px !important;
          height: 40px !important;
          background: rgba(255,255,255,0.85);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          backdrop-filter: blur(8px);
        }
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 16px !important;
          font-weight: bold;
        }
      `}</style>
    </section>
  );
}
