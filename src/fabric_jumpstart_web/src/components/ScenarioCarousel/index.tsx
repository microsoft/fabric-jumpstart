'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { tokens } from '@fluentui/react-components';
import { ChevronRightFilled } from '@fluentui/react-icons';
import scenariosData from '@data/scenarios.json';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

interface Scenario {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  tags: string[];
  previewImage: string;
  minutesToDeploy: number;
  minutesToComplete: number;
  itemsInScope: string[];
  slug: string;
}

const difficultyColor: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#dff6dd', fg: '#107c10' },
  intermediate: { bg: '#fff4ce', fg: '#797600' },
  advanced: { bg: '#fde7e9', fg: '#a4262c' },
};

export default function ScenarioCarousel() {
  const scenarios = scenariosData as Scenario[];
  const [activeIndex, setActiveIndex] = useState(0);

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
            color: tokens.colorNeutralForeground3,
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
          color: tokens.colorNeutralForeground3,
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
          backgroundColor: tokens.colorBrandBackground2,
          color: tokens.colorBrandForeground2,
        }}>
          {active.type}
        </span>
        <span style={{
          fontSize: '12px',
          color: tokens.colorNeutralForeground3,
        }}>
          ⚡ {active.minutesToDeploy} min deploy
        </span>
        {active.tags.slice(0, 3).map((tag) => (
          <span key={tag} style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: tokens.colorNeutralBackground3,
            color: tokens.colorNeutralForeground2,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Carousel — edge fade via CSS mask-image (no overlay rectangles) */}
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
          {scenarios.map((scenario, i) => (
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
                    backgroundColor: 'rgba(255, 255, 255, 0.82)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Image
                    src={scenario.previewImage}
                    alt={scenario.title}
                    width={600}
                    height={200}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    unoptimized
                  />
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
                      color: tokens.colorNeutralForeground3,
                    }}>
                      ⚡ {scenario.minutesToDeploy} min &middot; {scenario.itemsInScope.length} Fabric items
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
        /* Edge fade via mask — fades the actual pixels, no ugly rectangles */
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

        /* Non-active slides: dimmed + blurred */
        .swiper-slide {
          transition: filter 0.4s ease, opacity 0.4s ease;
          filter: blur(2px) brightness(0.65);
          opacity: 0.6;
        }
        .swiper-slide-active {
          filter: blur(0) brightness(1);
          opacity: 1;
        }

        /* Active card gets elevated glow */
        .swiper-slide-active .carousel-card {
          border-color: rgba(0, 120, 212, 0.35) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .carousel-card {
            background-color: rgba(30, 30, 36, 0.78) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
          }
          .swiper-slide {
            filter: blur(2px) brightness(0.45);
          }
          .swiper-slide-active {
            filter: blur(0) brightness(1);
          }
          .swiper-slide-active .carousel-card {
            border-color: rgba(100, 180, 255, 0.3) !important;
          }
        }

        /* Nav arrows */
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
