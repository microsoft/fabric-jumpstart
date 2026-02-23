'use client';
import * as React from 'react';
import useTranslation from '@utils/translateWrapper';
import SectionCard from '@components/SectionCard';
import { sectionCardsConst } from '@constants/homepage.constant';
import { useStyles } from './styles';

const RowSection: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation('home');

  const rowSection: {
    label: string;
    heading: string;
    desc: string[];
    link?: { text: string; url: string };
    codeSnippet?: { language: string; code: string };
  }[] = t('rowSection', { count: 1 }, { returnObjects: true }) as any;

  return (
    <>
      {sectionCardsConst.map((sectionCard, index) => (
        <SectionCard
          classNames={{
            cardClassNames: classes[`card${index}` as keyof typeof classes],
            textContainerClassName:
              classes[`textContainer${index}` as keyof typeof classes],
            imageClassName: classes[`image${index}` as keyof typeof classes],
          }}
          key={rowSection[index].label}
          label={rowSection[index].label}
          heading={rowSection[index].heading}
          desc={rowSection[index].desc}
          codeSnippet={rowSection[index].codeSnippet}
          image={sectionCard.image}
          type={index % 2 === 0 ? 'primary' : 'secondary'}
          imageAltText={rowSection[index].heading}
        />
      ))}
    </>
  );
};

export default RowSection;
