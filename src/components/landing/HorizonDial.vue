<script setup>
/*
  ПРИБОР «ГОРИЗОНТ» — шкала жизни циферблатом (главная, 15.10.2026).

  Та же шкала, что `HorizonScale.vue` внутри приложения: факт · прогноз ·
  план · цель на одной оси лет, только свёрнутая в дугу часов. Приём —
  циферблат спортивных часов, ровно та аудитория, о которой канон
  (`docs/KANON-uspeyu.md`, Д-40): язык приборов им родной.

  ⛔ НИЧЕГО НЕ СЧИТАЕТ. Все числа — из `public.json` (поля `horizon.*` по
     `docs/PUBLIC-WHITELIST.md` §1).

  ⛔ РАМКА ЧЕСТНОСТИ СТОИТ НА ЭКРАНЕ ВСЕГДА, а не только при выбранной цели:
     «не срок человека», «рубеж поставлен решением Михаила», «под него не
     подобран», зазор диапазоном и «рабочее задание» рядом с ним. Дым витрины
     проверяет их словами; выбор на приборе меняет только середину.

  ⛔ КРАСНОГО НЕТ НИ В ОДНОМ СЕГМЕНТЕ: зазор не тревога, а незакрытая работа.

  ── ВТОРОЙ ЗАХОД (Д-64, слово владельца 15.10.2026: «поправь анимацию в круге,
     там куча багов») ─────────────────────────────────────────────────────────
  Что было не так и как устроено теперь:

  1. ОСЬ КОНЧАЛАСЬ НА 90, А РУБЕЖ СТОЯЛ НА 87. Рядом оказались две подписи
     («90» у конца дуги и «▼ 87» с чертой сквозь кольцо), остаток дорожки
     87→90 торчал серым обрубком, а треугольник смотрел в сторону. Теперь
     дуга идёт от рождения ДО РУБЕЖА: конец шкалы и есть цель, подписан одним
     числом. Если план вдруг перешагнёт рубеж, ось тянется до конца плана, и
     рубеж ставится засечкой на кольце.
  2. ЗАПОЛНЕНИЕ ШЛО ЧЕРЕЗ `pathLength` + `stroke-dasharray`. В Safari длина
     пути для пунктира считается по-своему, и сегменты рисовались то пунктиром,
     то с хвостами. Теперь дугу двигает сам рисунок: кадр за кадром путь
     каждого сегмента строится до текущей точки «стрелки». Никаких трюков с
     пунктиром — в любом движке одно и то же.
  3. ПОДСВЕТКА ВЫБОРА ФИЛЬТРОМ (`feGaussianBlur`) давала прямоугольное марево
     вокруг дуги: фильтр режется по коробке пути. Выбор теперь показывает
     тонкая скобка снаружи кольца — как выделение на циферблате часов.
  4. Между сегментами просвечивали волоски сглаживания. Каждый сегмент
     заходит под следующий на долю градуса.

  💡 ДВИЖЕНИЕ ЧЕСТНОЕ: стрелка идёт от рождения к рубежу в том же порядке, в
     каком идут годы, и ни одного числа, которого нет в данных, при этом не
     появляется. Счётчиков-«накруток» нет нарочно.
*/
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { plural } from '../../composables/useData.js'

const props = defineProps({
  horizon: { type: Object, required: true },
  modelValue: { type: String, default: 'cur' },
  /* Чей это расчёт — тексты прибора говорят о человеке, а не о «профиле»
     (Д-65, слово владельца: «всё ещё непонятно, что на странице данные
     Михаила и это его прогноз»). Падежи — готовыми строками. */
  person: { type: Object, default: () => ({ name: 'Михаил', gen: 'Михаила', dat: 'Михаилу' }) },
  /* `person.author` — расчёт самого автора: тогда прибор говорит его голосом,
     от первого лица (Д-66: «предлагаю везде писать „я“ и „моё“»). */
  /* Д-71: прибор во вкладке «Горизонт» внутри кабинета стоит в колонке
     430 px и на компьютере. Медиазапрос считает ширину окна, а не колонки,
     и разводил бы дугу и объяснения в две колонки внутри узкой карточки. */
  narrow: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const uid = `hd${useId().replace(/[^a-zA-Z0-9]/g, '')}`

const goal = computed(() => props.horizon.goal || null)
const cur = computed(() => props.horizon.current)
const plan = computed(() => props.horizon.target)
const lived = computed(() => goal.value?.lived ?? 0)
const sel = computed(() => props.modelValue)

/* Конец оси: рубеж; если план его перешагнул — конец плана; без рубежа —
   ближайший десяток за планом. */
const END = computed(() => {
  const p = plan.value.age_hi
  if (goal.value) return Math.max(goal.value.age, p)
  return Math.ceil((p + 2) / 10) * 10
})
const goalAtEnd = computed(() => !!goal.value && goal.value.age >= plan.value.age_hi)

const ru = (n, d = 1) => Number(n).toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d })

/* ── геометрия ─────────────────────────────────────────────────────────── */
const VBW = 320
const VBH = 282
const C = 160
const R = 116
const SW = 20
const RB = R + SW / 2 + 7 // радиус скобки выбора
const A0 = -135
const A1 = 135
const DRAW_MS = 1700
const SEAM = 0.18 // лет нахлёста под соседний сегмент

function ang(age) {
  const f = Math.max(0, Math.min(1, age / END.value))
  return A0 + f * (A1 - A0)
}
function pt(a, r = R) {
  const t = (a * Math.PI) / 180
  return [C + r * Math.sin(t), C - r * Math.cos(t)]
}
function arc(fromAge, toAge, r = R) {
  const s = ang(fromAge)
  const e = ang(toAge)
  if (e - s < 0.01) return ''
  const [x0, y0] = pt(s, r)
  const [x1, y1] = pt(e, r)
  const large = e - s > 180 ? 1 : 0
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/* ── «стрелка»: докуда дуга уже нарисована ─────────────────────────────── */
const head = ref(0)
const drawn = computed(() => head.value * END.value)
const settled = ref(false)

const SEGS = computed(() => {
  const l = lived.value
  const c = cur.value
  const p = plan.value
  return [
    { k: 'lived', sel: 'fact', from: 0, to: l, stroke: 'var(--wk-lived)' },
    { k: 'ahead', sel: 'cur', from: l, to: c.age_lo, stroke: 'var(--wk-ahead)' },
    { k: 'cur', sel: 'cur', from: c.age_lo, to: c.age_hi, stroke: `url(#${uid}-ha)`, breath: true },
    { k: 'plan', sel: 'plan', from: c.age_hi, to: p.age_lo, stroke: 'var(--wk-target)' },
    { k: 'planv', sel: 'plan', from: p.age_lo, to: p.age_hi, stroke: `url(#${uid}-ht)` },
  ].filter((s) => s.to > s.from)
})

const segs = computed(() => {
  const d = drawn.value
  const last = SEGS.value.length - 1
  return SEGS.value
    .map((s, i) => {
      if (d <= s.from) return null
      const to = Math.min(d, i < last ? s.to + SEAM : s.to)
      return { ...s, d: arc(s.from, to) }
    })
    .filter((s) => s && s.d)
})

/* Зазор: от конца плана до рубежа — точками по дорожке. */
const gap = computed(() => {
  if (!goal.value || goal.value.reached_by_plan) return ''
  const from = plan.value.age_hi
  const to = Math.min(goal.value.age, drawn.value)
  if (to <= from) return ''
  return arc(from, to)
})

const ticks = computed(() => {
  const out = []
  for (let y = 10; y < END.value - 1; y += 10) {
    const a = ang(y)
    const [x1, y1] = pt(a, R - SW / 2 - 9)
    const [x2, y2] = pt(a, R - SW / 2 - 4)
    out.push({ y, x1, y1, x2, y2 })
  }
  return out
})

const now = computed(() => {
  const [x, y] = pt(ang(lived.value))
  return { x, y, on: drawn.value >= lived.value }
})

/* Подписи концов: 0 у начала, у конца — рубеж (или конец оси). */
const ends = computed(() => {
  const [x0, y0] = pt(A0, R)
  const [x1, y1] = pt(A1, R)
  return {
    a: { x: x0, y: y0 + SW / 2 + 16 },
    b: { x: x1, y: y1 + SW / 2 + 16 },
  }
})

/* Засечка рубежа на кольце — только если рубеж не на конце оси. */
const goalTick = computed(() => {
  if (!goal.value || goalAtEnd.value) return null
  const a = ang(goal.value.age)
  const [x1, y1] = pt(a, R - SW / 2 - 2)
  const [x2, y2] = pt(a, R + SW / 2 + 2)
  const [tx, ty] = pt(a, R + SW / 2 + 16)
  return { x1, y1, x2, y2, tx, ty: ty + 4 }
})

/* Скобка выбора — снаружи кольца, над выбранным участком. */
const bracket = computed(() => {
  const l = lived.value
  const c = cur.value
  const p = plan.value
  const span = {
    fact: [0, l],
    cur: [c.age_lo, c.age_hi],
    plan: [p.age_lo, p.age_hi],
    // Цель — граница, а не участок: её выбор поднимает точки зазора и число
    // у конца шкалы, скобка над точками задвоила бы их.
    goal: null,
  }[sel.value]
  if (!span) return null
  const cls = { fact: 'b-lived', cur: 'b-cur', plan: 'b-plan' }[sel.value]
  return { d: arc(span[0], span[1], RB), cls }
})

/* ── что стоит в середине циферблата ────────────────────────────────────── */
const READ = computed(() => {
  const g = goal.value
  const l = Math.floor(lived.value)
  return {
    fact: { label: 'Факт, лет', value: String(l), sub: 'уже прожито' },
    cur: { label: 'Прогноз, лет', value: cur.value.label, sub: 'при таких анализах' },
    plan: { label: 'План, лет', value: plan.value.label, sub: 'если подтянуть показатели' },
    goal: g
      ? { label: 'Цель, лет', value: String(Math.round(g.age)), sub: props.person.author ? 'я поставил её сам' : `${props.person.name} поставил её сам` }
      : null,
  }
})
const readout = computed(() => READ.value[sel.value] || READ.value.cur)

const extra = computed(() => props.horizon.on_the_table || null)

/* Объяснения — простым языком, про человека и его анализы (Д-64: без слов
   об устройстве экрана; Д-65: «для простых людей, сейчас всё очень заумно»). */
const SAY = computed(() => {
  const l = Math.floor(lived.value)
  const e = extra.value
  const g = goal.value
  const P = props.person
  const me = !!P.author
  const who = {
    dat: me ? 'Мне' : P.dat,
    gen: me ? 'меня' : P.gen,
    set: me ? 'я поставил себе сам' : `${P.name} поставил себе сам`,
    up: me ? 'Если я подтяну' : 'Если подтянуть',
  }
  const grows = me ? 'вырастет' : 'вырастает'
  return {
    fact: `${who.dat} ${l} ${plural(l, 'год', 'года', 'лет')}. Это единственное число на шкале, которое известно точно.`,
    cur: `Люди с такими же анализами, как у ${who.gen}, в среднем живут до ${cur.value.label} лет. Точнее сказать нельзя: чем свежее и полнее анализы, тем уже этот диапазон.`,
    plan: e
      ? `${who.up} к цели показатели, на которые можно повлиять, прогноз ${grows} до ${plan.value.label} лет. Эта прибавка и есть экстра-годы: около +${ru(e.years)}, от ${ru(e.years_lo)} до ${ru(e.years_hi)}.`
      : `${who.up} к цели показатели, на которые можно повлиять, прогноз ${grows} до ${plan.value.label} лет.`,
    goal: g
      ? (g.reached_by_plan
        ? `${Math.round(g.age)} — цель, которую ${who.set}. План до неё дотягивает.`
        : `${Math.round(g.age)} — цель, которую ${who.set}. Известные способы пока не дотягивают до неё на ${g.gap_label} лет.`)
      : '',
  }
})

const LEGEND = computed(() => {
  const out = [
    { id: 'fact', label: 'Факт', value: String(Math.floor(lived.value)), sw: 'lived' },
    { id: 'cur', label: 'Прогноз', value: cur.value.label, sw: 'hatch-a' },
    { id: 'plan', label: 'План', value: plan.value.label, sw: 'target' },
  ]
  if (goal.value) out.push({ id: 'goal', label: 'Цель', value: String(Math.round(goal.value.age)), sw: 'goal' })
  return out
})

/* ⚠ ПОКА ЧЕЛОВЕК НИЧЕГО НЕ ВЫБРАЛ, ДУГА ГОРИТ ЦЕЛИКОМ. Приглушать остальное
   имеет смысл, только когда человек сам спросил «а это что». */
const engaged = ref(false)
watch(() => props.modelValue, () => { engaged.value = true })
const dimmed = (id) => engaged.value && sel.value !== id

function pick(id) {
  engaged.value = true
  emit('update:modelValue', id)
}

/* ── ход стрелки при появлении ─────────────────────────────────────────── */
const box = ref(null)
let io = null
let raf = 0
let t0 = 0
const ease = (t) => 1 - Math.pow(1 - t, 3)

function frame(t) {
  if (!t0) t0 = t
  const k = Math.min(1, (t - t0) / DRAW_MS)
  head.value = ease(k)
  if (k < 1) raf = requestAnimationFrame(frame)
  else { raf = 0; settled.value = true }
}
function start() {
  if (raf || settled.value) return
  t0 = 0
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  const still = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (still || typeof window.IntersectionObserver === 'undefined' || !box.value) {
    head.value = 1
    settled.value = true
    return
  }
  io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      start()
      io?.disconnect()
      io = null
    }
  }, { threshold: 0.35 })
  io.observe(box.value)
})
onBeforeUnmount(() => {
  io?.disconnect()
  if (raf) cancelAnimationFrame(raf)
})

defineExpose({ el: box })
</script>

<template>
  <div class="hd" :class="{ 'is-settled': settled, 'is-engaged': engaged, 'hd-narrow': narrow }">
    <div class="hd-l">
      <div ref="box" class="dial">
        <svg
          :viewBox="`0 0 ${VBW} ${VBH}`"
          class="svg"
          role="img"
          :aria-label="goal
            ? `Прожито ${Math.floor(lived)} лет, прогноз ${cur.label}, план ${plan.label}, рубеж ${Math.round(goal.age)}`
            : `Прогноз ${cur.label}, план ${plan.label}`"
        >
          <defs>
            <pattern :id="`${uid}-ha`" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill="var(--wk-ahead)" />
              <rect width="3" height="7" fill="var(--wk-lived)" />
            </pattern>
            <pattern :id="`${uid}-ht`" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill="var(--wk-target)" opacity=".32" />
              <rect width="3" height="7" fill="var(--wk-target)" />
            </pattern>
          </defs>

          <!-- Дорожка: от рождения до конца оси. -->
          <path :d="arc(0, END)" class="track" :stroke-width="SW" fill="none" />

          <line v-for="t in ticks" :key="t.y" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" class="tick" />

          <path
            v-for="s in segs"
            :key="s.k"
            :d="s.d"
            class="seg"
            :class="{ dim: dimmed(s.sel), breath: s.breath }"
            :stroke="s.stroke"
            :stroke-width="SW"
            fill="none"
            @click="pick(s.sel)"
          />

          <!-- Зазор до рубежа: точки по дорожке, без заливки. -->
          <path
            v-if="gap"
            :d="gap"
            class="gap"
            :class="{ dim: dimmed('goal'), on: sel === 'goal' }"
            fill="none"
            @click="pick('goal')"
          />

          <!-- Скобка выбора снаружи кольца. -->
          <path
            v-if="bracket && bracket.d"
            :key="sel"
            :d="bracket.d"
            class="bracket"
            :class="bracket.cls"
            fill="none"
          />

          <line v-if="goalTick" :x1="goalTick.x1" :y1="goalTick.y1" :x2="goalTick.x2" :y2="goalTick.y2" class="goal-tick" />
          <text v-if="goalTick" :x="goalTick.tx" :y="goalTick.ty" class="goal-txt" @click="pick('goal')">{{ Math.round(goal.age) }}</text>

          <!-- «Сейчас» — конец прожитого. -->
          <g v-if="now.on" class="now" @click="pick('fact')">
            <circle :cx="now.x" :cy="now.y" r="9" class="now-pulse" />
            <circle :cx="now.x" :cy="now.y" r="5" class="now-dot" />
          </g>

          <text :x="ends.a.x" :y="ends.a.y" class="end">0</text>
          <text
            :x="ends.b.x"
            :y="ends.b.y"
            class="end"
            :class="{ 'end-goal': goalAtEnd, on: goalAtEnd && sel === 'goal' }"
            @click="goalAtEnd && pick('goal')"
          >{{ goalAtEnd ? Math.round(goal.age) : Math.round(END) }}</text>
        </svg>

        <!-- Середина циферблата — HTML поверх SVG: буквы чёткие на любом
             масштабе, и текст читается скринридером и дымом как текст. -->
        <div class="read" aria-live="polite">
          <Transition name="ro" mode="out-in">
            <div :key="sel" class="read-in">
              <div class="read-label">{{ readout.label }}</div>
              <div class="read-value up-digit">{{ readout.value }}</div>
              <div class="read-sub">{{ readout.sub }}</div>
            </div>
          </Transition>
        </div>
      </div>

      <div class="legend" role="group" aria-label="Что показать в середине прибора">
        <button
          v-for="it in LEGEND"
          :key="it.id"
          type="button"
          class="li"
          :class="{ on: sel === it.id }"
          :aria-pressed="sel === it.id ? 'true' : 'false'"
          @click="pick(it.id)"
        >
          <span class="li-top">
            <span class="sw" :class="it.sw" aria-hidden="true"></span>
            <span class="lb">{{ it.label }}</span>
          </span>
          <span class="lv up-digit">{{ it.value }}</span>
        </button>
      </div>
    </div>

    <div class="hd-r">
      <Transition name="ro" mode="out-in">
        <p :key="sel" class="say">{{ SAY[sel] || SAY.cur }}</p>
      </Transition>

      <p class="note">
        Все числа здесь — среднее для людей с похожими анализами. Это не срок человека и не дата.
      </p>

      <p v-if="horizon.old_picture" class="stale">{{ horizon.old_picture_note }}</p>

      <div v-if="extra" class="stat">
        <span class="stat-lw">
          <span class="stat-l">Экстра-годы</span>
          <span class="stat-s">столько можно добавить к прогнозу</span>
        </span>
        <!-- Диапазон слева от числа (Д-66): «+6,4» встаёт по правому краю, и
             строка читается ровно — подпись слева, число справа, как в Треке. -->
        <span class="stat-r up-digit">{{ ru(extra.years_lo) }}–{{ ru(extra.years_hi) }}</span>
        <span class="stat-v up-digit">+{{ ru(extra.years) }}</span>
      </div>

      <!-- ⛔ Зазор идёт вместе с тем, что с ним делать (канон Д-40, следствие 1). -->
      <div v-if="goal && !goal.reached_by_plan" class="gapcard">
        <div class="gtop">
          <span class="gl">Между планом и рубежом</span>
          <span class="gv up-digit">{{ goal.gap_label }} <i>лет</i></span>
        </div>
        <p class="gn">
          Столько лет до цели пока не даёт ни один известный способ. Сюда входит то,
          что ещё не измерено, и то, чего пока не знает наука. {{ person.author ? 'Для меня это' : 'Это' }}
          рабочее задание: с новыми анализами разрыв сужается.
        </p>
      </div>
      <div v-else-if="goal" class="gapcard">
        <span class="gl">Рубеж {{ Math.round(goal.age) }} достижим, если выполнить план.</span>
      </div>

      <p v-if="goal" class="own">
        [ВАЖНО] Рубеж <b>{{ Math.round(goal.age) }}</b> поставлен {{ person.author ? 'моим решением' : `решением ${person.gen}` }},
        расчёт его не выводил. Ни один коэффициент расчёта под него не подобран, иначе этой
        цифре нельзя было бы верить.
      </p>
    </div>
  </div>
</template>

<style scoped>
.hd { text-align: left; }

.dial {
  position: relative;
  max-width: 340px;
  margin: 0 auto;
}
.svg { display: block; width: 100%; height: auto; overflow: visible; }

.track { stroke: var(--surface-2); }
.tick { stroke: var(--text-muted); stroke-width: 1.5; stroke-linecap: round; opacity: 0.4; }

.seg { cursor: pointer; transition: opacity 0.35s ease; }
.seg.dim { opacity: 0.32; }
.is-settled .seg.breath:not(.dim) { animation: hd-breathe 4.2s ease-in-out infinite; }
@keyframes hd-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.74; }
}

/* Точки зазора: круглый конец штриха нулевой длины — ровная точка в любом
   движке, без зависимости от длины пути. */
.gap {
  stroke: var(--wk-target);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 0 9;
  cursor: pointer;
  transition: opacity 0.35s ease, stroke-width 0.25s ease;
}
.gap.dim { opacity: 0.4; }
.gap.on { stroke-width: 6.5; }

.bracket {
  stroke-width: 3;
  stroke-linecap: round;
  pointer-events: none;
  animation: hd-bracket 0.35s ease both;
}
.b-lived { stroke: var(--wk-lived); }
.b-cur { stroke: var(--action-text); }
.b-plan { stroke: var(--wk-target); }
@keyframes hd-bracket { from { opacity: 0; } to { opacity: 1; } }

.goal-tick { stroke: var(--text); stroke-width: 3; stroke-linecap: round; }
.goal-txt { fill: var(--text); font-size: 13px; font-weight: 700; text-anchor: middle; cursor: pointer; }

.now { cursor: pointer; animation: hd-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; transform-box: fill-box; transform-origin: center; }
.now-dot { fill: var(--text); stroke: var(--wk-lived); stroke-width: 2.5; }
.now-pulse { fill: var(--wk-lived); opacity: 0; transform-box: fill-box; transform-origin: center; }
.is-settled .now-pulse { animation: hd-pulse 2.4s ease-out infinite; }
@keyframes hd-pop { from { transform: scale(0.2); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes hd-pulse {
  0% { opacity: 0.5; transform: scale(0.45); }
  100% { opacity: 0; transform: scale(1.8); }
}

.end { fill: var(--text-muted); font-size: 11px; text-anchor: middle; font-variant-numeric: tabular-nums; }
.end-goal {
  fill: var(--text);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.4s ease, fill 0.2s ease;
}
.is-settled .end-goal { opacity: 1; }
.end-goal.on { fill: var(--sig-blocked-ink); }

/* Середина циферблата. */
.read {
  position: absolute;
  left: 50%;
  top: calc(160 / 282 * 100%);
  width: 64%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.read-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.read-value {
  margin-top: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(44px, 14vw, 58px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.035em;
  color: var(--text);
}
.read-sub { margin-top: 6px; font-size: 12.5px; line-height: 1.3; color: var(--text-muted); }

.ro-enter-active, .ro-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.ro-enter-from { opacity: 0; transform: translateY(4px); }
.ro-leave-to { opacity: 0; transform: translateY(-4px); }

/* Легенда-переключатель: как сегменты Трека, выбранный — поднятый слой. */
.legend {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  background: var(--bg);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
}
.li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 0;
  min-height: 56px;
  padding: 8px 9px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}
.li.on { background: var(--surface-2); box-shadow: inset 0 1px 0 var(--rim-glow); }
.li:focus-visible { outline: 2px solid var(--action-text); outline-offset: 1px; }
.li-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.lb { font-size: 11.5px; line-height: 1; color: var(--text-muted); white-space: nowrap; }
.li.on .lb { color: var(--text-secondary); }
.lv { font-size: 16px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; white-space: nowrap; }
.sw { width: 11px; height: 11px; border-radius: 3px; display: block; flex: 0 0 auto; }
.sw.lived { background: var(--wk-lived); }
.sw.target { background: var(--wk-target); }
.sw.hatch-a { background: repeating-linear-gradient(45deg, var(--wk-lived) 0 3px, var(--wk-ahead) 3px 6px); }
/* Образец цели повторяет знак на дуге: точки зазора. */
.sw.goal {
  border-radius: 0;
  background: radial-gradient(circle, var(--wk-target) 0 1.6px, transparent 1.9px) 0 50% / 4.5px 100% repeat-x;
}

.say {
  margin: 14px 2px 0;
  min-height: 4.5em;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--text-secondary);
}
.note { margin: 6px 2px 0; font-size: 12.5px; line-height: 1.45; color: var(--text-muted); }
.stale {
  margin: 12px 0 0; font-size: 12.5px;
  color: var(--sig-watch-ink); background: var(--sig-watch-fill);
  border-radius: 10px; padding: 7px 10px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.stat-lw { flex: 1 1 auto; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.stat-s { font-size: 12px; color: var(--text-muted); }
.stat-l {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.stat-v { flex: 0 0 auto; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); white-space: nowrap; }
.stat-r {
  flex: 0 0 auto; padding: 3px 9px; border-radius: 999px;
  background: var(--surface-2);
  font-size: 12.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;
}

/* Зазор — карточка «Важно» Трека, только фиолетовая. */
.gapcard {
  margin-top: 16px;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid var(--sig-blocked);
  background: var(--sig-blocked-fill);
}
.gtop { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.gl { font-size: 13px; color: var(--sig-blocked-ink); }
/* «Между планом и рубежом» — заголовком карточки (Д-66: «крупнее и жирнее»). */
.gtop .gl { font-size: 16px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
.gv { flex: 0 0 auto; font-size: 26px; font-weight: 700; color: var(--sig-blocked-ink); white-space: nowrap; }
.gv i { font-style: normal; font-size: 13px; font-weight: 500; }
.gn { margin: 8px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--sig-blocked-ink); }

.own { margin: 12px 2px 0; font-size: 12px; line-height: 1.45; color: var(--text-muted); }
.own b { color: var(--text); }

@media (min-width: 960px) {
  .hd {
    display: grid;
    grid-template-columns: minmax(320px, 380px) 1fr;
    column-gap: 40px;
    align-items: center;
  }
  .say { margin-top: 0; }
  .hd.hd-narrow { display: block; }
  .hd.hd-narrow .say { margin-top: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  .seg, .gap, .end-goal { transition: none; }
  .is-settled .seg.breath:not(.dim), .is-settled .now-pulse, .now, .bracket { animation: none; }
  .ro-enter-active, .ro-leave-active { transition: none; }
}
</style>
