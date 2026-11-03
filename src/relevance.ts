/** Lexical retrieval only: no embeddings, stemming, or semantic inference. */
export function terms(text: string): string[] {
  return text.normalize('NFKC').replace(/([\p{Ll}\d])([\p{Lu}])/gu, '$1 $2')
    .toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function rankByQuery(texts: string[], query: string) {
  const queries = [...new Set(terms(query))];
  const documents = texts.map(terms);
  const average = documents.reduce((sum, doc) => sum + doc.length, 0) / (documents.length || 1) || 1;
  const frequencies = queries.map(term => documents.filter(doc => doc.includes(term)).length);
  return documents.map(doc => {
    const counts = new Map<string, number>();
    for (const term of doc) counts.set(term, (counts.get(term) ?? 0) + 1);
    const matchedTerms: string[] = [];
    let score = 0;
    queries.forEach((term, i) => {
      const frequency = counts.get(term) ?? 0;
      if (!frequency) return;
      matchedTerms.push(term);
      const idf = Math.log(1 + (documents.length - frequencies[i] + 0.5) / (frequencies[i] + 0.5));
      score += idf * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * doc.length / average));
    });
    return { score, matchedTerms };
  });
}
