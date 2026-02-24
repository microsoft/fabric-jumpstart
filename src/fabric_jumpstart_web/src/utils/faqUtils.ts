import { INTERNAL_ROUTE } from '@config/urlconfig';

interface FaqElement {
  question: string;
  answer: string[];
}

/**
 * Parses a markdown string and converts it into an array of FaqElement objects.
 * Each FaqElement contains a question and an array of answers.
 *
 * @param markdown - The markdown string to be parsed.
 * @returns An array of FaqElement objects.
 */
export const refactorFaqMarkdown = (
  markdown: string,
  subpath: string
): FaqElement[] => {
  const lines = markdown.split('\n');
  const result: FaqElement[] = [];
  let currentElement: FaqElement = {
    question: '',
    answer: [],
  };
  let content = '';
  // Function to push accumulated table content to the current answer and reset the table content
  const pushAndResetContent = () => {
    if (content !== '') {
      // Add the accumulated table content to the current answer
      currentElement.answer.push(content);
      // Reset the table content
      content = '';
    }
  };
  lines.forEach((line: string) => {
    line = resolveRelativeUrlsInText(line, subpath);
    // Skip empty lines
    if (line.trim() === '') return;
    // Check if the line is a question (starts with "##" and does not include "(FAQ)")
    if (line.startsWith('##')) {
      // Before starting a new question, push any accumulated table content to the current answer
      pushAndResetContent();
      if (!line.includes('(FAQ)')) {
        // If there's a current question, push it to the result array
        if (currentElement.question) {
          result.push(currentElement);
        }

        // Start a new FaqElement for the new question
        currentElement = {
          question: line.replace(/^##\s*/, ''),
          answer: [],
        };
      }
    } else {
      // Check if the line is part of a table (starts with "|")
      // or a list (starts with "-")
      const trimmedLine = line.trimStart();
      if (line.startsWith('|') || trimmedLine.startsWith('-')) {
        // Append the line to the  content
        content = content + '\n' + line;
      } else {
        // If it's not a table line, add it to the current answer
        currentElement.answer.push(line);
        // Push any accumulated content to the current answer before adding a new line
        pushAndResetContent();
      }
    }
  });

  // Push the last FaqElement if it exists
  if (currentElement.question) {
    result.push(currentElement);
  }

  return result;
};

function resolveRelativeUrlsInText(text: string, subpath: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  /**
   * Resolves a given URL path to an absolute or relative URL.
   *
   * @param path - The URL path to resolve. It can be an absolute URL starting with "http" or a relative path.
   * @returns The resolved URL. If the path starts with "http", it returns the path as is.
   *          Otherwise, it processes the path to remove leading "./" or "../" and trailing slashes,
   *          and checks if the path matches any internal routes. If it matches, it returns the original path;
   *          otherwise, it prepends a subpath to the updated path.
   */
  const resolveUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const updatedPath = path
      .replace(/^(?:\.\/)*(?:\.\.\/)+/, '/')
      .replace(/\/$/, '');
    const internalRouteValues = new Set(
      Object.values(INTERNAL_ROUTE).map((route) => route.toUpperCase())
    );
    return internalRouteValues.has(updatedPath.toUpperCase())
      ? path
      : `${subpath}${updatedPath}`;
  };

  return text.replace(
    linkRegex,
    (_: string, linkText: string, path: string) => {
      const resolvedUrl = resolveUrl(path);
      return `[${linkText}](${resolvedUrl})`;
    }
  );
}
