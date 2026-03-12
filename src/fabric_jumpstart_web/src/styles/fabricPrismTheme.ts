/**
 * Custom Prism syntax-highlighting themes that match the Python library's
 * Fabric UI colour scheme (see formatting.py).
 *
 * Token → colour mapping mirrors the in-notebook renderer so that the
 * website code blocks look the same as what users see inside Fabric.
 */

import type { CSSProperties } from 'react';

type PrismTheme = Record<string, CSSProperties>;

/* ------------------------------------------------------------------ */
/*  Light theme – colours taken directly from formatting.py           */
/* ------------------------------------------------------------------ */

export const fabricLight: PrismTheme = {
  'code[class*="language-"]': {
    color: '#323130',
    fontFamily:
      'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#323130',
    background: '#f3f2f1',
    fontFamily:
      'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '0.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },

  // Token styles
  comment: { color: '#608b4e', fontStyle: 'italic' },
  prolog: { color: '#608b4e' },
  doctype: { color: '#608b4e' },
  cdata: { color: '#608b4e' },

  punctuation: { color: '#808080' },
  operator: { color: '#808080' },

  keyword: { color: '#0431fa' },
  boolean: { color: '#0431fa' },
  number: { color: '#0431fa' },
  constant: { color: '#0431fa' },

  builtin: { color: '#096bbc' },
  'class-name': { color: '#096bbc' },
  'attr-name': { color: '#096bbc' },
  namespace: { color: '#096bbc' },

  function: { color: '#605e5c' },
  'function-variable': { color: '#605e5c' },
  property: { color: '#605e5c' },
  tag: { color: '#605e5c' },

  string: { color: '#a31515' },
  char: { color: '#a31515' },
  'template-string': { color: '#a31515' },
  'attr-value': { color: '#a31515' },
  regex: { color: '#a31515' },

  selector: { color: '#096bbc' },
  symbol: { color: '#096bbc' },
  variable: { color: '#096bbc' },

  inserted: { color: '#107c10' },
  deleted: { color: '#a4262c' },
  important: { fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

/* ------------------------------------------------------------------ */
/*  Dark theme – lighter / VS Code Dark+-style variants               */
/* ------------------------------------------------------------------ */

export const fabricDark: PrismTheme = {
  'code[class*="language-"]': {
    color: '#d4d4d4',
    fontFamily:
      'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#d4d4d4',
    background: '#1e1e1e',
    fontFamily:
      'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '0.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },

  // Token styles
  comment: { color: '#6a9955', fontStyle: 'italic' },
  prolog: { color: '#6a9955' },
  doctype: { color: '#6a9955' },
  cdata: { color: '#6a9955' },

  punctuation: { color: '#d4d4d4' },
  operator: { color: '#d4d4d4' },

  keyword: { color: '#569cd6' },
  boolean: { color: '#569cd6' },
  number: { color: '#b5cea8' },
  constant: { color: '#569cd6' },

  builtin: { color: '#4ec9b0' },
  'class-name': { color: '#4ec9b0' },
  'attr-name': { color: '#4ec9b0' },
  namespace: { color: '#4ec9b0' },

  function: { color: '#dcdcaa' },
  'function-variable': { color: '#dcdcaa' },
  property: { color: '#dcdcaa' },
  tag: { color: '#dcdcaa' },

  string: { color: '#ce9178' },
  char: { color: '#ce9178' },
  'template-string': { color: '#ce9178' },
  'attr-value': { color: '#ce9178' },
  regex: { color: '#ce9178' },

  selector: { color: '#4ec9b0' },
  symbol: { color: '#4ec9b0' },
  variable: { color: '#4ec9b0' },

  inserted: { color: '#b5cea8' },
  deleted: { color: '#ce9178' },
  important: { fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};
