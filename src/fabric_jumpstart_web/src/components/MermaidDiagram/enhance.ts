/**
 * Shared SVG enhancement for Mermaid diagrams.
 * Injects Fabric item icons, gradient fills, drop shadows, and styled edges.
 */
import itemIconData from '@data/fabric-item-icons.json';
import itemDisplayNamesData from '@data/item-display-names.json';

const itemIcons = itemIconData as Record<string, string>;
const itemDisplayNames = itemDisplayNamesData as Record<string, string>;

/** Case-insensitive lookup map: lowercase key → original key. */
function buildCiIndex(map: Record<string, unknown>): Map<string, string> {
  const index = new Map<string, string>();
  for (const key of Object.keys(map)) index.set(key.toLowerCase(), key);
  return index;
}

const ciIcons = buildCiIndex(itemIcons);
const ciDisplayNames = buildCiIndex(itemDisplayNames);

/** Case-insensitive lookup. Tries exact match first, then lowercase. */
function ciGet<T>(map: Record<string, T>, ci: Map<string, string>, key: string): T | undefined {
  return map[key] ?? map[ci.get(key.toLowerCase()) ?? ''];
}

interface NodeInfo {
  nodeId: string;
  label: string;
  itemType: string;
  itemIcon: string | null;
  emoji: string | null;
}

// Consistent Fabric-themed node styling
const NODE_STROKE = { dark: 'rgba(255,255,255,0.25)', light: 'rgba(0,0,0,0.18)' };
const NODE_FILL_RGB = { dark: '255,255,255', light: '0,0,0' };

const UNICODE_CP_RE = /^U([0-9A-Fa-f]{4,6})$/;
const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

function extractNodeInfo(chart: string): Map<string, NodeInfo> {
  const nodes = new Map<string, NodeInfo>();
  const regex = /([A-Za-z_]\w*)\[([^\]]*)\]:::([^\s;]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(chart)) !== null) {
    const [, nodeId, label, itemType] = m;
    const itemIcon = ciGet(itemIcons, ciIcons, itemType) || null;
    if (itemIcon) {
      nodes.set(nodeId, { nodeId, label: label.trim(), itemType, itemIcon, emoji: null });
    } else {
      let emoji: string | null = null;
      const cpMatch = itemType.match(UNICODE_CP_RE);
      if (cpMatch) {
        emoji = String.fromCodePoint(parseInt(cpMatch[1], 16));
      } else {
        const emojiMatch = itemType.match(EMOJI_RE);
        emoji = emojiMatch ? emojiMatch[0] : null;
      }
      nodes.set(nodeId, { nodeId, label: label.trim(), itemType, itemIcon: null, emoji });
    }
  }
  return nodes;
}

/**
 * Map each declared node id to the set of subgraph (cluster) ids that enclose it.
 * Used to detect edges that cross a subgraph boundary — Mermaid terminates those
 * edges at the cluster border (not at the inner node), so they must not be trimmed.
 */
function parseClusterMembership(chart: string): Map<string, Set<string>> {
  const membership = new Map<string, Set<string>>();
  const stack: string[] = [];
  const subgraphRe = /^\s*subgraph\s+([A-Za-z_]\w*)/;
  const endRe = /^\s*end\s*$/;
  const nodeDeclRe = /([A-Za-z_]\w*)\s*[[(]/g;
  for (const line of chart.split('\n')) {
    const sg = subgraphRe.exec(line);
    if (sg) {
      stack.push(sg[1]);
      continue;
    }
    if (endRe.test(line)) {
      stack.pop();
      continue;
    }
    let m: RegExpExecArray | null;
    nodeDeclRe.lastIndex = 0;
    while ((m = nodeDeclRe.exec(line)) !== null) {
      if (!membership.has(m[1])) membership.set(m[1], new Set(stack));
    }
  }
  return membership;
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
    // Match by Mermaid node ID (e.g. id="flowchart-NB-0" or "prefix-flowchart-NB-0" → nodeId "NB")
    const gId = g.getAttribute('id') ?? '';
    const idMatch = gId.match(/flowchart-(.+)-\d+$/);
    const info = idMatch ? nodeMap.get(idMatch[1]) : undefined;
    if (!info) continue;

    const label = info.label;
    const sp = g.querySelector('span.nodeLabel, span');

    const rgb = NODE_FILL_RGB[isDark ? 'dark' : 'light'];

    const shape = g.querySelector('rect, polygon') as SVGGraphicsElement | null;
    if (!shape) continue;

    // Gradient fill — consistent neutral styling
    const gid = `wl-g-${gi++}`;
    const gr = svgEl('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
    const s1 = svgEl('stop', { offset: '0%' });
    const s2 = svgEl('stop', { offset: '100%' });
    s1.setAttribute('stop-color', `rgba(${rgb},${isDark ? 0.12 : 0.06})`);
    s2.setAttribute('stop-color', `rgba(${rgb},${isDark ? 0.04 : 0.02})`);
    gr.appendChild(s1);
    gr.appendChild(s2);
    defs.appendChild(gr);

    shape.setAttribute('fill', `url(#${gid})`);
    shape.setAttribute('stroke', NODE_STROKE[isDark ? 'dark' : 'light']);
    shape.setAttribute('stroke-width', '2');
    shape.setAttribute('rx', '6');
    shape.setAttribute('ry', '6');
    shape.style.filter = `url(#${SH})`;

    const box = shape.getBBox();

    const hasVisual = !!(info.emoji || info.itemIcon);
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
    } else if (info.itemIcon) {
      g.appendChild(svgEl('image', {
        href: info.itemIcon,
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

      // Show item type subtitle for registered Fabric types (has icon)
      const showType = showSubtitles && !info.emoji && !!info.itemIcon;
      const typeName = showType
        ? (ciGet(itemDisplayNames, ciDisplayNames, info.itemType) ?? info.itemType)
        : '';

      fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="
        display:flex;flex-direction:column;justify-content:center;
        height:100%;width:100%;padding:0 4px;box-sizing:border-box;
        text-align:left;
      ">
        <div style="font-family:Consolas,'Courier New',monospace;font-weight:600;font-size:14px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${isDark ? '#e0e0e0' : '#242424'}">${label}</div>
        ${showType ? `<div style="font-weight:500;font-size:11px;line-height:1.2;color:${TYPE_COLOR}">${typeName}</div>` : ''}
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

  // Edges that cross a subgraph boundary are terminated by Mermaid at the cluster
  // border (not at the inner node, which was widened), so their boundary endpoints
  // must not be trimmed — otherwise the arrow floats short of the workspace box.
  const membership = parseClusterMembership(chart);
  const knownIds = new Set(membership.keys());
  const parseEdgeId = (id: string): [string, string] | null => {
    const m = id.match(/(?:^|[-_])L[_-](.+)[_-]\d+$/);
    if (!m) return null;
    const parts = m[1].split('_');
    for (let k = 1; k < parts.length; k++) {
      const s = parts.slice(0, k).join('_');
      const d = parts.slice(k).join('_');
      if (knownIds.has(s) && knownIds.has(d)) return [s, d];
    }
    return null;
  };
  // True when some cluster encloses `a` but not `b` (so the a-end sits on a border).
  const endsOnBorder = (a: string, b: string): boolean => {
    const ca = membership.get(a);
    const cb = membership.get(b) ?? new Set<string>();
    if (!ca) return false;
    for (const c of ca) if (!cb.has(c)) return true;
    return false;
  };

  // Map node id → its <g class="node"> element, so cross-boundary edges (which
  // Mermaid clips at the cluster border) can be extended to the real node.
  const nodeElById = new Map<string, SVGGElement>();
  root.querySelectorAll('g.node').forEach(g => {
    const m = (g.id || '').match(/flowchart-(.+)-\d+$/);
    if (m && !nodeElById.has(m[1])) nodeElById.set(m[1], g as SVGGElement);
  });

  // Pull each external "source" node to the vertical position of the node it
  // feeds. Mermaid/dagre packs the source rank and centres it vertically — it
  // never aligns a source with its target — so left-column sources sit mid-height
  // and their connectors run at an angle. We align each source with its target's
  // vertical centre (in viewport space, since source and target live in different
  // transform groups), then spread apart only enough to avoid overlap. Sources
  // that live in their own subgraph box stay clamped within that box's extent.
  const getTranslate = (g: SVGGElement): { x: number; y: number } | null => {
    const m = (g.getAttribute('transform') || '').match(
      /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/,
    );
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
  };
  const setTranslateY = (g: SVGGElement, y: number): void => {
    const t = g.getAttribute('transform') || '';
    g.setAttribute(
      'transform',
      t.replace(
        /translate\(\s*([-\d.]+)([ ,]+)[-\d.]+/,
        (_all, x, sep) => `translate(${x}${sep}${y}`,
      ),
    );
  };
  const nodeVp = (g: SVGGElement): { y: number; h: number } | null => {
    const shape = (g.querySelector('rect') as SVGGraphicsElement | null) ?? g;
    const m = shape.getCTM();
    if (!m) return null;
    const bb = shape.getBBox();
    const c = new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(m);
    return { y: c.y, h: bb.height * (m.d || 1) };
  };

  // key (cluster + source column) → external sources feeding into that cluster.
  const groups = new Map<string, { id: string; wantSum: number; n: number }[]>();
  root.querySelectorAll('.edgePaths path, .edgePath path').forEach(p => {
    const parsed = parseEdgeId((p as SVGElement).getAttribute('data-id') || p.id || '');
    if (!parsed) return;
    const [src, dst] = parsed;
    // dst sits on a cluster border that src is outside of → src is an external source.
    if (!endsOnBorder(dst, src)) return;
    const srcEl = nodeElById.get(src);
    const dstEl = nodeElById.get(dst);
    if (!srcEl || !dstEl) return;
    const srcPos = getTranslate(srcEl);
    const dstVp = nodeVp(dstEl);
    if (!srcPos || !dstVp) return;
    // the cluster that encloses dst but not src
    const csrc = membership.get(src) ?? new Set<string>();
    let cluster: string | undefined;
    for (const c of membership.get(dst) ?? new Set<string>()) {
      if (!csrc.has(c)) {
        cluster = c;
        break;
      }
    }
    if (!cluster) return;
    // One lane per source column (same x), so a source never jumps lanes.
    const key = `${cluster}@${Math.round(srcPos.x)}`;
    const arr = groups.get(key) ?? [];
    const existing = arr.find(e => e.id === src);
    if (existing) {
      existing.wantSum += dstVp.y; // multiple targets → average their y
      existing.n += 1;
    } else arr.push({ id: src, wantSum: dstVp.y, n: 1 });
    groups.set(key, arr);
  });

  const GAP_PAD = 12;
  groups.forEach(entries => {
    const nodes = entries
      .map(e => {
        const el = nodeElById.get(e.id)!;
        const vp = nodeVp(el);
        const t = getTranslate(el);
        return vp && t
          ? { el, id: e.id, want: e.wantSum / e.n, curY: vp.y, curT: t.y, h: vp.h }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    if (nodes.length === 0) return;
    nodes.sort((a, b) => a.want - b.want);

    const boxed = nodes.every(n => (membership.get(n.id)?.size ?? 0) > 0);
    const minGap = Math.max(...nodes.map(n => n.h)) + GAP_PAD;
    const pos = nodes.map(n => n.want);

    if (boxed) {
      // Keep the sources inside their subgraph box's original vertical extent.
      const lo = Math.min(...nodes.map(n => n.curY));
      const hi = Math.max(...nodes.map(n => n.curY));
      pos[0] = Math.min(Math.max(pos[0], lo), hi);
      for (let i = 1; i < pos.length; i++) {
        pos[i] = Math.min(Math.max(pos[i], pos[i - 1] + minGap), hi);
      }
      for (let i = pos.length - 2; i >= 0; i--) {
        if (pos[i] > pos[i + 1] - minGap) pos[i] = pos[i + 1] - minGap;
      }
      if (pos.length > 1 && pos[0] < lo) {
        // Doesn't fit — distribute evenly across the box, preserving order.
        for (let i = 0; i < pos.length; i++) {
          pos[i] = lo + (i * (hi - lo)) / (pos.length - 1);
        }
      }
    } else {
      // Free vertical space: honour target alignment, spread only to de-overlap,
      // then recentre on the desired centroid so the group doesn't drift.
      for (let i = 1; i < pos.length; i++) {
        pos[i] = Math.max(pos[i], pos[i - 1] + minGap);
      }
      const wantMean = nodes.reduce((s, n) => s + n.want, 0) / nodes.length;
      const posMean = pos.reduce((s, y) => s + y, 0) / pos.length;
      const shift = wantMean - posMean;
      for (let i = 0; i < pos.length; i++) pos[i] += shift;
    }

    nodes.forEach((n, i) => setTranslateY(n.el, n.curT + (pos[i] - n.curY)));
  });

  // Connection point on a node face (in the edge path's coordinate space).
  // side: 'left' | 'right' — which vertical face the edge attaches to.
  const facePoint = (
    nodeEl: SVGGElement,
    side: 'left' | 'right',
    pathEl: SVGPathElement,
  ): { x: number; y: number } | null => {
    const shape = (nodeEl.querySelector('rect') as SVGGraphicsElement | null) ?? nodeEl;
    const pathM = pathEl.getCTM();
    const fromM = shape.getCTM();
    if (!pathM || !fromM) return null;
    const bb = shape.getBBox();
    const lx = side === 'left' ? bb.x : bb.x + bb.width;
    const ly = bb.y + bb.height / 2;
    const vp = new DOMPoint(lx, ly).matrixTransform(fromM);
    const local = new DOMPoint(vp.x, vp.y).matrixTransform(pathM.inverse());
    return { x: local.x, y: local.y };
  };

  root.querySelectorAll('.edgePaths path, .edgePath path').forEach(p => {
    const el = p as SVGPathElement;
    const totalLen = el.getTotalLength();
    if (totalLen <= EXTRA_W) return;

    let srcBorder = false;
    let dstBorder = false;
    let srcNode: SVGGElement | undefined;
    let dstNode: SVGGElement | undefined;
    const parsed = parseEdgeId(el.getAttribute('data-id') || el.id || '');
    if (parsed) {
      const [src, dst] = parsed;
      srcBorder = endsOnBorder(src, dst);
      dstBorder = endsOnBorder(dst, src);
      srcNode = nodeElById.get(src);
      dstNode = nodeElById.get(dst);
    }

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

    // Cross-boundary edges (either endpoint sits on a cluster border) are clipped
    // by Mermaid at the box edge and their source node may have been re-slotted
    // above, so reconnect BOTH ends straight to the real node faces. Same-cluster
    // edges are trimmed back to the widened node face as usual.
    const isCross = srcBorder || dstBorder;
    const srcPos = srcNode ? getTranslate(srcNode) : null;
    const dstPos = dstNode ? getTranslate(dstNode) : null;
    const srcRightOfDst = !!(srcPos && dstPos && srcPos.x > dstPos.x);
    const startSide: 'left' | 'right' = srcRightOfDst ? 'left' : 'right';
    const endSide: 'left' | 'right' = srcRightOfDst ? 'right' : 'left';

    const startExtend = isCross && srcNode ? facePoint(srcNode, startSide, el) : null;
    let startAt = 0;
    if (!startExtend) {
      const p0 = el.getPointAtLength(0);
      const p0n = el.getPointAtLength(Math.min(2, totalLen));
      startAt = Math.min(trimForEndpoint(p0n.x - p0.x, p0n.y - p0.y), totalLen * 0.4);
    }

    // End endpoint: extend to the real target node when clipped at a border.
    const endExtend = isCross && dstNode ? facePoint(dstNode, endSide, el) : null;
    let endAt = totalLen;
    if (!endExtend) {
      const pe = el.getPointAtLength(totalLen);
      const pe1 = el.getPointAtLength(Math.max(0, totalLen - 2));
      endAt = Math.max(totalLen - trimForEndpoint(pe.x - pe1.x, pe.y - pe1.y), totalLen * 0.6);
    }

    if (endAt <= startAt) return;

    const pts: { x: number; y: number }[] = [];
    if (startExtend || endExtend) {
      // Cross-boundary edge: Mermaid clipped it at the cluster border, leaving a
      // short stub that kinks away from the real endpoints. Draw a clean straight
      // line between the resolved node faces instead of following that stub.
      const startPt = startExtend ?? el.getPointAtLength(startAt);
      const endPt = endExtend ?? el.getPointAtLength(endAt);
      pts.push(startPt, endPt);
    } else {
      const span = endAt - startAt;
      const steps = Math.max(24, Math.round(span / 4));
      for (let i = 0; i <= steps; i++) {
        const t = startAt + (i / steps) * span;
        pts.push(el.getPointAtLength(t));
      }
    }

    const newD = pts
      .map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(2) + ',' + pt.y.toFixed(2))
      .join('');
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

  // ── Subgraph / cluster styling ──────────────────────────────────────

  // Parse subgraph definitions — supports `subgraph Title:::Type` syntax
  interface SubgraphInfo { title: string; itemType: string | null; }
  const subgraphDefs: SubgraphInfo[] = [];
  const sgRegex = /subgraph\s+(.+)/g;
  let sgMatch: RegExpExecArray | null;
  while ((sgMatch = sgRegex.exec(chart)) !== null) {
    const raw = sgMatch[1].trim();
    const typeMatch = raw.match(/^(.+?):::(\w+)$/);
    if (typeMatch) {
      subgraphDefs.push({ title: typeMatch[1].trim(), itemType: typeMatch[2] });
    } else {
      subgraphDefs.push({ title: raw, itemType: null });
    }
  }

  const SG_ICON = 26;
  // Height of the header band we add above the original box
  const SG_HEADER_H = 54;

  root.querySelectorAll('g.cluster').forEach((clusterG, idx) => {
    const rect = clusterG.querySelector('rect') as SVGRectElement | null;
    if (!rect) return;

    // Style cluster rect
    rect.setAttribute('rx', '10');
    rect.setAttribute('ry', '10');
    rect.removeAttribute('stroke-dasharray');
    // Use inline style to override Mermaid's CSS class rules (hsl(60,...) brownish fill)
    const sgFill = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.025)';
    const sgStroke = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.12)';
    rect.style.cssText = `fill:${sgFill};stroke:${sgStroke};stroke-width:1.5px`;

    // Clusters render in reverse order from source
    const sgInfo = subgraphDefs[subgraphDefs.length - 1 - idx];
    const sgTitle = sgInfo?.title ?? '';
    const sgType = sgInfo?.itemType ?? null;

    // Resolve icon from the shared icon map (Workspace, Lakehouse, Notebook, etc.)
    const iconUri = sgType ? (ciGet(itemIcons, ciIcons, sgType) ?? null) : null;

    // Human-readable type name from centralized display name map
    const typeName = sgType
      ? (ciGet(itemDisplayNames, ciDisplayNames, sgType) ?? sgType)
      : '';

    const box = rect.getBBox();

    // Expand rect upward so header doesn't crowd node content
    rect.setAttribute('y', String(box.y - SG_HEADER_H));
    rect.setAttribute('height', String(box.height + SG_HEADER_H));

    const labelG = clusterG.querySelector('.cluster-label') as SVGGElement | null;

    if (labelG) {
      // Position label in the new header space above the original box top
      const labelX = box.x + 16;
      const labelY = box.y - SG_HEADER_H;

      // Clear existing label content
      labelG.innerHTML = '';
      labelG.setAttribute('transform', `translate(${labelX},${labelY})`);

      // Icon — vertically centered within the header content area (above divider)
      const iconY = Math.round((SG_HEADER_H - SG_ICON) / 2);
      if (iconUri) {
        labelG.appendChild(svgEl('image', {
          href: iconUri,
          width: String(SG_ICON), height: String(SG_ICON),
          x: '0', y: String(iconY),
        }));
      }

      // Title + type via foreignObject to match node HTML rendering exactly
      const textLeftX = iconUri ? SG_ICON + 10 : 0;
      const fo = document.createElementNS(SVG_NS, 'foreignObject');
      fo.setAttribute('x', String(textLeftX));
      fo.setAttribute('y', '0');
      fo.setAttribute('width', String(box.width - 32 - textLeftX));
      fo.setAttribute('height', String(SG_HEADER_H));

      const titleColor = isDark ? '#e0e0e0' : '#242424';
      const typeHtml = sgType && typeName
        ? `<div style="font-weight:500;font-size:11px;line-height:1;color:${TYPE_COLOR};margin-top:-1px">${typeName}</div>`
        : '';

      fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="
        display:flex;flex-direction:column;justify-content:center;
        height:100%;width:100%;box-sizing:border-box;
        text-align:left;
      ">
        <div style="font-family:Consolas,'Courier New',monospace;font-weight:600;font-size:14px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${titleColor}">${sgTitle}</div>
        ${typeHtml}
      </div>`;
      labelG.appendChild(fo);

      // Horizontal divider at the original box top edge
      const lineY = SG_HEADER_H;
      labelG.appendChild(svgEl('line', {
        x1: String(-16),
        y1: String(lineY),
        x2: String(box.width - 16),
        y2: String(lineY),
        stroke: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.10)',
        'stroke-width': '1',
      }));
    }
  });

  // Expand viewBox — account for subgraph headers that extend above original bounds
  const sgExtra = subgraphDefs.length > 0 ? SG_HEADER_H : 0;
  if (expandViewBox) {
    const vb = root.getAttribute('viewBox');
    if (vb) {
      const p = vb.split(' ').map(Number);
      if (p.length === 4) {
        root.setAttribute('viewBox', `${p[0] - 8} ${p[1] - 8 - sgExtra} ${p[2] + 16} ${p[3] + 20 + sgExtra}`);
      }
    }
  }
}
