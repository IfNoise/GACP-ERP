import { type Tree, formatFiles, generateFiles, names, addProjectConfiguration } from '@nx/devkit';
import * as path from 'path';

interface MicroserviceGeneratorSchema {
  readonly name: string;
  readonly port?: number;
  readonly database?: boolean;
  readonly withAuditTrail?: boolean;
  readonly withObservability?: boolean;
  readonly complianceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly tags?: string;
}

export default async function generator(
  tree: Tree,
  options: MicroserviceGeneratorSchema,
): Promise<void> {
  const { fileName, className } = names(options.name);
  const projectRoot = `apps/${fileName}`;
  const port = options.port ?? 3001;
  const complianceLevel = options.complianceLevel ?? 'HIGH';

  const baseTags = ['type:app', 'runtime:nestjs', `compliance:${complianceLevel.toLowerCase()}`];
  const extraTags = options.tags ? options.tags.split(',').map((t) => t.trim()) : [];
  const allTags = [...baseTags, ...extraTags];

  addProjectConfiguration(tree, fileName, {
    root: projectRoot,
    projectType: 'application',
    sourceRoot: `${projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx/webpack:webpack',
        outputs: ['{options.outputPath}'],
        options: {
          target: 'node',
          compiler: 'tsc',
          outputPath: `dist/${projectRoot}`,
          main: `${projectRoot}/src/main.ts`,
          tsConfig: `${projectRoot}/tsconfig.app.json`,
          assets: [`${projectRoot}/src/assets`],
        },
        configurations: {
          production: {
            optimization: true,
            extractLicenses: true,
            inspect: false,
          },
        },
      },
      serve: {
        executor: '@nx/js:node',
        options: {
          buildTarget: `${fileName}:build`,
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
        },
      },
      test: {
        executor: '@nx/jest:jest',
        outputs: [`{workspaceRoot}/coverage/${projectRoot}`],
        options: {
          jestConfig: `${projectRoot}/jest.config.ts`,
          passWithNoTests: true,
        },
      },
    },
    tags: allTags,
  });

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name: options.name,
    fileName,
    className,
    port,
    database: options.database !== false,
    withAuditTrail: options.withAuditTrail !== false,
    withObservability: options.withObservability !== false,
    complianceLevel,
    tmpl: '',
  });

  await formatFiles(tree);
}
