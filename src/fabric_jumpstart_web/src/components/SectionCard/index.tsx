'use client';
import React from 'react';
import InfoCard, { InfoCardProps } from '@components/InfoCard';
import Image from 'next/image';
import { useStyles } from './styles';
import { mergeClasses } from '@fluentui/react-components';

export const cardType = {
  primary: 'primary',
  secondary: 'secondary',
};

export type CardType = keyof typeof cardType;

export interface SectionCardProps {
  image: string;
  type?: CardType;
  imageAltText: string;
  imageWidth?: number;
  imageHeight?: number;
  classNames?: {
    cardClassNames?: string;
    textContainerClassName?: string;
    imageClassName?: string;
  };
}

const SectionCard: React.FC<SectionCardProps & InfoCardProps> = ({
  image,
  imageAltText,
  imageWidth,
  imageHeight,
  type,
  classNames,
  ...infoCardProps
}) => {
  const { label, heading, desc, buttonProps, link } = infoCardProps;
  const styles = useStyles();
  const cardStyle = mergeClasses(
    type === cardType.primary ? styles.primaryCard : styles.secondaryCard,
    classNames?.cardClassNames
  );
  return (
    <div className={cardStyle}>
      <div
        className={mergeClasses(
          styles.infoContainer,
          classNames?.textContainerClassName
        )}
      >
        <InfoCard
          label={label}
          heading={heading}
          desc={desc}
          buttonProps={buttonProps}
          link={link}
        />
      </div>
      <div className={styles.imageContainer}>
        <Image
          src={image}
          alt={imageAltText}
          width={imageWidth}
          height={imageHeight}
          className={classNames?.imageClassName}
        />
      </div>
    </div>
  );
};

export default SectionCard;
