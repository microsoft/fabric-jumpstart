'use client';
import React from 'react';
import { tokens } from '@fluentui/react-components';
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
        <div style={{ marginTop: '8px' }}>
          <a
            href={INTERNAL_ROUTE.GETTING_STARTED}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: tokens.colorSubtleBackgroundHover,
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: tokens.colorCompoundBrandForeground1,
              textDecoration: 'none',
            }}
          >
            <span>🚀</span>
            Using Jumpstart for the First Time?
          </a>
        </div>
      </HeroBanner>
      <MenuLayout>
        <ScenarioGrid />
      </MenuLayout>
    </PageWrapper>
  );
}
