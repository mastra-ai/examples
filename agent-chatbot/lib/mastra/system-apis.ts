import { lowerCase, orderBy } from 'lodash'
import { PropertyType } from '@mastra/core'

export async function getTeams() {
  const TEAMS = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
  const response = await fetch(TEAMS)
  const data = await response.json()
  return data.sports?.[0].leagues?.[0].teams.map(
    ({ team }: { team: { id: string; displayName: string } }) => {
      return {
        id: team.id,
        name: team.displayName
      }
    }
  )
}

export async function getSportsNews() {
  const URI = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=10000`
  const response = await fetch(URI)
  const data = await response.json()

  return data?.articles?.map((a: Record<string, string>) => {
    return {
      headline: a.headline,
      description: a.description
    }
  })
}

export async function getAthletesForTeam({
  teamId,
  position
}: {
  teamId: string
  position: string
}) {
  const URI = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`
  const response = await fetch(URI)
  const data = await response.json()
  return (
    await Promise.all(
      data?.athletes?.flatMap(async (res: { items: Record<string, any>[] }) => {
        return res.items.map(a => {
          return {
            id: a.id,
            name: a.fullName,
            age: a.age,
            jersey: a.jersey,
            position: a.position.abbreviation,
            experience: a.experience?.years,
            college: a.college?.name
          }
        })
      })
    )
  )
    .flatMap(a => a)
    .filter(a => a.position === position)
}

async function getScore(day: string) {
  const response = await fetch(day)
  const data = await response.json()
  return data.events?.flatMap((e: Record<string, any>) => {
    return {
      id: e.id,
      name: e.name,
      shortName: e.shortName,
      season: e.season,
      week: e.week,
      competitions: e.competitions.map((c: Record<string, any>) => {
        return {
          id: c.id,
          teams: c.competitors.map((t: Record<string, any>) => {
            return {
              homeTeam: t.homeAway !== `away`,
              winner: t.winner,
              score: t.score,
              team: t.team?.displayName
            }
          }),

          headlines: c.headlines?.map(
            (h: { description: string; shortLinkText: string }) => {
              return {
                description: h.description,
                shortLinkText: h.shortLinkText
              }
            }
          )
        }
      })
    }
  })
}

export async function getScores({ week, day }: { week: string; day?: string }) {
  const MONDAY = `https://site.api.espn.com/apis/site/v2/mondaynightfootball`
  const THURSDAY = `https://site.api.espn.com/apis/site/v2/thursdaynightfootball`
  const SUNDAY = `https://site.api.espn.com/apis/site/v2/sundaynightfootball`

  const res: Record<string, any> = {
    monday: await getScore(MONDAY),
    thursday: await getScore(THURSDAY),
    sunday: await getScore(SUNDAY)
  }

  if (day) {
    return res[day].filter(
      (e: { week: number }) => e.week === parseInt(week, 10)
    )
  }

  return orderBy(
    [...res.monday, ...res.thursday, ...res.sunday],
    'week'
  ).filter((e: { week: number }) => e.week === parseInt(week, 10))
}

export async function reportAnswers({ data }: any) {
  const { mastra } = await import('./framework')

  await mastra.triggerEvent({
    key: 'REPORT_ANSWERS',
    data,
    user: {
      connectionId: 'SYSTEM'
    }
  })
  return { message: 'Reported' }
}

export async function callAgent({ data }: any) {
  const { mastra } = await import('./framework')

  const executor = await mastra.getAgent({
    agentId: 'asst_mFswl3bmGEsWJJxPMaT5mthN',
    connectionId: 'SYSTEM'
  })

  console.log('executor', executor)

  if (!executor) {
    throw new Error('Could not create agent executor')
  }

  if (typeof executor === 'function') {
    const result = await executor({ prompt: data?.message })

    return {
      message: result?.text
    }
  } else {
    const thread = await executor.initializeThread([
      { role: 'user', content: data?.message }
    ])

    const run = await executor.watchRun({ threadId: thread.id })

    return {
      message: run?.content?.[0]?.text?.value
    }
  }
}

export async function sendSlackMessage({ data, ctx }: any) {
  // @ts-ignore
  const { mastra } = await import('./framework')
  const integration = mastra.getIntegration('SLACK')

  const client = await integration.getApiClient(ctx)

  const response = await client.chatPostMessage({
    body: {
      channel: data.channelId,
      text: data.message
    }
  })

  return response
}

export function syncTeams() {
  return {
    id: 'sync-nfl-teams',
    event: 'SYNC_TEAMS',
    executor: async ({ event }: any) => {
      const { mastra } = await import('./framework')
      const connectionId = event.user.connectionId
      const teams = await getTeams()

      console.log(teams, connectionId)

      await mastra.dataLayer?.syncData({
        name: mastra.config.name,
        connectionId,
        data: teams.map((r: any) => {
          return {
            externalId: r.id,
            data: r,
            entityType: 'teams'
          }
        }),
        properties: [
          {
            name: 'id',
            displayName: 'Team ID',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 1,
            modifiable: true
          },
          {
            name: 'name',
            displayName: 'Name',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 1,
            modifiable: true
          }
        ],
        type: 'teams',
        lastSyncId: event?.id!
      })

      console.log('SYNCED')

      return event
    }
  }
}

export function syncCoins() {
  return {
    id: 'sync-crypto-coins',
    event: 'SYNC_CRYPTO_COINS',
    executor: async ({ event }: any) => {
      const { mastra } = await import('./framework')
      const connectionId = event.user.connectionId
      const coins = await getCoinList()

      console.log('syncCoins', coins, connectionId)

      await mastra.dataLayer?.syncData({
        name: mastra.config.name,
        connectionId,
        data: coins.map((r: any) => {
          return {
            externalId: r.id,
            data: {
              id: r.id,
              symbol: r.symbol,
              name: r.name,
              lowerCaseName: lowerCase(r.name)
            },
            entityType: 'coins'
          }
        }),
        properties: [
          {
            name: 'id',
            displayName: 'Coin ID',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 0,
            modifiable: true
          },
          {
            name: 'symbol',
            displayName: 'Symbol',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 1,
            modifiable: true
          },
          {
            name: 'name',
            displayName: 'Name',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 2,
            modifiable: true
          }
        ],
        type: 'coins',
        lastSyncId: event?.id!
      })

      console.log('SYNCED COINS')

      return event
    }
  }
}

export function syncStocks() {
  return {
    id: 'sync-stock-list',
    event: 'SYNC_STOCK_LIST',
    executor: async ({ event }: any) => {
      const { mastra } = await import('./framework')
      const connectionId = event.user.connectionId
      const stocks = await getStockList()

      console.log('syncCoins', stocks, connectionId)

      await mastra.dataLayer?.syncData({
        name: mastra.config.name,
        connectionId,
        data: stocks.map(stock => {
          return {
            externalId: stock.symbol,
            data: {
              id: stock.symbol,
              symbol: stock.symbol,
              name: stock.name,
              assetType: stock.assetType,
              exchange: stock.exchange,
              ipoDate: stock.ipoDate,
              status: stock.status.split('\r')[0],
              lowerCaseName: stock.name.toLowerCase()
            },
            entityType: 'stocks'
          }
        }),
        properties: [
          {
            name: 'id',
            displayName: 'Stock ID',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 0,
            modifiable: true
          },
          {
            name: 'symbol',
            displayName: 'Symbol',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 1,
            modifiable: true
          },
          {
            name: 'name',
            displayName: 'Name',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 2,
            modifiable: true
          },
          {
            name: 'assetType',
            displayName: 'Asset Type',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 3,
            modifiable: true
          },
          {
            name: 'exchange',
            displayName: 'Exchange',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 4,
            modifiable: true
          },
          {
            name: 'ipoDate',
            displayName: 'Ipo Date',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 5,
            modifiable: true
          },
          {
            name: 'status',
            displayName: 'Status',
            type: PropertyType.SINGLE_LINE_TEXT,
            visible: true,
            order: 6,
            modifiable: true
          }
        ],
        type: 'stocks',
        lastSyncId: event?.id!
      })

      console.log('SYNCED STOCKS')

      return event
    }
  }
}

export async function getCoinList() {
  const coinListUrl = `https://api.coingecko.com/api/v3/coins/list`

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!
    }
  }

  const response = await fetch(coinListUrl, options)
  const data = await response.json()
  return data.map((coin: { id: string; symbol: string; name: string }) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name
  }))
}

export async function searchCoins({ keyword }: { keyword: string }) {
  const { mastra } = await import('./framework')
  console.log('searchCoins', keyword)

  const lowercaseKeyword = keyword.toLowerCase()
  let coins

  // Try to find an exact match first.
  coins = await mastra.dataLayer.db.record.findFirst({
    where: {
      entityType: 'coins',
      data: {
        path: ['lowerCaseName'],
        equals: lowercaseKeyword
      }
    }
  })

  // Fallback to a partial contains match.
  if (!coins) {
    coins = await mastra.dataLayer.db.record.findFirst({
      where: {
        entityType: 'coins',
        data: {
          path: ['lowerCaseName'],
          string_contains: lowercaseKeyword
        }
      }
    })
  }

  return coins
}

export async function getCoinPrice({ id }: { id: string }) {
  const coinListUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}`

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!
    }
  }

  const response = await fetch(coinListUrl, options)
  const data = await response.json()

  if (data.length === 0) {
    return null
  }

  return data[0]
}

export async function getCoinHistoricalPrices({
  id,
  days
}: {
  id: string
  days: number
}) {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&id=${id}`

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!
    }
  }

  const response = await fetch(url, options)
  const data = await response.json()

  return data.prices.map((price: number[]) => ({
    timestamp: price[0],
    price: price[1]
  }))
}

export async function searchStocks({ keyword }: { keyword: string }) {
  const { mastra } = await import('./framework')
  console.log('searchCoins', keyword)

  const lowercaseKeyword = keyword.toLowerCase()
  let stocks

  // Try to find an exact match first.
  stocks = await mastra.dataLayer.db.record.findFirst({
    where: {
      entityType: 'stocks',
      data: {
        path: ['lowerCaseName'],
        equals: lowercaseKeyword
      }
    }
  })

  // Fallback to a partial contains match.
  if (!stocks) {
    stocks = await mastra.dataLayer.db.record.findFirst({
      where: {
        entityType: 'stocks',
        data: {
          path: ['lowerCaseName'],
          string_contains: lowercaseKeyword
        }
      }
    })
  }

  return stocks
}

export async function getStockPrice({ symbol }: { symbol: string }) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  return data
}

export async function getStockList() {
  const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`

  const response = await fetch(url)

  // Parse CSV response
  const text = await response.text()

  const [headers, ...rows] = text.split('\n')

  const parsedListings = rows
    .filter(row => row.trim()) // Remove empty rows
    .map(row => {
      const [symbol, name, exchange, assetType, ipoDate, , status] =
        row.split(',')
      return { symbol, name, exchange, assetType, ipoDate, status }
    })

  return parsedListings
}
