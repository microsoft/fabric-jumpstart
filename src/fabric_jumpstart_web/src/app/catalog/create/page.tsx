import type { Metadata } from 'next';
import CreateJumpstart from './CreateJumpstart';

export const metadata: Metadata = {
  title: 'Create a Jumpstart | Fabric Jumpstart',
  description: 'Contribute a new jumpstart to the Fabric Jumpstart catalog.',
  robots: { index: false, follow: false },
};

export default function CreateJumpstartPage() {
  return <CreateJumpstart />;
}
