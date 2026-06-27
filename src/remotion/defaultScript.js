export const defaultScript = {
  hook: 'Ship faster with automated PR videos',
  slides: [
    {
      id: 's1',
      tag: 'Update',
      headline: 'Turn PRs into shareable clips',
      body: 'Paste a repo URL and preview a Remotion-powered video in seconds.',
    },
    {
      id: 's2',
      tag: 'Detail',
      headline: 'No external AI calls',
      body: 'Scripts are built locally from PR metadata — ready for Remotion render.',
    },
  ],
  caption: 'Preview your next release video before you merge.',
  hashtags: ['opensource', 'devtools', 'remotion'],
  tone: 'informational',
  confidence: 0.8,
  skip_reason: null,
  pr: { repo: 'owner/repo', number: 42 },
}
