module.exports = {
  configPath: './.lhcirc.json',
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: [
      'accessibility',
      'best-practices',
      'performance',
      'seo'
    ],
    skipAudits: [
      'charset',
      'unsized-images'
    ]
  },
  // Custom budget thresholds
  budgets: [
    {
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 500 * 1024 // 500KB for initial bundle
        },
        {
          resourceType: 'total',
          budget: 2048 * 1024 // 2MB total budget
        }
      ]
    }
  ]
}
