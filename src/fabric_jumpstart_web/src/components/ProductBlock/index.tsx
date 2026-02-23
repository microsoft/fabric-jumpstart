'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import useTranslation from '@utils/translateWrapper';
import Typography from '@components/Typography';
import { useStyles } from './styles';
import Icon from '@components/Icon';
import LightArrow from '@images/light-arrow.svg';
import DarkArrow from '@images/dark-arrow.svg';
import LightRedirect from '@images/light-redirect.svg';
import DarkRedirect from '@images/dark-redirect.svg';

export interface ProductCardProps {
  jsonName: string;
  constants: {
    id: string;
    dark: {
      iconRegular: string;
      iconFilled: string;
    };
    light: {
      iconRegular: string;
      iconFilled?: string;
    };
    link: string;
    linkType?: string;
    hideInOverview?: boolean;
  }[];
  showHeader?: boolean;
}

const ProductCard = ({ jsonName, constants, showHeader }: ProductCardProps) => {
  const styles = useStyles();
  const { t } = useTranslation(jsonName);
  const [hoverCardIndex, setCardHoverIndex] = useState<number | null>();
  return (
    <div className={styles.root}>
      {showHeader && (
        <>
          <Typography type="heading" text={t('header.title')} />
          <Typography type="desc" text={t('header.subtitle')} />
        </>
      )}
      <section className={styles.cardWrapper}>
        {Array.isArray(constants) &&
          constants.map(
            (lineItem, index) =>
              !lineItem.hideInOverview && (
                <Link
                  className={styles.card}
                  key={t(`cards.${lineItem.id}.title`)}
                  href={lineItem.link}
                  onMouseEnter={() => setCardHoverIndex(index)}
                  onMouseLeave={() => setCardHoverIndex(null)}
                  target={lineItem?.linkType ? '_blank' : '_self'}
                >
                  <div className={styles.headerContainer}>
                    <Icon
                      darkThemeIcon={
                        hoverCardIndex === index
                          ? lineItem.dark.iconFilled
                          : lineItem.dark.iconRegular
                      }
                      lightThemeIcon={
                        hoverCardIndex === index && lineItem.light?.iconFilled
                          ? lineItem.light.iconFilled
                          : lineItem.light.iconRegular
                      }
                      alt={t(`cards.${lineItem.id}.title`)}
                      width={35}
                      height={25}
                    />
                    <Typography
                      type="subtitle"
                      text={t(`cards.${lineItem.id}.title`)}
                    />
                  </div>
                  <Typography
                    type="paragraph2"
                    text={t(`cards.${lineItem.id}.desc`)}
                  />
                  <div className={styles.footerContainer}>
                    <h6 className={styles.linkText}>
                      {t(`cards.${lineItem.id}.linkText`)}
                      {lineItem?.linkType ? (
                        <Icon
                          darkThemeIcon={DarkRedirect}
                          lightThemeIcon={LightRedirect}
                          width={10}
                          height={10}
                          alt={t(`cards.${lineItem.id}.title`)}
                          className={styles.linkText}
                        />
                      ) : (
                        <Icon
                          darkThemeIcon={DarkArrow}
                          lightThemeIcon={LightArrow}
                          width={5.47}
                          height={10}
                          alt={t(`cards.${lineItem.id}.title`)}
                          className={styles.linkText}
                        />
                      )}
                    </h6>
                  </div>
                </Link>
              )
          )}
      </section>
    </div>
  );
};

export default ProductCard;
