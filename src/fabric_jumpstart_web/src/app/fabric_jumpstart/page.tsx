'use client';
import React from 'react';
import PageWrapper from '@components/PageWrapper';
import useTranslation from '@utils/translateWrapper';
import HeroBanner from '@components/HeroBanner';
import Banner from '@images/scenarioBanner.svg';
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
      />
      <ScenarioGrid />
    </PageWrapper>
  );
}
