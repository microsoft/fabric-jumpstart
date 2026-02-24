export const findNode = (node: any, path: string): any => {
  if (node?.path?.replace(/\//g, '\\') === path) {
    return node;
  } else if (node.children) {
    let result = null;
    for (let i = 0; result == null && i < node.children.length; i++) {
      result = findNode(node.children[i], path);
    }
    return result;
  }
  return null;
};

export const findNodeByTitle = (node: any, path: string): any => {
  if (node.Title === path) {
    return node.Items && node.Items.length > 0 ? node : null;
  }

  if (node.Items && node.Items.length > 0) {
    for (const item of node.Items) {
      const result = findNodeByTitle(item, path);
      if (result) {
        return result;
      }
    }
  }

  return null;
};

export const findNodeInTree = (tree: any[], path: string): any => {
  for (const node of tree) {
    const result = findNodeByTitle(node, path);
    if (result) {
      return result;
    }
  }
  return null;
};

export const searchMenuDrawerNode = (node: any, searchTerm: string): any[] => {
  let results = [];
  searchTerm = searchTerm.toLowerCase();

  if (node.Title && node.Title.toLowerCase().includes(searchTerm)) {
    results.push(node);
  }

  if (node.Items && node.Items.length > 0) {
    for (const item of node.Items) {
      results = results.concat(searchMenuDrawerNode(item, searchTerm));
    }
  }

  return results;
};

export const searchSideMenuNode = (node: any, searchTerm: string): any[] => {
  let results = [];
  searchTerm = searchTerm.toLowerCase();

  if (
    (node.frontMatter &&
      node.frontMatter.title &&
      node.frontMatter.title.toLowerCase().includes(searchTerm)) ||
    (node.frontMatter &&
      node.frontMatter.linkTitle &&
      node.frontMatter.linkTitle.toLowerCase().includes(searchTerm))
  ) {
    results.push(node);
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      results = results.concat(searchSideMenuNode(child, searchTerm));
    }
  }

  return results;
};

export const searchSideMenuTree = (tree: any[], searchTerm: string): any[] => {
  return searchSideMenuNode(tree, searchTerm);
};

export const parseNodeTitle = (node: any): string => {
  if (node.frontMatter) {
    if (node.frontMatter.linkTitle) {
      return node.frontMatter.linkTitle;
    } else if (node.frontMatter.title) {
      return node.frontMatter.title;
    }
  }
  return node.path;
};
export const sortNodeTree = (node: any): void => {
  if (node.children) {
    node.children.sort((a: any, b: any) => {
      const aWeight =
        a.frontMatter && a.frontMatter.weight ? a.frontMatter.weight : 0;
      const bWeight =
        b.frontMatter && b.frontMatter.weight ? b.frontMatter.weight : 0;
      if (aWeight < bWeight) {
        return -1;
      } else if (aWeight > bWeight) {
        return 1;
      } else {
        return 0;
      }
    });
    node.children.forEach((child: any) => {
      sortNodeTree(child);
    });
  }
  return node;
};

export const extractRoutes = (node: any, arr: any[] = []): any[] => {
  arr.push({
    path: node.path.replace(/\\/g, '/'),
    title: parseNodeTitle(node),
  });

  if ('children' in node && node.children.length > 0) {
    node.children.forEach((child: any) => extractRoutes(child, arr));
  }
  return arr;
};

export const findBreadcrumbs = (
  node: any,
  path: string
): { path: string; title: string }[] => {
  if (`/${node.path.replace(/\\/g, '/')}` === path) {
    // If the current node matches the path, return a breadcrumb for this node.
    return [
      {
        path: node.path,
        title:
          node.frontMatter?.linkTitle || node.frontMatter?.title || node.name,
      },
    ];
  } else if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const breadcrumbsFromChild: { path: string; title: string }[] =
        findBreadcrumbs(node.children[i], path);
      if (breadcrumbsFromChild.length) {
        // If the path was found deeper in the tree, prepend the current breadcrumb and return.
        return [
          {
            path: node.path,
            title:
              node.frontMatter?.linkTitle ||
              node.frontMatter?.title ||
              node.name,
          },
          ...breadcrumbsFromChild,
        ];
      }
    }
  }
  return []; // Return an empty array if the path wasn't found under the current node.
};

export const removeFrontmatter = (text: string) => {
  return text ? text.replace(/---[\s\S]*?---/, '') : '';
};

export const createHtml = (node: any, link = true) => {
  // convert node.path needs to a relative path
  // remove all but the last part of the path and replace with ./
  const relativePath = node.path || '';

  let html = '';
  if (node.frontMatter) {
    if (node.frontMatter.title) {
      if (link) {
        html = `<h3><a href='${relativePath}' rel="noopener noreferrer">${node.frontMatter.title}</a></h3>`;
      } else {
        html = `<h2>${node.frontMatter.title}</h2>`;
      }
    } else if (node.frontMatter.linkTitle) {
      if (link) {
        html = `<h3><a href='${relativePath}' rel="noopener noreferrer">${node.frontMatter.linkTitle}</a></h3>`;
      } else {
        html = `<h2>${node.frontMatter.linkTitle}</h2>`;
      }
    }
    if (node.frontMatter.description) {
      html = `${html}<p>${node.frontMatter.description}</p>`;
    } else {
      html = `${html}<p></p>`;
    }
  }
  return html;
};

export const getPathName = (path: string, params?: { slug: string }) => {
  if (params && params.slug) {
    const { slug } = params!;
    const subPath = Array.isArray(slug) ? slug.join('/') : slug;
    return `${path}\\${subPath}`.replace(/^\//, '').replace(/\//g, '\\');
  }
  return path;
};

export const refactorMarkdown = async (
  data: string,
  currentNode: any,
  getFaq: Function,
  showFaq: boolean
) => {
  const markdown = removeFrontmatter(data);
  let htmlContent = '';
  let faqPath = '';
  let faqContent = '';
  if (currentNode && currentNode.children && currentNode.children.length > 0) {
    htmlContent = createHtml(currentNode, false);
    // for each child
    currentNode.children.forEach((child: any) => {
      if (child.path.includes('faq') || child.path.includes('FAQ')) {
        faqPath = child.path;
      } else {
        htmlContent = `${htmlContent}${createHtml(child)}`;
      }
    });
  }
  let content = '';
  if (markdown.replace(/\s/g, '') !== '') {
    content = markdown.replace(/^\s*\|/gm, '|');
  } else {
    content = htmlContent;
  }
  if (faqPath && faqPath !== '' && showFaq) {
    faqContent = await getFaq(currentNode, faqPath.replace('\\/g', '/'));
    content = `${content}${faqContent}`;
  }
  return content;
};

export const getJumpToSectionList = (pageRef: any) => {
  if (pageRef.current) {
    const elementsWithId = (pageRef.current as HTMLElement)?.querySelectorAll(
      'h2[id]'
    );
    return Array.from(elementsWithId).map((el) => ({
      id: el.id,
      name: el.textContent,
      href: el.id,
    }));
  }
};
