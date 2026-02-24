import React from 'react';
import { useStyles } from './styles';
import { mergeClasses } from '@fluentui/react-components';

export interface TableProps {
  children: React.ReactNode;
  horizontalScrollable?: boolean;
}

const Table: React.FC<TableProps> = ({ children, horizontalScrollable }) => {
  const styles = useStyles();
  return (
    <div className={styles.scrollable}>
      <table className={styles.customTable}>{children}</table>
    </div>
  );
};

export default Table;
