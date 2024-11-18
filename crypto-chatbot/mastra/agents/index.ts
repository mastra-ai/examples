import { Agent } from '@mastra/core';

import { systemPrompt } from '@/ai/prompts';

export const cryptoAgent = new Agent({
  name: 'cryptoAgent',
  instructions: systemPrompt,
  model: {
    provider: 'ANTHROPIC_VERCEL',
    name: 'claude-3-opus-20240229',
    toolChoice: 'auto',
  },
  enabledTools: {
    searchCryptoCoins: true,
    getCryptoPrice: true,
    getHistoricalCryptoPrices: true,
  },
});
