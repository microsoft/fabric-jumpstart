import type { Metadata } from 'next';
import DiagramGenerator from './DiagramGenerator';

export const metadata: Metadata = {
  title: 'Diagram Generator — Fabric Jumpstart',
  description: 'Generate mermaid diagram SVGs for Fabric Jumpstarts.',
  robots: 'noindex, nofollow',
};

export default function DiagramGeneratorPage() {
  return <DiagramGenerator />;
}
