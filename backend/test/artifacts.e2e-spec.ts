import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

describe('ArtifactController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let createdArtifactId: string;
  const testCode = `E2E-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();

    // Generate valid admin token for requests
    const jwtService = app.get(JwtService);
    token = jwtService.sign({ 
      sub: 'e2e-test-user-id', 
      email: 'admin@codice.gob', 
      role: 'admin' 
    });
  });

  it('POST /api/artifacts (Create)', async () => {
    const payload = {
      code: testCode,
      name: 'Vaso ceremonial Chimu',
      description: 'Vaso de oro repujado con incrustaciones de turquesa.',
      location: 'Boveda C, Estante 2',
      status: 'Catálogo Activo',
      material: 'Gold',
      epoch: 'Periodo Intermedio Tardio',
      dimensions: '20x10x10 cm',
      weight: '0.85 kg',
    };

    const res = await request(app.getHttpServer())
      .post('/api/artifacts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-client-origin', 'E2E Testing')
      .send(payload)
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.code).toBe(payload.code);
    expect(res.body.data.name).toBe(payload.name);
    createdArtifactId = res.body.data.id;
  });

  it('GET /api/artifacts/:id (Read)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/artifacts/${createdArtifactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.id).toBe(createdArtifactId);
    expect(res.body.data.code).toBe(testCode);
    expect(res.body.data.material).toBe('Gold');
  });

  it('PATCH /api/artifacts/:id (Update)', async () => {
    const updatePayload = {
      location: 'Taller de Conservacion A',
      status: 'En Restauración',
      name: 'Vaso ceremonial Chimu Restaurado',
    };

    const res = await request(app.getHttpServer())
      .patch(`/api/artifacts/${createdArtifactId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-client-origin', 'E2E Testing')
      .send(updatePayload)
      .expect(200);

    expect(res.body.data.location).toBe(updatePayload.location);
    expect(res.body.data.status).toBe(updatePayload.status);
    expect(res.body.data.name).toBe(updatePayload.name);
  });

  it('DELETE /api/artifacts/:id (Delete)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/artifacts/${createdArtifactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('GET /api/artifacts/:id (Verify deletion resolves to 404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/artifacts/${createdArtifactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
