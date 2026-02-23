import React, { useState } from 'react';
import { copyToClipboard } from '@utils/common';
import { useStyles } from './styles';
import Copy, { CopyToaster } from '@components/Markdown/Copy';

const Heading2 = ({
  id,
  children,
  copyText,
  ariaLabel,
}: {
  id: string;
  children: React.ReactNode;
  copyText?: string;
  ariaLabel?: string;
}) => {
  const [showToast, setShowToast] = useState(false);

  const handleClick = (event: any) => {
    copyToClipboard(event, id);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const styles = useStyles();
  return (
    <div className={styles.h2container}>
      <h2 id={id} area-label={children}>
        {children}
      </h2>
      {copyText && ariaLabel && (
        <div className={styles.copyContainer}>
          <Copy onClick={handleClick} altText={id} ariaLabel={ariaLabel} />
          <CopyToaster show={showToast} text={copyText} />
        </div>
      )}
    </div>
  );
};

export default Heading2;
