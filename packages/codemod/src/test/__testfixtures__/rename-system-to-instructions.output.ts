import { generateText, streamText, Agent } from 'ai';

declare const model: any;

await generateText({
  model,
  instructions: 'inline system',
  prompt: 'Hello',
});

const options = {
  model,
  instructions: 'variable system',
  prompt: 'Hello',
  onStart: ({ system }: any) => {
    console.log(system);
  },
};
await streamText(options);

const agent = new Agent({
  model,
  instructions: 'agent system',
});

const unrelated = { system: 'keep me' };
const { system } = unrelated;
console.log(unrelated.system, system);
