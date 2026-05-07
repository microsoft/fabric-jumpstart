'use client';
import React from 'react';
import Link from 'next/link';
import PageWrapper from '@components/PageWrapper';
import useTranslation from '@utils/translateWrapper';
import HeroBanner from '@components/HeroBanner';
import Banner from '@images/heroBanner.svg';
import { INTERNAL_ROUTE } from '@config/urlconfig';
import MenuLayout from '@components/SideMenu/MenuLayout';
import ScenarioGrid from './ScenarioGrid';

export default function Scenarios() {
  const { t } = useTranslation('scenarios');
  return (
    <PageWrapper>
      <HeroBanner
        label={t('banner.label')}
        heading={t('banner.heading')}
        desc={t('banner.desc')}
        image={Banner}
        imageAlt={t('banner.imageAlt')}
        type="scenarios"
      >
        <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={INTERNAL_ROUTE.GETTING_STARTED}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0, 120, 212, 0.1)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#0078d4',
              textDecoration: 'none',
            }}
          >
            <span>🚀</span>
            Using Jumpstart for the First Time?
          </a>
          <Link
            href={INTERNAL_ROUTE.CREATE}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(17, 120, 101, 0.12)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#117865',
              textDecoration: 'none',
            }}
          >
            <img src="/scenarios.svg" alt="" width={15} height={15} style={{ display: 'block' }} />
            Contribute to Jumpstart
          </Link>
        </div>
      </HeroBanner>
      <MenuLayout>
        <ScenarioGrid />
      </MenuLayout>
    </PageWrapper>
  );
}

