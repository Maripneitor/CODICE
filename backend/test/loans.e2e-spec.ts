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
import { Loan } from '../src/modules/tools/entities/loan.entity';
import { User } from '../src/modules/auth/user.entity';
import { Role } from '../src/modules/auth/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';

describe('LoansController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenAdmin: string;
  let tokenManager: string;
  let toolRepo: Repository<Tool>;
  let categoryRepo: Repository<Category>;
  let typeRepo: Repository<ToolType>;
  let statusRepo: Repository<ToolStatus>;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let loanRepo: Repository<Loan>;

  let toolId1: string;
  let toolId2: string;
  let categoryId: number;
  let typeId: number;
  let createdLoanId: string;

  const adminId = '00000000-0000-0000-0000-000000000003';
  const managerId = '00000000-0000-0000-0000-000000000004';
  const techUserId = '00000000-0000-0000-0000-000000000005';

  const uniqueSuffix = Date.now();
  const categoryName = `Construccion_${uniqueSuffix}`;
  const toolTypeName = `Martillo_${uniqueSuffix}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(APP_GUARD)
    .useValue({ canActivate: () => true })
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
    loanRepo = app.get(getRepositoryToken(Loan));

    let adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await roleRepo.save(roleRepo.create({ name: 'ADMIN' }));
    }
    let managerRole = await roleRepo.findOne({ where: { name: 'WAREHOUSE_MANAGER' } });
    if (!managerRole) {
      managerRole = await roleRepo.save(roleRepo.create({ name: 'WAREHOUSE_MANAGER' }));
    }
    let techRole = await roleRepo.findOne({ where: { name: 'TECHNICIAN' } });
    if (!techRole) {
      techRole = await roleRepo.save(roleRepo.create({ name: 'TECHNICIAN' }));
    }

    await userRepo.save(userRepo.create({
      id: adminId,
      name: 'E2E Admin 2',
      email: `admin-loans-${uniqueSuffix}@codice.gob`,
      passwordHash: 'hashed',
      role: adminRole,
      status: 'ACTIVE'
    }));

    await userRepo.save(userRepo.create({
      id: managerId,
      name: 'E2E Manager 2',
      email: `manager-loans-${uniqueSuffix}@codice.gob`,
      passwordHash: 'hashed',
      role: managerRole,
      status: 'ACTIVE'
    }));

    await userRepo.save(userRepo.create({
      id: techUserId,
      name: 'E2E Technician 2',
      email: `tech-loans-${uniqueSuffix}@codice.gob`,
      passwordHash: 'hashed',
      role: techRole,
      status: 'ACTIVE'
    }));

    const jwtService = app.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: adminId, email: `admin-loans-${uniqueSuffix}@codice.gob`, role: 'ADMIN' });
    tokenManager = jwtService.sign({ sub: managerId, email: `manager-loans-${uniqueSuffix}@codice.gob`, role: 'WAREHOUSE_MANAGER' });
  });

  afterAll(async () => {
    try {
      if (createdLoanId) {
        await loanRepo.delete(createdLoanId);
      }
      if (toolId1) await toolRepo.delete(toolId1);
      if (toolId2) await toolRepo.delete(toolId2);
      if (typeId) await typeRepo.delete(typeId);
      if (categoryId) await categoryRepo.delete(categoryId);
      await userRepo.delete(adminId);
      await userRepo.delete(managerId);
      await userRepo.delete(techUserId);
    } catch (e) {}
    await app.close();
  });

  it('Setup test tools', async () => {
    // 1. Category and ToolType
    const catRes = await categoryRepo.save(categoryRepo.create({ name: categoryName }));
    categoryId = catRes.id;

    const typeRes = await typeRepo.save(typeRepo.create({ name: toolTypeName, categories: [catRes] }));
    typeId = typeRes.id;

    const statusDisponible = await statusRepo.findOne({ where: { name: 'DISPONIBLE' } });
    expect(statusDisponible).toBeDefined();

    // 2. Register tools
    const t1 = await toolRepo.save(toolRepo.create({
      name: 'Martillo DeWalt',
      serialNumber: `M-101-${uniqueSuffix}`,
      description: 'Martillo neumático pesado.',
      location: 'Pasillo B / Estante 1',
      status: statusDisponible!,
      type: typeRes,
    }));
    toolId1 = t1.id;

    const t2 = await toolRepo.save(toolRepo.create({
      name: 'Martillo Bosch',
      serialNumber: `M-102-${uniqueSuffix}`,
      description: 'Martillo ligero de demolición.',
      location: 'Pasillo B / Estante 2',
      status: statusDisponible!,
      type: typeRes,
    }));
    toolId2 = t2.id;
  });

  it('POST /api/tools/loans (Create loan successfully)', async () => {
    const payload = {
      toolIds: [toolId1, toolId2],
      requestingUserId: techUserId,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      applicantNotes: 'Préstamo para obra civil pasillo central',
      signature: 'base64SignatureHashString'
    };

    const res = await request(app.getHttpServer())
      .post('/api/tools/loans')
      .set('Authorization', `Bearer ${tokenManager}`)
      .send(payload)
      .expect(201);

    expect(res.body.loan).toHaveProperty('id');
    expect(res.body.loan.status).toBe('ACTIVE');
    createdLoanId = res.body.loan.id;

    // Verify tools status updated to PRESTADO
    const tool1 = await toolRepo.findOne({ where: { id: toolId1 }, relations: { status: true } });
    const tool2 = await toolRepo.findOne({ where: { id: toolId2 }, relations: { status: true } });
    expect(tool1!.status.name).toBe('PRESTADO');
    expect(tool2!.status.name).toBe('PRESTADO');
  });

  it('POST /api/tools/loans (Try to loan already loaned tool -> 400 Bad Request)', async () => {
    const payload = {
      toolIds: [toolId1],
      requestingUserId: techUserId,
    };

    await request(app.getHttpServer())
      .post('/api/tools/loans')
      .set('Authorization', `Bearer ${tokenManager}`)
      .send(payload)
      .expect(400);
  });

  it('POST /api/tools/loans (DueDate in past -> 400 Bad Request)', async () => {
    const payload = {
      toolIds: [toolId2],
      requestingUserId: techUserId,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    };

    await request(app.getHttpServer())
      .post('/api/tools/loans')
      .set('Authorization', `Bearer ${tokenManager}`)
      .send(payload)
      .expect(400);
  });

  it('POST /api/tools/loans/:id/return (Return with damaged condition -> MANTENIMIENTO)', async () => {
    const payload = {
      returnCondition: 'DAÑADO',
      signature: 'technicianSignatureOnReturn'
    };

    const res = await request(app.getHttpServer())
      .post(`/api/tools/loans/${createdLoanId}/return`)
      .set('Authorization', `Bearer ${tokenManager}`)
      .send(payload)
      .expect(200);

    expect(res.body.loan.status).toBe('RETURNED');
    expect(res.body.loan.returnActNumber).toMatch(/^ACT-\d{8}-\d{4}$/);

    // Verify tools status changed to MANTENIMIENTO because condition is DAÑADO
    const tool1 = await toolRepo.findOne({ where: { id: toolId1 }, relations: { status: true } });
    expect(tool1!.status.name).toBe('MANTENIMIENTO');
  });
});
