<script setup>
/*
  КАЛЕНДАРЬ ЖИЗНИ. Точка = одна неделя, от рождения до верха ЦЕЛЕВОЙ вилки.

  ⚠⚠⚠ КАЛЕНДАРЬ РИСУЕТСЯ SVG, А НЕ ВЁРСТКОЙ (смена подхода, 30.08.2026).

  Три захода подряд на HTML-сетке дали три разные поломки геометрии, и все
  три — одной природы: размер круга и шаг между кругами зависели от чего
  угодно, только не от нас.
    · круг тянулся на долю ширины (6,81 px) — браузер округлял каждый в свою
      сторону, и в ряду стояли кружки 6 и 7 пикселей;
    · подпись года кеглем 8 оказывалась выше ячейки в 6 пикселей и распирала
      строку — вертикальный шаг переставал совпадать с горизонтальным;
    · подпись, вынутая из потока абсолютом, выпала из грида целиком, и все
      клетки съехали на колонку влево;
    · кнопка со стилем `display: grid` не раскладывала своё содержимое — полосы
      десятилетий не рисовались вовсе.

  В SVG ничего этого нет: координаты заданы числами в системе viewBox, радиус
  — число, шаг — число, а браузер масштабирует всё целиком. Круг не может
  стать овалом, шаг по вертикали равен шагу по горизонтали по построению, и
  подпись года ни на что не влияет, потому что у текста в SVG нет «высоты
  строки», которая распирала бы соседей.

  💡 Правило шире этого файла: **точная сетка из тысяч одинаковых элементов —
  работа для SVG, а не для CSS-раскладки.** Вёрстка хороша, когда размеры
  определяются содержимым; здесь всё наоборот — содержимое обязано лечь в
  заданную геометрию.

  ── ЧТО ПОКАЗАНО ──────────────────────────────────────────────────────────
    · СВЁРНУТЫЙ вид — текущий год жизни: 52 круга сеткой 13×4, подписи
      месяцев, текущая неделя кольцом.
    · ПОЛНЫЙ вид — вся жизнь: ранние годы полосами по десятилетиям (каждое
      разворачивается отдельно), последние восемь лет и всё будущее — по
      неделям, в конце взлётная полоса и самолёт.

  ⛔ ЗАГОЛОВОК ПОЛНОГО ВИДА — ВИЛКА, А НЕ ГОД СМЕРТИ. Владелец просил
  «1983 — расчётный год»; одно число запрещено замком контура (CLAUDE.md,
  KANON-uspeyu). Мысль сохранена, конец показан диапазоном.

  Цвета — в `main.css`: синий прожито · зелёный неделя с разбором ·
  бледно-синий впереди · фиолетовый экстра-годы.

  ⛔ ЗАДНИМ ЧИСЛОМ НЕ ЗАКРАШИВАЕТСЯ НИЧЕГО (Д-42): до первого разбора зелёных
  недель ноль. ⛔ Ни одна точка не несёт медицинского смысла — календарь про
  дисциплину, а не про самочувствие (docs/PUBLIC-WHITELIST.md).
*/
import { computed, ref } from 'vue'

const props = defineProps({
  born: { type: String, required: true },
  lived: { type: Number, required: true },
  toCurrentLo: { type: Number, default: 0 },
  toCurrentHi: { type: Number, default: 0 },
  toTargetHi: { type: Number, default: 0 },
  reviewed: { type: Array, default: () => [] },
})

const COLS = 52
const DAY = 86400000
const DECADE = 10
/* Сколько последних лет показывать по неделям. Восемь — не круглое число ради
   красоты: столько лет назад начинается ряд анализов контура, то есть ровно
   та часть прошлого, о которой ему есть что сказать. */
const DETAIL_YEARS = 8

/* Геометрия ПОЛНОГО вида в единицах viewBox. Шаг один на обе оси — это и есть
   всё требование к сетке, и здесь оно выражено одним числом. */
const STEP = 10
const R = 3.6
/* ⚠ Колонка под год шире, чем нужно самой цифре: подпись стоит раз в пять
   строк, соседние строки свободны, и кегль можно поднять до читаемого. При
   LABEL_W=34 и кегле 7 год на телефоне выходил в четыре пикселя — цифры
   различались только по длине. */
const LABEL_W = 52

/* Геометрия СВЁРНУТОГО вида: тот же принцип, другой масштаб. */
const Y_COLS = 13
const Y_STEP = 40
const Y_R = 11

const expanded = ref(false)
/* ⚠ ПРОШЛОЕ РАЗВОРАЧИВАЕТСЯ ЦЕЛИКОМ, а не по одному десятилетию (владелец,
   30.08.2026). Полосы остались четырьмя — так видно, из чего сложены прожитые
   годы, — но нажатие на любую открывает всё прошлое сразу: выбирать, какое
   именно десятилетие раскрыть, человеку незачем, а четыре независимых
   состояния он потом не помнит. */
const pastOpen = ref(false)

/** ISO-неделя для номера недели жизни N (0 — неделя рождения). */
function isoOfWeek(n) {
  const d = new Date(props.born + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n * 7)
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const num = Math.ceil(((t - start) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(num).padStart(2, '0')}`
}

/** Дата начала недели жизни N. */
function dateOfWeek(n) {
  const d = new Date(props.born + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d
}

const bornYear = computed(() => Number(props.born.slice(0, 4)))
const reviewedSet = computed(() => new Set(props.reviewed))

const endCurrent = computed(() => props.lived + props.toCurrentHi)
const total = computed(() => props.lived + Math.max(props.toTargetHi, props.toCurrentHi))

function kindOf(i) {
  if (i < props.lived) return reviewedSet.value.has(isoOfWeek(i)) ? 'review' : 'lived'
  if (i < endCurrent.value) return 'ahead'
  return 'target'
}

const weeks = computed(() => Array.from({ length: total.value }, (_, i) => kindOf(i)))

/* ── Возраст и текущий год жизни ────────────────────────────────────────
   ⛔ Год отсчитывается от последнего дня рождения, а не от номера недели:
   52 недели — это 364 дня, и за сорок лет набегает почти год расхождения.
   И номер года жизни всегда на единицу больше возраста. */
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const age = computed(() => {
  const b = new Date(props.born + 'T00:00:00Z')
  const now = new Date()
  let a = now.getUTCFullYear() - b.getUTCFullYear()
  const before = now.getUTCMonth() < b.getUTCMonth()
    || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())
  if (before) a -= 1
  return a
})
const yearNo = computed(() => age.value + 1)

const yearStart = computed(() => {
  const b = new Date(props.born + 'T00:00:00Z')
  const now = new Date()
  const last = new Date(Date.UTC(now.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()))
  if (last.getTime() > now.getTime()) last.setUTCFullYear(last.getUTCFullYear() - 1)
  return Math.max(0, Math.floor((last - b) / (7 * DAY)))
})

const weekOfYear = computed(() => Math.min(COLS, Math.max(1, props.lived - yearStart.value + 1)))

/* ── СВЁРНУТЫЙ ВИД: круги текущего года с координатами ─────────────────── */
const yearDots = computed(() => Array.from({ length: COLS }, (_, j) => {
  const i = yearStart.value + j
  const d = dateOfWeek(i)
  const col = j % Y_COLS
  const row = Math.floor(j / Y_COLS)
  return {
    i,
    kind: kindOf(i),
    now: i === props.lived,
    cx: col * Y_STEP + Y_STEP / 2,
    cy: row * Y_STEP + Y_STEP / 2,
    month: d.getUTCMonth(),
    first: d.getUTCDate() <= 7,
  }
}))
const yearW = Y_COLS * Y_STEP
/* +12 — место под подписи месяцев последнего ряда: без запаса нижний ряд
   обрезался краем viewBox ровно по буквам. */
const yearH = 4 * Y_STEP + 12

/* ── Вилка: годы, а не недели ──────────────────────────────────────────── */
const nowYear = computed(() => new Date().getUTCFullYear())
const aheadLo = computed(() => Math.floor(props.toCurrentLo / 52))
const aheadHi = computed(() => Math.floor(props.toCurrentHi / 52))
const endLo = computed(() => nowYear.value + aheadLo.value)
const endHi = computed(() => nowYear.value + aheadHi.value)

/* ── ПОЛНЫЙ ВИД ────────────────────────────────────────────────────────────

   ⚠ ПРОШЛОЕ СВЁРНУТО ПО ДЕСЯТИЛЕТИЯМ, а не одной полосой: одна полоса на
   тридцать шесть лет — переключатель с двумя положениями, либо ничего, либо
   стена в тридцать шесть строк. Десятилетие — привычная человеку единица
   прошлого, и по нему можно попасть пальцем. */
const detailFrom = computed(() => Math.max(0, (yearNo.value - DETAIL_YEARS) * COLS))
const pastYears = computed(() => Math.floor(detailFrom.value / COLS))

/* ⚠ ПОЛОСЫ РАВНОЙ ДЛИНЫ, А НЕ КАЛЕНДАРНЫЕ ДЕСЯТИЛЕТИЯ (владелец: «доведи
   четвёртую до конца», 30.08.2026). Прежде последняя полоса покрывала шесть
   лет из десяти и потому была короче — честно по пропорции, но на экране
   читалась обрывом, будто её не дорисовали. Прошлое теперь делится на четыре
   РАВНЫЕ части, и все четыре полосы одинаковой длины: форма снова не врёт —
   каждая полоса и правда покрывает одинаковый срок. */
const BANDS = 4

const decades = computed(() => {
  const out = []
  const per = Math.ceil(pastYears.value / BANDS)
  for (let y = 0; y < pastYears.value; y += per) {
    const years = Math.min(per, pastYears.value - y)
    const slice = weeks.value.slice(y * COLS, (y + years) * COLS)
    out.push({
      i: out.length,
      year: y,
      years,
      share: slice.length ? slice.filter((w) => w === 'review').length / slice.length : 0,
    })
  }
  return out
})

/* Раскладка полного вида: список рядов, каждый — либо полоса десятилетия,
   либо ряд недель. Считается один раз, и все координаты берутся отсюда: SVG
   рисует ровно то, что здесь посчитано, и ничего не решает сам. */
/* ⚠ ВЕРХНИЙ ОТСТУП ОБЯЗАТЕЛЕН. Подпись года стоит по центру своей строки, а
   её буквы поднимаются выше центра почти на весь кегль: у первой строки верх
   цифр уходил за нулевую координату, и «1983» срезалось краем viewBox. Отступ
   считается от кегля подписи, а не подбирается на глаз. */
const PAD_TOP = 7

const layout = computed(() => {
  const rows = []
  let y = PAD_TOP

  if (pastOpen.value) {
    for (let yr = 0; yr < pastYears.value; yr += 1) {
      rows.push({ kind: 'weeks', y, year: yr, from: yr * COLS, to: (yr + 1) * COLS })
      y += STEP
    }
  } else {
    for (const dc of decades.value) {
      rows.push({ kind: 'bar', y, dc, width: COLS * STEP })
      y += STEP
    }
  }
  const pastEnd = y

  const last = weeks.value.length
  for (let i = detailFrom.value; i < last; i += COLS) {
    rows.push({ kind: 'weeks', y, year: Math.floor(i / COLS), from: i, to: Math.min(i + COLS, last) })
    y += STEP
  }

  return { rows, height: y + 2, pastEnd }
})

/* Доля высоты, на которой стоит середина прожитого, — по ней центрируется
   кнопка «Всё забыть». ⚠ Она относится к прошлому, а не ко всей сетке, и
   стоять обязана посередине именно того поля, которое сворачивает. */
const pastCenter = computed(() => {
  const h = layout.value.height || 1
  return `${((layout.value.pastEnd / 2) / h) * 100}%`
})

/** Круги одного ряда недель — с готовыми координатами. */
function dotsOf(row) {
  const out = []
  for (let i = row.from; i < row.to; i += 1) {
    out.push({
      i,
      kind: weeks.value[i],
      cx: LABEL_W + (i - row.from) * STEP + STEP / 2,
      cy: row.y + STEP / 2,
    })
  }
  return out
}

/* ⚠ ВЗЛЁТНОЙ ПОЛОСЫ И САМОЛЁТА БОЛЬШЕ НЕТ (владелец, 30.08.2026). Метафора
   была хороша словами, но на экране заняла место рядом с сеткой и потребовала
   к себе внимания там, где смотрят на недели. Хвост последнего ряда остаётся
   пустым — это и есть конец вилки, объяснять его знаком не нужно. */

const fullW = LABEL_W + COLS * STEP

const counts = computed(() => ({
  review: weeks.value.filter((w) => w === 'review').length,
  reviewYear: yearDots.value.filter((c) => c.kind === 'review').length,
  onTable: Math.max(0, Math.round((props.toTargetHi - props.toCurrentHi) / 52)),
}))

/* Легенда с числами. ⚠ Числа — В ГОДАХ, а не в неделях: «2263» в кружке не
   читается и ни с чем не сравнивается, «43» — читается сразу и складывается
   в голове с вилкой сверху. Недели остаются единицей сетки, годы — единицей
   разговора. */
const legend = computed(() => {
  const out = [{ kind: 'lived', n: Math.floor(props.lived / 52), label: 'прожито' }]
  /* ⛔ «С разбором» показывается, только когда разборы есть. Пока их ноль,
     строка «0 с разбором» — чистый шум: она объясняет цвет, которого на сетке
     нет ни одной точкой. Появится первый разбор — появится и подпись. */
  if (counts.value.review) {
    out.push({ kind: 'review', n: Math.round(counts.value.review / 52), label: 'с разбором' })
  }
  out.push({ kind: 'ahead', n: aheadHi.value, label: 'впереди' })
  out.push({ kind: 'target', n: counts.value.onTable, label: 'экстра' })
  return out
})
</script>

<template>
  <div class="cal">
    <!-- ─── свёрнуто: текущий год жизни ─────────────────────────────── -->
    <template v-if="!expanded">
      <div class="head">
        <h3 class="ttl">{{ yearNo }}-й год</h3>
        <span class="sub">неделя {{ weekOfYear }} из 52</span>
      </div>

      <svg
        class="grid"
        :viewBox="`0 0 ${yearW} ${yearH}`"
        role="img"
        :aria-label="`Текущий год жизни: недель с разбором ${counts.reviewYear} из 52`"
      >
        <g v-for="c in yearDots" :key="c.i">
          <circle :cx="c.cx" :cy="c.cy" :r="Y_R" :class="['dot', c.kind]" />
          <!-- Текущая неделя — кольцом, а не пятым цветом: цвет уже занят
               состоянием, а пятый тон читатель бы не различил. -->
          <circle v-if="c.now" :cx="c.cx" :cy="c.cy" :r="Y_R + 3" class="ring" />
          <text v-if="c.first" :x="c.cx" :y="c.cy + Y_R + 10" class="mon">{{ MONTHS[c.month] }}</text>
        </g>
      </svg>

      <p class="ahead">
        <span class="anum">{{ aheadLo }}–{{ aheadHi }}</span>
        <span class="aword">лет впереди</span>
      </p>
      <!-- Две величины — двумя баблами: оговорка и прибавка. Строкой через
           точку они читались одним предложением, хотя это разные вещи. -->
      <p class="pills">
        <span class="pill">на текущих данных</span>
        <span class="pill extra">+{{ counts.onTable }} экстра</span>
        <span v-if="counts.reviewYear" class="pill">{{ counts.reviewYear }} с разбором</span>
      </p>
      <p v-if="!counts.reviewYear" class="gist">
        Зелёных недель пока нет: первый воскресный разбор ещё не прошёл.
      </p>
    </template>

    <!-- ─── развёрнуто: вся жизнь ───────────────────────────────────── -->
    <template v-else>
      <div class="head">
        <h3 class="ttl">{{ bornYear }} — {{ endLo }}…{{ endHi }}</h3>
        <span class="sub">ещё {{ aheadLo }}–{{ aheadHi }} лет</span>
      </div>

      <div class="wrap">
        <svg
          class="grid"
          :viewBox="`0 0 ${fullW} ${layout.height}`"
          role="img"
          :aria-label="`Календарь жизни от ${bornYear} до ${endHi}, неделя = круг`"
        >
          <template v-for="(row, ri) in layout.rows" :key="ri">
            <!-- ПОЛОСА ДЕСЯТИЛЕТИЯ. Кликается сама полоса плюс невидимая
                 накладка во всю высоту ряда: тонкую полосу пальцем не поймать. -->
            <!-- ⚠ У свёрнутых полос года НЕ подписаны (владелец, 30.08.2026):
                 четыре подписи подряд стояли впритык и читались столбиком
                 цифр, к сетке не относящимся. Годы возвращаются вместе с
                 неделями, когда прошлое развёрнуто. -->
            <g v-if="row.kind === 'bar'" class="barg" @click="pastOpen = true">
              <rect
                :x="LABEL_W" :y="row.y + STEP / 2 - R" :width="row.width" :height="R * 2"
                :rx="R" class="bar lived"
              />
              <rect
                v-if="row.dc.share"
                :x="LABEL_W" :y="row.y + STEP / 2 - R" :width="row.width * row.dc.share" :height="R * 2"
                :rx="R" class="bar review"
              />
              <rect :x="0" :y="row.y" :width="fullW" :height="STEP" class="hit" />
            </g>

            <!-- РЯД НЕДЕЛЬ -->
            <g v-else>
              <text
                v-if="row.year % 5 === 0"
                :x="LABEL_W - 8" :y="row.y + STEP / 2 + 2.6"
                class="yr"
              >{{ bornYear + row.year }}</text>
              <circle
                v-for="c in dotsOf(row)" :key="c.i"
                :cx="c.cx" :cy="c.cy" :r="R" :class="['dot', c.kind]"
              />
            </g>
          </template>

        </svg>

        <!-- ⚠ Выход из развёрнутого прошлого — большой кнопкой поверх той самой
             стены точек, которую она убирает. Ссылка под сеткой терялась. -->
        <button
          v-if="pastOpen"
          type="button"
          class="forget"
          :style="{ top: pastCenter }"
          @click="pastOpen = false"
        >Всё забыть</button>
      </div>

      <!-- Легенда несёт числа: цвет объясняет сетку, число отвечает «сколько
           этого». Оба вместе — иначе легенда только называет цвета. -->
      <ul class="legend">
        <li v-for="l in legend" :key="l.kind">
          <span class="sw" :class="l.kind">{{ l.n }}</span>
          <span class="lb">{{ l.label }}</span>
        </li>
      </ul>
    </template>

    <button type="button" class="toggle" :aria-expanded="expanded ? 'true' : 'false'" @click="expanded = !expanded">
      {{ expanded ? 'Свернуть' : 'Вся жизнь' }}
      <svg viewBox="0 0 20 20" class="chev" :class="{ up: expanded }" fill="none" stroke="currentColor"
           stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 8l5 5 5-5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.ttl { margin: 0; font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.sub { font-size: 12px; color: var(--text-muted); }

/* SVG тянется по ширине, высота считается из viewBox — пропорции сетки при
   этом сохраняются на любом экране. */
.grid { display: block; width: 100%; height: auto; margin-top: 14px; }
.wrap { position: relative; }

.dot.lived { fill: var(--wk-lived); }
.dot.review { fill: var(--wk-review); }
.dot.ahead { fill: var(--wk-ahead); }
.dot.target { fill: var(--wk-target); }
.ring { fill: none; stroke: var(--text); stroke-width: 1.6; }

.mon {
  font-size: 9px; fill: var(--text-muted); text-anchor: middle;
  font-family: inherit;
}
.yr {
  font-size: 13px; fill: var(--text-muted); text-anchor: end;
  font-family: inherit; font-variant-numeric: tabular-nums;
}

.bar.lived { fill: var(--wk-lived); }
.bar.review { fill: var(--wk-review); }
.barg { cursor: pointer; }
.barg:active .bar { opacity: .7; }
/* Прозрачная накладка во всю высоту ряда: тонкую полосу пальцем не поймать. */
.hit { fill: transparent; }

.forget {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 2; min-height: 44px; padding: 0 22px; border: 0; border-radius: 999px;
  background: var(--text); color: var(--bg); cursor: pointer;
  font: inherit; font-size: 14px; font-weight: 600;
  box-shadow: 0 6px 20px rgba(28, 27, 24, .28);
}
.forget:active { opacity: .9; }

/* Главное число блока: сколько впереди. Набрано числом, а не словами внутри
   абзаца, — иначе то, ради чего календарь открывают, читается последним. */
.ahead { display: flex; align-items: baseline; gap: 8px; margin: 16px 0 0; }
.anum {
  font-size: 30px; font-weight: 700; line-height: 1;
  letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--text);
}
.aword { font-size: 15px; font-weight: 600; color: var(--text-secondary); }
.gist { margin: 8px 0 0; font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }

/* Бабл — заливка без обводки: рамка добавила бы третью линию туда, где и так
   две величины рядом. */
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }
.pill {
  display: inline-flex; align-items: center; min-height: 26px;
  padding: 0 11px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
  background: var(--surface-2); color: var(--text-secondary);
}
.pill.extra { background: var(--wk-target); color: var(--ink-on-color); }

/* ⚠ Легенда — ОДНА строка. Три величины помещаются в неё на любом телефоне,
   если круг ужать до 26 и не давать подписям переноситься; четвёртой
   («с разбором») там нет, пока разборов ноль. */
/* ⚠⚠ СЕТКА, А НЕ СТРОКА ФЛЕКСОМ. С `flex-wrap: nowrap` три пары не влезали в
   ширину телефона, флекс ужимал их, и подпись наезжала за свою ячейку —
   выглядело так, будто круг «26» уехал вниз относительно слова. Колонки
   равной доли снимают вопрос: каждой паре достаётся треть ширины, и ужимать
   нечего. Четвёртая пара (когда появятся разборы) переносится на второй ряд
   сама. */
.legend {
  list-style: none; margin: 16px 0 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 10px;
}
.legend li { display: flex; align-items: center; gap: 7px; min-width: 0; }
/* Круг несёт число, поэтому он крупный. Выравнивание — по центру строки
   подписи, а не по её базовой линии: иначе кружок с цифрой «висит» выше
   слова. */
/* Круг и подпись центрируются друг относительно друга по СЕРЕДИНЕ, а не по
   базовой линии: иначе кружок с цифрой висит выше слова. Цифра внутри круга
   центрируется тем же приёмом плюс `.kh-digit` — коробка строки обрезается
   по высоте прописной, и цифра садится ровно в центр. */
.sw {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; flex: 0 0 26px; border-radius: 999px;
  font-size: 12px; font-weight: 700; color: var(--ink-on-color);
  font-variant-numeric: tabular-nums; line-height: 1;
}
.lb {
  font-size: 12.5px; color: var(--text-secondary); line-height: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sw.lived { background: var(--wk-lived); }
.sw.review { background: var(--wk-review); }
.sw.ahead { background: var(--wk-ahead); color: var(--text); }
.sw.target { background: var(--wk-target); }

.toggle {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; min-height: 36px; margin-top: 16px;
  border: 0; border-radius: 12px; cursor: pointer;
  background: var(--surface-2); color: var(--text-secondary);
  font-size: 12.5px; font-weight: 600; font-family: inherit;
}
.toggle:active { background: var(--surface-hover); }
.chev { width: 16px; height: 16px; transition: transform .18s ease; }
.chev.up { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
</style>
