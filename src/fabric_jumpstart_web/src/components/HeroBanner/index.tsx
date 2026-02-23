'use client';
import React, { useMemo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useStyles } from './styles';
import Typography from '@components/Typography';
import { mergeClasses } from '@fluentui/react-components';
import { splitHeading } from '@utils/common';
import { subproduct, pageTypeconst } from '@constants/common';

const CodeBlock = dynamic(() => import('@components/Markdown/Codeblock'), {
  ssr: false,
});

export const bannerType = {
  ...pageTypeconst,
  ...subproduct,
};
export interface BannerProps {
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  label: string;
  heading: string;
  desc: string;
  children?: React.ReactNode;
  imageAlt: string;
  type?: string;
  bottomSpacing?: boolean;
  codeSnippet?: {
    language: string;
    code: string;
  };
  pypiLink?: string;
  refs?: {
    textContainer?: React.RefObject<HTMLDivElement>;
    imageContainer?: React.RefObject<HTMLDivElement>;
  };
}

const HeroBanner = forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      image,
      imageWidth,
      imageHeight,
      label,
      heading,
      desc,
      imageAlt,
      type,
      children,
      bottomSpacing,
      codeSnippet,
      pypiLink,
      refs,
    },
    ref
  ) => {
    const styles = useStyles();
    const headingText = useMemo(() => splitHeading(heading), [heading]);
    const customHeading = useMemo(
      () =>
        mergeClasses(
          type === bannerType?.scenarios && styles.scenariosHeading,
          type === bannerType?.hcibox && styles.hciboxHeading,
          type === bannerType?.drops && styles.dropsHeading,
          type === bannerType?.arcbox && styles.arcboxHeading,
          type === bannerType?.agora && styles.agoraHeading,
          type === bannerType?.gems && styles.gemsHeading,
          type === bannerType?.badges && styles.badgesHeading
        ),
      [type]
    );

    return (
      <div
        className={mergeClasses(
          styles.bannerContainer,
          bottomSpacing && styles.containerWithBottomSpace,
          type === bannerType.about && styles.aboutBannerContainer
        )}
        ref={ref}
      >
        <div
          className={mergeClasses(
            styles.textContainer,
            type && styles.moduleTextContainer,
            type === bannerType.drops && styles.dropsTextContainer,
            type === bannerType.mission && styles.missionTextContainer,
            type === bannerType.about && styles.aboutTextContainer,
            (type === bannerType.contribute || type === bannerType.blog) &&
              styles.contributeTextContainer,
            type === bannerType.agora && styles.agoraTextContainer,
            type === bannerType.faq && styles.faqTextContainer,
            type === bannerType.scenarios && styles.scenariosTextContainer
          )}
          ref={refs?.textContainer}
        >
          <div role="heading" aria-level={1}>
            <Typography type="headingLabel" text={label} />
          </div>
          <div
            className={styles.headingContainer}
            role="heading"
            aria-level={2}
          >
            <Typography
              type="custom"
              text={headingText.firstHalf}
              className={styles.marginRightText}
            />
            <Typography
              type="custom"
              text={headingText.lastWord}
              className={customHeading}
            />
          </div>
          <Typography type="desc" text={desc} className={styles.desc} />
          {codeSnippet && (
            <div>
              {pypiLink && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0, 120, 212, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  <span>📦</span>
                  <a
                    href={pypiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#0078d4',
                      textDecoration: 'none',
                    }}
                  >
                    fabric-jumpstart on PyPI
                  </a>
                </div>
              )}
              <CodeBlock>
                <code className={`language-${codeSnippet.language}`}>
                  {codeSnippet.code}
                </code>
              </CodeBlock>
            </div>
          )}
          {children}
        </div>
        <div
          className={mergeClasses(
            styles.imageContainer,
            type === bannerType.drops && styles.dropsImgContainer,
            type === bannerType.scenarios && styles.scenariosImgContainer,
            type === bannerType.contribute && styles.contributeImgContainer
          )}
          ref={refs?.imageContainer}
        >
          <Image
            src={image}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            priority
            className={mergeClasses(
              styles.image,
              type === bannerType.documentation &&
                styles.documentationImgContainer,
              type === bannerType.agora && styles.agoraImgContainer
            )}
          />
        </div>
      </div>
    );
  }
);

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
