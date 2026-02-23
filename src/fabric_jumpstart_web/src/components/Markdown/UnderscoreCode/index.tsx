import React from 'react';

const UnderscoreCode = ({ children }: { children: React.ReactNode }) => {
  const refactor = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return child.replace(/<span>&#95;<\/span>/g, '_');
      }
      if (React.isValidElement(child) && child.props.children) {
        const newChildren = refactor(child.props.children);
        return React.cloneElement(child, {
          ...child.props,
          children: newChildren,
        });
      }

      return child;
    });
  };

  return <code>{refactor(children)}</code>;
};

export default UnderscoreCode;
