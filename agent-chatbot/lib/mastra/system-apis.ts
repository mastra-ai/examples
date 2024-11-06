import { orderBy } from 'lodash'
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
  // return data.map((coin: { id: string; symbol: string; name: string }) => ({
  //   id: coin.id,
  //   symbol: coin.symbol,
  //   name: coin.name
  // })).slice(0, 100)

  return [
    {
      id: 'aann-ai',
      symbol: 'an',
      name: 'AANN.ai'
    },
    {
      id: 'aardvark-2',
      symbol: 'vark',
      name: 'Aardvark'
    },
    {
      id: 'aark-digital',
      symbol: 'aark',
      name: 'Aark Digital'
    },
    {
      id: 'aarma',
      symbol: 'arma',
      name: 'Aarma [OLD]'
    },
    {
      id: 'aarma-2',
      symbol: 'arma',
      name: 'Aarma'
    },
    {
      id: 'aastoken',
      symbol: 'aast',
      name: 'AASToken'
    },
    {
      id: 'aave',
      symbol: 'aave',
      name: 'Aave'
    },
    {
      id: 'aave-aave',
      symbol: 'aaave',
      name: 'Aave AAVE'
    },
    {
      id: 'aave-amm-bptbalweth',
      symbol: 'aammbptbalweth',
      name: 'Aave AMM BptBALWETH'
    },
    {
      id: 'aave-amm-bptwbtcweth',
      symbol: 'aammbptwbtcweth',
      name: 'Aave AMM BptWBTCWETH'
    },
    {
      id: 'aave-amm-dai',
      symbol: 'aammdai',
      name: 'Aave AMM DAI'
    },
    {
      id: 'aave-amm-uniaaveweth',
      symbol: 'aammuniaaveweth',
      name: 'Aave AMM UniAAVEWETH'
    },
    {
      id: 'aave-amm-unibatweth',
      symbol: 'aammunibatweth',
      name: 'Aave AMM UniBATWETH'
    },
    {
      id: 'aave-amm-unicrvweth',
      symbol: 'aammunicrvweth',
      name: 'Aave AMM UniCRVWETH'
    },
    {
      id: 'aave-amm-unidaiusdc',
      symbol: 'aammunidaiusdc',
      name: 'Aave AMM UniDAIUSDC'
    },
    {
      id: 'aave-amm-unidaiweth',
      symbol: 'aammunidaiweth',
      name: 'Aave AMM UniDAIWETH'
    },
    {
      id: 'aave-amm-unilinkweth',
      symbol: 'aammunilinkweth',
      name: 'Aave AMM UniLINKWETH'
    },
    {
      id: 'aave-amm-unimkrweth',
      symbol: 'aammunimkrweth',
      name: 'Aave AMM UniMKRWETH'
    },
    {
      id: 'aave-amm-unirenweth',
      symbol: 'aammunirenweth',
      name: 'Aave AMM UniRENWETH'
    },
    {
      id: 'aave-amm-unisnxweth',
      symbol: 'aammunisnxweth',
      name: 'Aave AMM UniSNXWETH'
    },
    {
      id: 'aave-amm-uniuniweth',
      symbol: 'aammuniuniweth',
      name: 'Aave AMM UniUNIWETH'
    },
    {
      id: 'aave-amm-uniusdcweth',
      symbol: 'aammuniusdcweth',
      name: 'Aave AMM UniUSDCWETH'
    },
    {
      id: 'aave-amm-uniwbtcusdc',
      symbol: 'aammuniwbtcusdc',
      name: 'Aave AMM UniWBTCUSDC'
    },
    {
      id: 'aave-amm-uniwbtcweth',
      symbol: 'aammuniwbtcweth',
      name: 'Aave AMM UniWBTCWETH'
    },
    {
      id: 'aave-amm-uniyfiweth',
      symbol: 'aammuniyfiweth',
      name: 'Aave AMM UniYFIWETH'
    },
    {
      id: 'aave-amm-usdc',
      symbol: 'aammusdc',
      name: 'Aave AMM USDC'
    },
    {
      id: 'aave-amm-usdt',
      symbol: 'aammusdt',
      name: 'Aave AMM USDT'
    },
    {
      id: 'aave-amm-wbtc',
      symbol: 'aammwbtc',
      name: 'Aave AMM WBTC'
    },
    {
      id: 'aave-amm-weth',
      symbol: 'aammweth',
      name: 'Aave AMM WETH'
    },
    {
      id: 'aave-bal',
      symbol: 'abal',
      name: 'Aave BAL'
    },
    {
      id: 'aave-balancer-pool-token',
      symbol: 'abpt',
      name: 'Aave Balancer Pool Token'
    },
    {
      id: 'aave-bat',
      symbol: 'abat',
      name: 'Aave BAT'
    },
    {
      id: 'aave-bat-v1',
      symbol: 'abat',
      name: 'Aave BAT v1'
    },
    {
      id: 'aave-busd',
      symbol: 'abusd',
      name: 'Aave BUSD'
    },
    {
      id: 'aave-busd-v1',
      symbol: 'abusd',
      name: 'Aave BUSD v1'
    },
    {
      id: 'aave-crv',
      symbol: 'acrv',
      name: 'Aave CRV'
    },
    {
      id: 'aave-dai',
      symbol: 'adai',
      name: 'Aave DAI'
    },
    {
      id: 'aave-dai-v1',
      symbol: 'adai',
      name: 'Aave DAI v1'
    }
  ]
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
