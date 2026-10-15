// ⚠ КОПИЯ из ultra.runscale.ru (`.vitepress/lp/titan/`), сама копия gderost (GR-68). Перенесена 15.10.2026 для витрины «Успею»; файл не правится, а заменяется копией из источника.
// ⚠ КОПИЯ из gderost (`app/src/composables/`, GR-68) от 24.09.2026. Источник правды — там.
// Перелив титановых хлопьев — живой слой на WebGL (GR-68, слово Михаила 23.09:
// «плавно все эти хлопья вразнобой переливались, как будто волна, но не общим
// градиентом, а случайным… как будто близко смотрим на чешую дракона, который
// идёт»).
//
// КАК УСТРОЕН ПЕРЕЛИВ. У каждого хлопа своя грань — случайный наклон
// из плоскости (`nx, ny` в `titanFlakes.js`): большинство лежат почти ровно,
// немногие наклонены сильно. По полю бегут две медленные волны разного шага
// и направления, и волна не красит хлопья, а НАКЛОНЯЕТ их, как тело под
// чешуёй. Хлоп вспыхивает, когда его собственный наклон вместе с наклоном
// волны подставил грань под свет.
//
// Отсюда и «волна, но вразнобой». На гребне волны под свет попадает много
// хлопьев, во впадине почти ни одного, — волну видно по тому, ГДЕ вспыхивает.
// Но какой именно хлоп вспыхнет и когда, решает его собственный наклон:
// соседи загораются в разные моменты, часть гребня пропускает, и общего
// светлого пятна нет. Первая сборка давала граням равномерный угол на круге,
// и вспышки рассыпались по всему экрану без волны — при равномерном угле
// любое качание оставляет долю «попавших под свет» прежней (журнал GR-68).
//
// Фронт волны изогнут медленным шумом (тело не прямое), а сила бликов
// меняется по полю широкими пятнами — где-то волна играет ярче, где-то тише.
// Свет сам чуть плывёт, поэтому набор хлопьев, которые могут вспыхнуть,
// со временем меняется, и картинка не заучивается глазом.
//
// ПОЧЕМУ WebGL. На экране телефона две-три тысячи хлопьев, на широком
// мониторе до десяти тысяч, и каждый кадр у каждого свой цвет. Всё считается
// в вершинном шейдере на видеокарте за один проход; процессор в кадре только
// передаёт время. Холст на 2D или SVG с анимацией каждого хлопа на телефоне
// тормозит и греет батарею.
//
// ⚠ ЧЕСТНОСТЬ К БАТАРЕЕ. Кадры идут только пока слой виден: вне экрана
// и в фоновой вкладке цикл стоит. Частота ограничена шестьюдесятью кадрами —
// на экранах 120 Гц перелив медленный, и лишние кадры глаз не увидит, а батарея
// заметит. Контекст просит `low-power`: на ноутбуке с двумя видеокартами
// перелив не будит дискретную.
//
// ⚠ «Уменьшить движение» в системе — кадр рисуется один раз и стоит.

import { TITAN_STEPS, titanField } from './titanFlakes.js'

// Волны: шаг в пикселях и период в секундах. Медленнее — перелив замирает
// и читается картинкой; быстрее — рябь и суета, чешуя перестаёт «идти».
// ⚠ Ускорено словом Михаила 23.09: «сделай анимацию хлопьев более быстрой
// или активной, а то чтобы увидеть эффект, надо долго присматриваться».
// Было 7,5 и 12 секунд — гребень шёл по телефону пять секунд, и на тёмной
// палитре под текст вспышку замечали только те, кто ждал её.
const WAVE1 = 620
const WAVE2 = 740
const PERIOD1 = 4.6
const PERIOD2 = 7.2
const K1 = (Math.PI * 2) / WAVE1
const K2 = (Math.PI * 2) / WAVE2
const W1 = (Math.PI * 2) / PERIOD1
const W2 = (Math.PI * 2) / PERIOD2
// Разброс собственных граней и ширина блика. Разброс шире — вспышки теряют
// волну и сыплются по всему экрану; уже — гребень загорается сплошной
// полосой, то есть тем самым общим градиентом. Блик шире — хлопья тлеют
// долго и мутно, уже — мигают точками.
const SPREAD = 0.3
const GLINT = 0.15
// Статичный тон хлопа прижат ниже потолка палитры: блик упирается в
// `--titan-6`, и чем ниже хлоп стоит в покое, тем больше его вспышка.
// При 1,0 хлоп средней светлоты разгорался на 25 уровней из 255 — это
// и было «надо долго присматриваться»; при 0,78 — на 35.
const REST = 0.78

// ФОКУС-ВОЛНА (правка Михаила 23.09: «анимация обводки очень хитрая, как
// будто возникает оптическая иллюзия объёма, как будто размытием и фокусом
// проходится невидимой волной, по-моему не обводкой, а прямо поверх фона —
// это показать и усилить»). Широкая полоса проходит по предмету слева
// направо и наводит на хлопья резкость: внутри полосы контраст хлопьев
// растёт, грани чуть доворачиваются к свету и вспыхивают россыпью, снаружи
// контраст мягко проседает — глаз читает это как глубину резкости,
// прошедшую по металлу. Грань предмета (`.gr-titan-rim`) ловит тот же
// проход в тот же миг: слой отдаёт положение полосы наружу.
//
// Полоса наклонена на 15° — так же, как блик грани (градиент 105° в
// `main.css`), и её центр в долях ширины предмета.
const SWEEP_DIR = [0.966, 0.259]
const SWEEP_FROM = -0.45
const SWEEP_TO = 1.45
const SWEEP_OFF = -10

const VERT = `
precision highp float;
attribute vec2 a_pos;
attribute vec2 a_center;
attribute vec4 a_attr; // тон, наклон грани x и y, блеск
uniform vec2 u_res;
uniform float u_time;
uniform float u_sweep;
uniform vec3 u_pal[${TITAN_STEPS}];
varying vec3 v_col;

// Хеш без синуса: на мобильных видеокартах sin() от больших чисел теряет
// точность и даёт полосы.
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Ломаная по семи ступеням палитры — та же, что titanMix в titanFlakes.js.
vec3 pal(float v) {
  v = clamp(v, 0.0, 1.0) * ${(TITAN_STEPS - 1).toFixed(1)};
  vec3 c = u_pal[0];
  for (int k = 1; k < ${TITAN_STEPS}; k++) {
    c = mix(c, u_pal[k], clamp(v - float(k - 1), 0.0, 1.0));
  }
  return c;
}

const vec2 DIR1 = vec2(0.816, 0.577);
const vec2 DIR2 = vec2(-0.552, 0.834);

void main() {
  vec2 c = a_center;
  float t = u_time;

  // Две волны: шаг около ${Math.round(WAVE1)} и ${Math.round(WAVE2)} px, период около ${PERIOD1}
  // и ${PERIOD2} секунд. Гребень проходит экран телефона секунды за три.
  float bend = noise(c * 0.0035 + vec2(t * 0.05, -t * 0.035)) * 3.0;
  float s1 = sin(dot(c, DIR1) * ${K1.toFixed(4)} - t * ${W1.toFixed(3)} + bend);
  float s2 = sin(dot(c, DIR2) * ${K2.toFixed(4)} - t * ${W2.toFixed(3)} + bend * 0.6);
  vec2 wave = DIR1 * s1 * 0.55 + DIR2 * s2 * 0.32;

  // Своя грань хлопа с мелкой собственной дрожью.
  vec2 own = a_attr.yz * ${SPREAD.toFixed(2)};
  own += 0.04 * vec2(sin(t * 1.6 + a_attr.y * 7.0), cos(t * 1.25 + a_attr.z * 7.0));
  vec2 tilt = own + wave;

  // Где стоит свет: чуть в стороне от ровного положения по ходу волны,
  // поэтому в покое бликов мало, а гребень подставляет под свет целую россыпь.
  float drift = 0.3 * sin(t * 0.09);
  vec2 lamp = 0.42 * vec2(cos(0.615 + drift), sin(0.615 + drift));

  // Фокус-волна: расстояние хлопа до центра полосы в долях ширины предмета.
  float across = dot(vec2(c.x - u_sweep * u_res.x, c.y - 0.5 * u_res.y),
                     vec2(${SWEEP_DIR[0]}, ${SWEEP_DIR[1]})) / u_res.x;
  float focus = exp(-across * across * 15.4);
  // В полосе грани доворачиваются к свету — вспыхивает россыпь.
  tilt += (lamp - tilt) * 0.5 * focus;

  vec2 miss = tilt - lamp;
  float spec = exp(-dot(miss, miss) * ${(1 / (2 * GLINT * GLINT)).toFixed(2)});

  // Где волна играет ярче: широкие пятна, которые медленно плывут.
  float field = 0.5 + 0.5 * noise(c * 0.0021 + vec2(-t * 0.03, t * 0.024));

  float v = a_attr.x * ${REST.toFixed(2)} + 0.04 * dot(tilt, lamp)
          + spec * a_attr.w * field * (0.9 + 1.0 * focus);

  // Светотень внутри хлопа: сторона, наклонённая к свету, чуть светлее.
  // Без неё хлоп — плоская заплатка, с ней — пластинка металла.
  vec2 d = a_pos - a_center;
  float len = length(d);
  float side = len > 0.001 ? dot(d / len, normalize(tilt + vec2(0.0001))) : 0.0;
  v += side * 0.055 * (0.4 + spec + 1.4 * focus);

  // Резкость: вне полосы тон хлопьев чуть стягивается к середине (дымка),
  // в полосе расходится и светлеет. Без полосы (SWEEP_OFF) focus — ноль,
  // и множитель 0,9 — просто ровная мягкость материала. Потолок палитры
  // держится: v зажат в pal(), самый светлый хлоп — --titan-6, текст
  // поверх читается и в полосе.
  v = 0.34 + (v - 0.34) * (0.9 + 0.9 * focus) + 0.13 * focus;

  v_col = pal(v);
  vec2 clip = a_pos / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
varying vec3 v_col;
void main() { gl_FragColor = vec4(v_col, 1.0); }
`

// Кадр для «уменьшить движение» и для первого показа: взят момент,
// где на экране уже есть несколько бликов, а не пустая фаза волны.
const STILL_TIME = 3.4
const FRAME_MS = 1000 / 60 - 1.5
// Потолок пикселей холста: на большом мониторе с плотностью 2 холст иначе
// вырастает до десяти мегапикселей, а хлопьям хватает и четырёх. Плотность
// экрана берётся до трёх: на баннере в полтора десятка сантиметров хлопья
// при двойной плотности на экране в три размывались (GR-68, баннер «Ультры»),
// а пикселей там мало, и потолок они не трогают.
const MAX_PIXELS = 4.2e6
const FLOATS = 8 // a_pos 2 + a_center 2 + a_attr 4

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`titanGlint: шейдер не собрался — ${log}`)
  }
  return sh
}

/**
 * Где центр фокус-волны в момент `t` при периоде `period` секунд, в долях
 * ширины предмета. Проход занимает первую половину периода с разгоном
 * и торможением, вторую половину полоса стоит за правым краем. Первый
 * проход начинается через десятую долю периода после появления слоя —
 * слой успевает проявиться, и волна не стартует из-под пальца.
 */
export function titanSweepAt(t, period) {
  if (!(period > 0)) return SWEEP_OFF
  const phase = ((t / period) + 0.9) % 1
  if (phase >= 0.5) return SWEEP_TO
  const a = phase / 0.5
  const e = a * a * (3 - 2 * a)
  return SWEEP_FROM + (SWEEP_TO - SWEEP_FROM) * e
}

/**
 * Положение фокус-волны для блика грани: `background-position` первого слоя
 * `.gr-titan-rim::after`. ⚠ Формула держится за геометрию слоя в `main.css`:
 * слой втрое шире предмета, полоса в его середине, поэтому полоса стоит
 * над точкой `s` ширины при позиции (1,5 − s) × 50 %. Меняешь там
 * `background-size` или место полосы — меняй здесь.
 */
export function titanSweepCss(s) {
  return `${((1.5 - s) * 50).toFixed(2)}%`
}

/** Веер треугольников из центра каждого хлопа в один массив вершин. */
export function titanVertices(flakes) {
  let tris = 0
  for (const f of flakes) tris += f.n
  const data = new Float32Array(tris * 3 * FLOATS)
  let o = 0
  const put = (x, y, f) => {
    data[o++] = x; data[o++] = y
    data[o++] = f.cx; data[o++] = f.cy
    data[o++] = f.tone; data[o++] = f.nx; data[o++] = f.ny; data[o++] = f.gleam
  }
  for (const f of flakes) {
    for (let k = 0; k < f.n; k++) {
      const j = (k + 1) % f.n
      put(f.cx, f.cy, f)
      put(f.pts[k * 2], f.pts[k * 2 + 1], f)
      put(f.pts[j * 2], f.pts[j * 2 + 1], f)
    }
  }
  return data
}

/**
 * Запустить перелив на холсте.
 *
 * `palette` — семь цветов тремя числами 0…1, от `--titan-0` до `--titan-6`.
 * Возвращает управление или `null`, если WebGL на устройстве нет — тогда
 * слой показывает плитку SVG (`TitanLayer.vue`).
 */
export function titanGlint(canvas, { palette, seed = 'ranskeil', density = 1, scale = 1, speed = 1, still = false, sweep = 0, onSweep, onFirstFrame } = {}) {
  // `sweep` — период фокус-волны в секундах, 0 — без неё. `onSweep(s)`
  // получает её положение каждый кадр, чтобы грань предмета шла в ногу.
  // Масштаб узора: 1 — хлопья как на образце, меньше — мельче и гуще.
  // Поле строится на площади, увеличенной в 1/scale раз, и сжимается
  // в холст: хлопья, шаг и скорость волны мельчают вместе, и перелив
  // на маленьком баннере выглядит тем же материалом, увиденным издалека.
  const k = scale > 0 ? scale : 1
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  let prog = null
  let buf = null
  let loc = null
  let count = 0
  let cssW = 0
  let cssH = 0
  let raf = 0
  let running = false
  let lost = false
  let clock = 0
  let lastTs = 0
  let drewFirst = false

  function setup() {
    prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`titanGlint: программа не собралась — ${gl.getProgramInfoLog(prog)}`)
    }
    gl.useProgram(prog)
    loc = {
      pos: gl.getAttribLocation(prog, 'a_pos'),
      center: gl.getAttribLocation(prog, 'a_center'),
      attr: gl.getAttribLocation(prog, 'a_attr'),
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      sweep: gl.getUniformLocation(prog, 'u_sweep'),
      pal: gl.getUniformLocation(prog, 'u_pal'),
    }
    gl.uniform3fv(loc.pal, new Float32Array(palette.flat()))
    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const stride = FLOATS * 4
    gl.enableVertexAttribArray(loc.pos)
    gl.vertexAttribPointer(loc.pos, 2, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(loc.center)
    gl.vertexAttribPointer(loc.center, 2, gl.FLOAT, false, stride, 8)
    gl.enableVertexAttribArray(loc.attr)
    gl.vertexAttribPointer(loc.attr, 4, gl.FLOAT, false, stride, 16)
    const [r, g, b] = palette[0]
    gl.clearColor(r, g, b, 1)
    count = 0
  }

  function build() {
    if (!cssW || !cssH) { count = 0; return }
    const flakes = titanField({ seed, x0: 0, y0: 0, x1: cssW / k, y1: cssH / k, density })
    const data = titanVertices(flakes)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    count = data.length / FLOATS
  }

  function draw(time, moving = false) {
    if (lost) return
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (!count) return
    // Неподвижный кадр идёт без фокус-волны: застывшая полоса читалась бы
    // пятном на металле, а не проходом света.
    const s = moving ? titanSweepAt(clock, sweep) : SWEEP_OFF
    if (sweep > 0) onSweep?.(s)
    gl.uniform2f(loc.res, cssW / k, cssH / k)
    gl.uniform1f(loc.time, time)
    gl.uniform1f(loc.sweep, s)
    gl.drawArrays(gl.TRIANGLES, 0, count)
    if (!drewFirst) { drewFirst = true; onFirstFrame?.() }
  }

  function tick(ts) {
    raf = requestAnimationFrame(tick)
    if (lastTs && ts - lastTs < FRAME_MS) return
    // Пауза не прыгает: время перелива копится только за видимые кадры,
    // и после возврата на экран волна идёт с того места, где остановилась.
    const dt = lastTs ? Math.min(ts - lastTs, 100) : 0
    lastTs = ts
    clock += (dt / 1000) * speed
    draw(STILL_TIME + clock, true)
  }

  function start() {
    if (running || lost) return
    if (still) { draw(STILL_TIME + clock); return }
    running = true
    lastTs = 0
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
    raf = 0
  }

  /** Размер слоя в CSS-пикселях. Узор пересобирается, ячейки остаются прежними. */
  function resize(w, h, dpr = 1) {
    const ratio = Math.max(1, Math.min(dpr, 3, Math.sqrt(MAX_PIXELS / Math.max(1, w * h))))
    cssW = Math.max(0, Math.round(w))
    cssH = Math.max(0, Math.round(h))
    canvas.width = Math.max(1, Math.round(cssW * ratio))
    canvas.height = Math.max(1, Math.round(cssH * ratio))
    if (lost) return
    build()
    draw(STILL_TIME + clock)
  }

  function onLost(e) {
    e.preventDefault()
    lost = true
    stop()
  }
  function onRestored() {
    lost = false
    setup()
    build()
    draw(STILL_TIME + clock)
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  try {
    setup()
  } catch (err) {
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    console.warn(err)
    return null
  }

  return {
    resize,
    start,
    stop,
    setStill(v) {
      still = !!v
      stop()
      start()
    },
    destroy() {
      stop()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      if (buf) gl.deleteBuffer(buf)
      if (prog) gl.deleteProgram(prog)
    },
  }
}
