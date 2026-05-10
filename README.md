# Fun&Sun Banner Generator

Генератор PNG-баннеров Fun&Sun на базе HTML-шаблона, Express API и Puppeteer.

Проект принимает JSON с параметрами баннера, собирает URL для `banner.html`, открывает его в headless-браузере и сохраняет PNG в папку `output/`.

## Быстрый старт

```bash
npm install
npm start
```

Сервер по умолчанию запускается на:

```text
http://localhost:3000
```

Проверка доступности:

```text
GET /api/health
```

Генерация баннера:

```text
POST /api/generate-banner
```

## Скрипты

```bash
npm start
```

Запускает Express API.

```bash
npm test
```

Запускает интерактивный тестовый сценарий из `run_test.js`: выбирает JSON из `src/json`, отправляет его на API и сохраняет результат.

```bash
npm run generate
```

Запускает прямой тест Puppeteer из `generate-banner.js`.

## Основные файлы

- `server.js` - Express API, принимает JSON и запускает генерацию.
- `generate-banner.js` - Puppeteer-рендер и сохранение PNG.
- `banner.html` - HTML/CSS/JS-шаблон баннеров.
- `src/json/` - тестовые JSON payload.
- `src/img/` - локальные тестовые изображения и логотипы.
- `src/fonts/` - шрифты TT Firs Neue.
- `output/` - готовые PNG-баннеры.
- `temporary/` - временные файлы, если они понадобятся внешнему процессу.

## Форматы баннеров

Параметр `banner_type` отвечает за канал/размер баннера.

| banner_type | Размер PNG | Назначение |
| --- | ---: | --- |
| `email` | `580x356` | Баннеры для email-рассылок |
| `web` | `720x360` | Web push / web-баннер |
| `mobile` | `1000x500` | Mobile push / mobile-баннер |

Если `banner_type` не передан или передан неверно, используется `email`.

## Варианты верстки

Параметр `layout_type` отвечает за конкретную верстку внутри выбранного `banner_type`.

Если `layout_type` не передан, пустой или содержит недопустимые символы, используется:

```json
"layout_type": "default"
```

### Email layout_type

Все email-варианты генерируются в размере `580x356`.

| layout_type | Описание |
| --- | --- |
| `default` | Текст слева, одно большое фото справа |
| `top_image` | Бейдж и текст сверху, одно широкое фото снизу |
| `split_image_text` | Фото сверху, цветная текстовая плашка снизу |
| `two_images_equal` | Текст сверху, два равных фото снизу |
| `two_images_left_wide` | Текст сверху, снизу широкое фото слева и узкое справа |
| `two_images_right_wide` | Текст сверху, снизу узкое фото слева и широкое справа |
| `three_images_mixed` | Текст сверху, снизу три фото разной ширины |
| `three_images_equal` | Текст сверху, снизу три равных фото |
| `side_text_three_images` | Текст слева, три горизонтальных фото справа |

## Параметры JSON

| Поле | Обязательное | Описание |
| --- | --- | --- |
| `bg_color` | Да | Цвет фона баннера или основной плашки, hex |
| `title` | Да | Заголовок |
| `image_url` | Да | URL первого изображения |
| `text_color` | Нет | Цвет заголовка и подзаголовка, по умолчанию `#FFFFFF` |
| `subtitle` | Нет | Подзаголовок |
| `banner_type` | Нет | Тип баннера: `email`, `web`, `mobile` |
| `layout_type` | Нет | Вариант верстки, по умолчанию `default` |
| `image_url_2` | Нет | URL второго изображения для layout с 2/3 фото |
| `image_url_3` | Нет | URL третьего изображения для layout с 3 фото |
| `badge_text` | Нет | Текст бейджа |
| `badge_color` | Нет | Цвет бейджа |
| `badge_text_color` | Нет | Цвет текста бейджа |
| `show_logo` | Нет | Исторический параметр; сейчас логотип используется только в mobile-layout |

Если `image_url_2` или `image_url_3` не переданы, шаблон дублирует `image_url`.

## Пример запроса

```json
{
  "bg_color": "#0075C9",
  "text_color": "#FFFFFF",
  "title": "ЗАГОЛОВОК 1 СТРОКА",
  "subtitle": "Подзаголовок 1 строка",
  "image_url": "http://localhost:3000/src/img/01.jpg",
  "image_url_2": "http://localhost:3000/src/img/05.jpg",
  "image_url_3": "http://localhost:3000/src/img/04.jpg",
  "banner_type": "email",
  "layout_type": "three_images_equal",
  "badge_text": "ТЕКСТ ДЛЯ ТЕГА",
  "badge_color": "#AFC3F7",
  "badge_text_color": "#FFFFFF"
}
```

Пример `curl` для Windows PowerShell/cmd:

```powershell
curl -X POST http://localhost:3000/api/generate-banner ^
  -H "Content-Type: application/json" ^
  -d "{\"bg_color\":\"#0075C9\",\"title\":\"ЗАГОЛОВОК\",\"image_url\":\"http://localhost:3000/src/img/01.jpg\",\"banner_type\":\"email\",\"layout_type\":\"default\"}"
```

## Ответ API

```json
{
  "success": true,
  "data": {
    "fileName": "banner-email-1778432245414.png",
    "filePath": "C:\\path\\to\\output\\banner-email-1778432245414.png",
    "imageUrl": "http://localhost:3000/output/banner-email-1778432245414.png",
    "bannerUrl": "http://localhost:3000/banner.html?...",
    "params": {},
    "bannerType": "email",
    "layoutType": "three_images_equal"
  }
}
```

## Тестовые JSON

В папке `src/json/` лежат примеры payload для разных layout.

Основные email-примеры:

- `test-email.json`
- `test-email-top-image.json`
- `test-email-split-image-text.json`
- `test-email-two-images-equal.json`
- `test-email-two-images-left-wide.json`
- `test-email-two-images-right-wide.json`
- `test-email-three-images-mixed.json`
- `test-email-three-images-equal.json`
- `test-email-side-text-three-images.json`

## Важные детали

- Итоговые PNG сохраняются в `output/`.
- `output/*.png` игнорируются Git, кроме `.gitkeep`.
- Для прозрачных layout Puppeteer делает скриншот с прозрачным фоном.
- Для новых layout с тремя фото длинный текст переносится и уменьшается, чтобы поместиться в заданный блок.
- Если проект запускается на сервере, настройте `BASE_URL`, чтобы API возвращал публичный URL готового PNG.

## Проверка перед коммитом

```bash
node --check server.js
node --check generate-banner.js
node --check run_test.js
```

После запуска сервера можно проверить генерацию через:

```bash
npm test
```
