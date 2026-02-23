'use client';
import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { mergeClasses, Text } from '@fluentui/react-components';
import { ChevronRightFilled } from '@fluentui/react-icons';
import { useStyles } from './styles';
import { subproduct } from '@constants/common';

const subtitleType = {
  ...subproduct,
};

export interface UniverseCardProps {
  id: string;
  link: string;
  title: string;
  subtitle: string;
  description: string;
  footerText: string;
  imageSrc: string;
  imageAlt: string;
}

const UniverseCard: React.FC<UniverseCardProps> = ({
  id,
  link,
  title,
  subtitle,
  description,
  footerText,
  imageSrc,
  imageAlt,
}) => {
  const classes = useStyles();

  const subtitleClasses = useMemo(() => {
    return mergeClasses(
      classes.subtitle,
      id === subtitleType.hcibox && classes.subtitleHcibox,
      id === subtitleType.drops && classes.subtitleDrops,
      id === subtitleType.arcbox && classes.subtitleArcbox,
      id === subtitleType.agora && classes.subtitleAgora,
      id === subtitleType.scenarios && classes.subtitleScenarios,
      id === subtitleType.gems && classes.subtitleGems
    );
  }, [id]);

  return (
    <Link href={link} className={classes.link}>
      <div className={classes.root}>
        <div className={classes.wrapper}>
          <div role="heading" aria-level={3}>
            <Text block size={800} weight="semibold">
              {title}
            </Text>
            <Text
              block
              size={500}
              weight="semibold"
              align="end"
              className={subtitleClasses}
            >
              {subtitle}
            </Text>
          </div>
          <Image src={imageSrc} alt={imageAlt} width={115} height={142} />
        </div>
        <Text as="p" size={300} weight="regular" block className={classes.desc}>
          {description}
        </Text>
        <Text
          as="p"
          className={classes.footerText}
          size={400}
          weight="semibold"
          block
        >
          {footerText}
          <ChevronRightFilled />
        </Text>
      </div>
    </Link>
  );
};

export default UniverseCard;
