import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  tokens,
} from '@fluentui/react-components';
import MenuItem from '../MenuItem';

interface MenuProps {
  tree: any;
  openItems: any;
  onToggle: any;
  onMenuItemClick: any;
  menuOpenItems: any;
  activePath: any;
}

const Menu = ({
  tree,
  openItems,
  onToggle,
  onMenuItemClick,
  menuOpenItems,
  activePath,
}: MenuProps) => {
  const [count, setCount] = useState<number>(-1);
  useEffect(() => {
    setFocusOnLink();
    document.addEventListener('keydown', menuKeyHandler);
    return () => {
      document.removeEventListener('keydown', menuKeyHandler);
    };
  }, [count, menuOpenItems]);

  const setFocusOnLink = () => {
    const elements = document.querySelectorAll(
      `[aria-label*="Link to "]`
    ) as any as Array<HTMLElement>;

    if ((elements[count] as HTMLAnchorElement)?.href) {
      (elements[count] as HTMLAnchorElement)?.focus();
      (elements[count] as HTMLAnchorElement).style.outline = '0';
      (
        (elements[count] as HTMLAnchorElement)?.parentElement as HTMLElement
      ).style.border = `1px solid ${tokens.colorPaletteBeigeBorderActive}`;
    } else {
      (elements[count] as HTMLAnchorElement)?.parentElement?.focus();
    }
  };

  const childTag = (element: HTMLElement) => {
    const anchor = element.querySelector('a');
    return anchor;
  };
  const menuKeyHandler = (event: any) => {
    const navigationLinks = document.querySelectorAll(
      `[aria-label*="Link to "]`
    ) as any as Array<HTMLElement>;
    const currentTarget =
      event.target.type === 'button' ? childTag(event.target) : event.target;
    switch (event.key) {
      case 'ArrowDown':
        for (var i = 0; i < navigationLinks.length - 1; i++) {
          if (
            navigationLinks[i].isEqualNode(currentTarget) &&
            navigationLinks[i].ariaLabel === currentTarget.ariaLabel
          ) {
            setCount(i + 1);
            break;
          }
        }
        break;
      case 'ArrowUp':
        for (var i = 0; i < navigationLinks.length; i++) {
          if (
            navigationLinks[i].isEqualNode(currentTarget) &&
            navigationLinks[i].ariaLabel === currentTarget.ariaLabel
          ) {
            setCount(i - 1);
            break;
          }
        }
        break;
      case 'Enter':
        menuOpenItems;
        break;
      case 'Tab':
        if (
          (navigationLinks[0].isEqualNode(currentTarget) &&
            navigationLinks[0].ariaLabel === currentTarget.ariaLabel) ||
          (navigationLinks[count]?.isEqualNode(currentTarget) &&
            navigationLinks[count]?.ariaLabel === currentTarget.ariaLabel)
        ) {
          const target = document.querySelectorAll(`div[id='tabHandler']`);
          (target[0] as HTMLElement)?.focus();
        }
        break;
      default:
        return;
    }
  };
  return (
    <>
      <Accordion openItems={openItems} onToggle={onToggle} multiple collapsible>
        {tree?.children &&
          tree?.children?.map((node: any) => (
            <AccordionItem value={node?.name} key={node?.name}>
              <AccordionHeader expandIconPosition="end">
                <a aria-label={`Link to ${node?.frontMatter?.linkTitle}`}>
                  {node?.frontMatter?.title}
                </a>
              </AccordionHeader>
              <AccordionPanel>
                <MenuItem
                  node={node}
                  onMenuItemClick={onMenuItemClick}
                  menuOpenItems={menuOpenItems}
                  activePath={activePath}
                />
              </AccordionPanel>
            </AccordionItem>
          ))}
      </Accordion>
      <div id="tabHandler" tabIndex={-1} aria-hidden={false}></div>
    </>
  );
};

export default Menu;
