import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionToggleEventHandler,
  mergeClasses,
} from '@fluentui/react-components';
import { refactorFaqMarkdown } from '@utils/faqUtils';
import Typography from '@components/Typography';
import { useStyles } from './styles';

export interface FaqMarkDownProps {
  markdowndata: string;
  getMarkdownView: (data: string) => JSX.Element;
  faqTitle?: string;
}

const FaqMarkDown = ({
  markdowndata,
  getMarkdownView,
  faqTitle,
}: FaqMarkDownProps) => {
  const pathName = usePathname();
  const pathArr = pathName.split('/');
  const [, subpath] = pathArr;
  const faqArr =
    useMemo(
      () => refactorFaqMarkdown(markdowndata, subpath),
      [markdowndata, subpath]
    ) || [];
  const styles = useStyles();
  const [openItems, setOpenItems] = useState<string[]>([]);
  // @ts-ignore: fluent ui types are not updated
  const handleToggle: ToggleEventHandler<HTMLDivElement> &
    AccordionToggleEventHandler<string> = (
    _: any,
    data: { openItems: string[] }
  ) => {
    setOpenItems(data.openItems);
  };

  return (
    <section className={styles.faqContainer}>
      {faqTitle && (
        <Typography
          type="subtitle"
          text={faqTitle}
          className={styles.faqTitle}
        />
      )}

      <Accordion
        collapsible
        onToggle={handleToggle}
        as="div"
        openItems={openItems}
      >
        {faqArr.map((faq, index) => (
          <AccordionItem
            value={index.toString()}
            key={`${faq.question}-${index}`}
            className={mergeClasses(
              styles.faqItem,
              openItems.includes(index.toString()) && styles.openFaqItem
            )}
          >
            <AccordionHeader expandIconPosition="end" className={styles.faqQue}>
              {faq.question}
            </AccordionHeader>
            <AccordionPanel>{faq.answer.map(getMarkdownView)}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
export default FaqMarkDown;
