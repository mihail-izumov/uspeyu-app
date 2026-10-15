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

  ⛔ Каждое поле на экране — из `public.json` по docs/PUBLIC-WHITELIST.md §1.

  ⛔ СЛОВА, КОТОРЫХ НА СТРАНИЦЕ ДО ВХОДА БЫТЬ НЕ МОЖЕТ, — закрытый список
  дыма (PUBLIC-WHITELIST §2). Письмо рендерится только открытым.
*/
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BrandMark from '../components/BrandMark.vue'
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
import { plural } from '../composables/useData.js'
import { useProfile } from '../composables/useProfile.js'

const props = defineProps({ pub: { type: Object, default: null } })
const emit = defineEmits(['enter'])

const ready = computed(() => !!(props.pub && props.pub.horizon))
const H = computed(() => props.pub?.horizon || null)

/* ── первый экран: фраза и синяя строка ───────────────────────────────── */
const titleLines = computed(() => {
  const t = props.pub?.product?.welcome || 'Успею'
  return t.split('. ').map((l, i, a) => (i < a.length - 1 ? `${l}.` : l))
})

/* ── протокол ─────────────────────────────────────────────────────────── */
const { protocols: PROTOCOLS, current, name: whoName, select } = useProfile()
const who = computed(() => current.value.id)
/* Имя в заголовке — в родительном падеже: «Горизонт Михаила». Протоколы
   Марии и Павла пока закрыты, но форма имени заведена сразу. */
const GEN = { mikhail: 'Михаила', maria: 'Марии', pavel: 'Павла' }
const whoGen = computed(() => GEN[who.value] || whoName.value)
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
   Возраст данных решает, насколько верить вилке, поэтому он стоит рядом с
   ней, а не отдельным разделом в конце страницы. */
const fresh = computed(() => {
  const d = props.pub?.telemetry?.draw_days
  if (d == null) return { kind: 'alarm', text: 'данных о заборах нет' }
  const n = `${d} ${plural(d, 'день', 'дня', 'дней')}`
  if (d <= 180) return { kind: 'ok', text: `данные обновлены ${n} назад` }
  if (d <= 548) return { kind: 'watch', text: `данным ${n}` }
  return { kind: 'alarm', text: `данным ${n}, картина устарела` }
})

/* ── «С чем сравнить» — приём главной Ультры (блок сравнений, UD-137) ────
   ⛔ Слова — только из канона (`docs/KANON-uspeyu.md`): «этаж над
   спортчасами, а не конкурент» (Д-40) и «важно не только то, что заполнено,
   но и то, что пусто» (Д-58). Вкладка «Фитнес-трекер» — слово владельца
   15.10.2026 вместо «Спортчасов» (Д-64). */
const CMP = {
  folder: {
    tab: 'Папка анализов',
    lead: 'В папке лежит то, что сдано. Контур видит ещё и то, чего в ней не хватает.',
    cards: [
      { k: 'Пустые клетки', t: 'Видно, чего нет', s: 'важно не только то, что заполнено, но и то, что пусто' },
      { k: 'Ряд', t: 'Годы целиком', s: 'бланк описывает один день, а контур помнит весь ряд и видит, куда он идёт' },
    ],
  },
  tracker: {
    tab: 'Фитнес-трекер',
    lead: 'Трекер отвечает на вопрос дня, «Успею» — на вопрос жизни.',
    cards: [
      { k: 'Масштаб', t: 'Годы вместо дня', s: 'вилка лет и экстра-годы там, где трекер считает готовность к тренировке' },
      { k: 'Вместе', t: 'Этаж над трекером', s: 'трекер остаётся на руке, «Успею» с ним не спорит и его не заменяет' },
    ],
  },
}
const cmp = ref('folder')

/* ── календарь: строка данных под заголовком ─────────────────────────── */
const ru = (n) => Number(n).toLocaleString('ru-RU')
const calLine = computed(() => {
  const w = props.pub?.weeks
  if (!w) return ''
  return `Прожито ${ru(w.lived)} ${plural(w.lived, 'неделя', 'недели', 'недель')}, впереди по вилке ещё ${ru(w.to_current_lo)}–${ru(w.to_current_hi)}.`
})

/* ── метод: аккордеон ─────────────────────────────────────────────────── */
const items = computed(() => props.pub?.manifest?.items || [])
const NUM = ['Ноль', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять']
const methodLine = computed(() => {
  const n = items.value.length
  const word = NUM[n] || String(n)
  return `${word} ${plural(n, 'тезис', 'тезиса', 'тезисов')}, на которых стоит счёт.`
})
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
  setCanvas(true)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  paint()
})
onBeforeUnmount(() => {
  setCanvas(false)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})
</script>

<template>
  <div class="lp" data-theme="uspeyu-dark">
    <div class="lp-bg" aria-hidden="true">
      <TitanLayer seed="uspeyu-lp" />
    </div>

    <LandingHeader :compact="compact" @enter="emit('enter')" @top="toTop" />

    <main class="lp-main">
      <!-- ═══ Первый экран ═══ -->
      <section ref="hero" class="hero">
        <HeroMark :fade="heroFade" />

        <template v-if="ready">
          <h1 class="hero-title">
            <span v-for="l in titleLines" :key="l" class="hero-line">{{ l }}</span>
          </h1>
          <p class="hero-lead">
            <a href="#gorizont" class="hl" @click.prevent="goDial('cur')">Горизонт <span class="u up-digit">{{ H.current.label }}</span></a><template v-if="H.goal">, <a href="#gorizont" class="hl" @click.prevent="goDial('goal')">цель <span class="u up-digit">{{ Math.round(H.goal.age) }}</span></a></template>.
          </p>
        </template>
        <template v-else>
          <h1 class="hero-title"><span class="hero-line">Успею</span></h1>
          <p class="hero-sub">Первый прогон готовится.</p>
        </template>
      </section>

      <template v-if="ready">
        <!-- ═══ Плашка почты — стекло в кольце, как стартовая панель Ультры ═══ -->
        <section ref="capture" v-reveal class="wrap start">
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
                <p class="start-title">Свой горизонт</p>
                <p class="start-line">Оставьте почту, и она сразу придёт Михаилу.</p>
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
          <p v-reveal class="sec-blue">Сколько прожито и сколько ещё можно успеть по данным.</p>
          <p v-reveal class="chips">
            <span class="chip" :class="fresh.kind"><span class="chip-dot" aria-hidden="true"></span>{{ fresh.text }}</span>
            <span class="chip plain up-digit">методика {{ H.method_version }}</span>
          </p>

          <article ref="dialCard" v-reveal class="card dash">
            <HorizonDial v-model="sel" :horizon="H" />
          </article>

          <button v-reveal type="button" class="card row" @click="sheet = 'reading'">
            <span class="row-t">
              <span class="row-h">Как читать Горизонт</span>
              <span class="row-s">Что значит вилка и как она считается</span>
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
          <p v-reveal class="cmp-l">С чем сравнить «Успею»</p>
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
              <p class="cmp-lead">{{ CMP[cmp].lead }}</p>
              <div class="cmp-cards">
                <div v-for="c in CMP[cmp].cards" :key="c.t" class="card cmp-card">
                  <span class="cmp-k">{{ c.k }}</span>
                  <span class="cmp-t">{{ c.t }}</span>
                  <span class="cmp-s">{{ c.s }}</span>
                </div>
              </div>
            </div>
          </Transition>
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
          <p v-reveal class="sec-muted">{{ methodLine }}</p>
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
                <div class="acc-in"><p>{{ m.text }}</p></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Синяя плашка — как «От Трека до Ультры — одна команда.» ═══
             Знак — одной буквой, без слова (Д-64, п. 12). -->
        <section class="wrap sec end">
          <div v-reveal class="blue">
            <BrandMark state="min" :size="44" inverse class="blue-mark" />
            <p class="motto">{{ pub.product.motto }}</p>
            <p class="author">{{ pub.product.author }}</p>
            <button type="button" class="blue-go" @click="toCapture">Узнать свой горизонт</button>
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
              Успею <span class="ver-n up-digit">{{ version.version }}</span>
            </button>
          </div>
        </footer>
      </template>
    </main>

    <!-- ═══ ШТОРКИ — как у лендинга Ультры; письмо — легендой Ротора ═══ -->
    <template v-if="ready">
      <LandingSheet :open="isOpen('who')" title="Чей горизонт" @close="sheet = ''">
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
      </LandingSheet>

      <LetterLegend :open="isOpen('letter')" @close="sheet = ''" />

      <LandingSheet
        :open="isOpen('reading')"
        :title="(pub.onboarding && pub.onboarding.title) || 'Как читать Горизонт'"
        @close="sheet = ''"
      >
        <ReadingBlocks class="rd" :sections="(pub.onboarding && pub.onboarding.sections) || []" />
      </LandingSheet>

      <LandingSheet :open="isOpen('versions')" title="Версии «Успею»" @close="sheet = ''">
        <ol class="vers">
          <li v-for="(v, i) in pub.versions" :key="v.date + v.version" class="vr" :class="{ first: i === 0 }">
            <span class="vr-top">
              <span class="vr-n up-digit">{{ v.version }}</span>
              <span class="vr-d up-digit">{{ v.date.split('-').reverse().join('.') }}</span>
            </span>
            <p class="vr-t">{{ v.text }}</p>
          </li>
        </ol>
        <PoweredBy class="pb" />
      </LandingSheet>
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
.hero-sub { margin: 14px 0 0; font-size: 19px; font-weight: 600; color: var(--text-secondary); }
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
.chip-dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; }
.chip.ok { color: var(--sig-ok-ink); background: var(--sig-ok-fill); }
.chip.watch { color: var(--sig-watch-ink); background: var(--sig-watch-fill); }
.chip.alarm { color: var(--sig-alarm-ink); background: var(--sig-alarm-fill); }
.chip.plain { color: var(--text-secondary); background: var(--lp-glass); border: 1px solid var(--lp-glass-line); font-weight: 500; }

.dash { padding: 18px 16px 18px; scroll-margin-top: 90px; }

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
.blue-mark {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.35);
}
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
  color: var(--text); text-decoration: none;
  font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
  border-radius: 999px;
}
.foot-link svg { width: 14px; height: 14px; color: var(--text-muted); transition: transform 0.2s ease, color 0.2s ease; }
.foot-link:hover svg { color: var(--action-text); transform: translate(1px, -1px); }
.foot-link:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }
/* Бейдж версии — имя продукта и номер прошивки (Д-64, п. 14). */
.ver {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 36px; padding: 0 14px;
  border: 0; border-radius: 999px;
  background: var(--surface-2); color: var(--text);
  font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
}
.ver-n { font-weight: 500; color: var(--text-muted); }
.ver:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }

/* ── проявление ── */
.rv { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.rv.rv-in { opacity: 1; transform: none; }

/* ── шторки главной (они в <body>, тёмный набор несут сами) ── */
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

@media (min-width: 760px) {
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
</style>
