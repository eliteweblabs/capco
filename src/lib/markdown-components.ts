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
  // Use findOpeningTagEnd to handle attributes whose values contain ">" (e.g. rightContent="<h2>Title</h2>")
  const componentStartRegex = /<([A-Z][a-zA-Z0-9]*)(\s|$)/g;

  let match;
  while ((match = componentStartRegex.exec(content)) !== null) {
    const componentName = match[1];
    const tagStart = match.index;
    const afterName = tagStart + match[0].length;
    const openTagEnd = findOpeningTagEnd(content, afterName);
    if (openTagEnd === -1) continue;

    // Skip self-closing tags (handled by second pass)
    if (content[openTagEnd - 1] === "/") continue;

    const closingTag = `</${componentName}>`;
    const closeIndex = content.indexOf(closingTag, openTagEnd);
    if (closeIndex === -1) continue;

    const propsString = content.substring(afterName, openTagEnd).trim();
    const children = content.substring(openTagEnd + 1, closeIndex);
    const fullMatch = content.substring(tagStart, closeIndex + closingTag.length);
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

    processedRanges.push({ start: tagStart, end: tagStart + fullMatch.length });
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

    const propsString = fullMatch.slice(afterName - matchStart, fullMatch.length - 2).trim();
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
 * Handles nested divs by matching the correct closing tag.
 */
function extractSlotContent(children: string): Record<string, string> {
  const slotProps: Record<string, string> = {};
  // Match <div ... slot="name" ...> (slot can be any attribute)
  const slotOpenRegex = /<div[^>]*\sslot=["']([^"']+)["'][^>]*>/gi;

  let match;
  while ((match = slotOpenRegex.exec(children)) !== null) {
    const slotName = match[1];
    const startIndex = match.index + match[0].length;

    // Find matching </div> by counting nested <div> depth
    let depth = 1;
    let i = startIndex;
    let endIndex = -1;

    while (i < children.length) {
      const nextOpen = children.substring(i).toLowerCase().indexOf("<div");
      const nextClose = children.substring(i).toLowerCase().indexOf("</div>");
      const absOpen = nextOpen === -1 ? -1 : i + nextOpen;
      const absClose = nextClose === -1 ? -1 : i + nextClose;

      if (absClose === -1) break;

      if (absOpen !== -1 && absOpen < absClose) {
        depth++;
        i = absOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          endIndex = absClose;
          break;
        }
        i = absClose + 6;
      }
    }

    if (endIndex !== -1) {
      const slotContent = children.substring(startIndex, endIndex).trim();
      const propName = slotNameToPropName(slotName);
      slotProps[propName] = slotContent;
    }
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
 * Find the index of the first ">" that closes an opening tag (outside quoted attribute values).
 */
function findOpeningTagEnd(content: string, startIndex: number): number {
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
    if (c === ">") return i;
    i++;
  }
  return -1;
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

  // Match key="value" (value can contain \" for escaped quotes), key='value', or key=unquoted
  const propRegex = /(\w+)=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\s>]+))/g;

  let match;
  while ((match = propRegex.exec(propsString)) !== null) {
    const [, key, doubleQuoted, singleQuoted, unquoted] = match;
    let value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
    if (doubleQuoted != null || singleQuoted != null) {
      value = value.replace(/\\(.)/g, "$1"); // unescape \"
    }
    props[key] = value;
  }

  return props;
}
