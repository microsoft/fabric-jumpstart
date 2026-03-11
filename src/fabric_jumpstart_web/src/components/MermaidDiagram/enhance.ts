/**
 * Shared SVG enhancement for Mermaid diagrams.
 * Injects Fabric item icons, gradient fills, drop shadows, and styled edges.
 */
import { ITEM_WORKLOAD_MAP } from '@utils/mermaidParser';
import workloadColorsData from '@data/workload-colors.json';
import itemIconData from '@data/fabric-item-icons.json';

const itemIconDataUris = itemIconData as Record<string, string>;

export interface WorkloadColor {
  primary: string;
  secondary: string;
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

interface NodeInfo {
  nodeId: string;
  label: string;
  itemType: string;
  workload: string;
  wc: WorkloadColor;
  itemIcon: string | null;
  emoji: string | null;
}

const DEFAULT_WC: WorkloadColor = {
  primary: '#616161',
  secondary: '#9E9E9E',
  light: '#E0E0E0',
  accent: '#757575',
  mid: '#BDBDBD',
  icon: '',
};

const UNICODE_CP_RE = /^U([0-9A-Fa-f]{4,6})$/;
const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

function extractNodeInfo(chart: string): Map<string, NodeInfo> {
  const nodes = new Map<string, NodeInfo>();
  const regex = /([A-Za-z_]\w*)\[([^\]]*)\]:::([^\s;]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(chart)) !== null) {
    const [, nodeId, label, itemType] = m;
    const workload = ITEM_WORKLOAD_MAP[itemType];
    if (workload) {
      const wc = workloadColors[workload];
      if (!wc) continue;
      const itemIcon = itemIconDataUris[itemType] || null;
      nodes.set(label.trim(), { nodeId, label: label.trim(), itemType, workload, wc, itemIcon, emoji: null });
    } else {
      // Unregistered type — check for Unicode codepoint (:::U1F5A5) or direct emoji
      let emoji: string | null = null;
      const cpMatch = itemType.match(UNICODE_CP_RE);
      if (cpMatch) {
        emoji = String.fromCodePoint(parseInt(cpMatch[1], 16));
      } else {
        const emojiMatch = itemType.match(EMOJI_RE);
        emoji = emojiMatch ? emojiMatch[0] : null;
      }
      // Always render — emoji if available, plain box otherwise
      nodes.set(label.trim(), {
        nodeId, label: label.trim(), itemType, workload: 'Custom',
        wc: DEFAULT_WC, itemIcon: null, emoji,
      });
    }
  }
  return nodes;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export interface EnhanceOptions {
  /** Icon size in px (default 26). */
  iconSize?: number;
  /** Show item-type label below each node (default true). */
  showSubtitles?: boolean;
  /** Expand SVG viewBox to prevent clipping (default true). */
  expandViewBox?: boolean;
}

/**
 * Post-process a Mermaid SVG in the real DOM.
 * Must be called after mounting (requires getBBox).
 */
export function enhanceDiagram(
  root: SVGSVGElement,
  chart: string,
  isDark: boolean,
  opts: EnhanceOptions = {},
): void {
  const { iconSize: ICON = 32, showSubtitles = true, expandViewBox = true } = opts;
  const nodeMap = extractNodeInfo(chart);
  if (nodeMap.size === 0) return;

  let defs = root.querySelector('defs');
  if (!defs) {
    defs = svgEl('defs', {}) as SVGDefsElement;
    root.insertBefore(defs, root.firstChild);
  }

  // Move marker elements into <defs> so marker-end references resolve correctly
  root.querySelectorAll(':scope > g > marker, :scope > marker').forEach(m => {
    defs!.appendChild(m);
  });

  // Drop-shadow filter
  const SH = 'mermaid-node-shadow';
  if (!defs.querySelector(`#${SH}`)) {
    const f = svgEl('filter', { id: SH, x: '-20%', y: '-20%', width: '150%', height: '160%' });
    f.appendChild(svgEl('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: '4', result: 'blur' }));
    f.appendChild(svgEl('feOffset', { in: 'blur', dx: '0', dy: '3', result: 'shifted' }));
    f.appendChild(svgEl('feFlood', {
      'flood-color': '#000',
      'flood-opacity': isDark ? '0.45' : '0.12',
      result: 'color',
    }));
    f.appendChild(svgEl('feComposite', { in: 'color', in2: 'shifted', operator: 'in', result: 'shadow' }));
    const mg = svgEl('feMerge', {});
    mg.appendChild(svgEl('feMergeNode', { in: 'shadow' }));
    mg.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    f.appendChild(mg);
    defs.appendChild(f);
  }

  let gi = 0;
  const PAD = Math.round(ICON * 0.46) + 2;
  const EXTRA_W = ICON + PAD + 2;
  const EXTRA_H = 4; // extra height for item-type line inside the box
  const TYPE_COLOR = isDark ? 'rgba(180,190,200,0.7)' : 'rgba(80,90,100,0.75)';

  for (const g of root.querySelectorAll('g.node')) {
    // Resolve label
    let label = '';
    const sp = g.querySelector('span.nodeLabel, span');
    if (sp) label = (sp.textContent || '').trim();
    else {
      const t = g.querySelector('text');
      if (t) label = (t.textContent || '').trim();
    }

    const info = nodeMap.get(label);
    if (!info) continue;

    const [r, gv, b] = hexToRgb(info.wc.accent);
    const [lr, lg, lb] = hexToRgb(info.wc.light);

    const shape = g.querySelector('rect, polygon') as SVGGraphicsElement | null;
    if (!shape) continue;

    // Gradient fill
    const gid = `wl-g-${gi++}`;
    const gr = svgEl('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
    const s1 = svgEl('stop', { offset: '0%' });
    const s2 = svgEl('stop', { offset: '100%' });
    if (isDark) {
      s1.setAttribute('stop-color', `rgba(${r},${gv},${b},0.22)`);
      s2.setAttribute('stop-color', `rgba(${r},${gv},${b},0.06)`);
    } else {
      s1.setAttribute('stop-color', `rgba(${lr},${lg},${lb},0.7)`);
      s2.setAttribute('stop-color', `rgba(${lr},${lg},${lb},0.25)`);
    }
    gr.appendChild(s1);
    gr.appendChild(s2);
    defs.appendChild(gr);

    shape.setAttribute('fill', `url(#${gid})`);
    shape.setAttribute('stroke', info.wc.accent);
    shape.setAttribute('stroke-width', '2');
    shape.setAttribute('rx', '6');
    shape.setAttribute('ry', '6');
    shape.style.filter = `url(#${SH})`;

    const box = shape.getBBox();

    const hasVisual = !!(info.emoji || info.itemIcon || info.wc.icon);
    const extraW = hasVisual ? EXTRA_W : 0;

    // Widen for icon (only when there's an icon/emoji to show)
    if (extraW > 0) {
      shape.setAttribute('width', String(box.width + extraW));
      shape.setAttribute('x', String(box.x - extraW / 2));
    }
    if (showSubtitles) {
      shape.setAttribute('height', String(box.height + EXTRA_H));
      shape.setAttribute('y', String(box.y - EXTRA_H / 2));
    }

    // Icon — vertically centered in the expanded box
    const nodeH = showSubtitles ? box.height + EXTRA_H : box.height;
    const nodeY = showSubtitles ? box.y - EXTRA_H / 2 : box.y;
    const cx = box.x - extraW / 2 + PAD + ICON / 2;
    const cy = nodeY + nodeH / 2;
    if (info.emoji) {
      const emojiEl = document.createElementNS(SVG_NS, 'text');
      emojiEl.setAttribute('x', String(cx));
      emojiEl.setAttribute('y', String(cy));
      emojiEl.setAttribute('text-anchor', 'middle');
      emojiEl.setAttribute('dominant-baseline', 'central');
      emojiEl.setAttribute('font-size', String(ICON - 4));
      emojiEl.textContent = info.emoji;
      g.appendChild(emojiEl);
    } else if (info.itemIcon || info.wc.icon) {
      g.appendChild(svgEl('image', {
        href: info.itemIcon || info.wc.icon,
        width: String(ICON), height: String(ICON),
        x: String(cx - ICON / 2), y: String(cy - ICON / 2),
      }));
    }

    // Replace label layout
    const labelGrp = g.querySelector('g.label');
    const fo = labelGrp?.querySelector('foreignObject');
    if (fo && sp) {
      const nodeLeft = box.x - extraW / 2;
      const nodeRight = nodeLeft + box.width + extraW;
      // Text starts right of icon, or with standard padding for plain boxes
      const textLeftX = hasVisual ? cx + ICON / 2 + 12 : nodeLeft + 10;
      const textWidth = nodeRight - textLeftX - 2;

      // Show item type subtitle only for registered Fabric types
      const showType = showSubtitles && !info.emoji && !!ITEM_WORKLOAD_MAP[info.itemType];
      const typeName = showType
        ? info.itemType.replace(/([a-z])([A-Z])/g, '$1 $2')
        : '';

      fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="
        display:flex;flex-direction:column;justify-content:center;
        height:100%;width:100%;padding:0 4px;box-sizing:border-box;
        text-align:left;
      ">
        <div style="font-family:Consolas,'Courier New',monospace;font-weight:600;font-size:14px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${isDark ? '#e0e0e0' : '#242424'}">${label}</div>
        ${showType ? `<div style="font-weight:500;font-size:11px;line-height:1.2;color:${TYPE_COLOR};margin-top:2px">${typeName}</div>` : ''}
      </div>`;

      fo.setAttribute('width', String(textWidth));
      fo.setAttribute('height', String(nodeH));
      fo.setAttribute('x', '0');
      fo.setAttribute('y', '0');

      labelGrp!.setAttribute('transform', `translate(${textLeftX},${nodeY})`);
    } else if (labelGrp) {
      // Fallback: just shift existing label right
      const tf = labelGrp.getAttribute('transform') || '';
      const tm = /translate\(\s*([^,)]+)[,\s]+([^)]*)\)/.exec(tf);
      if (tm) {
        labelGrp.setAttribute('transform',
          `translate(${parseFloat(tm[1]) + extraW / 2},${parseFloat(tm[2] || '0')})`);
      }
    }

    // Bold label text
    if (sp) {
      (sp as HTMLElement).style.fontWeight = '600';
      (sp as HTMLElement).style.fontSize = '13px';
    }
  }

  // Trim edge paths so endpoints reach widened node boundaries.
  // Nodes grew by EXTRA_W horizontally and EXTRA_H vertically.
  // Trim amount depends on which face of the node the edge connects to.
  const HALF_W = EXTRA_W / 2;
  const HALF_H = EXTRA_H / 2;
  root.querySelectorAll('.edgePaths path, .edgePath path').forEach(p => {
    const el = p as SVGPathElement;
    const totalLen = el.getTotalLength();
    if (totalLen <= EXTRA_W) return;

    // Helper: compute trim for an endpoint based on edge direction there.
    // Side-entering edges (|dx|>|dy|) trim by HALF_W; top/bottom by HALF_H.
    function trimForEndpoint(dx: number, dy: number): number {
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return 0;
      if (adx >= ady) {
        // Entering a side face — trim based on horizontal shift
        return HALF_W / (adx / len);
      } else {
        // Entering top/bottom face — trim based on vertical shift
        return HALF_H / (ady / len);
      }
    }

    const p0 = el.getPointAtLength(0);
    const p0n = el.getPointAtLength(Math.min(2, totalLen));
    const trimStart = trimForEndpoint(p0n.x - p0.x, p0n.y - p0.y);

    const pe = el.getPointAtLength(totalLen);
    const pe1 = el.getPointAtLength(Math.max(0, totalLen - 2));
    const trimEnd = trimForEndpoint(pe.x - pe1.x, pe.y - pe1.y);

    const startAt = Math.min(trimStart, totalLen * 0.4);
    const endAt = Math.max(totalLen - trimEnd, totalLen * 0.6);
    if (startAt >= endAt) return;

    const span = endAt - startAt;
    const steps = Math.max(24, Math.round(span / 4));
    let newD = '';
    for (let i = 0; i <= steps; i++) {
      const t = startAt + (i / steps) * span;
      const pt = el.getPointAtLength(t);
      newD += (i === 0 ? 'M' : 'L') + pt.x.toFixed(2) + ',' + pt.y.toFixed(2);
    }
    el.setAttribute('d', newD);
  });

  // Edge styling — preserve Mermaid's solid/dotted/thick patterns
  const ec = isDark ? 'rgba(106,164,188,0.55)' : 'rgba(33,149,128,0.45)';
  const arrowColor = isDark ? 'rgba(106,164,188,0.8)' : 'rgba(33,149,128,0.7)';
  root.querySelectorAll('.edgePaths path, .edgePath path').forEach(p => {
    const el = p as SVGElement;
    const isDotted = el.classList.contains('edge-pattern-dotted');
    const isThick = el.classList.contains('edge-thickness-thick');
    el.style.stroke = ec;
    el.style.strokeWidth = isThick ? '3.5px' : '2.5px';
    el.style.strokeLinecap = 'round';
    if (isDotted) {
      el.style.strokeDasharray = '8,5';
    }
  });
  root.querySelectorAll('marker').forEach(m => {
    const marker = m as SVGMarkerElement;
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    // refX positions the arrow so the line ends behind the arrowhead body
    if (marker.id.includes('pointEnd')) {
      marker.setAttribute('refX', '6');
      marker.setAttribute('refY', '5');
    }
  });
  root.querySelectorAll('marker path, .arrowheadPath').forEach(p => {
    (p as SVGElement).style.fill = arrowColor;
  });
  root.querySelectorAll('.edgeLabel').forEach(edgeLbl => {
    const t = edgeLbl.querySelector('text, span');
    if (t) {
      (t as HTMLElement).style.fontSize = '11px';
      (t as HTMLElement).style.fontWeight = '500';
    }
  });

  // Expand viewBox
  if (expandViewBox) {
    const vb = root.getAttribute('viewBox');
    if (vb) {
      const p = vb.split(' ').map(Number);
      if (p.length === 4) {
        root.setAttribute('viewBox', `${p[0] - 8} ${p[1] - 8} ${p[2] + 16} ${p[3] + 20}`);
      }
    }
  }
}

/** Get the workload color for the first annotated node in a chart. */
export function getPrimaryWorkloadColor(chart: string): WorkloadColor | null {
  const map = extractNodeInfo(chart);
  if (map.size === 0) return null;
  const first = map.values().next().value;
  return first?.wc ?? null;
}
