/**
 * Shared Mermaid rendering utilities used by DiagramGenerator and the
 * Create Jumpstart diagram step.
 */
import { enhanceDiagram } from '@components/MermaidDiagram/enhance';

export const MERMAID_CONFIG_LIGHT = {
  startOnLoad: false,
  securityLevel: 'loose' as const,
  theme: 'base' as const,
  themeVariables: {
    primaryColor: '#f5f8fa',
    primaryTextColor: '#242424',
    primaryBorderColor: '#c8c8c8',
    lineColor: '#219580',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '13px',
  },
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis' as const,
    padding: 22,
    nodeSpacing: 70,
    rankSpacing: 85,
  },
};

export const MERMAID_CONFIG_DARK = {
  ...MERMAID_CONFIG_LIGHT,
  themeVariables: {
    primaryColor: '#2a2a32',
    primaryTextColor: '#e0e0e0',
    primaryBorderColor: '#4a4a55',
    lineColor: '#5a8a9a',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '13px',
  },
};

/**
 * Renders a Mermaid chart to an SVG string using an off-screen container.
 * Applies the standard Fabric diagram enhancements after rendering.
 *
 * @returns The enhanced SVG outerHTML, or null on error.
 */
export async function renderMermaidSvg(
  chart: string,
  isDark: boolean,
  container: HTMLDivElement,
): Promise<string | null> {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize(isDark ? MERMAID_CONFIG_DARK : MERMAID_CONFIG_LIGHT);

  const id = `mermaid-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    const strippedChart = chart.replace(/^(\s*subgraph\s+.+?):::(\w+)\s*$/gm, '$1');
    const { svg } = await mermaid.render(id, strippedChart);
    container.innerHTML = svg;

    const svgEl = container.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          enhanceDiagram(svgEl, chart, isDark);
          resolve();
        });
      });
      return svgEl.outerHTML;
    }
  } catch (err) {
    console.error('Mermaid render error:', err);
  }
  return null;
}
