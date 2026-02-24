'use client';
import MenuLayout from '@components/SideMenu/MenuLayout';

export default function FabricJumpstartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MenuLayout>{children}</MenuLayout>;
}
