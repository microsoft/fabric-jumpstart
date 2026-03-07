'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface ImageWithLightboxProps {
  src?: string;
  alt?: string;
}

export default function ImageWithLightbox({ src, alt, ...rest }: ImageWithLightboxProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      <figure style={{ margin: '20px 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...rest}
          src={src}
          alt={alt || ''}
          loading="lazy"
          onClick={() => setOpen(true)}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            cursor: 'zoom-in',
          }}
        />
        {alt && (
          <figcaption
            style={{
              marginTop: '6px',
              fontSize: '13px',
              lineHeight: 1.4,
              color: 'var(--prose-caption, rgba(0,0,0,0.5))',
              textAlign: 'left',
            }}
          >
            {alt}
          </figcaption>
        )}
      </figure>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={close}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '20px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ''}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '8px',
              objectFit: 'contain',
              cursor: 'default',
            }}
          />
        </div>
      )}
    </>
  );
}
