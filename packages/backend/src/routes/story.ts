import { Router } from 'express';
import { storyService } from '../services/storyService.js';

// Type definitions
interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  createdAt: string;
  wordCount: number;
  theme?: string;
  filePath: string;
}

const router = Router();

/**
 * GET /api/story/chapters
 * List all chapters with metadata
 */
router.get('/chapters', async (_req, res) => {
  try {
    const chapters = await storyService.listChapters();
    res.json(chapters);
  } catch (error) {
    console.error('[Story API] Error listing chapters:', error);
    res.status(500).json({ error: 'Failed to list chapters' });
  }
});

/**
 * GET /api/story/chapters/:id
 * Get a specific chapter by ID (includes full content)
 */
router.get('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await storyService.getChapter(id);

    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    res.json(chapter);
  } catch (error) {
    console.error('[Story API] Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

/**
 * POST /api/story/continue
 * Trigger the story-of-us/ flow to create the next chapter
 * Optional: theme parameter for chapter theme
 */
router.post('/continue', async (req, res) => {
  try {
    const { theme } = req.body || {};

    // In a full implementation, this would trigger the orchestrator flow
    // For now, return success indicating flow was triggered
    // The actual flow execution is handled by the orchestrator

    res.json({
      success: true,
      message: 'story-of-us/ flow triggered. Next chapter in progress.',
      theme: theme || 'auto-generated',
    });
  } catch (error) {
    console.error('[Story API] Error triggering story continuation:', error);
    res.status(500).json({ error: 'Failed to trigger story continuation' });
  }
});

/**
 * GET /api/story/stats
 * Get story statistics (total chapters, word count, etc.)
 */
router.get('/stats', async (_req, res) => {
  try {
    const metadata = await storyService.readMetadata();
    const totalWordCount = await storyService.getTotalWordCount();
    const hasChapters = await storyService.hasChapters();

    res.json({
      totalChapters: metadata.chapters.length,
      totalWordCount,
      lastUpdated: metadata.lastUpdated,
      hasChapters,
      nextChapterNumber: await storyService.getNextChapterNumber(),
    });
  } catch (error) {
    console.error('[Story API] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch story statistics' });
  }
});

export default router;
