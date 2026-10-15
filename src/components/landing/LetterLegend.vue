<script setup>
/*
  ПИСЬМО МИХАИЛА — окном-легендой, как легенда Ротора в gderost.

  Повод (Д-64, слово владельца 15.10.2026): «письмо сделай в стиле легенды из
  страницы Ротора в gderost с анимацией один в один, и иконку письма тоже
  замени на ту, какая там, с анимацией».

  Образец — `gderost/docs/пмк/ПМК.html`, блок `.pm-leg` и его скрипт (D-1381):
    · текст плывёт вверх сам, как вступление «Звёздных войн»: плоскость
      наклонена от зрителя на 22°, перспектива 1400 px, читается полоса
      посередине, сверху и снизу текст тает маской;
    · скорость 36 px в секунду, старт через 0,7 с, встаёт, когда подпись
      дошла до середины окна;
    · колесо, палец и стрелки двигают текст руками, после этого автопрокрутка
      ждёт 2,5 с и продолжает; Home/End — к началу и к подписи;
    · внизу две кнопки: «Сначала» и «Закрыть»; Escape закрывает;
    · при системной настройке «уменьшить движение» текст стоит и листается
      только руками.
  Перенесено дословно, числами. Отличие одно: шрифты — системные, как на всей
  главной (Univers Ранскеила здесь не живёт).

  ⛔ ТЕКСТ РЕНДЕРИТСЯ ТОЛЬКО ОТКРЫТЫМ. В письме есть слово из закрытого списка
     витрины (PUBLIC-WHITELIST §2), и дым читает страницу закрытой.
*/
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BrandMark from '../BrandMark.vue'
import { LETTER, LETTER_ORG, LETTER_ROLE, LETTER_SIGN, LETTER_TITLE } from '../../content/letter.js'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const SPEED = 36
const PAUSE = 2500

const stage = ref(null)
const crawl = ref(null)
const closeBtn = ref(null)

let quiet = false
let pos = 0
let max = 0
let holdUntil = 0
let last = 0
let raf = 0
let finger = null
let opener = null

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function startPos() {
  const el = crawl.value
  const st = stage.value
  if (!el || !st) return 0
  const top = parseFloat(getComputedStyle(el).paddingTop) || 0
  return quiet ? Math.max(0, top - st.clientHeight * 0.35) : 0
}
function measure() {
  if (!crawl.value || !stage.value) return
  max = Math.max(0, crawl.value.offsetHeight - stage.value.clientHeight * 0.5)
}
function place() {
  pos = Math.max(0, Math.min(max, pos))
  if (crawl.value) crawl.value.style.transform = `translate3d(0,${(-pos).toFixed(1)}px,0)`
}
function hold() { holdUntil = now() + PAUSE }
function step(t) {
  raf = 0
  if (!props.open) return
  const dt = last ? Math.min(0.05, (t - last) / 1000) : 0
  last = t
  if (!quiet && t >= holdUntil && pos < max) { pos += SPEED * dt; place() }
  raf = requestAnimationFrame(step)
}
function restart() {
  measure()
  pos = startPos()
  place()
  last = 0
  holdUntil = now() + 700
}

function onWheel(e) {
  e.preventDefault()
  const st = stage.value
  pos += e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? (st ? st.clientHeight : 600) : 1)
  place()
  hold()
}
function onTouchStart(e) {
  if (e.touches.length === 1) { finger = e.touches[0].clientY; hold() }
}
function onTouchMove(e) {
  if (finger === null || e.touches.length !== 1) return
  const y = e.touches[0].clientY
  pos += finger - y
  finger = y
  place()
  hold()
  if (e.cancelable) e.preventDefault()
}
function onTouchEnd() { finger = null }
function onKey(e) {
  if (!props.open) return
  const h = (stage.value?.clientHeight || 600) * 0.25
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') pos += e.key === 'ArrowDown' ? 60 : h
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') pos -= e.key === 'ArrowUp' ? 60 : h
  else if (e.key === 'Home') pos = startPos()
  else if (e.key === 'End') pos = max
  else return
  e.preventDefault()
  place()
  hold()
}
function onResize() { if (props.open) { measure(); place() } }

watch(() => props.open, async (v) => {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (v) {
    quiet = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    opener = document.activeElement
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    await nextTick()
    restart()
    if (!raf) raf = requestAnimationFrame(step)
    closeBtn.value?.focus({ preventScroll: true })
  } else {
    root.style.overflow = ''
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
    if (raf) { cancelAnimationFrame(raf); raf = 0 }
    if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true })
    opener = null
  }
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
  }
})
</script>

<template>
  <Teleport to="body">
    
      <div
        v-if="open"
        class="lg"
        data-theme="uspeyu-dark"
        role="dialog"
        aria-modal="true"
        aria-label="Письмо Михаила"
        @wheel="onWheel"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div ref="stage" class="lg-stage">
          <div class="lg-plane">
            <div ref="crawl" class="lg-crawl">
              <!-- Над заголовком — знак с 87, а не слово «Успею» (Д-65, слово
                   владельца: «вместо „Успею“ поставь лого с 87»). У Ротора на
                   этом месте подпись «Ранскеил»; здесь марка сама подписывает
                   письмо. -->
              <div class="lg-over"><BrandMark state="head" :size="72" inverse class="lg-mark" /></div>
              <!-- Неразрывный пробел перед тире: прописными в 52 px строка «— ЭТО»
                   иначе начиналась бы с тире. -->
              <h2 class="lg-title">{{ LETTER_TITLE.replace(' —', '\u00a0—') }}</h2>
              <p v-for="(p, i) in LETTER" :key="i">{{ p.replace(/Успею 87/g, 'Успею\u00a087') }}</p>
              <p class="lg-sign">{{ LETTER_SIGN }}, {{ LETTER_ROLE }} <a :href="LETTER_ORG.url" target="_blank" rel="noopener">{{ LETTER_ORG.name }}</a></p>
            </div>
          </div>
        </div>
        <div class="lg-bar">
          <button type="button" class="lg-btn" @click="restart">Сначала</button>
          <button ref="closeBtn" type="button" class="lg-btn" @click="emit('close')">Закрыть</button>
        </div>
      </div>
  </Teleport>
</template>

<style scoped>
/* Окно легенды — числа образца Ротора (`.pm-leg*`) без изменений. */
.lg {
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  overscroll-behavior: contain;
  background: var(--lg-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}
.lg-stage {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 64px;
  overflow: hidden;
  perspective: 1400px;
  perspective-origin: 50% 50%;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 30%, black 70%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, black 30%, black 70%, transparent 100%);
}
/* Наклон 22° при дальней перспективе: строки уходят вдаль, но буквы не косят. */
.lg-plane { position: absolute; inset: 0; transform: rotateX(22deg); transform-origin: 50% 50%; }
.lg-crawl {
  max-width: 640px;
  margin: 0 auto;
  padding: 75vh 24px 0;
  text-align: center;
  color: var(--lg-ink);
  font-size: 22px;
  line-height: 1.6;
  will-change: transform;
}
.lg-crawl p { margin: 0 0 1.15em; }
.lg-crawl .lg-over { display: flex; justify-content: center; margin: 0 0 26px; }
.lg-title {
  margin: 0 -0.04em 0.8em 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 72px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--lg-title);
  text-wrap: balance;
}
.lg-crawl .lg-sign { margin-top: 2em; font-size: 15px; color: var(--lg-muted); }
/* Ссылка в подписи — как в легенде Ротора: светлым, с тонкой чертой. */
.lg-sign a { color: var(--lg-ink); text-decoration: none; border-bottom: 1px solid var(--lg-btn-hi); }
.lg-sign a:hover { border-bottom-color: var(--lg-ink); }
.lg-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.lg-btn {
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  padding: 8px 14px;
  background: var(--lg-btn);
  color: var(--lg-title);
}
.lg-btn:hover { background: var(--lg-btn-hi); }
.lg-btn:focus-visible { outline: 2px solid var(--lg-over); outline-offset: 2px; }

@media (max-width: 620px) {
  .lg-crawl { font-size: 18px; }
  .lg-title { font-size: 52px; }
}
</style>
