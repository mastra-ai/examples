import { convertToCoreMessages, Message, StreamData, streamText } from 'ai';
import { z } from 'zod';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'getWeather'
  | 'searchCryptoCoins'
  | 'getCryptoPrice'
  | 'getHistoricalCryptoPrices';

const weatherTools: AllowedTools[] = ['getWeather'];
const cryptoTools: AllowedTools[] = [
  'searchCryptoCoins',
  'getCryptoPrice',
  'getHistoricalCryptoPrices',
];

const allTools: AllowedTools[] = [...weatherTools, ...cryptoTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [
      { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  });

  const streamingData = new StreamData();

  const result = await streamText({
    model: customModel(model.apiIdentifier),
    system: systemPrompt,
    messages: coreMessages,
    maxSteps: 5,
    experimental_activeTools: allTools,
    tools: {
      getWeather: {
        description: 'Get the current weather at a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
          );

          const weatherData = await response.json();
          return weatherData;
        },
      },
      searchCryptoCoins: {
        description: 'Search all available crypto coins by a keyword',
        parameters: z.object({
          keyword: z.string(),
        }),
        execute: async ({ keyword }) => {
          const coinListUrl = `https://api.coingecko.com/api/v3/coins/list`;

          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!,
            },
          };

          const response = await fetch(coinListUrl, options);
          const data = await response.json();

          // First try to find an exact match.
          const exactMatch = data.find(
            (coin: any) => coin.name.toLowerCase() === keyword.toLowerCase()
          );

          if (exactMatch) {
            console.log('searchCryptoCoins exactMatch', exactMatch);
            return exactMatch;
          }

          // If no exact match is found, return first coin that contains the keyword.
          const coin = data.filter((coin: any) =>
            coin.name.toLowerCase().includes(keyword.toLowerCase())
          );

          if (coin.length >= 0) {
            console.log('searchCryptoCoins containsMatch', coin[0]);
            return coin[0];
          }

          return null;
        },
      },
      getCryptoPrice: {
        description: 'Get crypto price by id',
        parameters: z.object({
          id: z.string(),
        }),
        execute: async ({ id }) => {
          const coinListUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}`;

          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!,
            },
          };

          const response = await fetch(coinListUrl, options);
          const data = await response.json();
          console.log('getCryptoPrice', data);

          if (data.length === 0) {
            return null;
          }

          return data[0];
        },
      },
      getHistoricalCryptoPrices: {
        description: 'Get historical crypto prices for use in a chart',
        parameters: z.object({
          id: z.string(),
          days: z.number(),
        }),
        execute: async ({ id, days }) => {
          const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;

          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!,
            },
          };

          const response = await fetch(url, options);
          const data = await response.json();

          return data.prices.map((price: number[]) => ({
            timestamp: price[0],
            price: price[1],
          }));
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(responseMessages);

          await saveMessages({
            messages: responseMessagesWithoutIncompleteToolCalls.map(
              (message) => {
                const messageId = generateUUID();

                if (message.role === 'assistant') {
                  streamingData.appendMessageAnnotation({
                    messageIdFromServer: messageId,
                  });
                }

                return {
                  id: messageId,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              }
            ),
          });
        } catch (error) {
          console.error('Failed to save chat');
        }
      }

      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
