import sideMenuData from '@data/side-menu.json';

interface MenuNode {
  name: string;
  type: string;
  path: string;
  children?: MenuNode[];
  frontMatter?: any;
}

function getAllPaths(node: MenuNode, basePath: string = ''): string[] {
  const paths: string[] = [];

  if (node.path && node.path !== basePath) {
    // Convert Windows paths to URL-friendly paths
    const normalizedPath = node.path
      .replace(/\\/g, '/')
      .replace(new RegExp(`^${basePath.replace(/\\/g, '/')}/`), '');

    if (normalizedPath) {
      paths.push(normalizedPath);
    }
  }

  if (node.children) {
    node.children.forEach((child) => {
      paths.push(...getAllPaths(child, basePath));
    });
  }

  return paths;
}

export function getStaticParamsForPath(pathPrefix: string) {
  const rootNode = sideMenuData as MenuNode;
  const targetNode = rootNode.children?.find(
    (child: MenuNode) => child.name === pathPrefix
  );

  if (!targetNode) {
    return [];
  }

  const allPaths = getAllPaths(targetNode, pathPrefix);

  return allPaths.map((path) => ({
    slug: path.split('/').filter(Boolean),
  }));
}
