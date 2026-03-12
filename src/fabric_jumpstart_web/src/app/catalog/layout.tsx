import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalog — Fabric Jumpstart',
  description: 'Browse and filter all Fabric Jumpstart solutions.',
};

export default function FabricJumpstartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
