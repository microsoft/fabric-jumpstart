import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStyles } from './styles';

const Anchor = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const pathName = usePathname();
  const styles = useStyles();

  // Remove redirect parameters from the URL
  const removeRedirectParam = (url: string) => {
    const [base, hash] = url.split('#');
    const [path, query] = base.split('?');
    const filtered = query
      ?.split('&')
      .filter((p) => !/^redirect(_uri|_url)?=/i.test(p))
      .join('&');
    return path + (filtered ? '?' + filtered : '') + (hash ? '#' + hash : '');
  };

  // External link detection
  const externalLink = /^https?:\/\//i.test(href);

  const resolveHref = (href: string) => {
    if (href.startsWith('../')) {
      if (typeof window === 'undefined') {
        return href;
      }
      const baseUrl = window.location.href;
      const [, , ...basePathParts] = baseUrl.split('/');
      const basePath = basePathParts.length ? basePathParts.slice(1) : [];
      const relativePathParts = href.split('/').filter(Boolean);
      relativePathParts.forEach((part) => {
        if (part === '..') {
          basePath.pop();
        } else {
          basePath.push(part);
        }
      });
      const resolvedPath = basePath.join('/');
      return `/${resolvedPath}`;
    } else if (href.startsWith('#')) {
      return `${pathName}${href}`;
    }
    return href.startsWith('/') ? href : `/${href}`;
  };
  const sanitizedNewHref = removeRedirectParam(resolveHref(href));
  const sanitizedHref = removeRedirectParam(href);
  const finalHref = externalLink ? sanitizedHref : sanitizedNewHref; //CodeQL [SM01507] we can't validate the redirection URL because for that we'll need a set of defined trusted domains in the code and we cannot do so

  return (
    <Link
      className={styles.link}
      href={finalHref} //CodeQL [SM01507] we can't validate the redirection URL because for that we'll need a set of defined trusted domains in the code and we cannot do so
      id={finalHref} //CodeQL [SM01507] we can't validate the redirection URL because for that we'll need a set of defined trusted domains in the code and we cannot do so
      target={externalLink ? '_blank' : '_self'}
      rel="noreferrer"
      aria-label={React.Children.toArray(children)
        .map((child) => (typeof child === 'string' ? child : ''))
        .join('')} //CodeQL [SM01507] we can't validate the redirection URL because for that we'll need a set of defined trusted domains in the code and we cannot do so
    >
      {children}
    </Link>
  );
};

export default Anchor;
