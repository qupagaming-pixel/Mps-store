import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Check ImgBB API configuration status
 */
router.get('/status', (req: Request, res: Response) => {
  const apiKey = process.env.IMGBB_API_KEY;
  res.json({
    configured: Boolean(apiKey && apiKey.trim().length > 0),
    provider: 'ImgBB API',
    endpoint: 'https://api.imgbb.com/1/upload'
  });
});

/**
 * Upload image to ImgBB
 * Accepts: { image: string, name?: string }
 * where image is a base64 encoded string or image data URL or direct image URL
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { image, name } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required (base64 string or URL)' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(503).json({
        error: 'IMGBB_API_KEY is not configured in server environment variables. Please add your ImgBB API key in the AI Studio Settings menu to upload screenshots directly to ImgBB.'
      });
    }

    // Clean base64 string: ImgBB accepts base64 string without data:image/png;base64, prefix
    let cleanImage = image.trim();
    if (cleanImage.startsWith('data:')) {
      cleanImage = cleanImage.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
    }

    // ImgBB API requires form-data / x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('image', cleanImage);
    if (name) {
      formData.append('name', String(name).slice(0, 50));
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data: any = await response.json();

    if (!response.ok || !data || !data.success) {
      const errorMessage = data?.error?.message || data?.message || 'ImgBB upload rejected';
      console.error('ImgBB API upload failed:', errorMessage, data);
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 500).json({
        error: `ImgBB upload failed: ${errorMessage}`
      });
    }

    // Successfully uploaded to ImgBB
    return res.json({
      success: true,
      url: data.data.url,
      display_url: data.data.display_url,
      thumb_url: data.data.thumb?.url || data.data.url,
      delete_url: data.data.delete_url,
      size: data.data.size,
      provider: 'ImgBB'
    });
  } catch (error: any) {
    console.error('Unexpected error in ImgBB upload route:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while processing ImgBB image upload'
    });
  }
});

export default router;
