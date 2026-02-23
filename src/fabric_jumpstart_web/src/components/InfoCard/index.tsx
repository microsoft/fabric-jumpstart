import React from 'react';
import Typography from '@components/Typography';
import ButtonGroup, { ButtonGroupProps } from '@components/ButtonGroup';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useStyles } from './styles';

const CodeBlock = dynamic(() => import('@components/Markdown/Codeblock'), {
  ssr: false,
});

export interface InfoCardProps {
  label: string;
  heading: string;
  desc?: string[];
  buttonProps?: ButtonGroupProps;
  link?: { url?: string; text?: string };
  codeSnippet?: {
    language: string;
    code: string;
  };
}
const InfoCard: React.FC<InfoCardProps> = ({
  label,
  heading,
  desc,
  buttonProps,
  link,
  codeSnippet,
}) => {
  const classes = useStyles();
  return (
    <>
      <div role="heading" aria-level={2}>
        <Typography
          type="headingLabel"
          text={label}
          className={classes.infoCardLabel}
        />
      </div>
      <div role="heading" aria-level={3}>
        <Typography
          type="custom"
          text={heading}
          className={classes.infoCardTitle}
        />
      </div>
      {desc?.map((descItem) => (
        <Typography type="paragraph" text={descItem} key={descItem} />
      ))}
      {codeSnippet && (
        <CodeBlock>
          <code className={`language-${codeSnippet.language}`}>
            {codeSnippet.code}
          </code>
        </CodeBlock>
      )}
      {link && link.url && link.text && (
        <Link href={link.url} target="_blank" rel="noopener noreferrer">
          <Typography type="link" text={link.text} />
        </Link>
      )}
      {buttonProps && (
        <ButtonGroup left={buttonProps?.left} right={buttonProps?.right} />
      )}
    </>
  );
};

export default InfoCard;
