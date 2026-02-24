'use client';
import React from 'react';
import Markdown from 'markdown-to-jsx';
import Heading2 from '@components/Markdown/Heading2';
import Anchor from '@components/Markdown/Anchor';
import Blockquote from '@components/Markdown/Blockquote';
import ImageComp from '@components/Markdown/Image';
import CodeBlock from '@components/Markdown/Codeblock';
import ListItem from '@components/Markdown/ListItem';
import { mergeClasses } from '@fluentui/react-components';
import IconContainer, {
  IconContainerProps,
} from '@components/Markdown/MdIconContainer';
import FaqMarkDown, { FaqMarkDownProps } from '../MdFaq';
import { useStyles } from './styles';
import MarkdownView from '../main';
import { TableProps } from '../Table';

export interface PreviewProps {
  markdowndata: string;
  pathToRoot: string;
  fullPathName: string;
  heading?: { copyText: string; ariaLabel: string };
  codeblock: { copyText: string; ariaLabel: string };
  feedback: IconContainerProps['feedback'];
  skeleton: { loading: string };
  showFullview: boolean;
  editPage: IconContainerProps['editPage'];
  addChild: IconContainerProps['addChild'];
  bug: IconContainerProps['bug'];
  isDarkMode: boolean;
  isFaq?: boolean;
  faqTitle?: FaqMarkDownProps['faqTitle'];
  blockquote: { disclaimer: string };
  onlyContent?: boolean;
  horizontalScrollableTable?: TableProps['horizontalScrollable'];
  useMainPageLayout?: boolean;
}

const Preview = ({
  markdowndata,
  pathToRoot,
  fullPathName,
  heading,
  codeblock,
  feedback,
  skeleton,
  showFullview,
  editPage,
  addChild,
  bug,
  isDarkMode,
  isFaq,
  faqTitle,
  blockquote,
  onlyContent = false,
  horizontalScrollableTable,
  useMainPageLayout = false,
}: PreviewProps) => {
  const styles = useStyles();

  markdowndata = markdowndata.replace(/```source/g, '```source\n');
  const markdown = (markdowndata: string) => (
    <MarkdownView
      markdowndata={markdowndata}
      key={markdowndata}
      pathToRoot={pathToRoot}
      fullPathName={fullPathName}
      heading={heading}
      codeblock={codeblock}
      isDarkMode={isDarkMode}
      blockquote={blockquote}
      horizontalScrollableTable={horizontalScrollableTable}
    />
  );

  const RenderMarkDown: React.FC = () => (
    <div
      className={mergeClasses(
        styles.pageContainer,
        showFullview && styles.fullView,
        horizontalScrollableTable && styles.horizontalScrollableTableWapper,
        useMainPageLayout && styles.mainPageContainer
      )}
    >
      <div
        className={mergeClasses(styles.markDownContainer, styles.markdownView)}
        role="main"
      >
        <IconContainer
          editPage={editPage}
          addChild={addChild}
          bug={bug}
          feedback={feedback}
        />
        {markdown(markdowndata)}
      </div>
    </div>
  );

  const RenderFaq = () => (
    <FaqMarkDown
      markdowndata={markdowndata}
      getMarkdownView={markdown}
      faqTitle={faqTitle}
    />
  );

  const ContentView = () => {
    return (
      <section className={styles.markdownView}>
        {markdown(markdowndata)}
      </section>
    );
  };

  if (!markdowndata)
    <div className={styles.pageContainer}>{skeleton.loading}</div>;

  if (onlyContent) return <ContentView />;

  return <>{isFaq ? <RenderFaq /> : <RenderMarkDown />}</>;
};

export default Preview;
