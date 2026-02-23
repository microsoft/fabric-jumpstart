'use client';
import React, { useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import Copy, { CopyToaster } from '../Copy';
import { useStyles } from './styles';
import { copyToClipboard } from '@utils/common';

interface hsl {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}
const propertyClassDefaultColorOneDark: hsl = {
  h: 355,
  s: 65,
  l: 65,
};
const propertyClassContrastColorOneDark: hsl = {
  h: 356,
  s: 75,
  l: 68,
};
const commentDefaultColorOneDark: hsl = {
  h: 220,
  s: 10,
  l: 40,
};
const commentContrastColorOneDark: hsl = {
  h: 221,
  s: 15,
  l: 60,
};
const punctuationDefaultColorOneDark: hsl = {
  h: 220,
  s: 14,
  l: 71,
};
const punctuationContrastColorOneDark: hsl = {
  h: 160,
  s: 70,
  l: 75,
};

const CodeBlock = (props: any) => {
  const [showToast, setShowToast] = useState(false);

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

  const handleClick = (event: any) => {
    copyToClipboard(event, text);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Toast disappears after 3 seconds
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

  const oneDarkColorClass = {
    property: 'property',
    comment: 'comment',
    punctuation: 'punctuation',
  };

  const propertyClassContrastColorOneDarkString = `hsl(${propertyClassContrastColorOneDark.h}, ${propertyClassContrastColorOneDark.s}%, ${propertyClassContrastColorOneDark.l}%)`;
  const commentContrastColorOneDarkString = `hsl(${commentContrastColorOneDark.h}, ${commentContrastColorOneDark.s}%, ${commentContrastColorOneDark.l}%)`;
  const punctuationContrastColorOneDarkString = `hsl(${punctuationContrastColorOneDark.h}, ${punctuationContrastColorOneDark.s}%, ${punctuationContrastColorOneDark.l}%)`;

  const oneDarkPropertyhslColor = oneDark[oneDarkColorClass.property].color
    ?.substring(3)
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/%/g, '')
    .split(',') || [0, 0, 0];
  const parsedOneDarkPropertyhslColor = oneDarkPropertyhslColor && {
    h: parseInt(oneDarkPropertyhslColor[0].toString().trim(), 10),
    s: parseInt(oneDarkPropertyhslColor[1].toString().trim(), 10),
    l: parseInt(oneDarkPropertyhslColor[2].toString().trim(), 10),
  };
  const oneDarkCommenthslColor = oneDark[oneDarkColorClass.comment].color
    ?.substring(3)
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/%/g, '')
    .split(',') || [0, 0, 0];
  const parsedOneDarkCommenthslColor = oneDarkCommenthslColor && {
    h: parseInt(oneDarkCommenthslColor[0].toString().trim(), 10),
    s: parseInt(oneDarkCommenthslColor[1].toString().trim(), 10),
    l: parseInt(oneDarkCommenthslColor[2].toString().trim(), 10),
  };
  const oneDarkPunctuationhslColor = oneDark[
    oneDarkColorClass.punctuation
  ].color
    ?.substring(3)
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/%/g, '')
    .split(',') || [0, 0, 0];
  const parsedOneDarkPunctuationhslColor = oneDarkPunctuationhslColor && {
    h: parseInt(oneDarkPunctuationhslColor[0].toString().trim(), 10),
    s: parseInt(oneDarkPunctuationhslColor[1].toString().trim(), 10),
    l: parseInt(oneDarkPunctuationhslColor[2].toString().trim(), 10),
  };
  const areHslColorsEqual = (onDarkClassName: string): boolean => {
    if (onDarkClassName === oneDarkColorClass.property) {
      return (
        parsedOneDarkPropertyhslColor.h ===
          propertyClassDefaultColorOneDark.h &&
        parsedOneDarkPropertyhslColor.s ===
          propertyClassDefaultColorOneDark.s &&
        parsedOneDarkPropertyhslColor.l === propertyClassDefaultColorOneDark.l
      );
    } else if (onDarkClassName === oneDarkColorClass.comment) {
      return (
        parsedOneDarkCommenthslColor.h === commentDefaultColorOneDark.h &&
        parsedOneDarkCommenthslColor.s === commentDefaultColorOneDark.s &&
        parsedOneDarkCommenthslColor.l === commentDefaultColorOneDark.l
      );
    } else if (onDarkClassName === oneDarkColorClass.punctuation) {
      return (
        parsedOneDarkPunctuationhslColor.h ===
          punctuationDefaultColorOneDark.h &&
        parsedOneDarkPunctuationhslColor.s ===
          punctuationDefaultColorOneDark.s &&
        parsedOneDarkPunctuationhslColor.l === punctuationDefaultColorOneDark.l
      );
    }
    return false;
  };

  oneDark[oneDarkColorClass.property].color = areHslColorsEqual(
    oneDarkColorClass.property
  )
    ? propertyClassContrastColorOneDarkString
    : oneDark[oneDarkColorClass.property].color;
  oneDark[oneDarkColorClass.comment].color = areHslColorsEqual(
    oneDarkColorClass.comment
  )
    ? commentContrastColorOneDarkString
    : oneDark[oneDarkColorClass.comment].color;
  oneDark[oneDarkColorClass.punctuation].color = areHslColorsEqual(
    oneDarkColorClass.punctuation
  )
    ? punctuationContrastColorOneDarkString
    : oneDark[oneDarkColorClass.punctuation].color;
  const codeBlockLang = useMemo(() => refactorLang(), [language]);
  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <span>{language}</span>
        <Copy
          onClick={handleClick}
          altText={text}
          ariaLabel={props.ariaLabel}
        />
      </div>
      <div className={styles.codeBlockBody}>
        <SyntaxHighlighter
          language={codeBlockLang}
          style={props.isDarkMode ? oneDark : oneLight}
          showLineNumbers={false}
          tabIndex={0}
        >
          {text}
        </SyntaxHighlighter>
        <span className={styles.copyCodeSuccessfullyToast}>
          <CopyToaster show={showToast} text={props.copyText} />
        </span>
      </div>
    </div>
  );
};

export default CodeBlock;
