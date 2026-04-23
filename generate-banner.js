const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Генерирует скриншот баннера из HTML-шаблона
 * @param {string} bannerUrl - URL с параметрами
 * @param {string} outputPath - Путь для сохранения изображения
 * @param {string} bannerType - Тип баннера (email/web/mobile)
 */
async function generateBanner(bannerUrl, outputPath, bannerType = 'email') {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 📍 РАЗМЕРЫ VIEWPORT В ЗАВИСИМОСТИ ОТ ТИПА БАННЕРА
    let viewportWidth, viewportHeight;
    
    switch (bannerType) {
      case 'web':
        viewportWidth = 720;
        viewportHeight = 360;
        break;
      case 'mobile':
        viewportWidth = 720;
        viewportHeight = 360;
        break;
      case 'email':
      default:
        viewportWidth = 1160;
        viewportHeight = 712;
    }
    
    await page.setViewport({ 
      width: viewportWidth, 
      height: viewportHeight, 
      deviceScaleFactor: 2 
    });
    
    await page.goto(bannerUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.waitForSelector('.banner', { timeout: 10000 });
    await page.evaluateHandle('document.fonts.ready');
    
    const bannerElement = await page.$('.banner');
    await bannerElement.screenshot({ 
      path: outputPath, 
      type: 'png'
    });
    
    console.log(`✅ Скриншот сохранён: ${outputPath}`);
    
  } finally {
    await browser.close();
  }
}

module.exports = { generateBanner };

// Если запускается напрямую
if (require.main === module) {
  const testUrl = 'http://localhost:3000/banner.html?' + 
    'bg_color=%23FF6B00&' +
    'text_color=%23FFFFFF&' +
    'title=Тестовый%20баннер&' +
    'subtitle=Проверка%20работы&' +
    'image_url=https://images.unsplash.com/photo-1576014131341-fe148656e6d4&' +
    'badge_text=ТЕСТ&' +
    'banner_type=web';
  
  generateBanner(testUrl, path.join(__dirname, 'output', 'test-banner.png'), 'web')
    .then(() => console.log('🎉 Тест завершён!'))
    .catch(console.error);
}