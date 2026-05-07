'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  tokens,
} from '@fluentui/react-components';
import { ChevronLeft24Regular } from '@fluentui/react-icons';
import { INTERNAL_ROUTE } from '@config/urlconfig';
import { initialDraft, type JumpstartDraft } from './formState';
import CardPreview from './CardPreview';
import PythonSnippet from './PythonSnippet';
import BasicInfo from './steps/BasicInfo';
import Tags from './steps/Tags';
import SourceAndScope from './steps/SourceAndScope';
import TimingAndLinks from './steps/TimingAndLinks';
import DiagramStep from './steps/DiagramStep';
import ReviewAndSubmit from './steps/ReviewAndSubmit';

type SectionId = 'basic' | 'tags' | 'source' | 'timing' | 'diagram' | 'review';

function sectionComplete(id: SectionId, draft: JumpstartDraft, diagramSaved?: boolean): boolean {
  switch (id) {
    case 'basic':
      return !!(
        draft.name.trim() &&
        draft.logical_id.trim() &&
        draft.description.trim() &&
        draft.description.length <= 250 &&
        draft.type &&
        draft.difficulty
      );
    case 'tags':
      return draft.workload_tags.length > 0 && draft.scenario_tags.length > 0;
    case 'source':
      return !!(
        draft.repo_url.trim() &&
        draft.repo_ref.trim() &&
        draft.workspace_path.trim() &&
        draft.entry_point.trim() &&
        draft.items_in_scope.length > 0
      );
    case 'timing':
      return !!(
        draft.owner_email.trim() &&
        draft.minutes_to_deploy !== '' &&
        draft.minutes_to_complete_jumpstart !== ''
      );
    case 'diagram':
      return !!diagramSaved;
    case 'review':
      return false;
  }
}

function SectionStatus({ complete }: { complete: boolean }) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        background: complete ? tokens.colorStatusSuccessBackground1 : tokens.colorNeutralBackground3,
        color: complete ? tokens.colorStatusSuccessForeground3 : tokens.colorNeutralForeground3,
        border: `1.5px solid ${complete ? tokens.colorStatusSuccessForeground1 : tokens.colorNeutralStroke1}`,
        flexShrink: 0,
      }}
    >
      {complete ? '✓' : ''}
    </span>
  );
}

const CARD_STYLE = {
  borderRadius: 8,
  border: `1px solid #e0e0e0`,
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  overflow: 'hidden' as const,
  marginBottom: 10,
};

export default function CreateJumpstart() {
  const [draft, setDraft] = useState<JumpstartDraft>(initialDraft);
  const [openSections, setOpenSections] = useState<SectionId[]>([]);
  const [diagramSaved, setDiagramSaved] = useState(false);

  const patchDraft = (patch: Partial<JumpstartDraft>) => {
    if ('mermaid_diagram' in patch) setDiagramSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 71px)',
        background: '#f2f2f2',
      }}
    >
      {/* Page header — not sticky, scrolls away */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
          background: '#fff',
        }}
      >
        <Link
          href={INTERNAL_ROUTE.SCENARIOS}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            fontSize: 14,
            color: tokens.colorNeutralForeground2,
          }}
        >
          <ChevronLeft24Regular style={{ fontSize: 18 }} />
          Back to Catalog
        </Link>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
          Create a Jumpstart
        </h1>
        <div style={{ width: 120 }} />
      </div>

      {/* Two-column body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '372px 1fr',
          flex: 1,
          alignItems: 'start',
        }}
      >
        {/* Left panel: sticky below site header only */}
        <div
          style={{
            position: 'sticky',
            top: 71,
            maxHeight: 'calc(100vh - 71px)',
            overflowY: 'auto',
            padding: '20px 16px 32px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
            background: '#fff',
          }}
        >
          <CardPreview draft={draft} />
          <PythonSnippet draft={draft} />
        </div>

        {/* Right panel: accordion form */}
        <div style={{ padding: '16px 24px 48px' }}>
          <Accordion
            multiple
            collapsible
            openItems={openSections}
            onToggle={(_, data) => setOpenSections(data.openItems as SectionId[])}
          >
            {[
              { id: 'basic' as SectionId, title: 'Basic Info', desc: 'Name, type, description', content: <BasicInfo draft={draft} onChange={patchDraft} /> },
              { id: 'tags' as SectionId, title: 'Tags', desc: 'Workload and scenario tags', content: <Tags draft={draft} onChange={patchDraft} /> },
              { id: 'source' as SectionId, title: 'Source & Scope', desc: 'Repository and Fabric items', content: <SourceAndScope draft={draft} onChange={patchDraft} /> },
              { id: 'timing' as SectionId, title: 'Timing & Links', desc: 'Deploy time, docs, video', content: <TimingAndLinks draft={draft} onChange={patchDraft} /> },
              { id: 'diagram' as SectionId, title: 'Architecture Diagram', desc: 'Mermaid diagram editor', content: <DiagramStep draft={draft} onChange={patchDraft} diagramSaved={diagramSaved} onSaveDiagram={() => setDiagramSaved(true)} /> },
              { id: 'review' as SectionId, title: 'Review & Submit', desc: 'Preview YAML and open PR', content: <ReviewAndSubmit draft={draft} diagramSaved={diagramSaved} /> },
            ].map(({ id, title, desc, content }) => (
              <div key={id} style={CARD_STYLE}>
                <AccordionItem value={id}>
                  <AccordionHeader expandIconPosition="end" size="large">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SectionStatus complete={sectionComplete(id, draft, diagramSaved)} />
                      <span style={{ fontWeight: 600 }}>{title}</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: tokens.colorNeutralForeground3 }}>
                        {desc}
                      </span>
                    </div>
                  </AccordionHeader>
                  <AccordionPanel>
                    <div style={{ padding: '4px 16px 20px' }}>
                      {content}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

