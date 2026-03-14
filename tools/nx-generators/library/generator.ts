import {
  type Tree,
  formatFiles,
  generateFiles,
  names,
  addProjectConfiguration,
  updateJson,
  offsetFromRoot,
} from '@nx/devkit';
import * as path from 'path';

interface LibraryGeneratorSchema {
  readonly name: string;
  readonly directory?: string;
  readonly type: 'data-access' | 'ui' | 'business-logic' | 'utility';
  readonly tags?: string;
  readonly withTests?: boolean;
}

export default async function generator(
  tree: Tree,
  options: LibraryGeneratorSchema,
): Promise<void> {
  const { fileName, className, propertyName } = names(options.name);
  const projectDirectory = options.directory
    ? `libs/${options.directory}/${fileName}`
    : `libs/${fileName}`;
  const projectRoot = projectDirectory;
  const libName = options.directory
    ? `@gacp-erp/${options.directory}-${fileName}`
    : `@gacp-erp/${fileName}`;

  // Compose default tags
  const baseTags = [`type:${options.type}`, `scope:shared`];
  const extraTags = options.tags ? options.tags.split(',').map((t) => t.trim()) : [];
  const allTags = [...baseTags, ...extraTags];

  // Register project in NX graph
  addProjectConfiguration(tree, libName.replace('@gacp-erp/', 'gacp-erp-'), {
    root: projectRoot,
    projectType: 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/${projectRoot}`,
          tsConfig: `${projectRoot}/tsconfig.lib.json`,
          packageJson: `${projectRoot}/package.json`,
          main: `${projectRoot}/src/index.ts`,
          assets: [`${projectRoot}/*.md`],
        },
      },
      typecheck: {
        executor: 'nx:run-commands',
        options: {
          command: `tsc --project ${projectRoot}/tsconfig.json --noEmit`,
        },
      },
      lint: {
        executor: '@nx/eslint:lint',
        outputs: ['{options.outputFile}'],
        options: {
          lintFilePatterns: [`${projectRoot}/**/*.ts`],
          eslintConfig: `${projectRoot}/.eslintrc.json`,
        },
      },
      ...(options.withTests !== false
        ? {
            test: {
              executor: '@nx/jest:jest',
              outputs: [`{workspaceRoot}/coverage/${projectRoot}`],
              options: {
                jestConfig: `${projectRoot}/jest.config.ts`,
                passWithNoTests: true,
              },
            },
          }
        : {}),
    },
    tags: allTags,
  });

  // Generate files from templates
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name: options.name,
    fileName,
    className,
    propertyName,
    libName,
    type: options.type,
    offsetFromRoot: offsetFromRoot(projectRoot),
    withTests: options.withTests !== false,
    tmpl: '',
  });

  // Update tsconfig.base.json paths
  updateJson(tree, 'tsconfig.base.json', (json: Record<string, unknown>) => {
    const compilerOptions = json['compilerOptions'] as Record<string, unknown>;
    const paths = (compilerOptions['paths'] ?? {}) as Record<string, string[]>;
    paths[libName] = [`${projectRoot}/src/index.ts`];
    paths[`${libName}/*`] = [`${projectRoot}/src/*`];
    compilerOptions['paths'] = paths;
    return json;
  });

  await formatFiles(tree);
}
