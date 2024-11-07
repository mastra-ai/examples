import { Google_MailIntegration } from '@mastra/google_mail'
import { GithubIntegration } from '@mastra/github'
import { FirecrawlIntegration } from '@mastra/firecrawl'
import { SlackIntegration } from '@mastra/slack'
import { z } from 'zod'
import { Config } from '@mastra/core'
import {
  callAgent,
  getAthletesForTeam,
  getCoinHistoricalPrices,
  getCoinList,
  getCoinPrice,
  getScores,
  getSportsNews,
  getStockPrice,
  reportAnswers,
  searchCoins,
  searchStocks,
  sendSlackMessage,
  syncCoins,
  syncStocks,
  syncTeams
} from './lib/mastra/system-apis'

const TimeSeriesDataPoint = z.object({
  '1. open': z.string(),
  '2. high': z.string(),
  '3. low': z.string(),
  '4. close': z.string(),
  '5. volume': z.string()
})

const AlphaVantageMetaData = z.object({
  '1. Information': z.string(),
  '2. Symbol': z.string(),
  '3. Last Refreshed': z.string(),
  '4. Interval': z.string(),
  '5. Output Size': z.string(),
  '6. Time Zone': z.string()
})

const AlphaVantageIntradaySchema = z.object({
  'Meta Data': AlphaVantageMetaData,
  'Time Series (5min)': z.record(TimeSeriesDataPoint)
})

export const config: Config = {
  name: 'agent-chatbot',
  integrations: [
    new Google_MailIntegration({
      config: {
        CLIENT_ID: process.env.GOOGLE_MAIL_CLIENT_ID!,
        CLIENT_SECRET: process.env.GOOGLE_MAIL_CLIENT_SECRET!,
        SCOPES: [
          'https://mail.google.com/',
          'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
          'https://www.googleapis.com/auth/gmail.addons.current.message.action',
          'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
          'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.insert',
          'https://www.googleapis.com/auth/gmail.labels',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.settings.basic',
          'https://www.googleapis.com/auth/gmail.settings.sharing'
        ]
      }
    }),

    new GithubIntegration(),

    new FirecrawlIntegration({
      config: {
        API_KEY: process.env.FIRECRAWL_API_KEY!
      }
    }),

    // @ts-ignore
    new SlackIntegration({
      config: {
        CLIENT_ID: process.env.SLACK_CLIENT_ID!,
        CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET!,
        REDIRECT_URI: `https://redirectmeto.com/${new URL(
          '/api/mastra/connect/callback',
          process.env.APP_URL
        ).toString()}`,
        SCOPES: ['channels:manage', 'users:read', 'chat:write']
      }
    })
  ],
  db: {
    provider: 'postgres',
    uri: process.env.DB_URL!
  },
  agents: {
    agentDirPath: '/mastra/agents',
    vectorProvider: [
      {
        name: 'PINECONE',
        provider: 'PINECONE',
        apiKey: process.env.PINECONE_API_KEY!,
        dirPath: '/mastra/vector-configs'
      }
    ]
  },
  logs: {
    provider: 'UPSTASH',
    config: {
      url:
        process.env.UPSTASH_URL || 'https://prepared-mongoose-49206.upstash.io',
      token: process.env.UPSTASH_API_KEY!
    }
  },
  workflows: {
    blueprintDirPath: '/mastra/blueprints',
    systemEvents: {
      REPORT_ANSWERS: {
        label: 'Report answers for NFL Analyst bot',
        description: 'Report answers for NFL Analyst bot',
        schema: z.object({
          message: z.string()
        })
      },
      SYNC_TEAMS: {
        label: 'Sync teams',
        description: 'Sync teams',
        schema: z.object({}),
        handler: syncTeams,
        entityType: 'teams',
        fields: [
          {
            name: 'id',
            displayName: 'Team ID',
            type: 'SINGLE_LINE_TEXT',
            order: 0
          },
          {
            name: 'name',
            displayName: 'Name',
            type: 'SINGLE_LINE_TEXT',
            order: 1
          }
        ]
      },
      REPORT_GAME_RESULTS: {
        label: 'Report Game Results',
        description: 'Sync teams',
        schema: z.object({
          week: z.string(),
          day: z.enum(['monday', 'thursday', 'sunday'])
        })
      },
      SYNC_CRYPTO_COINS: {
        label: 'Sync Crypto Coins',
        description: 'Sync all available Cryptocurrencies to the database',
        schema: z.object({}),
        handler: syncCoins,
        entityType: 'coins',
        fields: [
          {
            name: 'id',
            displayName: 'Coin ID',
            type: 'SINGLE_LINE_TEXT',
            order: 0
          },
          {
            name: 'symbol',
            displayName: 'Symbol',
            type: 'SINGLE_LINE_TEXT',
            order: 1
          },
          {
            name: 'name',
            displayName: 'Name',
            type: 'SINGLE_LINE_TEXT',
            order: 2
          },
          {
            name: 'lowerCaseName',
            displayName: 'Lowercase Name',
            type: 'SINGLE_LINE_TEXT',
            order: 3
          }
        ]
      },
      SYNC_STOCK_LIST: {
        label: 'Sync stock list',
        description: 'Sync all available stocks to the database',
        schema: z.object({}),
        handler: syncStocks,
        entityType: 'stocks',
        fields: [
          {
            name: 'id',
            displayName: 'Stock ID',
            type: 'SINGLE_LINE_TEXT',
            order: 0
          },
          {
            name: 'symbol',
            displayName: 'Symbol',
            type: 'SINGLE_LINE_TEXT',
            order: 1
          },
          {
            name: 'name',
            displayName: 'Name',
            type: 'SINGLE_LINE_TEXT',
            order: 2
          },
          {
            name: 'assetType',
            displayName: 'Asset Type',
            type: 'SINGLE_LINE_TEXT',
            order: 3
          },
          {
            name: 'exchange',
            displayName: 'Exchange',
            type: 'SINGLE_LINE_TEXT',
            order: 4
          },
          {
            name: 'ipoDate',
            displayName: 'Ipo Date',
            type: 'SINGLE_LINE_TEXT',
            order: 5
          },
          {
            name: 'status',
            displayName: 'Status',
            type: 'SINGLE_LINE_TEXT',
            order: 6
          }
        ]
      }
    },
    systemApis: [
      {
        type: 'get_scores_for_nfl_matchups',
        label: 'Provides scores for different NFL matchups by week',
        description: 'Provides scores for different NFL matchups by week',
        schema: z.object({
          week: z.string(),
          day: z.enum(['monday', 'thursday', 'sunday'])
        }),
        executor: async ({ data }: { data: any }) => {
          const scores = await getScores(data)
          return scores
        }
      },
      {
        type: 'get_athletes_for_nfl_team',
        label: 'Provides athlete information for NFL team',
        description: 'Provides athlete information for NFL team',
        schema: z.object({
          teamId: z.number(),
          position: z.enum(['PK', 'WR', 'QB', 'P'])
        }),
        executor: async ({ data }: any) => {
          const athlete = await getAthletesForTeam(data)
          return athlete
        }
      },
      {
        type: 'get_sports_news',
        label: 'Get sports news',
        description: 'Get sports news',
        schema: z.object({}),
        executor: async () => {
          return await getSportsNews()
        }
      },
      {
        type: 'send_slack_message',
        label: 'Send message to slack',
        description: 'Send message to slack',
        schema: z.object({
          message: z.string(),
          channelId: z.string()
        }),
        executor: sendSlackMessage
      },
      {
        type: 'report_answers_to_slack',
        label: 'Triggers a workflow for questions asked to the bot',
        description: 'Triggers a workflow for questions asked to the bot',
        schema: z.object({
          message: z.string()
        }),
        executor: reportAnswers
      },
      {
        type: 'trigger_agent_call',
        label: 'Trigger Agent Call',
        description: 'Calls an Agent',
        schema: z.object({
          message: z.string()
        }),
        outputSchema: z.object({
          message: z.string()
        }),
        executor: callAgent
      },
      {
        type: 'get_crypto_coins',
        label: 'Get crypto coins',
        description: 'Get all available crypto coin ids',
        schema: z.object({}),
        outputSchema: z.object({
          id: z.string(),
          symbol: z.string(),
          name: z.string()
        }),
        executor: getCoinList
      },
      {
        type: 'search_crypto_coins',
        label: 'Search crypto coins',
        description: 'Search all available crypto coin by a keyword',
        schema: z.object({
          keyword: z.string()
        }),
        outputSchema: z.object({
          id: z.string(),
          symbol: z.string(),
          name: z.string()
        }),
        executor: async ({ data }: { data: any }) => {
          return (await searchCoins(data)) as any
        }
      },
      {
        type: 'get_crypto_price',
        label: 'Get crypto price',
        description: 'Get crypto price by id',
        schema: z.object({
          id: z.string()
        }),
        outputSchema: z.object({
          id: z.string(),
          symbol: z.string(),
          name: z.string(),
          image: z.string(),
          current_price: z.number(),
          market_cap: z.number(),
          market_cap_rank: z.number(),
          fully_diluted_valuation: z.number(),
          total_volume: z.number(),
          high_24h: z.number(),
          low_24h: z.number(),
          price_change_24h: z.number(),
          price_change_percentage_24h: z.number(),
          market_cap_change_24h: z.number(),
          market_cap_change_percentage_24h: z.number(),
          circulating_supply: z.number(),
          total_supply: z.number(),
          max_supply: z.number(),
          ath: z.number(),
          ath_change_percentage: z.number(),
          ath_date: z.string(),
          atl: z.number(),
          atl_change_percentage: z.number(),
          atl_date: z.string(),
          roi: z.any(),
          last_updated: z.string()
        }),
        executor: async ({ data }: { data: any }) => {
          return await getCoinPrice(data)
        }
      },
      {
        type: 'get_crypto_historical_prices',
        label: 'Get historical crypto prices',
        description:
          'Get historical crypto prices for use in a chart. Returns an array of price objects with a timestamp and price.',
        schema: z.object({
          id: z.string(),
          days: z.number()
        }),
        outputSchema: z.object({
          prices: z.array(
            z.object({
              timestamp: z.number(),
              price: z.number()
            })
          )
        }),
        executor: async ({ data }: { data: any }) => {
          return await getCoinHistoricalPrices(data)
        }
      },
      {
        type: 'search_stock',
        label: 'Search stock',
        description: 'Search all available stock by a keyword',
        schema: z.object({
          keyword: z.string()
        }),
        outputSchema: z.object({
          id: z.string(),
          symbol: z.string(),
          name: z.string()
        }),
        executor: async ({ data }: { data: any }) => {
          return (await searchStocks(data)) as any
        }
      },
      {
        type: 'get_stock_price',
        label: 'Get stock price',
        description:
          'Get stock price. Returns open, high, low, close, and volume.',
        schema: z.object({
          symbol: z.string()
        }),
        outputSchema: AlphaVantageIntradaySchema,
        executor: async ({ data }: { data: any }) => {
          return await getStockPrice(data)
        }
      }
    ]
  },
  systemHostURL: process.env.APP_URL!,
  routeRegistrationPath: '/api/mastra'
}
