import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyRequest } from 'fastify';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { SpatialRepository } from '../spatial/spatial.repository';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'models');
const ALLOWED_EXTS: Record<string, 'ifc' | 'gltf' | 'xkt'> = {
  '.ifc': 'ifc',
  '.gltf': 'gltf',
  '.glb': 'gltf',
  '.xkt': 'xkt',
};

const RegisterModelSchema = z.object({
  model_url: z.string().url(),
  model_format: z.enum(['ifc', 'gltf', 'xkt']),
});

type RegisterModel = z.infer<typeof RegisterModelSchema>;

@Controller({ path: 'buildings', version: '1' })
export class BuildingsController {
  constructor(private readonly repo: SpatialRepository) {}

  @Get()
  listBuildings() {
    return this.repo.findAllBuildings();
  }

  @Get(':id')
  getBuilding(@Param('id') id: string) {
    return this.repo.findBuildingByIdOrThrow(id);
  }

  /**
   * POST /buildings/:id/model/upload
   *
   * Accepts a multipart file upload (.ifc / .gltf / .glb / .xkt),
   * saves it to disk, and registers the resulting URL on the building record.
   */
  @Post(':id/model/upload')
  async uploadModel(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.repo.findBuildingByIdOrThrow(id).catch(() => {
      throw new NotFoundException(`Building ${id} not found`);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(req as any).isMultipart?.()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await (req as any).file()) as
      | {
          filename: string;
          file: NodeJS.ReadableStream;
        }
      | undefined;

    if (!data) throw new BadRequestException('No file provided');

    const ext = extname(data.filename).toLowerCase();
    const format = ALLOWED_EXTS[ext];
    if (!format) {
      throw new BadRequestException(
        `Unsupported file type "${ext}". Allowed: .ifc, .gltf, .glb, .xkt`,
      );
    }

    mkdirSync(UPLOADS_DIR, { recursive: true });
    const savedName = `${randomUUID()}${ext}`;
    const dest = join(UPLOADS_DIR, savedName);

    await pipeline(data.file, createWriteStream(dest));

    const port = process.env['PORT'] ?? '3007';
    const model_url = `http://localhost:${port}/static/models/${savedName}`;

    return this.repo.updateBuildingModel(id, model_url, format);
  }

  /**
   * PUT /buildings/:id/model
   *
   * Registers a model by URL (e.g. from external object storage).
   */
  @Put(':id/model')
  updateModel(@Param('id') id: string, @ZodBody(RegisterModelSchema) dto: RegisterModel) {
    return this.repo.updateBuildingModel(id, dto.model_url, dto.model_format);
  }
}
