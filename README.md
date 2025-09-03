# When

A quick proof-of-concept sketch of a high-level DSL for writing Camunda 8 API behavioural tests. 

This moves boilerplate wiring of scenarios to a declarative format. 

Instead of: 

```typescript
test('Something that needs a running process instance', () => {
    const filename = './test-fixtures/basic-process.bpmn'
    const variables = { testVar: 'someValue' }
    const client = new Camunda8().getCamundaRestClient()
    const deploy = await client.deployResourcesFromFiles(['./test-fixtures/basic-process.bpmn'])
    const {processDefinitionId, processDefinitionVersion} = deploy.processes[0]
    const {processInstanceKey} = await client.createProcessInstance({
      processDefinitionId,
      processDefinitionVersion,
      variables
    })

    // Now do the test
})
```

Using this approach, the same test can be written like this: 

```typescript
test('Something that needs a running process instance', async () => {
  await when([processStarted('./test-fixtures/basic-process.bpmn', { testVar: 'someValue' })], (context, client) => {
    // test goes here
    // client is a CamundaRestClient
    // context has processDefinitionKey, processDefinitionId, processDefinitionVersion, and processInstanceKey
    console.log(context)
  })
})
```

The DSL in [when.ts](./when.ts) is a quick sketch, but it scaffolds the type system needed to provide a strongly typed context and client in `when` block.

There are a couple of demonstration tests in [test-demo.ts](./test-demo.ts). Open them in VSCode to see how the Intellisense works.

## Limitations of POC implementation

- Series execution of prerequisite operations only, no parallel execution
- Context is merged. With duplicate keys, last one wins (so if you want to deploy more than one process, etc, the prerequisite operation implementations would need to be made context-aware)