import React from 'react';
import { Button, mergeClasses, ButtonProps } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { themeType } from '@constants/common';
import { useStyles } from './styles';

export const ButtonType = {
  primary: 'primary',
  secondary: 'secondary',
};

interface ButtonCustomProps {
  className?: string;
  children: any;
}

const ButtonComp: React.FC<ButtonCustomProps & ButtonProps> = ({
  children,
  className,
  appearance,
  ...restProps
}) => {
  const classes = useStyles();
  const { theme } = useThemeContext();
  const isLightMode = theme.key === themeType.light;
  return (
    <Button
      {...restProps}
      className={mergeClasses(
        classes.btn,
        appearance === ButtonType.primary && classes.primaryBtn,
        isLightMode &&
          appearance === ButtonType.primary &&
          classes.primaryBtnLightMode,
        className
      )}
      appearance={appearance}
    >
      {children}
    </Button>
  );
};

export default ButtonComp;
