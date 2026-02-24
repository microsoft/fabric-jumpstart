/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useStyles } from './styles';

const ImageComp = ({
  alt,
  basePath,
  path,
  src,
  width,
}: {
  alt: string;
  basePath: string;
  path: string;
  src: string;
  width: number;
}) => {
  let imagePath = '';

  const transformSrc = (src: string): string => {
    return src.replace(/<span>&#95;<\/span>/g, '_');
  };

  src = transformSrc(src);
  if (!/^https?:\/\//i.test(src)) {
    if (src.includes('./')) {
      src = src.replace('./', '');
      imagePath = `${basePath}/docs/${path}/${src}`;
    } else {
      imagePath = `${basePath}${src}`;
    }
  } else {
    imagePath = src;
  }

  const covertSrcToAltText = (src: string) => {
    let altText = src.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('.'));
    altText = altText.replace(/_/g, ' ');
    altText = altText.replace(/\w\S*/g, (w: string) =>
      w.replace(/^\w/, (c) => c.toUpperCase())
    );
    return altText;
  };

  const altText = alt ? alt : covertSrcToAltText(src);

  const widthStyle = width ? { width: `${width}px` } : {};

  const styles = useStyles();

  return (
    <img
      src={imagePath}
      className={mergeClasses(
        styles.customImage,
        width?.toString() && styles.customImageWidth
      )}
      alt={altText}
      title={altText}
      style={widthStyle}
    />
  );
};

export default ImageComp;
