// A project that does not import from the AI SDK. None of these `system` keys
// are AI SDK options, so the codemod must leave the file untouched (see #25434).
const list = {
  fields: {
    system: { type: 'text' },
  },
};

const metadata = { system: 'core' };
const labels = { system: 'System' };

const { system } = metadata;
console.log(list.fields.system, metadata.system, system);
