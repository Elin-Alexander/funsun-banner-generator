const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Генерирует скриншот баннера из HTML-шаблона
 * @param {string} bannerUrl - URL с параметрами
 * @param {string} outputPath - Путь для сохранения изображения
 */
async function generateBanner(bannerUrl, outputPath) {
  // Убеждаемся, что папка существует
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
    
    // НОВЫЙ РАЗМЕР: 1160×712 (2x для Retina = 2320×1424)
    await page.setViewport({ 
      width: 1160, 
      height: 712, 
      deviceScaleFactor: 2 
    });
    
    // Переходим на страницу с параметрами
    await page.goto(bannerUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Ждём рендеринга контента
    await page.waitForSelector('.banner', { timeout: 10000 });
    
    // Ждём загрузки шрифтов
    await page.evaluateHandle('document.fonts.ready');
    
    // Скриншот только элемента .banner (не fullPage)
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
    'show_logo=true';
  
  generateBanner(testUrl, path.join(__dirname, 'output', 'test-banner.png'))
    .then(() => console.log('🎉 Тест завершён!'))
    .catch(console.error);
}