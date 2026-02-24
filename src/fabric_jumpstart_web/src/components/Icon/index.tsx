'use client';
import React from 'react';
import Image from 'next/image';
import { useThemeContext } from '@components/Providers/themeProvider';
import { themeType } from '@constants/common';

interface IconProps {
  darkThemeIcon: string;
  lightThemeIcon: string;
  width?: number;
  height?: number;
  alt: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({
  darkThemeIcon,
  lightThemeIcon,
  width,
  height,
  alt,
  className,
}) => {
  const { theme } = useThemeContext();
  const src = theme?.key === themeType.dark ? darkThemeIcon : lightThemeIcon;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default Icon;
