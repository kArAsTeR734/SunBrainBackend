const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\uFEFF]/g;

export function parseStructuredTaskContent(content) {
  if (typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();

  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function normalizeLatexText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(ZERO_WIDTH_CHARS_REGEX, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeSvg(svgValue) {
  if (!svgValue || typeof svgValue !== 'string') {
    return null;
  }

  const cleaned = svgValue.trim();

  if (!cleaned || !cleaned.startsWith('<svg')) {
    return null;
  }

  return cleaned;
}

export function svgToDataUri(svgValue) {
  const normalized = normalizeSvg(svgValue);
  if (!normalized) {
    return null;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(normalized)}`;
}

export function buildRenderableTaskStatement(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const statementLatex = normalizeLatexText(
    String(payload.statementLatex || payload.questionLatex || '')
  );

  if (!statementLatex) {
    return null;
  }

  const imageDataUri = svgToDataUri(payload.imageSvg);
  if (!imageDataUri) {
    return statementLatex;
  }

  return `![image:block](${imageDataUri})\n\n${statementLatex}`;
}

export function normalizeTaskContent(content, originalTex = null) {
  const payload = parseStructuredTaskContent(content);

  if (!payload) {
    return {
      payload: null,
      content: typeof content === 'string' ? content : '',
      originalTex: originalTex || null
    };
  }

  const normalizedStatement = normalizeLatexText(
    String(payload.statementLatex || payload.questionLatex || '')
  );

  const renderedContent =
    buildRenderableTaskStatement(payload) || normalizedStatement || String(content);

  return {
    payload,
    content: renderedContent,
    originalTex: normalizedStatement || originalTex || null
  };
}
