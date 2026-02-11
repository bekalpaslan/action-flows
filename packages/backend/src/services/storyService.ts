import { promises as fs } from 'fs';
import path from 'path';

// Story of Us types (defined here as they're specific to story service)
interface ChapterMeta {
  id: string;
  number: number;
  title: string;
  filePath: string;
  createdAt: string;
  wordCount: number;
  theme?: string;
}

interface StoryMetadata {
  version: string;
  lastUpdated: string;
  chapters: ChapterMeta[];
}

interface Chapter extends ChapterMeta {
  content: string;
}

/**
 * Story Service
 * Manages chapter storage and metadata for the Story of Us system.
 *
 * Storage structure:
 * - .claude/actionflows/logs/story/chapters/ (chapter markdown files)
 * - .claude/actionflows/logs/story/metadata.json (index of all chapters)
 */

const STORY_DIR = path.join('.claude', 'actionflows', 'logs', 'story');
const CHAPTERS_DIR = path.join(STORY_DIR, 'chapters');
const METADATA_FILE = path.join(STORY_DIR, 'metadata.json');

export class StoryService {
  /**
   * Read metadata.json and return parsed StoryMetadata
   */
  async readMetadata(): Promise<StoryMetadata> {
    try {
      const content = await fs.readFile(METADATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // If metadata.json doesn't exist, return empty metadata
      return {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        chapters: [],
      };
    }
  }

  /**
   * List all chapters from metadata.json
   */
  async listChapters(): Promise<Chapter[]> {
    const metadata = await this.readMetadata();

    // Load full content for each chapter
    const chapters: Chapter[] = [];
    for (const meta of metadata.chapters) {
      try {
        const chapter = await this.getChapter(meta.id);
        if (chapter) {
          chapters.push(chapter);
        }
      } catch (error) {
        console.warn(`Failed to load chapter ${meta.id}:`, error);
      }
    }

    return chapters;
  }

  /**
   * Get a single chapter by ID (includes full markdown content)
   */
  async getChapter(id: string): Promise<Chapter | null> {
    const metadata = await this.readMetadata();
    const meta = metadata.chapters.find((c) => c.id === id);

    if (!meta) {
      return null;
    }

    try {
      const filePath = meta.filePath;
      // Handle both absolute and relative paths
      const absolutePath = path.isAbsolute(filePath) ? filePath : filePath;

      const content = await fs.readFile(absolutePath, 'utf-8');

      // Extract title from markdown if available
      let title = meta.title;
      const titleMatch = content.match(/^#\s+(.+?)$/m);
      if (titleMatch) {
        title = titleMatch[1].replace('Chapter \\d+: ', '').trim();
      }

      return {
        id: meta.id,
        number: meta.number,
        title,
        content,
        createdAt: meta.createdAt,
        wordCount: meta.wordCount,
        theme: meta.theme,
        filePath: meta.filePath,
      };
    } catch (error) {
      console.error(`Failed to read chapter file for ${id}:`, error);
      return null;
    }
  }

  /**
   * Update metadata.json with a new chapter entry
   */
  async updateMetadata(chapterMeta: ChapterMeta): Promise<void> {
    const metadata = await this.readMetadata();

    // Remove existing chapter with same ID if any
    metadata.chapters = metadata.chapters.filter((c: ChapterMeta) => c.id !== chapterMeta.id);

    // Add new chapter
    metadata.chapters.push(chapterMeta);

    // Sort by chapter number
    metadata.chapters.sort((a: ChapterMeta, b: ChapterMeta) => a.number - b.number);

    // Update lastUpdated timestamp
    metadata.lastUpdated = new Date().toISOString();

    // Ensure directory exists
    await fs.mkdir(STORY_DIR, { recursive: true });

    // Write updated metadata
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
  }

  /**
   * Copy a chapter file from source (narrate/ log folder) to story/chapters/
   * Updates metadata.json with the new chapter entry
   */
  async copyChapterToStorage(
    sourcePath: string,
    chapterNumber: number,
    theme?: string
  ): Promise<void> {
    try {
      // Read source file
      const content = await fs.readFile(sourcePath, 'utf-8');

      // Extract title from markdown
      let title = `Chapter ${chapterNumber}`;
      const titleMatch = content.match(/^#\s+Chapter\s+\d+:\s+(.+?)$/m);
      if (titleMatch) {
        title = `Chapter ${chapterNumber}: ${titleMatch[1]}`;
      }

      // Calculate word count
      const wordCount = content.split(/\s+/).length;

      // Generate destination filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const destFileName = `chapter-${chapterNumber}_${timestamp}.md`;
      const destPath = path.join(CHAPTERS_DIR, destFileName);

      // Ensure chapters directory exists
      await fs.mkdir(CHAPTERS_DIR, { recursive: true });

      // Copy file
      await fs.writeFile(destPath, content);

      // Update metadata
      const chapterMeta: ChapterMeta = {
        id: `chapter-${chapterNumber}`,
        number: chapterNumber,
        title,
        filePath: destPath,
        createdAt: new Date().toISOString(),
        wordCount,
        theme,
      };

      await this.updateMetadata(chapterMeta);

      console.log(`[StoryService] Chapter ${chapterNumber} copied to storage: ${destPath}`);
    } catch (error) {
      console.error(`[StoryService] Failed to copy chapter from ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * Get total word count across all chapters
   */
  async getTotalWordCount(): Promise<number> {
    const metadata = await this.readMetadata();
    return metadata.chapters.reduce((sum: number, c: ChapterMeta) => sum + c.wordCount, 0);
  }

  /**
   * Check if any chapters exist
   */
  async hasChapters(): Promise<boolean> {
    const metadata = await this.readMetadata();
    return metadata.chapters.length > 0;
  }

  /**
   * Get next chapter number (based on existing chapters)
   */
  async getNextChapterNumber(): Promise<number> {
    const metadata = await this.readMetadata();
    if (metadata.chapters.length === 0) {
      return 1;
    }
    const maxNumber = Math.max(...metadata.chapters.map((c: ChapterMeta) => c.number));
    return maxNumber + 1;
  }
}

// Export singleton instance
export const storyService = new StoryService();
