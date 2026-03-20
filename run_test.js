const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/generate-banner';
const OUTPUT_DIR = path.join(__dirname, 'output');
const JSON_PATH = path.join(__dirname, 'src', 'json', 'test.json');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}🧪 ТЕСТ ГЕНЕРАЦИИ БАННЕРА${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`${colors.yellow}⚠️  Папка output не найдена. Создаём...${colors.reset}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Чтение JSON
  console.log(`${colors.blue}📥 Шаг 1: Чтение параметров из ${JSON_PATH}...${colors.reset}`);
  
  let testPayload;
  try {
    const jsonData = fs.readFileSync(JSON_PATH, 'utf8');
    testPayload = JSON.parse(jsonData);
    console.log(`${colors.green}✅ Параметры загружены${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Ошибка чтения JSON: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Проверка изображения
  console.log(`${colors.blue}🖼️  Шаг 2: Проверка изображения...${colors.reset}`);
  
  const imageUrl = testPayload.image_url;
  const imageFileName = imageUrl.split('/').pop();
  const imageLocalPath = path.join(__dirname, 'src', 'img', imageFileName);
  
  if (fs.existsSync(imageLocalPath)) {
    console.log(`${colors.green}✅ Изображение найдено: ${imageLocalPath}${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Изображение не найдено локально, пробуем URL...${colors.reset}\n`);
  }

  // Проверка сервера
  console.log(`${colors.blue}📡 Шаг 3: Проверка доступности сервера...${colors.reset}`);
  try {
    await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
    console.log(`${colors.green}✅ Сервер доступен${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Сервер недоступен!${colors.reset}`);
    console.log(`${colors.yellow}💡 Запустите сервер командой: npm start${colors.reset}\n`);
    process.exit(1);
  }

  // Отправка запроса
  console.log(`${colors.blue}📥 Шаг 4: Отправка данных на генерацию...${colors.reset}`);
  console.log(`${colors.cyan}Параметры:${colors.reset}`);
  console.log(JSON.stringify(testPayload, null, 2) + '\n');

  try {
    const response = await axios.post(API_URL, testPayload, { timeout: 60000 });
    
    if (response.data.success) {
      console.log(`${colors.green}✅ Баннер успешно сгенерирован!${colors.reset}\n`);
      
      const { fileName, filePath, imageUrl, bannerUrl, params } = response.data.data;
      
      // Сохранение URL в txt
      console.log(`${colors.blue}📝 Шаг 5: Сохранение информации о баннере...${colors.reset}`);
      
      const urlInfo = `Баннер сгенерирован: ${new Date().toISOString()}
========================================

📁 Имя файла: ${fileName}
📂 Путь к файлу: ${filePath}
🖼️  URL изображения: ${imageUrl}
🔗 URL баннера (HTML): ${bannerUrl}

📊 Параметры:
${JSON.stringify(params, null, 2)}
`;
      
      const txtPath = path.join(OUTPUT_DIR, 'banner_url.txt');
      fs.writeFileSync(txtPath, urlInfo);
      
      console.log(`${colors.green}✅ Информация сохранена в: ${txtPath}${colors.reset}\n`);
      
      // Результаты
      console.log('='.repeat(60));
      console.log(`${colors.green}🎉 РЕЗУЛЬТАТЫ ТЕСТА${colors.reset}`);
      console.log('='.repeat(60));
      console.log(`${colors.cyan}📁 Файл:${colors.reset}      ${fileName}`);
      console.log(`${colors.cyan}🖼️  Изображение:${colors.reset} ${imageUrl}`);
      console.log(`${colors.cyan}🔗 HTML-версия:${colors.reset} ${bannerUrl}`);
      console.log(`${colors.cyan}📝 TXT-файл:${colors.reset}   banner_url.txt`);
      console.log('='.repeat(60) + '\n');
      
      console.log(`${colors.yellow}💡 Для проверки откройте URL изображения в браузере${colors.reset}\n`);
      
    } else {
      console.log(`${colors.red}❌ Ошибка генерации: ${response.data.error}${colors.reset}\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Ошибка запроса:${colors.reset} ${error.message}\n`);
    if (error.response) {
      console.log(`${colors.red}Статус: ${error.response.status}${colors.reset}`);
      console.log(`${colors.red}Ответ: ${JSON.stringify(error.response.data)}${colors.reset}\n`);
    }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error(`${colors.red}❌ Критическая ошибка:${colors.reset}`, error);
  process.exit(1);
});