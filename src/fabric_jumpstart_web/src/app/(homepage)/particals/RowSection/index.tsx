'use client';
import * as React from 'react';
import useTranslation from '@utils/translateWrapper';
import Icon from '@components/Icon';
import SectionCard from '@components/SectionCard';
import { sectionCardsConst } from '@constants/homepage.constant';
import ExternalArrowWhite from '@images/externalArrowWhite.svg';
import ExternalArrowBlack from '@images/externalArrowBlack.svg';
import { useStyles } from './styles';

const RowSection: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation('home');

  const rowSection: {
    label: string;
    heading: string;
    desc: string[];
    buttonText: { left: { label: string }; right: { label: string } };
    link: { text: string; url: string };
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
          buttonProps={{
            left: {
              label: rowSection[index].buttonText?.left.label,
              as: 'a',
              href: sectionCard.button?.left.link,
              target: sectionCard.button?.left.icon ? '_blank' : '',
              rel: sectionCard.button?.left.icon ? 'noopener noreferrer' : '',
              icon: sectionCard.button?.left.icon ? (
                <Icon
                  darkThemeIcon={ExternalArrowWhite}
                  lightThemeIcon={
                    sectionCard.id === 'demos'
                      ? ExternalArrowWhite
                      : ExternalArrowBlack
                  }
                  alt={t('banner.buttonText.right.iconAltText')}
                  width={30}
                  height={20}
                />
              ) : null,
            },
            right: {
              label: rowSection[index].buttonText?.right.label,
              as: 'a',
              href: sectionCard.button?.right.link,
              target: sectionCard.button?.right.icon ? '_blank' : '',
              rel: sectionCard.button?.right.icon ? 'noopener noreferrer' : '',
              icon: sectionCard.button?.right.icon ? (
                <Icon
                  darkThemeIcon={ExternalArrowWhite}
                  lightThemeIcon={ExternalArrowBlack}
                  alt={t('banner.buttonText.right.iconAltText')}
                  width={30}
                  height={20}
                />
              ) : null,
            },
          }}
          image={sectionCard.image}
          link={{
            text: rowSection[index].link?.text,
            url: rowSection[index].link?.text ? sectionCard.link : '',
          }}
          type={index % 2 === 0 ? 'primary' : 'secondary'}
          imageAltText={rowSection[index].heading}
        />
      ))}
    </>
  );
};

export default RowSection;
