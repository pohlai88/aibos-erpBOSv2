module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      comment: 'This is an orphan module - it\'s likely not used (anymore?). Either use it or remove it. If it\'s logical this module is an orphan (i.e. it\'s a config file), add an exception for it in your dependency-cruiser configuration.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)(node_modules|test|spec|__tests__|tests|__mocks__|mocks|coverage|docs|doc|documentation|build|dist|lib|bin|scripts|tools|config|\.config|\.github|\.vscode|\.idea|\.cursor)/',
          '\\.d\\.ts$',
          // Intentional orphans - placeholder modules for future development
          '^packages/auth/index\\.ts$',
          '^apps/main/index\\.ts$'
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      comment: 'A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn\'t deprecate lightly.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: [
          'core'
        ],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      }
    },
    {
      name: 'not-to-deprecated',
      comment: 'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: [
          'deprecated'
        ]
      }
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment: 'This module depends on an npm package that isn\'t in the \'dependencies\' section of your package.json. That\'s problematic as the package either (1) won\'t be available on live (2) will be available but only because some other dependency brought it in - which is fragile (3) will be available but not necessarily the version you expect.',
      from: {},
      to: {
        dependencyTypes: [
          'npm-no-pkg',
          'npm-unknown'
        ]
      }
    },
    {
      name: 'no-unresolved',
      severity: 'error',
      comment: 'This module depends on a module that cannot be found (\'resolved to absolute path\'). Either (1) it\'s not installed, (2) it\'s not in the dependencies section of your package.json, (3) it\'s not in the dependencies section of the package.json of the package that contains it, or (4) it\'s not in the dependencies section of the package.json of the package that contains it.',
      from: {},
      to: {
        couldNotResolve: true
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    includeOnly: '^packages|^apps|^libs',
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: '^(packages|libs|apps|test|spec|__tests__|tests|__mocks__|mocks|coverage|docs|doc|documentation|build|dist|lib|bin|scripts|tools|config|\.config|\.github|\.vscode|\.idea|\.cursor)/[^/]+'
      }
    }
  }
};
