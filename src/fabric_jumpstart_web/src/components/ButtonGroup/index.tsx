'use client';
import React from 'react';
import Button from '@components/Button';
import { ButtonProps } from '@fluentui/react-components';
import { useStyles } from './styles';

export interface ButtonGroupProps {
  left: ButtonProps & {
    label: string;
  };
  right?: ButtonProps & {
    label: string;
  };
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ left, right }) => {
  const classes = useStyles();
  if (!left) return null;
  return (
    <div className={classes.buttonContainer}>
      <Button
        appearance="primary"
        aria-label={left?.label}
        size="large"
        iconPosition="after"
        {...left}
      >
        {left?.label}
      </Button>
      {right && (
        <Button
          appearance="secondary"
          aria-label={right?.label}
          size="large"
          iconPosition="after"
          {...right}
        >
          {right?.label}
        </Button>
      )}
    </div>
  );
};

export default ButtonGroup;
