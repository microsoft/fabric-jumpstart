'use client';
import React, { useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { fabricDark, fabricLight } from '@styles/fabricPrismTheme';
import { tokens } from '@fluentui/react-components';
import { useStyles } from './styles';

const CodeBlock = (props: any) => {
  const [copied, setCopied] = useState(false);
  const isDark = !!props.isDarkMode;

  const getChildrenText = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children.replace(/<span>&#95;<\/span>/g, '_');
    }
    if (Array.isArray(children)) {
      return children
        .map(getChildrenText)
        .join('')
        .trim()
        .replace(/\n /g, '\n');
    }
    if (
      React.isValidElement(children) &&
      children.props &&
      children.props.children
    ) {
      return getChildrenText(children.props.children);
    }
    return '';
  };

  const getLanguage = (children: React.ReactNode): string => {
    if (
      React.isValidElement(children) &&
      children.props &&
      typeof children.props === 'object'
    ) {
      const { class: className, className: classProp } = children.props as {
        class?: string;
        className?: string;
      };
      if (className?.includes('language-')) {
        return className.split('language-')[1];
      }
      if (className?.includes('lang-')) {
        return className.split('lang-')[1];
      }
      if (classProp?.includes('language-')) {
        return classProp.split('language-')[1];
      }
      if (classProp?.includes('lang-')) {
        return classProp.split('lang-')[1];
      }
    }
    if (Array.isArray(children)) {
      return children.map(getLanguage).join('');
    }
    if (
      React.isValidElement(children) &&
      children.props &&
      (children.props as any).children
    ) {
      return getLanguage((children.props as any).children);
    }
    return '';
  };

  const language = getLanguage(props.children);
  const text = getChildrenText(props.children);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const styles = useStyles();

  const refactorLang = () => {
    if (language === 'PowerShell') {
      return 'powershell';
    } else if (language === 'Bash') {
      return 'bash';
    } else {
      return language;
    }
  };

  const codeBlockLang = useMemo(() => refactorLang(), [language]);
  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <span>{language}</span>
      </div>
      <div className={styles.codeBlockBody}>
        <SyntaxHighlighter
          language={codeBlockLang}
          style={isDark ? fabricDark : fabricLight}
          showLineNumbers={false}
          tabIndex={0}
        >
          {text}
        </SyntaxHighlighter>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 10px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            color: tokens.colorNeutralForeground2,
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default CodeBlock;
