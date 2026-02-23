'use client';
import React from 'react';
import useTranslation from '@utils/translateWrapper';
import Typography from '@components/Typography';
import UniverseCard from '@components/UniverseCard';
import { useStyles } from './styles';
import { jumpstartUniverseConst } from '@constants/homepage.constant';

const Explore = ({ showHeader }: { showHeader?: boolean }) => {
  const classes = useStyles();
  const { t } = useTranslation('universe');
  return (
    <div className={classes.exploreSection}>
      {showHeader && (
        <>
          <div role="heading" aria-level={2}>
            <Typography
              type="headingLabel"
              text={t('explore.label')}
              className={classes.exploreLabel}
            />
          </div>
          <div role="heading" aria-level={3}>
            <Typography
              type="custom"
              text={t('explore.title')}
              className={classes.exploreTitle}
            />
          </div>
        </>
      )}
      <div className={classes.exploreWrapper}>
        {jumpstartUniverseConst.cards.map((card) => {
          const cardSubtitle = t(`explore.cards.${card.id}.subtitle`);
          const cardSubtitleLower = cardSubtitle?.toLocaleLowerCase();
          return (
            <UniverseCard
              key={cardSubtitleLower}
              id={card.id}
              title={t(`explore.cards.${card.id}.title`)}
              subtitle={t(`explore.cards.${card.id}.subtitle`)}
              description={t(`explore.cards.${card.id}.desc`)}
              footerText={t(`explore.cards.${card.id}.footerText`)}
              imageSrc={card.image}
              link={card.link}
              imageAlt={t(`explore.cards.${card.id}.subtitle`)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Explore;
