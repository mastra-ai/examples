import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import Chart from './chart'
import { parseCryptoStructuredOutput } from '@/lib/utils'

export interface ChatList {
  assistantName: string
  messages: UIState
  session?: Session
  isShared: boolean
}

export function ChatList({
  assistantName,
  messages,
  session,
  isShared
}: ChatList) {
  if (!messages.length) {
    return null
  }
  const isStockAssistant = assistantName === 'Stock/Crypto Analyst'
  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {!isShared && !session ? (
        <>
          <div className="group relative mb-4 flex items-start md:-ml-12">
            <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border shadow-sm">
              <ExclamationTriangleIcon />
            </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              <p className="text-muted-foreground leading-normal">
                Please{' '}
                <Link href="/login" className="underline">
                  log in
                </Link>{' '}
                or{' '}
                <Link href="/signup" className="underline">
                  sign up
                </Link>{' '}
                to save and revisit your chat history!
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </>
      ) : null}

      {messages.map((message, index) => {
        let display = message.display as string
        let data: { timestamp: number; price: number }[] = []

        if (isStockAssistant) {
          const { display: displayMessage, transformedData } =
            parseCryptoStructuredOutput({
              message: message.display as string
            })

          display = displayMessage
          data = transformedData
        }

        return (
          <div key={message.id}>
            {display}
            {data.length > 0 && <Chart data={data} />}
            {index < messages.length - 1 && <Separator className="my-4" />}
          </div>
        )
      })}
    </div>
  )
}
