'use client';
import { Text, mergeClasses } from '@fluentui/react-components';
import { useStyle } from './styles';

export const TypographyType = {
  LABEL: 'label',
  HEADING: 'heading',
  TITLE: 'title',
  DESC: 'desc',
  PARAGRAPH: 'paragraph',
  PARAGRAPH2: 'paragraph2',
  LINK: 'link',
  SUBTITLE: 'subtitle',
  CAPTION: 'caption',
  CAPTION2: 'caption2',
  LABEL2: 'label2',
  CUSTOM: 'custom',
  HEADINGLABEL: 'headingLabel',
};

export interface TypographyProps {
  type:
    | 'label'
    | 'label2'
    | 'heading'
    | 'title'
    | 'desc'
    | 'paragraph'
    | 'paragraph2'
    | 'link'
    | 'subtitle'
    | 'caption'
    | 'caption2'
    | 'custom'
    | 'headingLabel';
  text: string;
  className?: string;
}

const Typography: React.FC<TypographyProps> = ({ type, text, className }) => {
  const classes = useStyle();
  switch (type) {
    case TypographyType.HEADING:
      return (
        <Text
          as="h1"
          block
          size={800}
          weight="bold"
          className={mergeClasses(classes.heading, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.TITLE:
      return (
        <Text
          as="h2"
          block
          size={600}
          weight="bold"
          className={mergeClasses(classes.title, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.SUBTITLE:
      return (
        <Text
          as="h3"
          block
          size={500}
          className={mergeClasses(classes.subtitle, className)}
          aria-label={text}
          weight="semibold"
        >
          {text}
        </Text>
      );
    case TypographyType.DESC:
      return (
        <Text
          as="p"
          block
          size={500}
          aria-label={text}
          className={mergeClasses(classes.desc, className)}
        >
          {text}
        </Text>
      );
    case TypographyType.PARAGRAPH:
      return (
        <Text
          as="p"
          block
          size={400}
          className={mergeClasses(classes.paragraph, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.PARAGRAPH2:
      return (
        <Text
          as="p"
          block
          size={300}
          className={mergeClasses(classes.paragraph, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.LINK:
      return (
        <Text
          as="p"
          block
          size={400}
          className={mergeClasses(classes.link, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );

    case TypographyType.CAPTION:
      return (
        <Text
          as="p"
          block
          size={200}
          className={mergeClasses(classes.caption, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.CAPTION2:
      return (
        <Text
          as="p"
          block
          size={200}
          className={mergeClasses(classes.caption, className)}
          aria-label={text}
          weight="semibold"
        >
          {text}
        </Text>
      );

    case TypographyType.LABEL:
      return (
        <Text
          as="h6"
          block
          size={400}
          weight="semibold"
          className={mergeClasses(classes.label, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.HEADINGLABEL:
      return (
        <Text
          as="p"
          block
          size={400}
          weight="semibold"
          className={mergeClasses(classes.label, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.LABEL2:
      return (
        <Text
          as="p"
          block
          size={200}
          weight="semibold"
          className={mergeClasses(classes.label, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    case TypographyType.CUSTOM:
      return (
        <Text
          as="span"
          className={mergeClasses(classes.customText, className)}
          aria-label={text}
        >
          {text}
        </Text>
      );
    default:
      return <Text as="span">{text}</Text>;
  }
};

export default Typography;
