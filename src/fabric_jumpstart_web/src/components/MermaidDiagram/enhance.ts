/**
 * Shared SVG enhancement for Mermaid architecture diagrams.
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
}

function extractNodeInfo(chart: string): Map<string, NodeInfo> {
  const nodes = new Map<string, NodeInfo>();
  const regex = /([A-Za-z_]\w*)\[([^\]]*)\]:::(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(chart)) !== null) {
    const [, nodeId, label, itemType] = m;
    const workload = ITEM_WORKLOAD_MAP[itemType];
    if (!workload) continue;
    const wc = workloadColors[workload];
    if (!wc) continue;
    const itemIcon = itemIconDataUris[itemType] || null;
    nodes.set(label.trim(), { nodeId, label: label.trim(), itemType, workload, wc, itemIcon });
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
  const { iconSize: ICON = 26, showSubtitles = true, expandViewBox = true } = opts;
  const nodeMap = extractNodeInfo(chart);
  if (nodeMap.size === 0) return;

  let defs = root.querySelector('defs');
  if (!defs) {
    defs = svgEl('defs', {}) as SVGDefsElement;
    root.insertBefore(defs, root.firstChild);
  }

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
  const PAD = Math.round(ICON * 0.46);
  const EXTRA_W = ICON + PAD + 8;
  const EXTRA_H = 8; // extra height for item-type line inside the box
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

    // Widen for icon, taller for item-type line
    shape.setAttribute('width', String(box.width + EXTRA_W));
    shape.setAttribute('x', String(box.x - EXTRA_W / 2));
    if (showSubtitles) {
      shape.setAttribute('height', String(box.height + EXTRA_H));
      shape.setAttribute('y', String(box.y - EXTRA_H / 2));
    }

    // Icon — vertically centered in the expanded box
    const nodeH = showSubtitles ? box.height + EXTRA_H : box.height;
    const nodeY = showSubtitles ? box.y - EXTRA_H / 2 : box.y;
    const cx = box.x - EXTRA_W / 2 + PAD + ICON / 2;
    const cy = nodeY + nodeH / 2;
    g.appendChild(svgEl('image', {
      href: info.itemIcon || info.wc.icon,
      width: String(ICON), height: String(ICON),
      x: String(cx - ICON / 2), y: String(cy - ICON / 2),
    }));

    // Replace label with two-line layout: item name + item type, left-aligned
    const labelGrp = g.querySelector('g.label');
    const fo = labelGrp?.querySelector('foreignObject');
    if (fo && sp) {
      // Get text area left edge (right of icon)
      const textLeftX = cx + ICON / 2 + 12;
      const nodeLeft = box.x - EXTRA_W / 2;
      const nodeRight = nodeLeft + box.width + EXTRA_W;
      const textWidth = nodeRight - textLeftX - 8;

      // Replace foreignObject content with two-line flex layout
      const typeName = showSubtitles
        ? info.itemType.replace(/([a-z])([A-Z])/g, '$1 $2')
        : '';

      fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="
        display:flex;flex-direction:column;justify-content:center;
        height:100%;width:100%;padding:0 4px;box-sizing:border-box;
        text-align:left;
      ">
        <div style="font-weight:600;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${isDark ? '#e0e0e0' : '#242424'}">${label}</div>
        ${showSubtitles ? `<div style="font-weight:500;font-size:10px;line-height:1.2;color:${TYPE_COLOR};margin-top:2px">${typeName}</div>` : ''}
      </div>`;

      // Resize and reposition foreignObject to fill the text area
      fo.setAttribute('width', String(textWidth));
      fo.setAttribute('height', String(nodeH));
      fo.setAttribute('x', '0');
      fo.setAttribute('y', '0');

      // Position label group so foreignObject starts at textLeftX, vertically centered
      labelGrp!.setAttribute('transform', `translate(${textLeftX},${nodeY})`);
    } else if (labelGrp) {
      // Fallback: just shift existing label right
      const tf = labelGrp.getAttribute('transform') || '';
      const tm = /translate\(\s*([^,)]+)[,\s]+([^)]*)\)/.exec(tf);
      if (tm) {
        labelGrp.setAttribute('transform',
          `translate(${parseFloat(tm[1]) + EXTRA_W / 2},${parseFloat(tm[2] || '0')})`);
      }
    }

    // Bold label text
    if (sp) {
      (sp as HTMLElement).style.fontWeight = '600';
      (sp as HTMLElement).style.fontSize = '13px';
    }
  }

  // Edge styling
  const ec = isDark ? 'rgba(106,164,188,0.55)' : 'rgba(33,149,128,0.45)';
  root.querySelectorAll('.edgePath path').forEach(p => {
    (p as SVGElement).setAttribute('stroke-width', '2.5');
    (p as SVGElement).setAttribute('stroke-linecap', 'round');
    (p as SVGElement).style.stroke = ec;
  });
  root.querySelectorAll('marker path, .arrowheadPath').forEach(p => {
    (p as SVGElement).setAttribute('fill', ec);
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
        root.setAttribute('viewBox', `${p[0] - 30} ${p[1] - 15} ${p[2] + 60} ${p[3] + 40}`);
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
