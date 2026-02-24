import React from 'react';
import {
  Button,
  Tooltip,
  ButtonProps,
  mergeClasses,
} from '@fluentui/react-components';
import { useStyles } from './styles';

export interface IconButtonProps {
  showLabel?: boolean;
  label?: string;
  filledIcon: any;
  regularIcon: any;
  onIconClick?: () => void;
}

const IconButton = ({
  showLabel,
  label,
  filledIcon,
  regularIcon,
  onIconClick,
}: IconButtonProps & ButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => setIsHovered(false);

  const styles = useStyles();
  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {showLabel && label ? (
        <Button
          size="small"
          icon={isHovered ? filledIcon : regularIcon}
          className={styles.iconButton}
          aria-label={label}
          onClick={onIconClick}
          tabIndex={0}
          role="link"
        >
          {label}
        </Button>
      ) : (
        <Tooltip content={label || ''} relationship="label">
          <Button
            size="small"
            aria-label={label}
            icon={isHovered ? filledIcon : regularIcon}
            className={mergeClasses(
              styles.iconButton,
              !showLabel && styles.iconButtonNoLabel
            )}
            onClick={onIconClick}
            tabIndex={0}
            role="link"
          />
        </Tooltip>
      )}
    </span>
  );
};

export default IconButton;
