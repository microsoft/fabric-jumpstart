import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Markdown from 'markdown-to-jsx';
import Anchor from '@components/Markdown/Anchor';
import Blockquote from '@components/Markdown/Blockquote';
import DropsImg from './DropImage';
import ImageComp from '@components/Markdown/Image';
import Heading2 from '@components/Markdown/Heading2';
import CodeBlock from '@components/Markdown/Codeblock';
import ListItem from '@components/Markdown/ListItem';
import Table, { TableProps } from '@components/Markdown/Table';
import Underscore from './Underscore';
import UnderscoreEM from './UnderscoreEM';
import UnderscoreCode from './UnderscoreCode';

interface MarkdownViewInterface {
  markdowndata: string;
  pathToRoot: string;
  fullPathName: string;
  heading?: { copyText: string; ariaLabel: string };
  codeblock: { copyText: string; ariaLabel: string };
  isDarkMode: boolean;
  useDropImage?: boolean;
  blockquote: { disclaimer: string };
  horizontalScrollableTable?: TableProps['horizontalScrollable'];
}

const MarkdownView: React.FC<MarkdownViewInterface> = ({
  markdowndata,
  pathToRoot,
  fullPathName,
  heading,
  codeblock,
  isDarkMode,
  useDropImage,
  blockquote,
  horizontalScrollableTable,
}) => {
  const serach = usePathname();
  useEffect(() => {
    const currentUrl = window.location.hash;
    if (currentUrl) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        element.setAttribute('style', 'scroll-Margin-Top: 130px');
        setTimeout(() => {
          const downloadLink = document.createElement('a');
          downloadLink.href = currentUrl;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }, 100);
      }
    }
  }, [serach]);

  return (
    <Markdown
      key={markdowndata}
      options={{
        overrides: {
          empty: () => <></>,
          a: ({ href, children }) => <Anchor href={href}>{children}</Anchor>,
          blockquote: (props) => (
            <Blockquote {...props} disclaimer={blockquote.disclaimer} />
          ),
          code: UnderscoreCode,
          em: UnderscoreEM,
          span: Underscore,
          img: (props) => {
            return useDropImage ? (
              <DropsImg {...props} githubLink={pathToRoot} />
            ) : (
              <ImageComp {...props} basePath={pathToRoot} path={fullPathName} />
            );
          },

          h2: (props) => (
            <Heading2
              {...props}
              copyText={heading?.copyText}
              ariaLabel={heading?.ariaLabel}
            />
          ),
          pre: (props) => (
            <CodeBlock
              {...props}
              copyText={codeblock.copyText}
              ariaLabel={codeblock.ariaLabel}
              isDarkMode={isDarkMode}
            />
          ),
          li: ListItem,
          table: (props) => (
            <Table
              {...props}
              horizontalScrollable={horizontalScrollableTable}
            />
          ),
        },
      }}
    >
      {markdowndata}
    </Markdown>
  );
};

export default MarkdownView;
