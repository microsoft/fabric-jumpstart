import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronCircleRightFilled,
  ChevronCircleDownFilled,
  ChevronCircleRightRegular,
} from '@fluentui/react-icons';
import { mergeClasses } from '@fluentui/react-components';
import { useStyles } from './styles';

interface childNode {
  name?: string;
  children?: childNode[];
  frontMatter: {
    linkTitle: string;
  };
  path: string;
}

export interface MenuItemProps {
  node: childNode;
  onMenuItemClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    isBranch: boolean,
    node: childNode
  ) => void;
  menuOpenItems: any;
  activePath?: string;
}

interface ItemProps {
  isBranch?: boolean;
  node: childNode;
  isOpen?: boolean;
  isExpandable?: boolean;
}

const MenuItem = ({
  node,
  onMenuItemClick,
  menuOpenItems,
  activePath,
}: MenuItemProps) => {
  const styles = useStyles();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const modifiedActivePath = activePath?.replace(/\\/g, '/').trim();
  const checkActivePath = (node: childNode) => {
    const modifiedNodePath = node.path?.replace(/\\/g, '/').trim();
    if (modifiedNodePath === modifiedActivePath) {
      return true;
    }
    return (
      node.children?.some((childNode: childNode) => {
        const modifiedChildrenNodePath = childNode.path
          ?.replace(/\\/g, '/')
          .trim();
        return modifiedChildrenNodePath === modifiedActivePath;
      }) || false
    );
  };
  const showOverview = !(
    node?.children?.length === 1 && node?.children[0]?.name === 'img'
  )
    ? true
    : false;
  const Item = ({ isBranch, node, isOpen, isExpandable }: ItemProps) => {
    return (
      <div>
        <div
          onMouseEnter={() => setHoveredItem(node.path)}
          onMouseLeave={() => setHoveredItem(null)}
          className={mergeClasses(
            styles.menuItem,
            !isBranch && styles.menuItemLeaf,
            !isBranch && checkActivePath(node) && styles.menuItemActiveLeaf
          )}
        >
          <Link
            href={`/${node.path}`}
            onClick={(e) =>
              onMenuItemClick(
                e,
                isExpandable ? (isBranch ?? false) : false,
                node
              )
            }
            className={mergeClasses(styles.menuItemLink)}
            aria-label={`Link to ${node.frontMatter.linkTitle}`}
            prefetch
          >
            {isExpandable &&
              isBranch &&
              (isOpen ? (
                <ChevronCircleDownFilled />
              ) : hoveredItem === node.path ? (
                <ChevronCircleRightFilled />
              ) : (
                <ChevronCircleRightRegular />
              ))}

            {node.frontMatter.linkTitle}
          </Link>
        </div>
        {isExpandable && isOpen && (
          <div className={styles.menuChild}>
            <MenuItem
              node={node}
              onMenuItemClick={onMenuItemClick}
              menuOpenItems={menuOpenItems}
              activePath={activePath}
            />
          </div>
        )}
      </div>
    );
  };

  const showNode = (node: any) => {
    if (
      node.frontMatter?.toc_hide ||
      node.path.includes('\\img') ||
      node.path.includes('/img')
    ) {
      return false;
    }
    return true;
  };

  const OverviewNode = (node: any) => {
    return (
      <Item
        node={{
          frontMatter: {
            linkTitle: 'Overview',
          },
          path: node.path,
        }}
      />
    );
  };

  return (
    <>
      {showOverview && <OverviewNode {...node} />}
      {node.children &&
        node.children.map((childNode: childNode) => {
          const isBranch =
            !!childNode.children?.length &&
            !(
              childNode.children.length == 1 &&
              childNode.children[0]?.name === 'img'
            );
          const pathWithBackSlash = childNode.path.replace(/\//g, '\\');
          const isOpen =
            isBranch &&
            (menuOpenItems.includes(childNode.path) ||
              menuOpenItems.includes(pathWithBackSlash));
          const isExpandable = !(
            childNode.children?.length === 1 &&
            childNode.children[0]?.name == 'img'
          )
            ? true
            : false;
          if (showNode(childNode) && showOverview) {
            return (
              <Item
                key={childNode.name}
                isBranch={isBranch}
                node={childNode}
                isOpen={isOpen}
                isExpandable={isExpandable}
              />
            );
          }
        })}
    </>
  );
};

export default MenuItem;
