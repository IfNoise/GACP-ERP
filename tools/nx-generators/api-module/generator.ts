import { type Tree, formatFiles, generateFiles, names } from '@nx/devkit';
import * as path from 'path';

interface ApiModuleGeneratorSchema {
  readonly name: string;
  readonly app: string;
  readonly withCrud?: boolean;
  readonly authRequired?: boolean;
  readonly auditLevel?: 'FULL' | 'MINIMAL' | 'NONE';
}

export default async function generator(
  tree: Tree,
  options: ApiModuleGeneratorSchema,
): Promise<void> {
  const { fileName, className, propertyName } = names(options.name);
  const { fileName: appFileName } = names(options.app);
  const moduleRoot = `apps/${appFileName}/src/${fileName}`;

  generateFiles(tree, path.join(__dirname, 'files'), moduleRoot, {
    name: options.name,
    fileName,
    className,
    propertyName,
    withCrud: options.withCrud !== false,
    authRequired: options.authRequired !== false,
    auditLevel: options.auditLevel ?? 'FULL',
    tmpl: '',
  });

  await formatFiles(tree);
}
