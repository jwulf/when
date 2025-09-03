import { Camunda8, CamundaRestClient } from '@camunda8/sdk'

/**
 * Optional configuration for the when() orchestration.
 * Provide an existing CamundaRestClient (or Camunda JS SDK) to reuse connections, otherwise a new Camunda8 instance is created.
 */
export interface WhenOptions {
  client?: CamundaRestClient
  sdk?: Camunda8
}

export async function when<T extends readonly PrerequisiteOperation<any>[]>(
  prerequisites: [...T],
  test: (context: MergeTuple<T>, client: CamundaRestClient) => void | Promise<void>,
  options: WhenOptions = {}
): Promise<void> {

  const client = options.client ?? options.sdk?.getCamundaRestClient() ?? new Camunda8().getCamundaRestClient() // Zero-conf constructor for matrix runs. All config via env vars.
  let context = {} as MergeTuple<T>
  for (const prereq of prerequisites) {
    context = { ...context, ...(await prereq(client)) }
  }
  await test(context, client)
}

/**
* Deploys a process model from a file, given the filename
*/
export function processDeployed(filename: string): PrerequisiteOperation<{
  processDefinitionKey: string
  processDefinitionId: string
  processDefinitionVersion: number
}> {
  return async (client) => {
    const deployRes = await client.deployResourcesFromFiles([filename])
    const process = deployRes.processes[0]
    
    if (!process) throw new Error('Deployment failed')
    const { processDefinitionKey, processDefinitionId, processDefinitionVersion } = process
    return { processDefinitionKey, processDefinitionId, processDefinitionVersion }
  }
}

/**
 * Starts an instance of a process with the given variables
*/
export function processStarted(filename: string, variables = {}): PrerequisiteOperation<{
  processInstanceKey: string
  processDefinitionKey: string
  processDefinitionId: string
  processDefinitionVersion: number
}> {
  return async (client) => {
    // Reuse the deployment result within same client lifecycle
    const deploy = await processDeployed(filename)(client)
    const { processDefinitionId, processDefinitionVersion } = deploy
    const res = await client.createProcessInstance({
      processDefinitionId,
      processDefinitionVersion,
      variables
    })
    return { processInstanceKey: String(res.processInstanceKey), ...deploy }
  }
}

type PrerequisiteOperation<R extends Record<string, any> = Record<string, any>> = (client: CamundaRestClient) => Promise<R>

type ContextFromOp<O> = O extends PrerequisiteOperation<infer R> ? R : {}

type MergeTuple<T extends readonly any[], Acc = {}> = T extends readonly [infer H, ...infer Rest]
  ? MergeTuple<Rest, Acc & ContextFromOp<H>>
  : Acc