'use client';

import * as React from 'react';
import {
  SSRProvider,
  RendererProvider,
  createDOMRenderer,
  renderToStyleElements,
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';
import { ThemeProvider } from './themeProvider';
import { GlobalProvider } from './globalProvider';

const RootProvider = ({ children }: { children: React.ReactNode }) => {
  const [renderer] = React.useState(() => createDOMRenderer());
  const didRenderRef = React.useRef(false);

  useServerInsertedHTML(() => {
    if (didRenderRef.current) {
      return;
    }
    didRenderRef.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <GlobalProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </GlobalProvider>
      </SSRProvider>
    </RendererProvider>
  );
};

export default RootProvider;
