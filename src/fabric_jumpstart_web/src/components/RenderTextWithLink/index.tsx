'use client';
import React from 'react';
import Link from 'next/link';
import { useStyles } from './styles';

interface UrlMap {
  [key: string]: {
    url: string;
  };
}

interface RenderTextWithLinksProps {
  text: string;
  urlMap: UrlMap;
  className?: string;
}

const RenderTextWithLinks: React.FC<RenderTextWithLinksProps> = ({
  text,
  urlMap,
  className,
}) => {
  const styles = useStyles();
  const parts = text.split(/({[^}]+})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const key = part.slice(1, -1);
      return (
        <Link
          href={urlMap[index - 1]?.url}
          className={
            className && className === 'previewNoteLinks'
              ? styles.previewNoteLinks
              : styles.previewLinks
          }
          key={part}
          target={urlMap[index - 1]?.url.startsWith('http') ? '_blank' : ''}
        >
          {key}
        </Link>
      );
    }
    return part;
  });
};

export default RenderTextWithLinks;
