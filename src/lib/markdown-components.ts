/**
 * Markdown Component Parser
 * Extracts component shortcodes from markdown content
 */

export interface ComponentShortcode {
  name: string;
  props: Record<string, string>;
  position: number;
  fullMatch: string;
  id: string; // Unique placeholder ID
}

/**
 * Parse component shortcodes from markdown content
 * Supports:
 *   - Self-closing: <ComponentName prop="value"/>
 *   - With children: <ComponentName>...content...</ComponentName>
 *   - With slots: <ComponentName><div slot="left">...</div></ComponentName>
 */
export function parseComponentShortcodes(content: string): ComponentShortcode[] {
  const components: ComponentShortcode[] = [];
  const processedRanges: Array<{ start: number; end: number }> = [];
  let index = 0;

  // First pass: Match components with closing tags (may have children/slots)
  const componentWithChildrenRegex = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)>([^]*?)<\/\1>/g;

  let match;
  while ((match = componentWithChildrenRegex.exec(content)) !== null) {
    const [fullMatch, componentName, propsString, children] = match;
    const props = parseProps(propsString);
    const id = `__COMPONENT_${index}__`;

    // Extract slot content from children
    const slotProps = extractSlotContent(children);
    Object.assign(props, slotProps);

    components.push({
      name: componentName,
      props,
      position: match.index,
      fullMatch,
      id,
    });

    processedRanges.push({ start: match.index, end: match.index + fullMatch.length });
    index++;
  }

  // Second pass: Match self-closing tags (supports attribute values containing ">")
  const selfClosingStartRegex = /<([A-Z][a-zA-Z0-9]*)(\s|$)/g;
  while ((match = selfClosingStartRegex.exec(content)) !== null) {
    const matchStart = match.index;
    const componentName = match[1];
    const afterName = matchStart + match[0].length;
    const tagEnd = findSelfClosingTagEnd(content, afterName);
    if (tagEnd === -1) continue;

    const fullMatch = content.slice(matchStart, tagEnd);
    if (!fullMatch.endsWith("/>")) continue;

    const matchEnd = tagEnd;
    const alreadyProcessed = processedRanges.some(
      (range) => matchStart >= range.start && matchEnd <= range.end
    );
    if (alreadyProcessed) continue;

    const propsString = fullMatch
      .slice(afterName - matchStart, fullMatch.length - 2)
      .trim();
    const props = parseProps(propsString);
    const id = `__COMPONENT_${index}__`;

    components.push({
      name: componentName,
      props,
      position: matchStart,
      fullMatch,
      id,
    });
    index++;
    selfClosingStartRegex.lastIndex = matchEnd;
  }

  // Sort by position to maintain order
  components.sort((a, b) => a.position - b.position);

  return components;
}

/**
 * Extract slot content from children HTML
 * Converts <div slot="name">content</div> to nameContent props
 */
function extractSlotContent(children: string): Record<string, string> {
  const slotProps: Record<string, string> = {};

  // Match slot divs: <div slot="slotName">...content...</div>
  const slotRegex = /<div\s+slot=["']([^"']+)["'][^>]*>([^]*?)<\/div>/gi;

  let match;
  while ((match = slotRegex.exec(children)) !== null) {
    const [, slotName, slotContent] = match;

    // Convert slot name to content prop name
    // "left" -> "leftContent", "col1" -> "col1Content", "content" -> "mainContent", "sidebar" -> "sidebarContent"
    const propName = slotNameToPropName(slotName);
    slotProps[propName] = slotContent.trim();
  }

  return slotProps;
}

/**
 * Convert slot name to the corresponding content prop name
 */
function slotNameToPropName(slotName: string): string {
  const slotMapping: Record<string, string> = {
    left: "leftContent",
    right: "rightContent",
    col1: "col1Content",
    col2: "col2Content",
    col3: "col3Content",
    content: "mainContent",
    sidebar: "sidebarContent",
  };

  return slotMapping[slotName] || `${slotName}Content`;
}

/**
 * Find end index of self-closing tag (exclusive), respecting quoted attribute values.
 * Attribute values may contain ">" (e.g. leftContent="<h2>Title</h2>").
 */
function findSelfClosingTagEnd(content: string, startIndex: number): number {
  let i = startIndex;
  let inDouble = false;
  let inSingle = false;
  while (i < content.length) {
    const c = content[i];
    if (inDouble) {
      if (c === '"') inDouble = false;
      i++;
      continue;
    }
    if (inSingle) {
      if (c === "'") inSingle = false;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      i++;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (c === "/" && content[i + 1] === ">") {
      return i + 2;
    }
    i++;
  }
  return -1;
}

/**
 * Parse props from attribute string
 * Example: 'lat="37.7749" lng="-122.4194" zoom="12"'
 * Supports: key="value with spaces" key='value' key=value
 */
function parseProps(propsString: string): Record<string, string> {
  const props: Record<string, string> = {};

  if (!propsString.trim()) {
    return props;
  }

  // Regex to properly handle quoted strings with spaces
  // Matches: key="value with spaces" or key='value' or key=value
  const propRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match;
  while ((match = propRegex.exec(propsString)) !== null) {
    const [, key, doubleQuoted, singleQuoted, unquoted] = match;
    // Use whichever capture group matched
    const value = doubleQuoted ?? singleQuoted ?? unquoted;
    props[key] = value;
  }

  return props;
}
