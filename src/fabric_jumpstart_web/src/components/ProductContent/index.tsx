import React from 'react';
import useTranslation from '@utils/translateWrapper';
import HeroBanner from '@components/HeroBanner';
import ProductBlock, { ProductCardProps } from '@components/ProductBlock';

interface ProductContentProps {
  type: string;
  constants: ProductCardProps['constants'];
  bannerImg: string;
}

export default function ProductContent({
  type,
  constants,
  bannerImg,
}: ProductContentProps) {
  const { t } = useTranslation(type);
  return (
    <>
      <HeroBanner
        label={t('banner.label')}
        heading={t('banner.heading')}
        desc={t('banner.desc')}
        image={bannerImg}
        imageAlt={t('banner.imageAlt')}
        type={type}
      />
      <ProductBlock jsonName={type} constants={constants} />
    </>
  );
}
