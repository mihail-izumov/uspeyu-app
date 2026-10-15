// ⚠ КОПИЯ из ultra.runscale.ru (`.vitepress/lp/titan/`), сама копия gderost (GR-68). Перенесена 15.10.2026 для витрины «Успею»; файл не правится, а заменяется копией из источника.
// ⚠ КОПИЯ из gderost (`app/src/composables/`, GR-68) от 24.09.2026. Источник правды — там.
// Титановые хлопья — геометрия узора (GR-68, слово Михаила 23.09).
//
// Образец — кованый карбон с серебром: серые и светлые хлопья разной формы
// лежат внахлёст на почти чёрной основе. Модуль чистый, без DOM и без WebGL,
// и его читают три места: живой слой (`titanGlint.js`), статичная плитка SVG
// в том же слое, когда видеокарты нет, и выгрузка файла для мобилки
// (`tools/titan-svg.mjs`). Форма хлопа поэтому живёт ОДНОЙ функцией
// `makeFlake` (Н-44): поменяешь её — поменяются все три показа сразу,
// и плитка в мобилке не разъедется с сайтом.
//
// Всё считается от зерна. Один и тот же ключ даёт один и тот же узор
// на любом устройстве и при любой перерисовке: узор не пляшет при повороте
// телефона и не мигает при возврате на экран.

const TAU = Math.PI * 2

/** Ступеней тона в палитре `--titan-0…--titan-6`, от смолы между хлопьями до блика. */
export const TITAN_STEPS = 7
/** Сторона плитки SVG в CSS-пикселях. */
export const TITAN_TILE = 512
/** Сторона ячейки живого поля. Хлоп больше ячейки не бывает (см. `R_MAX`). */
export const TITAN_CELL = 128

// Плотность подобрана по образцу: смола видна тонкими щелями, основа
// перекрыта хлопьями в два-три слоя. Реже — узор распадается на отдельные
// пятна на чёрном, чаще — хлопья мельчают в шум.
const PER_TILE = 2600
const PER_CELL = PER_TILE * (TITAN_CELL / TITAN_TILE) ** 2

// Размер хлопа — логнормальный: много мелких, немного крупных, как у рубленого
// волокна. Медиана 9 px, потолок 30 px с вытяжкой 3,2 даёт 96 px — меньше
// ячейки, поэтому одного кольца соседних ячеек хватает, чтобы хлоп с края
// не обрезался.
const R_MEDIAN = 9
const R_SPREAD = 0.42
const R_MIN = 3
const R_MAX = 30
const STRETCH_MAX = 2.2

/** Генератор чисел от зерна (mulberry32): быстрый, одинаковый везде. */
export function titanRandom(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Свёртка ключа (строки или числа) и координат ячейки в одно зерно. */
export function titanHash(...parts) {
  let h = 2166136261
  for (const part of parts) {
    const s = String(part)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    h ^= 0x9e37
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function gauss(rand) {
  // Бокс — Мюллер; единица минус случай, чтобы логарифм не встретил ноль.
  return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(TAU * rand())
}

/**
 * Один хлоп вокруг точки (x, y).
 *
 * Форма — многоугольник на три-шесть вершин: треугольники и четырёхугольники
 * встречаются чаще всего, пяти- и шестиугольные осколки реже. Вершины идут
 * по кругу с разбросом угла, поэтому порядок вершин вокруг центра всегда
 * верный и хлоп раскладывается веером треугольников из центра без
 * самопересечений — на этом стоит живой слой.
 *
 * Тон снят пипеткой с образца (журнал GR-68): основа тёмная, около трети
 * хлопьев средние, каждый седьмой светлый. Блик в тон не входит — его
 * добавляет перелив.
 *
 * `nx, ny` — наклон грани хлопа из плоскости, случайный вектор с нормальным
 * разбросом: большинство хлопьев лежат почти ровно, немногие наклонены
 * сильно, как в настоящем прессованном карбоне. От наклона зависит,
 * в какой момент волна подставит хлоп под свет; у соседей он разный,
 * поэтому соседи вспыхивают вразнобой. `gleam` — насколько хлоп блестит:
 * одни хлопья зеркальные, другие матовые.
 */
export function makeFlake(rand, x, y) {
  const u = rand()
  const n = u < 0.45 ? 3 : u < 0.8 ? 4 : u < 0.93 ? 5 : 6
  const r = Math.min(R_MAX, Math.max(R_MIN, R_MEDIAN * Math.exp(R_SPREAD * gauss(rand))))
  const stretch = 1 + Math.pow(rand(), 1.6) * STRETCH_MAX
  const rot = rand() * TAU
  const cr = Math.cos(rot)
  const sr = Math.sin(rot)
  const start = rand() * TAU
  const step = TAU / n
  const pts = new Array(n * 2)
  for (let k = 0; k < n; k++) {
    // ⚠ Разброс угла не шире ±0,23 шага: соседние вершины тогда расходятся
    // меньше чем на 1,46 шага, у треугольника это 3,06 радиана — меньше π.
    // Шире — у треугольника появляется просвет больше развёрнутого угла,
    // центр выпадает из хлопа, и веер из центра на WebGL рисует не ту фигуру,
    // что SVG. Держит самопроверка `titan-flakes.test.ts`.
    const a = start + k * step + (rand() - 0.5) * step * 0.46
    const rr = r * (0.45 + 0.55 * rand())
    const lx = Math.cos(a) * rr * stretch
    const ly = Math.sin(a) * rr
    pts[k * 2] = x + lx * cr - ly * sr
    pts[k * 2 + 1] = y + lx * sr + ly * cr
  }
  const lean = Math.sqrt(-2 * Math.log(1 - rand()))
  const facet = rand() * TAU
  const tiltX = lean * Math.cos(facet)
  const tiltY = lean * Math.sin(facet)
  return {
    n,
    pts,
    cx: x,
    cy: y,
    tone: 0.1 + 0.76 * Math.pow(rand(), 1.2),
    nx: tiltX,
    ny: tiltY,
    gleam: 0.35 + 0.65 * Math.pow(rand(), 0.7),
  }
}

function bbox(f) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (let k = 0; k < f.n; k++) {
    const x = f.pts[k * 2]
    const y = f.pts[k * 2 + 1]
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return { x0, y0, x1, y1 }
}

function shifted(f, dx, dy) {
  const pts = f.pts.map((v, i) => (i % 2 ? v + dy : v + dx))
  return { ...f, pts, cx: f.cx + dx, cy: f.cy + dy, copy: true }
}

/**
 * Бесшовная плитка: хлопья, которые переходят край, повторены с другой
 * стороны. Копия встаёт в список сразу за своим хлопом, поэтому порядок
 * наложения на стыке тот же, что внутри плитки, и шва не видно ни на одной
 * стороне.
 */
export function titanTile({ seed = 'ranskeil', size = TITAN_TILE, density = 1 } = {}) {
  const rand = titanRandom(titanHash(seed, 'tile', size))
  const count = Math.round(PER_TILE * density * (size / TITAN_TILE) ** 2)
  const flakes = []
  for (let i = 0; i < count; i++) {
    const f = makeFlake(rand, rand() * size, rand() * size)
    const b = bbox(f)
    flakes.push(f)
    for (const dy of [-size, 0, size]) {
      for (const dx of [-size, 0, size]) {
        if (dx === 0 && dy === 0) continue
        if (b.x1 + dx <= 0 || b.x0 + dx >= size || b.y1 + dy <= 0 || b.y0 + dy >= size) continue
        flakes.push(shifted(f, dx, dy))
      }
    }
  }
  return { size, flakes }
}

/**
 * Живое поле без повтора для прямоугольника [x0, x1) × [y0, y1).
 *
 * Поле нарезано ячейками, и у каждой ячейки своё зерно от её координат.
 * Экран вырос — добавились ячейки по краям, а старые остались прежними:
 * при повороте телефона и при растягивании окна узор не перетасовывается.
 * Кольцо ячеек за краем берётся, чтобы хлоп из соседней ячейки не обрывался
 * на границе экрана.
 *
 * Порядок наложения — случайный ключ у каждого хлопа, общий для всего поля.
 * Шёл бы он по ячейкам — хлопья соседних ячеек ложились бы друг на друга
 * рядами, и сетка проступила бы.
 */
export function titanField({ seed = 'ranskeil', x0 = 0, y0 = 0, x1, y1, density = 1 }) {
  const c0 = Math.floor(x0 / TITAN_CELL) - 1
  const r0 = Math.floor(y0 / TITAN_CELL) - 1
  const c1 = Math.floor(x1 / TITAN_CELL) + 1
  const r1 = Math.floor(y1 / TITAN_CELL) + 1
  const flakes = []
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const rand = titanRandom(titanHash(seed, 'cell', col, row))
      const count = Math.floor(PER_CELL * density + rand())
      for (let i = 0; i < count; i++) {
        const f = makeFlake(rand, (col + rand()) * TITAN_CELL, (row + rand()) * TITAN_CELL)
        f.z = rand()
        flakes.push(f)
      }
    }
  }
  flakes.sort((a, b) => a.z - b.z)
  return flakes
}

/** Ступень палитры для тона: плитка на токенах красится семью ступенями. */
export function titanStep(tone) {
  return Math.max(0, Math.min(TITAN_STEPS - 1, Math.round(tone * (TITAN_STEPS - 1))))
}

/**
 * Цвет токена в три числа 0…1. Токены в `main.css` записаны hex'ом, а шейдеру
 * и выгрузке нужны числа. Строку, которую прочесть нельзя, возвращаем пустой:
 * вызывающий решает, что делать без цвета.
 */
export function titanParseColor(str) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(str || '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

/**
 * Тон 0…1 → цвет по палитре из семи ступеней, ломаной между соседними.
 * ⚠ Та же ломаная стоит в шейдере `titanGlint.js` (функция `pal`). Меняешь
 * здесь — меняй там: иначе плитка для мобилки и живой слой разойдутся тоном.
 */
export function titanMix(palette, tone) {
  const v = Math.max(0, Math.min(1, tone)) * (palette.length - 1)
  const i = Math.min(palette.length - 2, Math.floor(v))
  const f = v - i
  return palette[i].map((c, k) => c + (palette[i + 1][k] - c) * f)
}

/**
 * Тело плитки SVG: основа и хлопья по порядку наложения. Чем красить,
 * решает вызывающий: `paint(tone)` возвращает атрибуты хлопа строкой —
 * класс ступени в приложении (цвет из токена) или готовый цвет в выгрузке.
 */
export function titanSvgBody({ size, flakes }, { paint, base }) {
  const out = [`<rect width="${size}" height="${size}" ${base}/>`]
  for (const f of flakes) {
    let points = ''
    for (let k = 0; k < f.n; k++) {
      points += `${k ? ' ' : ''}${f.pts[k * 2].toFixed(1)},${f.pts[k * 2 + 1].toFixed(1)}`
    }
    out.push(`<polygon points="${points}" ${paint(f.tone)}/>`)
  }
  return out.join('')
}

/** Самостоятельный файл плитки: `viewBox` по стороне, лишнее за краем срезано. */
export function titanSvg(tile, opts) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile.size}" height="${tile.size}" `
    + `viewBox="0 0 ${tile.size} ${tile.size}" shape-rendering="geometricPrecision">`
    + titanSvgBody(tile, opts)
    + '</svg>'
}
