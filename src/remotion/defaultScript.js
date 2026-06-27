export const defaultScript = {
  hook: 'Add dark mode to dashboard',
  componentSources: [
    { filename: 'src/components/Dashboard.tsx', status: 'modified' },
  ],
  componentCount: 1,
  changedFiles: [],
  uiFileCount: 1,
  slides: [
    {
      id: 'hero',
      tag: 'Release',
      headline: 'Add dark mode to dashboard',
      body: 'PR #42 by @dev · owner/repo',
      visual: { type: 'hero' },
    },
    {
      id: 'component-0',
      tag: 'Updated component',
      headline: 'Dashboard.tsx',
      body: 'src/components/Dashboard.tsx · +24 / -8 lines',
      visual: {
        type: 'component-preview',
        filename: 'src/components/Dashboard.tsx',
        canPreview: true,
        previewCode:
          'function Dashboard() {\n  return <Card title="Dashboard"><Badge>Dark mode</Badge></Card>;\n}\nrender(<Dashboard />);',
        highlightLines: [],
        status: 'modified',
      },
    },
  ],
  caption: 'Dark mode components from the PR.',
  hashtags: ['opensource', 'owner', 'devtools'],
  tone: 'celebratory',
  confidence: 0.88,
  skip_reason: null,
  pr: { repo: 'owner/repo', number: 42 },
}
