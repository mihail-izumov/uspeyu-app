<script setup>
/*
  ГЛАВНАЯ «УСПЕЮ» — страница до входа (Д-63, 15.10.2026; правки Д-64 в тот же день).

  Слово владельца (Д-63): «переделай дизайн по текущим стандартам Ранскеила —
  смотри приложение Трек и особенно его дашборды, лендинг Ультры и /join —
  собери всё в незабываемый интерактивный опыт. Делай только для главной,
  внутри после кнопки не трогай».

  Откуда что взято:
    · холст, первый экран, стеклянная плашка, синяя плашка, капсула подвала,
      шторки — лендинг Ультры (`ultra.runscale.ru`, `.vitepress/lp/`);
    · прибор «Горизонт» и строки «что дальше» — дашборды Трека;
    · аккордеон метода с прописными строками — блок «Важно.» на /join;
    · окно письма — легенда Ротора (`gderost/docs/пмк/ПМК.html`, D-1381).

  ── ПРАВКИ ВЛАДЕЛЬЦА 15.10.2026, 14:48 (Д-64) — что где сделано ───────────
    1. анимация круга                → `HorizonDial.vue` (второй заход)
    2. знак навыворот на тёмном       → `BrandMark` `inverse`, генератор
    3, 17. «Горизонт Михаила» крупно по центру, протокол и письмо над
       заголовком                     → секция `#gorizont`
    4. ни слова об устройстве экрана  → тексты прибора, календаря, разделов
    5. «решением Михаила»             → `HorizonDial.vue`, дым
    6. «Как читать» и версии шторкой Ультры, письмо легендой Ротора
                                      → `LandingSheet.vue`, `LetterLegend.vue`
    7. «Фитнес-трекер» вместо спортчасов, 8. «кости и карты» над сравнением
    9. ровная легенда календаря       → `.lp-cal :deep(...)` ниже
   10. телеметрия свёрнута в одну строку свежести под заголовком прибора
   11. бейджа «черновик» на главной нет
   12. в синей плашке — знак с одной буквой, без слова
   14. в подвале — «Ранскеил для бизнеса» и бейдж «Успею · версия»
   15. почта уходит в Google Таблицу → `LeadCapture.vue`
   16. тексты пропущены через humanizer

  ⚠⚠ ЭТО ОТДЕЛЬНЫЙ ЭКРАН, А НЕ ПРАВКА `PublicScreen.vue`. Тот же экран
  показывается внутри контура вкладкой «Горизонт» — правка его задела бы то,
  что после «Войти», а это владелец трогать запретил.

  ⚠⚠ Д-71 (15.10.2026, 21:00): ЭТОТ ЖЕ ЭКРАН — ВКЛАДКА «ГОРИЗОНТ» ВНУТРИ
  КАБИНЕТА, проп `inside`. Слово владельца на вопрос «сделать на её месте то
  же, что сейчас на главной?» — «сделай». Один экран, а не копия: копия
  разошлась бы с главной в первую же правку текста. Внутри тема светлая
  (Д-70) — набор `uspeyu-light` вместо `uspeyu-dark`, и снято то, что внутри
  не работает или говорит неправду:
    · своя шапка с «Войти» и тёмный титан под страницей — у кабинета своя
      шапка и свой холст, страница не трогает подложку документа;
    · плашка почты и кнопка «Узнать свой горизонт» в синей плашке — человек
      уже вошёл, звать его оставить почту некому;
    · строка с замком «Кнопка «Войти» наверху ведёт туда» — заменена строкой
      о том, где кабинет внутри;
    · шторки — светлые общие (`BottomSheet`), письмо — та же легенда Ротора.
  Режим главной (`inside` = false) этой правкой не изменён: вычисленные
  стили её элементов до и после совпадают.

  ⛔ Каждое поле на экране — из `public.json` по docs/PUBLIC-WHITELIST.md §1.

  ⛔ СЛОВА, КОТОРЫХ НА СТРАНИЦЕ ДО ВХОДА БЫТЬ НЕ МОЖЕТ, — закрытый список
  дыма (PUBLIC-WHITELIST §2). Письмо рендерится только открытым.
*/
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BottomSheet from '../components/BottomSheet.vue'
import LifeCalendar from '../components/LifeCalendar.vue'
import PoweredBy from '../components/PoweredBy.vue'
import ReadingBlocks from '../components/ReadingBlocks.vue'
import TitanLayer from '../components/titan/TitanLayer.vue'
import HeroMark from '../components/landing/HeroMark.vue'
import HorizonDial from '../components/landing/HorizonDial.vue'
import LandingHeader from '../components/landing/LandingHeader.vue'
import LandingSheet from '../components/landing/LandingSheet.vue'
import LeadCapture from '../components/landing/LeadCapture.vue'
import LetterLegend from '../components/landing/LetterLegend.vue'
import { plural, usePublicData } from '../composables/useData.js'
import { useProfile } from '../composables/useProfile.js'

const props = defineProps({
  pub: { type: Object, default: null },
  /* Д-71: вкладка «Горизонт» внутри кабинета — светлая, без своей шапки,
     без почты и без тёмного холста документа. */
  inside: { type: Boolean, default: false },
})
const emit = defineEmits(['enter'])
/* Шторки: на главной — тёмные, как у Ультры; внутри — светлые общие. */
const Sheet = computed(() => (props.inside ? BottomSheet : LandingSheet))

const ready = computed(() => !!(props.pub && props.pub.horizon))
const { publicFailed } = usePublicData()
const H = computed(() => props.pub?.horizon || null)

/* ── первый экран: фраза и синяя строка ───────────────────────────────── */
const titleLines = computed(() => {
  const t = props.pub?.product?.welcome || 'Успею 87'
  return t.split('. ').map((l, i, a) => (i < a.length - 1 ? `${l}.` : l))
})

/* ── протокол ─────────────────────────────────────────────────────────── */
const { protocols: PROTOCOLS, current, name: whoName, select } = useProfile()
const who = computed(() => current.value.id)
/* Чей расчёт — словами, в нужных падежах (Д-64 «Горизонт Михаила»; Д-65:
   «всё ещё непонятно, что на странице данные Михаила и это его прогноз»).
   Протоколы Марии и Павла пока закрыты, но формы имён заведены сразу. */
const PERSON = {
  mikhail: { name: 'Михаил', gen: 'Михаила', dat: 'Михаилу', full: 'Михаил Изюмов', fullGen: 'Михаила Изюмова', ini: 'МИ', author: true },
  maria: { name: 'Мария', gen: 'Марии', dat: 'Марии', full: 'Мария', fullGen: 'Марии', ini: 'М' },
  pavel: { name: 'Павел', gen: 'Павла', dat: 'Павлу', full: 'Павел', fullGen: 'Павла', ini: 'П' },
}
const person = computed(() => PERSON[who.value] || { name: whoName.value, gen: whoName.value, dat: whoName.value, full: whoName.value, fullGen: whoName.value, ini: whoName.value.slice(0, 1) })
const whoGen = computed(() => person.value.gen)
const whoFull = computed(() => person.value.full)
const whoInitials = computed(() => person.value.ini)
const ownerLine = computed(() => {
  const l = Math.floor(H.value?.goal?.lived ?? 0)
  const age = l ? `${l} ${plural(l, 'год', 'года', 'лет')}` : ''
  return [age, person.value.author ? 'автор метода «Успею 87»' : ''].filter(Boolean).join(', ')
})

/* ── ГОЛОС И ИМЯ (Д-66, слово владельца 15.10.2026, 17:50) ─────────────────
   «Надо решить, от лица кого сайт, предлагаю везде писать „я“ и „моё“» —
   сайт говорит голосом Михаила. Заголовок «Горизонт Михаила.» остаётся
   именем, как подпись под портретом, а всё, что под ним, — от первого лица.
   Имя продукта на странице — «Успею 87» («замени везде „Успею“ на „Успею 87“»).
   «Основатель Ранскеил» — ссылкой в новом окне на страницу Ранскеила, ту же,
   что в подвале («Ранскеил для бизнеса»). */
const RUNSCALE_URL = 'https://ultra.runscale.ru'
/* «Успею 87» не рвётся по строкам: «Успею» в конце одной строки и «87»
   в начале следующей читаются как два разных слова. Неразрывный пробел
   ставится при показе — в мастерах текста он был бы невидимой ловушкой. */
const NB = (t) => String(t || '').replace(/Успею 87/g, 'Успею\u00a087')
const sheet = ref('')
const isOpen = (k) => sheet.value === k
function pick(p) { if (select(p)) sheet.value = '' }

const version = computed(() => (props.pub?.versions && props.pub.versions[0]) || null)

/* ── прибор ───────────────────────────────────────────────────────────── */
const sel = ref('cur')
const dialCard = ref(null)
function goDial(id) {
  sel.value = id
  const el = dialCard.value
  if (!el) return
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
}

/* ── свежесть данных: одна строка под заголовком прибора (Д-64, п. 10) ──
   Возраст анализов решает, насколько верить прогнозу, поэтому он стоит рядом
   с ним. С Д-65 — без точки и словами «последние анализы»: «данные» и
   «забор» — язык контура, а не читателя. */
const fresh = computed(() => {
  const d = props.pub?.telemetry?.draw_days
  if (d == null) return { kind: 'alarm', text: 'анализов пока нет' }
  const n = `${d} ${plural(d, 'день', 'дня', 'дней')}`
  if (d <= 180) return { kind: 'ok', text: `последние анализы — ${n} назад` }
  if (d <= 548) return { kind: 'watch', text: `последние анализы — ${n} назад` }
  return { kind: 'alarm', text: `последние анализы — ${n} назад, картина устарела` }
})
/* Версия расчёта вместо «методика gorizont-1.1» (Д-65, п. 7). Номер — тот же
   `horizon.method_version`, только без служебного префикса. */
const methodLabel = computed(() => `версия расчёта ${String(H.value?.method_version || '').replace(/^gorizont-/, '')}`)

/* ── ТОЧКИ (Д-65, п. 1: «убери точки везде, где они не нужны, и поставь, где
   нужны»). Правило одно на всю главную:
     · заголовки разделов и строки под ними — фразы, с точкой в конце, как
       «Важно.» на /join и заголовки Ультры;
     · подписи, кнопки, чипы, вкладки, заголовки карточек и тезисов — без
       точки, и внутри них тоже не бывает двух фраз;
     · подписи-пояснения с маленькой буквы (под числом, под «Экстра-годы») —
       без точки; тексты карточек и объяснения — предложения с точкой. */

/* ── «С чем сравнить» — приём главной Ультры (блок сравнений, UD-137) ────
   ⛔ Слова — только из канона (`docs/KANON-uspeyu.md`): «этаж над
   спортчасами, а не конкурент» (Д-40) и «важно не только то, что заполнено,
   но и то, что пусто» (Д-58). Вкладка «Фитнес-трекер» — слово владельца
   15.10.2026 вместо «Спортчасов» (Д-64). */
const CMP = {
  folder: {
    tab: 'Папка анализов',
    lead: 'Папка с анализами у меня тоже была: в ней лежало то, что я успел сдать. «Успею 87» показывает ещё и пробелы: что давно пора пересдать и что я не сдавал ни разу.',
    cards: [
      { k: 'Пробелы', t: 'Видно, чего нет', s: 'Пустые места в анализах говорят о здоровье не меньше заполненных.' },
      { k: 'Годы', t: 'Вся история', s: 'Бланк показывает один день. «Успею 87» видит мои анализы за годы и замечает, куда они меняются.' },
    ],
  },
  tracker: {
    tab: 'Фитнес-трекер',
    lead: 'Трекер отвечает на вопрос дня, «Успею 87» — на вопрос жизни.',
    cards: [
      { k: 'Масштаб', t: 'Годы вместо дня', s: 'Трекер считает готовность к тренировке, «Успею 87» — сколько лет впереди и сколько можно добавить.' },
      { k: 'Связка', t: 'Работают вместе', s: 'Трекер остаётся у меня на руке, а «Успею 87» смотрит на годы вперёд.' },
    ],
  },
}
const cmp = ref('folder')

/* ── «Анализы и врачи» — что внутри кабинета (Д-66) ──────────────────────
   Слово владельца 15.10.2026: «добавь, что внутри — личный кабинет Михаила
   со всей аналитикой и данные для врачей, задачи по здоровью… опиши, что
   есть, чтобы готовиться к чекапам и системно их проводить, чтобы разговоры
   с врачами были полезнее… разверни блок про анализы и врачей».
   ⛔ Здесь описано, ЧТО умеет кабинет, а не что в нём лежит: ни одного
   показателя, вопроса или задачи поимённо (PUBLIC-WHITELIST §2), и ни
   одного слова из закрытого списка дыма. */
const DOCS = [
  { i: 'stack', t: 'Все анализы в одном месте', s: 'Результаты за годы из разных лабораторий сведены к одним единицам, поэтому их можно сравнивать между собой.' },
  { i: 'clock', t: 'Что пора сдать', s: 'Кабинет показывает, какие анализы устарели, каких не хватает и когда их пересдавать. Так чекап получается полным.' },
  { i: 'page', t: 'Выписка к врачу', s: 'Перед приёмом собирается одна страница: как менялись показатели за годы, что показать и какие вопросы задать.' },
  { i: 'chat', t: 'Вопросы и ответы врачей', s: 'Я записываю вопросы к врачам и их ответы дословно, поэтому между визитами ничего не теряется.' },
  { i: 'check', t: 'Задачи со сроками', s: 'Каждая рекомендация врача становится задачей с датой: сдать, записаться, пересдать. Невыполненное видно сразу.' },
  { i: 'week', t: 'Неделя за неделей', s: 'Раз в неделю я отмечаю самочувствие и события. Так видно, что с чем связано, и в кабинете врача не приходится вспоминать.' },
]

/* ── календарь: строка данных под заголовком ─────────────────────────── */
const ru = (n) => Number(n).toLocaleString('ru-RU')
const calLine = computed(() => {
  const w = props.pub?.weeks
  if (!w) return ''
  const who = person.value.author ? 'меня' : whoGen.value
  return `За плечами у ${who} ${ru(w.lived)} ${plural(w.lived, 'неделя', 'недели', 'недель')}, по прогнозу впереди ещё ${ru(w.to_current_lo)}–${ru(w.to_current_hi)}.`
})

/* ── метод: аккордеон ─────────────────────────────────────────────────── */
const items = computed(() => props.pub?.manifest?.items || [])
const NUM = ['Ноль', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять']
const methodLine = computed(() => {
  const n = items.value.length
  const word = NUM[n] || String(n)
  return `${word} ${plural(n, 'правило', 'правила', 'правил')}, по которым считает «Успею 87».`
})
const readSections = computed(() => ((props.pub?.onboarding && props.pub.onboarding.sections) || [])
  .map((x) => ({ ...x, body: NB(x.body) })))
const openItem = ref(-1)
function toggle(i) { openItem.value = openItem.value === i ? -1 : i }

/* ── почта: синяя плашка ведёт к полю ─────────────────────────────────── */
const capture = ref(null)
function toCapture() {
  const el = capture.value
  if (!el) return
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  const input = el.querySelector('input[type="email"]')
  if (input) setTimeout(() => input.focus({ preventScroll: true }), reduced ? 0 : 450)
}

/* ── прокрутка: свет за знаком и стеклянная капсула ───────────────────── */
const hero = ref(null)
const heroFade = ref(1)
const compact = ref(false)
let reduced = false
let raf = 0
function paint() {
  raf = 0
  const el = hero.value
  const y = window.scrollY || 0
  if (!el) { compact.value = y > 240; return }
  const r = el.getBoundingClientRect()
  const top = r.top + y
  const mid = Math.max(1, top + r.height * 0.32)
  const k = Math.min(1, Math.max(0, 1 - y / mid))
  heroFade.value = k * k * (3 - 2 * k)
  compact.value = y > top + r.height - 80
}
function onScroll() { if (!raf) raf = requestAnimationFrame(paint) }
function toTop() { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }) }

/* ── проявление блоков при прокрутке ──────────────────────────────────── */
let io = null
const vReveal = {
  mounted(el) {
    if (!io) { el.classList.add('rv-in'); return }
    el.classList.add('rv')
    io.observe(el)
  },
  unmounted(el) { io?.unobserve(el) },
}

/* ── холст документа: тёмный, пока стоит главная ──────────────────────── */
let prevTheme = null
function setCanvas(on) {
  const root = document.documentElement
  const meta = document.querySelector('meta[name="theme-color"]')
  if (on) {
    root.classList.add('up-landing')
    if (meta) {
      prevTheme = meta.getAttribute('content')
      const c = getComputedStyle(root).getPropertyValue('--lp-canvas').trim()
      if (c) meta.setAttribute('content', c)
    }
  } else {
    root.classList.remove('up-landing')
    if (meta && prevTheme) meta.setAttribute('content', prevTheme)
  }
}

if (typeof window !== 'undefined') {
  reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!reduced && typeof window.IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in')
          io.unobserve(e.target)
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
  }
}

onMounted(() => {
  /* Внутри кабинета страница не хозяйка документа: холст, строку состояния
     и прокрутку держит оболочка (Д-71). */
  if (props.inside) return
  setCanvas(true)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  paint()
})
onBeforeUnmount(() => {
  if (!props.inside) {
    setCanvas(false)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})
</script>

<template>
  <div class="lp" :class="{ in: inside }" :data-theme="inside ? 'uspeyu-light' : 'uspeyu-dark'">
    <div v-if="!inside" class="lp-bg" aria-hidden="true">
      <TitanLayer seed="uspeyu-lp" />
    </div>

    <LandingHeader v-if="!inside" :compact="compact" @enter="emit('enter')" @top="toTop" />

    <main class="lp-main">
      <!-- ═══ Первый экран ═══ -->
      <section ref="hero" class="hero">
        <HeroMark :fade="heroFade" :inverse="!inside" />

        <template v-if="ready">
          <h1 class="hero-title">
            <span v-for="l in titleLines" :key="l" class="hero-line">{{ l }}</span>
          </h1>
          <p class="hero-lead">
            <a href="#gorizont" class="hl" @click.prevent="goDial('cur')">Горизонт {{ whoGen }} <span class="u up-digit">{{ H.current.label }}</span></a><template v-if="H.goal">, <a href="#gorizont" class="hl" @click.prevent="goDial('goal')">цель <span class="u up-digit">{{ Math.round(H.goal.age) }}</span></a></template>.
          </p>
          <!-- Что это за сайт — одним абзацем простыми словами (Д-65, п. 6 и 12),
               голосом Михаила (Д-66). -->
          <p class="hero-sub">
            «Успею&nbsp;87» по анализам за несколько лет считает, сколько в среднем живут
            люди с такими данными и сколько к этому можно добавить. Ниже&nbsp;— мой&nbsp;расчёт.
          </p>
          <!-- Подпись — своей строкой, с воздухом от абзаца (Д-69, слово
               владельца: «поставь на новую строку чуть через расстояние»). -->
          <p class="hero-sig">
            Я Михаил Изюмов, основатель
            <a class="ext" :href="RUNSCALE_URL" target="_blank" rel="noopener">Ранскеил</a>.
          </p>
        </template>
        <!-- Д-74: пока данные в пути, под знаком ничего не пишется — место
             держит пустой блок. «Первый прогон готовится» — только когда файл
             пришёл без расчёта; сбой загрузки назван сбоем. До Д-74 эта ветка
             стояла на каждой загрузке и мелькала вместо «Ранскеил теперь и
             для жизни.». -->
        <template v-else-if="pub">
          <h1 class="hero-title"><span class="hero-line">Успею&nbsp;87</span></h1>
          <p class="hero-sub">Первый прогон готовится.</p>
        </template>
        <template v-else-if="publicFailed">
          <h1 class="hero-title"><span class="hero-line">Успею&nbsp;87</span></h1>
          <p class="hero-sub">Расчёт не загрузился. Обновите страницу.</p>
        </template>
        <div v-else class="hero-wait" aria-hidden="true"></div>
      </section>

      <template v-if="ready">
        <!-- ═══ Плашка почты — стекло в кольце, как стартовая панель Ультры ═══ -->
        <section v-if="!inside" ref="capture" v-reveal class="wrap start">
          <div class="glass">
            <span class="glass-ring" aria-hidden="true"></span>
            <span class="glass-core" aria-hidden="true"></span>
            <div class="start-in">
              <svg class="start-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
                <path d="M3.8 7 12 13l8.2-6" />
              </svg>
              <div class="start-text">
                <p class="start-title">Узнать свой горизонт</p>
                <!-- Кому это (Д-66, слово владельца 15.10.2026, 17:51): «Успею&nbsp;87» —
                     некоммерческая программа для сотрудников и друзей Ранскеил. -->
                <p class="start-line">
                  «Успею&nbsp;87» — некоммерческая программа для сотрудников и друзей
                  <a class="ext" :href="RUNSCALE_URL" target="_blank" rel="noopener">Ранскеил</a>.
                  Оставьте почту, и я напишу, когда смогу посчитать и ваш горизонт.
                </p>
              </div>
            </div>
            <LeadCapture class="start-form" />
          </div>
        </section>

        <!-- ═══ Горизонт Михаила (Д-64, п. 3 и 17) ═══
             Протокол и письмо стоят над заголовком: это «чей» и «зачем»,
             а заголовок отвечает «что». Имя в заголовке меняется вместе с
             протоколом. -->
        <section id="gorizont" class="wrap sec">
          <div v-reveal class="gz-top">
            <button type="button" class="who" @click="sheet = 'who'">
              {{ whoName }}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6.5 8 10 4.5 13.5 8" /><path d="M6.5 12 10 15.5 13.5 12" />
              </svg>
            </button>
            <button type="button" class="letter-go" @click="sheet = 'letter'">
              <!-- Значок «титры» — из шапки Ротора (D-1383): четыре строки
                   сужаются и тают кверху, по наведению плывут вверх. -->
              <svg class="crawl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
                <g class="crawl-g">
                  <path d="M2.5 20H21.5" stroke-width="2.2" />
                  <path d="M5 15.5H19" stroke-width="1.9" opacity=".78" />
                  <path d="M7.2 11.3H16.8" stroke-width="1.6" opacity=".55" />
                  <path d="M9.2 7.6H14.8" stroke-width="1.3" opacity=".35" />
                </g>
              </svg>
              Читать письмо от {{ whoGen }}
            </button>
          </div>

          <h2 v-reveal class="sec-title">Горизонт {{ whoGen }}.</h2>
          <p v-reveal class="sec-blue">Расчёт по моим анализам: сколько прожито, чего ждать и сколько можно добавить.</p>
          <p v-reveal class="chips">
            <span class="chip" :class="fresh.kind">{{ fresh.text }}</span>
            <span class="chip plain up-digit">{{ methodLabel }}</span>
          </p>

          <article ref="dialCard" v-reveal class="card dash">
            <!-- Чей расчёт — прямо на карточке, а не только в заголовке над ней:
                 карточку читают и без заголовка, когда к ней ведёт синяя строка. -->
            <div class="owner">
              <span class="owner-ini" aria-hidden="true">{{ whoInitials }}</span>
              <span class="owner-t">
                <span class="owner-n">{{ whoFull }}</span>
                <span class="owner-s up-digit">{{ NB(ownerLine) }}</span>
              </span>
            </div>
            <HorizonDial v-model="sel" :horizon="H" :person="person" :narrow="inside" />
          </article>

          <button v-reveal type="button" class="card row" @click="sheet = 'reading'">
            <span class="row-t">
              <span class="row-h">Как читать Горизонт</span>
              <span class="row-s">Откуда берутся эти числа и как к ним относиться</span>
            </span>
            <svg class="row-a" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l6 6-6 6" /></svg>
          </button>
        </section>

        <!-- ═══ Сравнить с — как блок сравнений на главной Ультры ═══
             Д-57: формула живёт в языке и не переходит в картинку. С 15.10
             она стоит над сравнением (Д-64, п. 8). -->
        <section class="wrap sec cmp">
          <p v-reveal class="quote">Мы не играем в кости —<br />мы считаем карты.</p>
          <p v-reveal class="cmp-l">С чем сравнить «Успею&nbsp;87»</p>
          <div v-reveal class="seg2" role="group" aria-label="С чем сравнить">
            <button
              v-for="(c, id) in CMP"
              :key="id"
              type="button"
              class="seg2-b"
              :class="{ on: cmp === id }"
              :aria-pressed="cmp === id ? 'true' : 'false'"
              @click="cmp = id"
            >{{ c.tab }}</button>
          </div>
          <Transition name="cf" mode="out-in">
            <div :key="cmp" class="cmp-body">
              <p class="cmp-lead">{{ NB(CMP[cmp].lead) }}</p>
              <div class="cmp-cards">
                <div v-for="c in CMP[cmp].cards" :key="c.t" class="card cmp-card">
                  <span class="cmp-k">{{ c.k }}</span>
                  <span class="cmp-t">{{ c.t }}</span>
                  <span class="cmp-s">{{ NB(c.s) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </section>

        <!-- ═══ Анализы и врачи — что внутри кабинета (Д-66) ═══
             Строки — как «Что дальше» на «Сегодня» Трека: значок, заголовок,
             одна-две фразы. -->
        <section class="wrap sec">
          <h2 v-reveal class="sec-title">Анализы и врачи.</h2>
          <p v-reveal class="sec-blue">
            Внутри «Успею&nbsp;87» — мой личный кабинет. С ним я готовлюсь к чекапам
            и прохожу их по системе, а разговор с врачом выходит полезнее.
          </p>
          <div v-reveal class="card docs">
            <div v-for="d in DOCS" :key="d.t" class="doc">
              <span class="doc-i" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <template v-if="d.i === 'stack'"><path d="M12 3 3 7.5 12 12l9-4.5L12 3z" /><path d="M3 12l9 4.5 9-4.5" /><path d="M3 16.5 12 21l9-4.5" /></template>
                  <template v-else-if="d.i === 'clock'"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></template>
                  <template v-else-if="d.i === 'page'"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 15.5h5" /></template>
                  <template v-else-if="d.i === 'chat'"><path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4A8 8 0 1 1 20 12z" /><path d="M9 11h6M9 14h4" /></template>
                  <template v-else-if="d.i === 'check'"><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M8.5 12.2l2.4 2.4 4.6-5" /></template>
                  <template v-else><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></template>
                </svg>
              </span>
              <span class="doc-t">
                <span class="doc-h">{{ d.t }}</span>
                <span class="doc-s">{{ d.s }}</span>
              </span>
            </div>
          </div>
          <p v-if="!inside" v-reveal class="docs-lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
            Кабинет закрыт паролем, потому что в нём мои медицинские подробности. Кнопка «Войти»
            наверху ведёт туда. На экстренный случай пароль есть у моих родственников, Марии и Максима.
          </p>
          <!-- Внутри кабинета строка говорит, где всё это, а не как сюда попасть
               (Д-71). Здесь уже за паролем, поэтому разделы названы прямо. -->
          <p v-else v-reveal class="docs-lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
            Всё это — во вкладках внизу: «Заряд», «День» и «Данные». Пароль от кабинета
            на экстренный случай есть у моих родственников, Марии и Максима.
          </p>
        </section>

        <!-- ═══ Календарь жизни ═══ -->
        <section class="wrap sec">
          <h2 v-reveal class="sec-title">Календарь жизни.</h2>
          <p v-reveal class="sec-blue">{{ calLine }}</p>
          <div v-reveal class="card lp-cal">
            <LifeCalendar
              :born="pub.weeks.born"
              :lived="pub.weeks.lived"
              :to-current-lo="pub.weeks.to_current_lo"
              :to-current-hi="pub.weeks.to_current_hi"
              :to-target-hi="pub.weeks.to_target_hi"
              :reviewed="pub.weeks.reviewed"
            />
          </div>
        </section>

        <!-- ═══ Метод — аккордеон, как «Важно.» на /join ═══ -->
        <section v-if="items.length" class="wrap sec">
          <h2 v-reveal class="sec-title">Метод.</h2>
          <p v-reveal class="sec-muted">{{ NB(methodLine) }}</p>
          <div v-reveal class="card acc">
            <div v-for="(m, i) in items" :key="i" class="acc-item" :class="{ open: openItem === i }">
              <button
                type="button"
                class="acc-head"
                :aria-expanded="openItem === i ? 'true' : 'false'"
                @click="toggle(i)"
              >
                <span class="acc-t">{{ m.title }}</span>
                <svg class="acc-c" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
              </button>
              <div class="acc-body">
                <div class="acc-in"><p>{{ NB(m.text) }}</p></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Синяя плашка — как «От Трека до Ультры — одна команда.» ═══
             Знак целиком — число, буква и слово «Успею», со светом, кантом и
             наклоном, как на первом экране (Д-74, слово владельца 16.10.2026:
             «в синей плашке где лого внутри лого тоже надо писать успею»;
             прежнее Д-64, п. 12 «знак без слова» этим снято). -->
        <section class="wrap sec end">
          <div v-reveal class="blue">
            <HeroMark state="full" inverse width="clamp(160px, 46vw, 196px)" class="blue-mark" />
            <p class="motto">{{ pub.product.motto }}</p>
            <p class="author">{{ pub.product.author }}</p>
            <button v-if="!inside" type="button" class="blue-go" @click="toCapture">Узнать свой горизонт</button>
          </div>
        </section>

        <!-- ═══ Подвал — капсула, как у Ультры (Д-64, п. 14) ═══ -->
        <footer class="wrap foot">
          <div class="foot-pill">
            <a class="foot-link" href="https://ultra.runscale.ru" target="_blank" rel="noopener">
              Ранскеил для бизнеса
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
            <button v-if="version" type="button" class="ver" @click="sheet = 'versions'">
              Успею&nbsp;87 <span class="ver-n up-digit">{{ version.version }}</span>
            </button>
          </div>
          <!-- Посвящение (Д-68, слово владельца 15.10.2026: «добавь серым
               некрупно текст в самом низу… Вечная память: Изюмов Василий
               Лаврентьевич 1939–2026 (87 лет); если „вечная память“ слишком
               угрюмо — придумай другую»). «Памяти…» — обычная форма
               посвящения, без траурной интонации. -->
          <p class="memo up-digit">Памяти Василия Лаврентьевича Изюмова, 1939–2026 (87&nbsp;лет)</p>
        </footer>
      </template>
    </main>

    <!-- ═══ ШТОРКИ — как у лендинга Ультры; письмо — легендой Ротора ═══ -->
    <template v-if="ready">
      <component :is="Sheet" :open="isOpen('who')" title="Чей горизонт" @close="sheet = ''">
        <p class="who-p">
          Сейчас открыт мой расчёт. Я Михаил Изюмов, основатель
          <a class="ext" :href="RUNSCALE_URL" target="_blank" rel="noopener">Ранскеил</a>
          и автор метода «Успею&nbsp;87». Расчёты Марии и Павла появятся позже.
        </p>
        <ul class="whos">
          <li v-for="p in PROTOCOLS" :key="p.id">
            <button type="button" class="whorow" :class="{ off: p.soon, on: p.id === who }" :disabled="p.soon" @click="pick(p)">
              <span>{{ p.name }}</span>
              <span v-if="p.soon" class="soon">скоро</span>
              <span v-else-if="p.id === who" class="mark">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" /></svg>
              </span>
            </button>
          </li>
        </ul>
      </component>

      <LetterLegend :open="isOpen('letter')" @close="sheet = ''" />

      <component
        :is="Sheet"
        :open="isOpen('reading')"
        :title="(pub.onboarding && pub.onboarding.title) || 'Как читать Горизонт'"
        @close="sheet = ''"
      >
        <ReadingBlocks class="rd" :sections="readSections" />
      </component>

      <component :is="Sheet" :open="isOpen('versions')" title="Версии «Успею&nbsp;87»" @close="sheet = ''">
        <ol class="vers" :class="{ 'vers-in': inside }">
          <li v-for="(v, i) in pub.versions" :key="v.date + v.version" class="vr" :class="{ first: i === 0 }">
            <span class="vr-top">
              <span class="vr-n up-digit">{{ v.version }}</span>
              <span class="vr-d up-digit">{{ v.date.split('-').reverse().join('.') }}</span>
            </span>
            <p class="vr-t">{{ NB(v.text) }}</p>
          </li>
        </ol>
        <PoweredBy class="pb" />
      </component>
    </template>
  </div>
</template>

<style scoped>
.lp {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  overflow-x: hidden;
}
/* Слой титана выведен за края окна: под панелями браузера и при оттяжке
   страницы тоже титан, а не дыра (приём Ультры, UD-49). */
.lp-bg {
  position: fixed;
  inset: -12vh 0;
  z-index: 0;
  isolation: isolate;
  overflow: hidden;
  pointer-events: none;
  background: var(--titan-0);
}
.lp-main {
  position: relative;
  z-index: 1;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28px);
}

.wrap { max-width: 560px; margin: 0 auto; padding: 0 16px; box-sizing: border-box; }

/* ── первый экран ── */
.hero {
  max-width: 820px;
  margin: 0 auto;
  padding: 44px 22px 30px;
  text-align: center;
}
.hero-title {
  position: relative;
  z-index: 1;
  margin: 34px auto 0;
  max-width: 14ch;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(38px, 10.4vw, 72px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.hero-line { display: block; }
/* Место под заголовок, пока данные в пути: страница не прыгает, когда он встаёт. */
.hero-wait { min-height: 260px; }
.hero-lead {
  position: relative;
  z-index: 1;
  margin: 14px auto 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(24px, 6.4vw, 36px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: var(--action-text);
}
.hl { color: inherit; text-decoration: none; }
.hl:focus-visible { outline: 2px solid var(--action-text); outline-offset: 3px; border-radius: 6px; }
/* Черта — только под числами, тише текста (приём Ультры, UL-15). */
.u {
  background-image: linear-gradient(
    color-mix(in srgb, currentColor 45%, transparent),
    color-mix(in srgb, currentColor 45%, transparent)
  );
  background-repeat: no-repeat;
  background-size: 100% 2px;
  background-position: 0 100%;
  padding-bottom: 2px;
  transition: background-size 0.2s ease;
}
.hl:hover .u { background-image: linear-gradient(currentColor, currentColor); }
/* Ссылка внутри текста («основатель Ранскеил») — синим, с тихой чертой,
   открывается в новом окне. */
.ext {
  color: var(--action-text);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.ext:hover { text-decoration-color: currentColor; }
.ext:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; border-radius: 4px; }
.hero-sub {
  position: relative;
  z-index: 1;
  margin: 18px auto 0;
  max-width: 31rem;
  font-size: 16.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-secondary);
  text-wrap: pretty;
}
.hero-sig {
  position: relative;
  z-index: 1;
  margin: 16px auto 0;
  font-size: 16.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text);
}
.hero-note { margin: 10px 0 0; font-size: 12.5px; color: var(--text-muted); }

/* ── стеклянная плашка в кольце (StartPanel Ультры) ── */
.start { padding-top: 6px; }
.glass {
  --g-r: 26px;
  --g-ring: 9px;
  --g-gap: 2px;
  position: relative;
  isolation: isolate;
  border-radius: var(--g-r);
  padding: calc(var(--g-ring) + var(--g-gap) + 16px) calc(var(--g-ring) + var(--g-gap) + 14px);
  box-shadow: inset 0 1px 0 var(--rim-glow);
}
.glass-ring, .glass-core {
  position: absolute;
  z-index: -1;
  pointer-events: none;
  background-color: color-mix(in srgb, var(--surface) 30%, transparent);
  background-image: var(--lp-grain);
  background-size: 140px 140px;
  -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
}
.glass-ring {
  inset: 0;
  border: var(--g-ring) solid transparent;
  border-radius: var(--g-r);
  -webkit-mask: linear-gradient(var(--text) 0 0) padding-box, linear-gradient(var(--text) 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(var(--text) 0 0) padding-box, linear-gradient(var(--text) 0 0);
          mask-composite: exclude;
}
.glass-core {
  inset: calc(var(--g-ring) + var(--g-gap));
  border-radius: calc(var(--g-r) - var(--g-ring) - var(--g-gap));
  background-color: color-mix(in srgb, var(--surface) 48%, transparent);
}
.start-in { display: flex; align-items: flex-start; gap: 13px; }
.start-mark { flex: 0 0 auto; width: 30px; height: 30px; margin-top: 2px; color: var(--action-text); }
.start-text { min-width: 0; }
.start-title { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.25; letter-spacing: -0.01em; }
.start-line { margin: 4px 0 0; font-size: 15px; line-height: 1.4; color: var(--text-secondary); }
.start-form { margin-top: 16px; }
.start-form :deep(.up-field) { background: color-mix(in srgb, var(--bg) 60%, transparent); }

/* ── секции ── */
.sec { padding-top: 76px; scroll-margin-top: 80px; }
.sec-title {
  margin: 0;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(34px, 9vw, 52px);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.03em;
}
.sec-blue, .sec-muted {
  margin: 10px auto 0;
  max-width: 26rem;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  text-wrap: balance;
}
.sec-blue { color: var(--action-text); }
.sec-muted { color: var(--text-secondary); font-weight: 500; }

/* Карточка на титане: держится светлотой, а не обводкой (§8 стандарта),
   свет по верхней кромке. */
.card {
  margin-top: 22px;
  border-radius: 24px;
  padding: 18px;
  background: var(--lp-card);
  -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 var(--rim-glow), 0 24px 48px -28px var(--lp-shadow);
}

/* ── Горизонт Михаила: протокол и письмо над заголовком (Д-64) ── */
.gz-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 18px;
}
/* Капсула протокола — тёмный переключатель, как бизнес в шапке Трека. */
.who {
  display: inline-flex; align-items: center; gap: 3px;
  min-height: 38px; padding: 0 7px 0 12px;
  border: 1px solid var(--lp-glass-line); border-radius: 999px;
  background: var(--lp-glass); color: var(--text);
  -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
  font: inherit; font-size: 13px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  cursor: pointer;
}
.who svg { width: 15px; height: 15px; color: var(--text-muted); }
.who:active { background: var(--surface-2); }
/* «Читать письмо» — та же капсула стекла, синий текст и значок «титры». */
.letter-go {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 38px; padding: 0 13px 0 9px;
  white-space: nowrap;
  border: 1px solid var(--lp-glass-line); border-radius: 999px;
  background: var(--lp-glass); color: var(--action-text);
  -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
  font: inherit; font-size: 13.5px; font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.letter-go:hover { background: var(--surface-2); }
.crawl-ico { width: 20px; height: 20px; flex: 0 0 auto; display: block; }
.crawl-g { transform-box: fill-box; transform-origin: 50% 50%; }
/* Анимация значка — из Ротора один в один: по наведению строки плывут вверх
   (`pm-crawl-up`, 1,6 с). На телефоне наведения нет, поэтому там значок
   плывёт сам — реже, с паузой, чтобы не дёргать глаз. */
@media (prefers-reduced-motion: no-preference) {
  .letter-go:hover .crawl-g, .letter-go:focus-visible .crawl-g { animation: crawl-up 1.6s linear infinite; }
}
@media (prefers-reduced-motion: no-preference) and (hover: none) {
  .crawl-g { animation: crawl-up-idle 4.8s linear infinite; }
}
@keyframes crawl-up {
  0% { transform: translateY(3px); opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: translateY(-3px); opacity: 0; }
}
@keyframes crawl-up-idle {
  0% { transform: translateY(3px); opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 1; }
  33.3% { transform: translateY(-3px); opacity: 0; }
  33.4%, 100% { transform: none; opacity: 1; }
}
.who:focus-visible, .letter-go:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }

/* Свежесть данных и методика — чипы под синей строкой. */
.chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 14px 0 0; }
.chip {
  display: inline-flex; align-items: center; gap: 7px;
  min-height: 28px; padding: 0 12px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
}
.chip.ok { color: var(--sig-ok-ink); background: var(--sig-ok-fill); }
.chip.watch { color: var(--sig-watch-ink); background: var(--sig-watch-fill); }
.chip.alarm { color: var(--sig-alarm-ink); background: var(--sig-alarm-fill); }
.chip.plain { color: var(--text-secondary); background: var(--lp-glass); border: 1px solid var(--lp-glass-line); font-weight: 500; }

.dash { padding: 16px 16px 18px; scroll-margin-top: 90px; }
/* Чей расчёт — шапка карточки, как профиль в шапке дашбордов Трека. */
.owner { display: flex; align-items: center; gap: 11px; padding: 2px 2px 12px; margin-bottom: 6px; border-bottom: 1px solid var(--line); }
.owner-ini {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; flex: 0 0 38px; border-radius: 999px;
  background: var(--action); color: var(--action-ink);
  font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
}
.owner-t { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.owner-n { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
.owner-s { font-size: 13px; color: var(--text-muted); }

/* ── «Как читать Горизонт» — строка-карточка, как «Что дальше» в Треке ── */
.row {
  display: flex; align-items: center; gap: 12px; width: 100%;
  margin-top: 12px; padding: 15px 18px; border: 0;
  color: var(--text); font: inherit; text-align: left; cursor: pointer;
}
.row:active { background: var(--surface-2); }
.row:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }
.row-t { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1 1 auto; }
.row-h { font-size: 16px; font-weight: 600; }
.row-s { font-size: 13px; line-height: 1.35; color: var(--text-muted); }
.row-a { width: 18px; height: 18px; flex: 0 0 auto; color: var(--text-muted); }

/* ── сравнить с ── */
.cmp { text-align: center; }
.cmp-l { margin: 34px 0 0; font-size: 17px; font-weight: 700; }
.seg2 {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 4px;
  margin-top: 14px;
  padding: 4px;
  border-radius: 999px;
  background: var(--lp-glass);
  border: 1px solid var(--lp-glass-line);
  -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
}
.seg2-b {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 14.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.seg2-b.on { background: var(--surface-2); color: var(--text); box-shadow: inset 0 1px 0 var(--rim-glow); }
.seg2-b:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }
.cmp-lead {
  margin: 18px auto 0;
  max-width: 24rem;
  font-size: 16px;
  line-height: 1.45;
  color: var(--text-secondary);
  text-wrap: balance;
}
.cmp-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
.cmp-card {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 14px;
  border-radius: 20px;
  text-align: center;
}
.cmp-k { font-size: 12.5px; color: var(--text-muted); }
.cmp-t {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
.cmp-s { font-size: 12.5px; line-height: 1.4; color: var(--text-muted); text-wrap: balance; }
.cf-enter-active, .cf-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.cf-enter-from { opacity: 0; transform: translateY(6px); }
.cf-leave-to { opacity: 0; transform: translateY(-6px); }
.quote {
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(26px, 7vw, 40px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text);
}

/* ── «Анализы и врачи» ── */
.docs { padding: 6px 0; }
.doc { display: flex; align-items: flex-start; gap: 14px; padding: 14px 18px; }
.doc + .doc { border-top: 1px solid var(--line); }
.doc-i {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; flex: 0 0 38px; border-radius: 12px;
  background: var(--surface-2); color: var(--action-text);
}
.doc-i svg { width: 21px; height: 21px; }
.doc-t { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.doc-h { font-size: 16px; font-weight: 600; line-height: 1.3; }
.doc-s { font-size: 14px; line-height: 1.5; color: var(--text-secondary); }
.docs-lock {
  display: flex; align-items: flex-start; gap: 10px;
  margin: 14px 4px 0; font-size: 13.5px; line-height: 1.5; color: var(--text-muted);
}
.docs-lock svg { width: 18px; height: 18px; flex: 0 0 18px; margin-top: 1px; }

/* ── календарь: легенда ровной строкой (Д-64, п. 9) ──
   В общем `LifeCalendar.vue` класс абзаца «лет впереди» `.ahead` совпал с
   классом круга легенды `.sw.ahead`: круг «впереди» получал отступ сверху
   16px и выравнивание по базовой линии и съезжал вниз. Компонент общий с
   контуром за входом, поэтому чинится здесь, со стороны главной.
   «Зелёных недель пока нет» объясняет цвет точек, то есть устройство
   экрана, — на главной эта строка скрыта (Д-64, п. 4). */
.lp-cal :deep(.legend .sw) { margin: 0; align-items: center; gap: 0; }
.lp-cal :deep(.legend li) { align-items: center; }
.lp-cal :deep(.gist) { display: none; }

/* ── метод: аккордеон ── */
.acc { padding: 4px 0; }
.acc-item + .acc-item { border-top: 1px solid var(--line); }
.acc-head {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  width: 100%; min-height: 56px; padding: 14px 18px;
  border: 0; background: transparent; color: var(--text);
  font: inherit; text-align: left; cursor: pointer;
}
.acc-head:focus-visible { outline: 2px solid var(--action-text); outline-offset: -2px; border-radius: 12px; }
.acc-t {
  font-size: 13.5px; font-weight: 700; line-height: 1.35;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.acc-c { width: 18px; height: 18px; flex: 0 0 auto; color: var(--text-muted); transition: transform 0.3s ease; }
.acc-item.open .acc-c { transform: rotate(180deg); color: var(--text); }
.acc-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
.acc-item.open .acc-body { grid-template-rows: 1fr; }
.acc-in { min-height: 0; overflow: hidden; }
.acc-in p { margin: 0; padding: 0 18px 16px; font-size: 14.5px; line-height: 1.55; color: var(--text-secondary); }

/* ── синяя плашка ── */
.end { padding-top: 84px; }
.blue {
  position: relative;
  /* Своя ступень наложения: свет за знаком (z-index −1 внутри HeroMark)
     ложится поверх синей заливки плашки, а не уходит под неё (Д-74). */
  isolation: isolate;
  overflow: hidden;
  border-radius: 28px;
  padding: 26px 22px 22px;
  text-align: center;
  background: var(--action);
  color: var(--lp-on-blue);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 30px 60px -30px var(--lp-halo);
}
.blue::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: var(--lp-grain);
  background-size: 140px 140px;
  opacity: 0.6;
}
/* Свет за знаком на синем — светлые ступени синего (`--glow-blue-*`):
   тёмный ореол первого экрана на синей заливке читался бы грязным пятном. */
.blue {
  --glow-0: var(--glow-blue-0);  --glow-1: var(--glow-blue-1);
  --glow-2: var(--glow-blue-2);  --glow-3: var(--glow-blue-3);
  --glow-4: var(--glow-blue-4);  --glow-5: var(--glow-blue-5);
  --glow-6: var(--glow-blue-6);
}
.blue-mark { margin: 6px auto 4px; }
.motto {
  position: relative;
  margin: 16px 0 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: clamp(28px, 7.6vw, 38px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.author { position: relative; margin: 8px 0 0; font-size: 16px; font-weight: 600; color: var(--lp-on-blue-muted); }
.blue-go {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 52px; margin-top: 22px;
  border: 0; border-radius: 16px;
  background: var(--lp-on-blue); color: var(--action);
  font: inherit; font-size: 14px; font-weight: 800;
  letter-spacing: 0.12em; text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.blue-go:active { transform: scale(0.98); }
.blue-go:focus-visible { outline: 2px solid var(--lp-on-blue); outline-offset: 3px; }

/* ── подвал ── */
.foot { padding-top: 40px; }
.foot-pill {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 8px 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--lp-glass-line);
  background: var(--lp-glass);
  -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 var(--lp-glass-hi);
}
.foot-link {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 36px; padding: 0 6px;
  color: var(--text); text-decoration: none; white-space: nowrap;
  font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em;
  border-radius: 999px;
}
.foot-link svg { width: 14px; height: 14px; color: var(--text-muted); transition: transform 0.2s ease, color 0.2s ease; }
.foot-link:hover svg { color: var(--action-text); transform: translate(1px, -1px); }
.foot-link:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }
/* Бейдж версии — имя продукта и номер прошивки (Д-64, п. 14). */
.ver {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 36px; padding: 0 13px;
  border: 0; border-radius: 999px;
  background: var(--surface-2); color: var(--text); white-space: nowrap;
  font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
}
.ver-n { font-weight: 500; color: var(--text-muted); }
.memo {
  margin: 22px auto 0;
  max-width: 24rem;
  text-align: center;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-muted);
  text-wrap: balance;
}
.ver:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }

/* ── проявление ── */
.rv { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.rv.rv-in { opacity: 1; transform: none; }

/* ── шторки главной (они в <body>, тёмный набор несут сами) ── */
.who-p { margin: 0 0 8px; font-size: 15px; line-height: 1.5; color: var(--text-secondary); }
.whos { list-style: none; margin: 0; padding: 0 0 8px; }
.whorow {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; min-height: 54px; padding: 0 4px; border: 0; background: transparent;
  font: inherit; font-size: 17px; color: var(--text); cursor: pointer; text-align: left;
}
.whos li + li .whorow { border-top: 1px solid var(--line); }
.whorow.off { color: var(--text-muted); cursor: default; }
.whorow.on { font-weight: 600; }
.soon {
  font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--text-muted); background: var(--surface-2);
  border-radius: 999px; padding: 4px 10px;
}
.mark { display: inline-flex; color: var(--action-text); }
.mark svg { width: 20px; height: 20px; }

.vers { list-style: none; margin: 0; padding: 0; }
.vr { padding: 14px 0; }
.vr + .vr { border-top: 1px solid var(--line); }
.vr-top { display: flex; align-items: center; gap: 10px; }
.vr-n {
  display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px;
  border-radius: 999px; background: var(--surface-2);
  font-size: 12.5px; font-weight: 700; color: var(--text);
}
.vr.first .vr-n { background: var(--action); color: var(--action-ink); }
.vr-d { font-size: 12.5px; color: var(--text-muted); }
.vr-t { margin: 8px 0 0; font-size: 15px; line-height: 1.55; color: var(--text-secondary); }
.vr.first .vr-t { color: var(--text); }
.pb { margin: 14px 0 6px; }

/* Узкие телефоны (360): ссылка и бейдж версии в одну строку капсулы. */
@media (max-width: 380px) {
  .foot-pill { padding-left: 10px; gap: 6px; }
  .foot-link { padding: 0 4px; font-size: 13.5px; gap: 4px; }
  .foot-link svg { width: 12px; height: 12px; }
  .ver { padding: 0 10px; font-size: 13px; gap: 4px; }
}
@media (min-width: 760px) {
  .memo { max-width: none; }
  .hero { padding-top: 64px; }
  .sec { padding-top: 104px; }
}
/* Прибор на компьютере — шире колонки текста: дуга слева, объяснения
   справа. Остальные блоки держат 560, как хвост Ультры. */
@media (min-width: 960px) {
  #gorizont.wrap { max-width: 980px; }
  .dash { padding: 24px 28px 28px; }
  #gorizont .sec-blue { max-width: 34rem; }
}

@media (prefers-reduced-motion: reduce) {
  .rv { opacity: 1; transform: none; transition: none; }
  .acc-body, .acc-c { transition: none; }
  .cf-enter-active, .cf-leave-active { transition: none; }
  .crawl-g { animation: none !important; }
}
/* ═══ Д-71: ВКЛАДКА «ГОРИЗОНТ» ВНУТРИ КАБИНЕТА ═══════════════════════════
   Все правила ниже начинаются с `.lp.in` и на главной не срабатывают.
   Колонка кабинета — 430 px и на компьютере, поэтому кегли заданы числом,
   а не от ширины окна (`vw` на компьютере дал бы заголовок в 72 px внутри
   узкой колонки), и медиазапросы главной перебиты по специфичности.
   Поверхности — язык кабинета (Д-70): белая карточка на объёме и канте,
   нажимаемое — с контактной тенью. */
.lp.in { min-height: 0; overflow-x: visible; }
.lp.in .lp-main { padding-bottom: 8px; }
.lp.in .wrap { max-width: none; padding: 0; }
.lp.in .hero { padding: 6px 0 4px; }
.lp.in :deep(.hm) { width: min(62%, 228px); }
.lp.in .hero-title { margin-top: 26px; font-size: 40px; }
.lp.in .hero-lead { font-size: 26px; }
.lp.in .hero-sub, .lp.in .hero-sig { font-size: 16px; }
.lp.in .sec { padding-top: 64px; scroll-margin-top: 72px; }
.lp.in .sec-title { font-size: 38px; }
.lp.in .quote { font-size: 26px; }
.lp.in .motto { font-size: 32px; }
.lp.in #gorizont.wrap { max-width: none; }
.lp.in #gorizont .sec-blue { max-width: 26rem; }
.lp.in .dash { padding: 16px 16px 18px; }
.lp.in .end { padding-top: 64px; }
.lp.in .foot { padding-top: 32px; }
.lp.in .memo { max-width: 24rem; }
.lp.in .card {
  background: var(--surface);
  -webkit-backdrop-filter: none;
          backdrop-filter: none;
  box-shadow:
    inset 0 1px 0 var(--rim-glow, transparent),
    inset 0 -1px 0 var(--rim-shade, transparent),
    var(--card-shadow, none);
}
.lp.in .row:active { background: var(--surface-hover); }
.lp.in .who, .lp.in .letter-go, .lp.in .foot-pill {
  background: var(--surface);
  -webkit-backdrop-filter: none;
          backdrop-filter: none;
  border-color: transparent;
  box-shadow: inset 0 1px 0 var(--rim-glow, transparent), var(--card-shadow-sm, none);
}
.lp.in .chip.plain { background: var(--surface); border-color: transparent; }
.lp.in .seg2 {
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border-color: transparent;
  -webkit-backdrop-filter: none;
          backdrop-filter: none;
  box-shadow: inset 0 1px 2px var(--rim-shade, transparent);
}
.lp.in .seg2-b.on { background: var(--surface); box-shadow: inset 0 1px 0 var(--rim-glow, transparent), var(--card-shadow-sm, none); }
.lp.in .doc-i, .lp.in .ver { background: var(--surface-3); }
/* Блик по тёмной клетке — светом, а не тенью: тень на тёмном не видна. */
.lp.in :deep(.hm-shine) {
  background: radial-gradient(
    circle at var(--hm-gx, 50%) var(--hm-gy, 28%),
    rgba(255, 255, 255, 0.16) 0%,
    rgba(255, 255, 255, 0) 55%
  );
  mix-blend-mode: screen;
}
.vers-in .vr-n { background: color-mix(in srgb, var(--text) 8%, transparent); }
.vers-in .vr.first .vr-n { background: var(--action); }
</style>
