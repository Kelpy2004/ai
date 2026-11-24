import { generateText, streamText, Agent } from 'ai';

declare const model: any;

await generateText({
  model,
  system: 'inline system',
  prompt: 'Hello',
});

const options = {
  model,
  system: 'variable system',
  prompt: 'Hello',
  onStart: ({ system }: any) => {
    console.log(system);
  },
};
await streamText(options);

const agent = new Agent({
  model,
  system: 'agent system',
});

const unrelated = { system: 'keep me' };
const { system } = unrelated;
console.log(unrelated.system, system);
