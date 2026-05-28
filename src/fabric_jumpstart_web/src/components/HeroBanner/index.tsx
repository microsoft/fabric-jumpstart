'use client';
import React, { useMemo, useState, useEffect, forwardRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useStyles } from './styles';
import Typography from '@components/Typography';
import { mergeClasses } from '@fluentui/react-components';
import { splitHeading } from '@utils/common';
import { subproduct, pageTypeconst } from '@constants/common';
import { useThemeContext } from '@components/Providers/themeProvider';

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
    const { theme } = useThemeContext();
    const isDark = theme.key === 'dark';
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    useEffect(() => {
      if (!isVideoOpen) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsVideoOpen(false);
        }
      };

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [isVideoOpen]);

    const headingText = useMemo(() => splitHeading(heading), [heading]);
    const customHeading = useMemo(
      () =>
        mergeClasses(
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
          type === bannerType.about && styles.aboutBannerContainer,
          type === bannerType.scenarios && styles.scenariosBannerContainer
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
            <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                }}
              >

                {pypiLink && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(0, 120, 212, 0.1)',
                      borderRadius: '8px',
                      padding: '6px 14px',
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
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0, 120, 212, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  <span>🚀</span>
                  <a
                    href="/getting-started?from=home"
                    style={{
                      color: '#0078d4',
                      textDecoration: 'none',
                    }}
                  >
                    Getting Started
                  </a>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0, 120, 212, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  <span>▶</span>
                  <button
                    type="button"
                    onClick={() => setIsVideoOpen(true)}
                    style={{
                      color: '#0078d4',
                      textDecoration: 'none',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    Watch the Demo Video
                  </button>
                </div>
              </div>
              <CodeBlock isDarkMode={isDark}>
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

        {isVideoOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Fabric Jumpstart demo video"
            onClick={() => setIsVideoOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '4px',
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(99vw, 1600px)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
                backgroundColor: '#000',
              }}
            >
              <button
                type="button"
                onClick={() => setIsVideoOpen(false)}
                aria-label="Close video"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 2,
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#1f1f1f',
                  fontSize: '20px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%',
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/pqYJVZXTAcE?autoplay=1"
                  title="Fabric Jumpstart demo video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
