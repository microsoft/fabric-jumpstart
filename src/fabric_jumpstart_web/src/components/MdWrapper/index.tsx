'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import useTranslation from '@utils/translateWrapper';
import { fetchData } from '@utils/apiUtils';
import {
  findNode,
  getPathName,
  refactorMarkdown,
  sortNodeTree,
  getJumpToSectionList,
} from '@utils/markdown';
import Preview, { PreviewProps } from '@components/Markdown/Preview';
import SideMenuData from '@data/side-menu.json';
import { useGlobalContext } from '@components/Providers/globalProvider';
import { useThemeContext } from '@components/Providers/themeProvider';
import { endpathForMarkdown, themeType } from '@constants/common';
import { ACTION } from '@store/action';

interface MarkDownPreviewProps {
  params?: { slug: string };
  path?: string;
  githubContentBasePath?: string;
  pathToRoot: string;
  editGitHubPage?: string;
  createGitHubPage?: string;
  githubReportABug?: string;
  githubFeedback?: string;
  isFaq?: PreviewProps['isFaq'];
  fileurl?: string;
  onlyContent?: boolean;
  horizontalScrollableTable?: PreviewProps['horizontalScrollableTable'];
  useMainPageLayout?: PreviewProps['useMainPageLayout'];
}

const isPromiseLike = (value: any): value is Promise<any> => {
  return value && typeof value === 'object' && typeof value.then === 'function';
};

const MdWrapper = ({
  params,
  path,
  githubContentBasePath,
  pathToRoot,
  editGitHubPage,
  createGitHubPage,
  githubReportABug,
  githubFeedback,
  isFaq,
  fileurl,
  onlyContent,
  horizontalScrollableTable,
  useMainPageLayout,
}: MarkDownPreviewProps) => {
  const markdownRef = useRef<HTMLDivElement>(null);
  const { globaleState, setGlobalState } = useGlobalContext();
  const { theme } = useThemeContext();
  const { t } = useTranslation('markdown');
  const [menuData] = useState(SideMenuData);
  const [markdowndata, setMarkDownData] = useState('');
  const unwrappedParams = params
    ? isPromiseLike(params)
      ? React.use(params)
      : params
    : undefined;
  const fullPathName = path ? getPathName(path, unwrappedParams as any) : '';
  const url =
    fileurl || `${githubContentBasePath}${fullPathName}${endpathForMarkdown}`;
  const editPageUrl = `${editGitHubPage}${fullPathName}${endpathForMarkdown}`;
  const createPageUrl = `${createGitHubPage}${fullPathName}${endpathForMarkdown}`;
  const reportABugPageUrl = githubReportABug;
  const feedbackPageUrl = githubFeedback;

  const getMarkdownData = useCallback(async (): Promise<string> => {
    const markdown = await fetchData(url);
    const result = markdown || '';
    return result;
  }, [fullPathName]);

  const getContent = useCallback(
    async (data: any) => {
      const currentNode = findNode(menuData, fullPathName);
      const markdown = await refactorMarkdown(
        data,
        currentNode,
        getMarkdownData,
        !onlyContent
      );
      setMarkDownData(markdown);
    },
    [getMarkdownData, menuData, fullPathName]
  );

  useEffect(() => {
    sortNodeTree(menuData);
    getMarkdownData().then((data) => {
      getContent(data);
    });
  }, [menuData, getMarkdownData, getContent]);

  useEffect(() => {
    if (markdownRef.current && markdowndata) {
      const jumpToSectionList = getJumpToSectionList(markdownRef);
      setGlobalState(ACTION.SET_JUMP_TO_SECTION_LIST, jumpToSectionList);
    }
  }, [markdownRef.current, markdowndata]);

  return (
    <section ref={markdownRef}>
      <Preview
        markdowndata={markdowndata}
        pathToRoot={pathToRoot}
        fullPathName={fullPathName}
        heading={{
          copyText: t('heading.copyLabel'),
          ariaLabel: t('heading.ariaLabel'),
        }}
        codeblock={{
          copyText: t('codeblock.copyLabel'),
          ariaLabel: t('codeblock.ariaLabel'),
        }}
        feedback={{ label: t('feedback.label'), link: feedbackPageUrl }}
        skeleton={{ loading: t('skeleton.loading') }}
        showFullview={!globaleState.isMenuOpen}
        editPage={{ label: t('editPage.label'), link: editPageUrl }}
        addChild={{ label: t('addChild.label'), link: createPageUrl }}
        bug={{ label: t('bug.label'), link: reportABugPageUrl }}
        isDarkMode={theme.key === themeType.dark}
        isFaq={isFaq}
        faqTitle={t('faq.title')}
        blockquote={{
          disclaimer: t('blockquote.disclaimer'),
        }}
        onlyContent={onlyContent}
        horizontalScrollableTable={horizontalScrollableTable}
        useMainPageLayout={useMainPageLayout}
      />
    </section>
  );
};

export default MdWrapper;
