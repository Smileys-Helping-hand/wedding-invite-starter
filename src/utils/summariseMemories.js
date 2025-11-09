const buildFallbackSummary = (memories) => {
  if (!memories?.length) return '';
  const total = memories.length;
  const highlighted = memories
    .slice(0, 3)
    .map((item) => item.name)
    .join(', ');
  return `Collected ${total} heartfelt blessings${highlighted ? ` — including warm words from ${highlighted}` : ''}.`;
};

export const summariseMemories = async (memories) => {
  if (!memories?.length) return '';

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackSummary(memories);
  }

  try {
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Summarise wedding guest messages into a single, uplifting sentence of under 32 words. Maintain a warm, Islamic tone and include gratitude.',
        },
        {
          role: 'user',
          content: memories
            .slice(0, 12)
            .map((item) => `${item.name}: ${item.message}`)
            .join('\n'),
        },
      ],
      max_tokens: 80,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return buildFallbackSummary(memories);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return content ?? buildFallbackSummary(memories);
  } catch (err) {
    return buildFallbackSummary(memories);
  }
};

export default summariseMemories;
