const express = require('express');
const path = require('path');
const { generateBanner } = require('./generate-banner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Статика
app.use(express.static(path.join(__dirname)));
app.use('/src/img', express.static(path.join(__dirname, 'src', 'img')));
app.use('/src/fonts', express.static(path.join(__dirname, 'src', 'fonts')));
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/temporary', express.static(path.join(__dirname, 'temporary')));

// POST /api/generate-banner
app.post('/api/generate-banner', async (req, res) => {
  try {
    console.log('📥 Получены данные от Telegram-бота:', JSON.stringify(req.body, null, 2));

    const { 
      bg_color, 
      text_color, 
      title, 
      image_url, 
      subtitle, 
      show_logo,
      badge_text, 
      badge_color, 
      badge_text_color 
    } = req.body;

    // Валидация обязательных параметров
    if (!bg_color || !title || !image_url) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные параметры: bg_color, title, image_url'
      });
    }

    // Формируем параметры для URL
    const params = {
      bg_color: bg_color,
      text_color: text_color || '#FFFFFF',
      title: title,
      image_url: image_url
    };

    // Опциональные параметры
    if (subtitle) params.subtitle = subtitle;
    if (show_logo) params.show_logo = show_logo;
    if (badge_text) {
      params.badge_text = badge_text;
      params.badge_color = badge_color || '#FFD700';
      params.badge_text_color = badge_text_color || '#E63946';
    }

    // Формируем URL для banner.html
    const queryString = new URLSearchParams(params).toString();
    const bannerUrl = `http://localhost:${PORT}/banner.html?${queryString}`;

    console.log('🔗 URL баннера:', bannerUrl);

    // Генерируем имя файла
    const timestamp = Date.now();
    const outputFileName = `banner-${timestamp}.png`;
    const outputPath = path.join(__dirname, 'output', outputFileName);

    // Генерируем изображение
    await generateBanner(bannerUrl, outputPath);

    console.log('✅ Баннер сгенерирован:', outputPath);

    // Возвращаем результат
    res.json({
      success: true,
      data: {
        fileName: outputFileName,
        filePath: outputPath,
        imageUrl: `${process.env.BASE_URL || `http://localhost:${PORT}`}/output/${outputFileName}`,
        bannerUrl: bannerUrl,
        params: params
      }
    });

  } catch (error) {
    console.error('❌ Ошибка генерации баннера:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 API: POST http://localhost:${PORT}/api/generate-banner`);
});