/**
 * Figma Routes Tests
 * Unit tests for Figma design link storage endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import figmaRouter from '../routes/figma.js';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/figma', figmaRouter);

describe('Figma Routes', () => {
  describe('POST /api/figma/links', () => {
    it('should create a new Figma link with valid URL', async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName',
          title: 'Test Design',
          chainId: 'chain-123',
          sessionId: 'session-456',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.link).toBeDefined();
      expect(response.body.link.fileKey).toBe('ABC123');
      expect(response.body.link.title).toBe('Test Design');
      expect(response.body.link.chainId).toBe('chain-123');
      expect(response.body.link.sessionId).toBe('session-456');
      expect(response.body.link.id).toBeDefined();
      expect(response.body.link.createdAt).toBeDefined();
    });

    it('should extract nodeId from Figma URL with node-id param', async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName?node-id=1-2',
          title: 'Test Design with Node',
        })
        .expect(201);

      expect(response.body.link.fileKey).toBe('ABC123');
      expect(response.body.link.nodeId).toBe('1-2');
    });

    it('should reject missing url field', async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          title: 'Test Design',
        })
        .expect(400);

      expect(response.body.error).toContain('url');
    });

    it('should reject missing title field', async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName',
        })
        .expect(400);

      expect(response.body.error).toContain('title');
    });

    it('should reject invalid Figma URL format', async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://invalid-url.com',
          title: 'Test Design',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid Figma URL');
    });
  });

  describe('GET /api/figma/links', () => {
    let linkId: string;

    beforeEach(async () => {
      // Create a test link
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName',
          title: 'Test Design',
          chainId: 'chain-123',
          sessionId: 'session-456',
        });
      linkId = response.body.link.id;
    });

    it('should list all Figma links', async () => {
      const response = await request(app)
        .get('/api/figma/links')
        .expect(200);

      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.links).toBeInstanceOf(Array);
      expect(response.body.links[0]).toHaveProperty('id');
      expect(response.body.links[0]).toHaveProperty('fileKey');
      expect(response.body.links[0]).toHaveProperty('title');
    });

    it('should filter links by chainId', async () => {
      const response = await request(app)
        .get('/api/figma/links?chainId=chain-123')
        .expect(200);

      expect(response.body.links.every((link: any) => link.chainId === 'chain-123')).toBe(true);
    });

    it('should filter links by sessionId', async () => {
      const response = await request(app)
        .get('/api/figma/links?sessionId=session-456')
        .expect(200);

      expect(response.body.links.every((link: any) => link.sessionId === 'session-456')).toBe(true);
    });
  });

  describe('GET /api/figma/links/:id', () => {
    let linkId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName',
          title: 'Test Design',
        });
      linkId = response.body.link.id;
    });

    it('should get a specific link by ID', async () => {
      const response = await request(app)
        .get(`/api/figma/links/${linkId}`)
        .expect(200);

      expect(response.body.link.id).toBe(linkId);
      expect(response.body.link.title).toBe('Test Design');
    });

    it('should return 404 for non-existent link', async () => {
      const response = await request(app)
        .get('/api/figma/links/non-existent-id')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/figma/links/:id', () => {
    let linkId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/figma/links')
        .send({
          url: 'https://www.figma.com/file/ABC123/DesignName',
          title: 'Test Design',
        });
      linkId = response.body.link.id;
    });

    it('should delete a link by ID', async () => {
      const response = await request(app)
        .delete(`/api/figma/links/${linkId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(true);

      // Verify link is deleted
      await request(app)
        .get(`/api/figma/links/${linkId}`)
        .expect(404);
    });

    it('should return 404 for non-existent link', async () => {
      const response = await request(app)
        .delete('/api/figma/links/non-existent-id')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });
});
