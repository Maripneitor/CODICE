import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { Tool } from '../src/modules/tools/entities/tool.entity';
import { ToolType } from '../src/modules/tools/entities/tool-type.entity';
import { Category } from '../src/modules/tools/entities/category.entity';
import { ToolStatus } from '../src/modules/tools/entities/tool-status.entity';
import { User } from '../src/modules/auth/user.entity';
import { Role } from '../src/modules/auth/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';

describe('ToolsController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenAdmin: string;
  let tokenTech: string;
  let toolRepo: Repository<Tool>;
  let categoryRepo: Repository<Category>;
  let typeRepo: Repository<ToolType>;
  let statusRepo: Repository<ToolStatus>;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;

  let createdToolId: string;
  let categoryId: number;
  let typeId: number;

  const adminId = '00000000-0000-0000-0000-000000000001';
  const techId = '00000000-0000-0000-0000-000000000002';

  const uniqueSuffix = Date.now();
  const categoryName = `Seguridad_${uniqueSuffix}`;
  const toolTypeName = `Taladradora_${uniqueSuffix}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(APP_GUARD)
    .useValue({ canActivate: () => true }) // Bypass throttlers in E2E tests
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();

    toolRepo = app.get(getRepositoryToken(Tool));
    categoryRepo = app.get(getRepositoryToken(Category));
    typeRepo = app.get(getRepositoryToken(ToolType));
    statusRepo = app.get(getRepositoryToken(ToolStatus));
    userRepo = app.get(getRepositoryToken(User));
    roleRepo = app.get(getRepositoryToken(Role));

    let adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await roleRepo.save(roleRepo.create({ name: 'ADMIN' }));
    }
    let techRole = await roleRepo.findOne({ where: { name: 'TECHNICIAN' } });
    if (!techRole) {
      techRole = await roleRepo.save(roleRepo.create({ name: 'TECHNICIAN' }));
    }

    await userRepo.save(userRepo.create({
      id: adminId,
      name: 'E2E Admin',
      email: `admin-tools-${uniqueSuffix}@codice.gob`,
      passwordHash: 'hashed',
      role: adminRole,
      status: 'ACTIVE'
    }));

    await userRepo.save(userRepo.create({
      id: techId,
      name: 'E2E Technician',
      email: `tech-tools-${uniqueSuffix}@codice.gob`,
      passwordHash: 'hashed',
      role: techRole,
      status: 'ACTIVE'
    }));

    const jwtService = app.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: adminId, email: `admin-tools-${uniqueSuffix}@codice.gob`, role: 'ADMIN' });
    tokenTech = jwtService.sign({ sub: techId, email: `tech-tools-${uniqueSuffix}@codice.gob`, role: 'TECHNICIAN' });
  });

  afterAll(async () => {
    try {
      if (createdToolId) {
        await toolRepo.delete(createdToolId);
      }
      if (typeId) {
        await typeRepo.delete(typeId);
      }
      if (categoryId) {
        await categoryRepo.delete(categoryId);
      }
      await userRepo.delete(adminId);
      await userRepo.delete(techId);
    } catch (e) {}
    await app.close();
  });

  it('Category and ToolType creation', async () => {
    const catRes = await request(app.getHttpServer())
      .post('/api/tools/categories')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: categoryName })
      .expect(201);
    
    categoryId = catRes.body.category.id;
    expect(categoryId).toBeDefined();

    const typeRes = await request(app.getHttpServer())
      .post('/api/tools/types')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: toolTypeName, categoryIds: [categoryId] })
      .expect(201);

    typeId = typeRes.body.toolType.id;
    expect(typeId).toBeDefined();
  });

  it('POST /api/tools (Create with sanitization and code generation)', async () => {
    const payload = {
      name: 'Taladro Percutor DeWalt',
      description: '<script>alert(XSS)</script>Taladro industrial de alta gama.',
      serialNumber: `DW-9821-X-${uniqueSuffix}`,
      location: 'Pasillo A / Estante 3',
      typeId,
    };

    const res = await request(app.getHttpServer())
      .post('/api/tools')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(payload)
      .expect(201);

    expect(res.body.tool).toHaveProperty('id');
    expect(res.body.tool.code).toMatch(/^HERR-\d{4}-\d{5}$/);
    expect(res.body.tool.description).toBe('Taladro industrial de alta gama.');
    createdToolId = res.body.tool.id;
  });

  it('PATCH /api/tools/:id/status (Transition constraints)', async () => {
    const maintenanceStatus = await statusRepo.findOne({ where: { name: 'MANTENIMIENTO' } });
    const borrowedStatus = await statusRepo.findOne({ where: { name: 'PRESTADO' } });
    const bajaStatus = await statusRepo.findOne({ where: { name: 'BAJA' } });

    expect(maintenanceStatus).toBeDefined();
    expect(borrowedStatus).toBeDefined();
    expect(bajaStatus).toBeDefined();

    const tool = await toolRepo.findOneBy({ id: createdToolId });
    const currentVersion = tool!.version;

    await request(app.getHttpServer())
      .patch(`/api/tools/${createdToolId}/status`)
      .set('Authorization', `Bearer ${tokenTech}`)
      .send({ statusId: maintenanceStatus!.id, version: currentVersion, reason: 'Mantenimiento anual' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/tools/${createdToolId}/status`)
      .set('Authorization', `Bearer ${tokenTech}`)
      .send({ statusId: borrowedStatus!.id, version: currentVersion + 1, reason: 'Intento de prestado' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/tools/${createdToolId}/status`)
      .set('Authorization', `Bearer ${tokenTech}`)
      .send({ statusId: bajaStatus!.id, version: currentVersion + 1, reason: 'Baja del equipo' })
      .expect(401);

    await request(app.getHttpServer())
      .patch(`/api/tools/${createdToolId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ statusId: bajaStatus!.id, version: currentVersion + 1, reason: 'Baja autorizada por Admin' })
      .expect(200);
  });

  it('Dictionary deletion constraints', async () => {
    await request(app.getHttpServer())
      .delete(`/api/tools/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/tools/types/${typeId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);
  });

  it('Optimistic locking concurrency check', async () => {
    const tool = await toolRepo.findOneBy({ id: createdToolId });
    expect(tool).toBeDefined();
    const currentVersion = tool!.version;

    const maintenanceStatus = await statusRepo.findOne({ where: { name: 'MANTENIMIENTO' } });

    await request(app.getHttpServer())
      .patch(`/api/tools/${createdToolId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ statusId: maintenanceStatus!.id, version: currentVersion - 1, reason: 'Outdated version' })
      .expect(409);
  });
});
