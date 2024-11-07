"use server"

import { mastra } from "../../mastra"

export async function generateOpenApiSpec({ url }: { url: string }) {
  const { workflowEvent } = await mastra.triggerEvent({
    key: "WRITE_SPEC",
    data: {
      integration_name: "BrowserBase",
      url,
    },
    integrationName: mastra.config.name,
    user: {
      connectionId: "SYSTEM",
    },
  })

  const eventResponse = await workflowEvent.subscribe()

  const ctx = eventResponse.output?.data?.[0]?.fullCtx

  console.log("er", JSON.stringify(eventResponse, null, 2))
  console.log("ctx", ctx)

  const run: any = Object.values(ctx ?? {})?.find(
    (run: any) => run?.workflowStepOrder! === 1
  )

  const openApiSpec = run?.mergedSpec

  if (!openApiSpec) {
    return { message: "failed", data: "No Open API Spec generated" }
  }

  console.log({
    run,
  })

  return { message: "successful", data: openApiSpec }
}

export async function makeMastraPR({
  crawledUrl,
  yaml,
}: {
  yaml: string
  crawledUrl: string
}) {
  const { workflowEvent } = await mastra.triggerEvent({
    key: "WRITE_SPEC",
    data: {
      integrationName: "BrowserBase",
      url: crawledUrl,
      yaml,
    },
    integrationName: mastra.config.name,
    user: {
      connectionId: "SYSTEM",
    },
  })

  const eventResponse = await workflowEvent.subscribe()
}
