declare const test: any

import { processDeployed, when, processStarted } from './when'

test('Something that needs a deployed process model to exist', async () => {
  const filename = './test-fixtures/basic-process.bpmn'

  await when([processDeployed(filename)], async (context, client) => {
    // test goes here
    // context has processDefinitionKey, processDefinitionId, processDefinitionVersion
    console.log(context)
  })
})

test('Something that needs a running process instance', async () => {
  const filename = './test-fixtures/basic-process.bpmn'
  const variables = { testVar: 'someValue' }

  await when([processStarted(filename, variables)], (context, client) => {
    // test goes here
    // context has processDefinitionKey, processDefinitionId, processDefinitionVersion, and processInstanceKey
    console.log(context)
  })
})
