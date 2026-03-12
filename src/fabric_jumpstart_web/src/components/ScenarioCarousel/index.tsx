'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { tokens } from '@fluentui/react-components';
import { ChevronRightFilled } from '@fluentui/react-icons';
import { useThemeContext } from '@components/Providers/themeProvider';
import JumpstartCard from '@components/JumpstartCard';
import scenariosData from '@data/scenarios.json';
import type { ScenarioCard } from '@scenario/scenario';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

export default function ScenarioCarousel() {
  const scenarios = scenariosData as ScenarioCard[];
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  if (scenarios.length === 0) return null;

  return (
    <section style={{ padding: '48px 0 56px', position: 'relative', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '0 8%',
        marginBottom: '24px',
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
            Featured Jumpstarts
          </h2>
        </div>
        <Link
          href="/catalog"
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
                href={`/catalog/${scenario.slug}/?from=home`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <JumpstartCard
                  scenario={scenario}
                  isDark={isDark}
                  className="carousel-card"
                  style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: tokens.colorNeutralBackground1,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                />
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
          pointer-events: none;
        }
        .swiper-slide-active {
          filter: blur(0) brightness(1);
          opacity: 1;
          pointer-events: auto;
        }

        .swiper-slide-active .carousel-card {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
        }

        .swiper-button-next,
        .swiper-button-prev {
          color: ${isDark ? '#ffffff' : '#0078d4'} !important;
          width: 44px !important;
          height: 44px !important;
          background: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.92)'};
          border-radius: 50%;
          box-shadow: ${isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)'};
          backdrop-filter: blur(8px);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,120,212,0.1)'};
          transform: scale(1.08);
        }
        .swiper-button-next {
          right: calc(50% - 220px) !important;
        }
        .swiper-button-prev {
          left: calc(50% - 220px) !important;
        }
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 18px !important;
          font-weight: bold;
        }
      `}</style>
    </section>
  );
}
