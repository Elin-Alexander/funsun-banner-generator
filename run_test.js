const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const API_URL = 'http://localhost:3000/api/generate-banner';
const OUTPUT_DIR = path.join(__dirname, 'output');
const JSON_DIR = path.join(__dirname, 'src', 'json');

// Цвета для красивого вывода в консоль
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Создание readline интерфейса
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для вопроса пользователю
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

// Функция для получения списка JSON файлов
function getJsonFiles() {
  if (!fs.existsSync(JSON_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(JSON_DIR);
  return files.filter(file => file.endsWith('.json'));
}

// Функция для чтения JSON файла
function readJsonFile(fileName) {
  const filePath = path.join(JSON_DIR, fileName);
  const jsonData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(jsonData);
}

// Функция для отображения превью параметров
function showPreview(params) {
  console.log('\n' + colors.gray + '─'.repeat(60) + colors.reset);
  console.log(`${colors.cyan}📋 ПРЕВЬЮ ПАРАМЕТРОВ:${colors.reset}`);
  console.log(colors.gray + '─'.repeat(60) + colors.reset);
  console.log(`  ${colors.yellow}Тип баннера:${colors.reset}  ${params.banner_type || 'email'}`);
  console.log(`  ${colors.yellow}Заголовок:${colors.reset}    ${params.title}`);
  console.log(`  ${colors.yellow}Подзаголовок:${colors.reset} ${params.subtitle || '—'}`);
  console.log(`  ${colors.yellow}Цвет фона:${colors.reset}    ${params.bg_color}`);
  console.log(`  ${colors.yellow}Цвет текста:${colors.reset}  ${params.text_color || '#FFFFFF'}`);
  console.log(`  ${colors.yellow}Плашка:${colors.reset}       ${params.badge_text || '—'}`);
  console.log(colors.gray + '─'.repeat(60) + colors.reset + '\n');
}

// Основная функция теста
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}🧪 ТЕСТ ГЕНЕРАЦИИ БАННЕРА${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Проверяем, существует ли папка output
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`${colors.yellow}⚠️  Папка output не найдена. Создаём...${colors.reset}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 📍 Шаг 1: Получаем список JSON файлов
  console.log(`${colors.blue}📥 Шаг 1: Поиск доступных JSON файлов...${colors.reset}`);
  
  const jsonFiles = getJsonFiles();
  
  if (jsonFiles.length === 0) {
    console.log(`${colors.red}❌ JSON файлы не найдены в папке ${JSON_DIR}${colors.reset}`);
    console.log(`${colors.yellow}💡 Создайте тестовые файлы (например: test-email.json, test-web.json, test-mobile.json)${colors.reset}\n`);
    rl.close();
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Найдено файлов: ${jsonFiles.length}${colors.reset}\n`);

  // 📍 Шаг 2: Показываем список и просим выбрать
  console.log(`${colors.blue}📋 Шаг 2: Выберите JSON файл для теста:${colors.reset}\n`);
  
  jsonFiles.forEach((file, index) => {
    const num = index + 1;
    const filePath = path.join(JSON_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    const date = stats.mtime.toLocaleDateString('ru-RU');
    
    console.log(`  ${colors.magenta}[${num}]${colors.reset} ${file}`);
    console.log(`      ${colors.gray}Размер: ${size} КБ | Изменён: ${date}${colors.reset}`);
  });
  
  console.log(`  ${colors.magenta}[0]${colors.reset} Выход\n`);
  
  const choice = await askQuestion(`${colors.cyan}Введите номер файла (0-${jsonFiles.length}): ${colors.reset}`);
  const choiceNum = parseInt(choice.trim());
  
  if (choiceNum === 0) {
    console.log(`${colors.yellow}👋 Тест отменён пользователем${colors.reset}\n`);
    rl.close();
    process.exit(0);
  }
  
  if (choiceNum < 1 || choiceNum > jsonFiles.length) {
    console.log(`${colors.red}❌ Неверный номер файла${colors.reset}\n`);
    rl.close();
    process.exit(1);
  }
  
  const selectedFile = jsonFiles[choiceNum - 1];
  console.log(`${colors.green}✅ Выбран файл: ${selectedFile}${colors.reset}\n`);

  // 📍 Шаг 3: Читаем выбранный JSON
  console.log(`${colors.blue}📥 Шаг 3: Чтение параметров...${colors.reset}`);
  
  let testPayload;
  try {
    testPayload = readJsonFile(selectedFile);
    console.log(`${colors.green}✅ Параметры загружены${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Ошибка чтения JSON: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Показываем превью параметров
  showPreview(testPayload);

  // 📍 Шаг 4: Проверка изображения
  console.log(`${colors.blue}🖼️  Шаг 4: Проверка изображения...${colors.reset}`);
  
  const imageUrl = testPayload.image_url;
  const isLocalUrl = imageUrl.includes('localhost');
  
  if (isLocalUrl) {
    const imageFileName = imageUrl.split('/').pop();
    const imageLocalPath = path.join(__dirname, 'src', 'img', imageFileName);
    
    if (fs.existsSync(imageLocalPath)) {
      console.log(`${colors.green}✅ Изображение найдено: ${imageLocalPath}${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Изображение не найдено локально: ${imageLocalPath}${colors.reset}`);
      console.log(`${colors.yellow}   Продолжаем с URL: ${imageUrl}${colors.reset}\n`);
    }
  } else {
    console.log(`${colors.green}✅ Внешний URL: ${imageUrl}${colors.reset}\n`);
  }

  // 📍 Шаг 5: Проверка сервера
  console.log(`${colors.blue}📡 Шаг 5: Проверка доступности сервера...${colors.reset}`);
  try {
    await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
    console.log(`${colors.green}✅ Сервер доступен${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Сервер недоступен!${colors.reset}`);
    console.log(`${colors.yellow}💡 Запустите сервер командой: npm start${colors.reset}\n`);
    rl.close();
    process.exit(1);
  }

  // 📍 Шаг 6: Отправка запроса на генерацию
  console.log(`${colors.blue}📥 Шаг 6: Отправка данных на генерацию...${colors.reset}`);

  try {
    const response = await axios.post(API_URL, testPayload, { timeout: 60000 });
    
    if (response.data.success) {
      console.log(`${colors.green}✅ Баннер успешно сгенерирован!${colors.reset}\n`);
      
      const { fileName, filePath, imageUrl, bannerUrl, params, bannerType } = response.data.data;
      
      // 📍 Шаг 7: Сохранение информации
      console.log(`${colors.blue}📝 Шаг 7: Сохранение информации о баннере...${colors.reset}`);
      
      const urlInfo = `Баннер сгенерирован: ${new Date().toISOString()}
========================================
JSON файл: ${selectedFile}
Тип баннера: ${bannerType}

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
      
      // Вывод результатов
      console.log('='.repeat(60));
      console.log(`${colors.green}🎉 РЕЗУЛЬТАТЫ ТЕСТА${colors.reset}`);
      console.log('='.repeat(60));
      console.log(`${colors.cyan}📁 Файл:${colors.reset}        ${fileName}`);
      console.log(`${colors.cyan}🖼️  Изображение:${colors.reset}  ${imageUrl}`);
      console.log(`${colors.cyan}🔗 HTML-версия:${colors.reset}  ${bannerUrl}`);
      console.log(`${colors.cyan}📝 TXT-файл:${colors.reset}     banner_url.txt`);
      console.log(`${colors.cyan}📊 Тип баннера:${colors.reset}  ${bannerType}`);
      console.log('='.repeat(60) + '\n');
      
      console.log(`${colors.yellow}💡 Для проверки откройте URL изображения в браузере${colors.reset}\n`);
      
      // Предложение запустить ещё один тест
      const runAgain = await askQuestion(`${colors.cyan}Запустить ещё один тест? (y/n): ${colors.reset}`);
      
      if (runAgain.toLowerCase() === 'y') {
        console.log('\n');
        rl.close();
        await runTest(); // Рекурсивный запуск
      } else {
        console.log(`${colors.green}👋 Тестирование завершено!${colors.reset}\n`);
      }
      
    } else {
      console.log(`${colors.red}❌ Ошибка генерации: ${response.data.error}${colors.reset}\n`);
      rl.close();
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Ошибка запроса:${colors.reset} ${error.message}\n`);
    if (error.response) {
      console.log(`${colors.red}Статус: ${error.response.status}${colors.reset}`);
      console.log(`${colors.red}Ответ: ${JSON.stringify(error.response.data)}${colors.reset}\n`);
    }
    rl.close();
    process.exit(1);
  }
  
  rl.close();
}

// Запуск теста
runTest().catch(error => {
  console.error(`${colors.red}❌ Критическая ошибка:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});