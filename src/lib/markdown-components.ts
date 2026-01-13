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
 * Supports: <ComponentName/>, <ComponentName prop="value"/>
 */
export function parseComponentShortcodes(content: string): ComponentShortcode[] {
  const components: ComponentShortcode[] = [];

  // Regex to match component tags: <ComponentName prop="value"/>
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*\/?>/g;

  let match;
  let index = 0;

  while ((match = componentRegex.exec(content)) !== null) {
    const [fullMatch, componentName, propsString] = match;
    const props = parseProps(propsString);
    const id = `__COMPONENT_${index}__`;

    components.push({
      name: componentName,
      props,
      position: match.index,
      fullMatch,
      id,
    });

    index++;
  }

  return components;
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
