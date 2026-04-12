function formatGuideDetails(guide) {
  const lines = (guide.steps || []).flatMap((step) => [
    `${step.title}:`,
    ...(step.points || []).map((point) => `- ${point}`),
  ]);
  return `${guide.title}\n${lines.join("\n")}`;
}

/**
 * @param {string} questionRaw
 * @param {{ families: string[], questions: {keyword:string, response:string}[], details: Record<string, {title:string, steps:any}> }} bundle
 * @param {{ keyword: string, guide_slug: string }[]} routes sorted long-first
 */
function matchGuideContent(questionRaw, bundle, routes) {
  const q = questionRaw.toLowerCase();
  for (const r of routes) {
    if (q.includes(r.keyword.toLowerCase())) {
      const guide = bundle.details[r.guide_slug];
      if (guide) {
        return { source: "guide_detail", answer: formatGuideDetails(guide) };
      }
    }
  }
  for (const item of bundle.questions || []) {
    if (q.includes(String(item.keyword).toLowerCase())) {
      return { source: "guide_qa", answer: item.response };
    }
  }
  return null;
}

module.exports = { matchGuideContent, formatGuideDetails };
