<script setup>
/*
  ШТОРКА ГЛАВНОЙ — копия шторки лендинга Ультры (`ultra.runscale.ru`,
  `.vitepress/lp/ultra/components/BottomSheet.vue`, источник правды — gderost).

  Повод (Д-64, слово владельца 15.10.2026): «переделай модалки „Как читать
  Горизонт“ и „Жить — это команда“ под стандарты лендинга Ультры… модалку
  версий тоже стилизуй под всё».

  Что перенесено и почему:
    · ТЁМНАЯ ПАНЕЛЬ ИЗ ТЁМНОЙ СТРАНИЦЫ. Шторка уезжает в <body>, и набор
      токенов страницы до неё не долетает; поэтому оверлей сам несёт
      `data-theme="uspeyu-dark"`. Белая панель из почти чёрной страницы
      читалась бы переходом в другое приложение (довод Ультры дословно).
    · ПРИХОД И УХОД — по кривой системной шторки iOS
      `cubic-bezier(0.32, 0.72, 0, 1)`: 0,42 с на приход, 0,3 с на уход.
    · ЗАТЕМНЕНИЕ С РАЗМЫТИЕМ, ручка сверху, крестика нет: закрывается свайпом
      вниз от верха прокрутки, касанием затемнения и Escape.
    · Страница под шторкой заморожена: иначе палец тянет фон.

  ⚠ Шторка внутри контура (`components/BottomSheet.vue`) не тронута: всё, что
    после «Войти», владелец трогать запретил.
*/
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['close'])

let lockedBody = ''
let lockedRoot = ''
function lock(on) {
  if (typeof document === 'undefined') return
  const b = document.body
  const r = document.documentElement
  if (on) {
    lockedBody = b.style.overflow
    lockedRoot = r.style.overflow
    b.style.overflow = 'hidden'
    r.style.overflow = 'hidden'
  } else {
    b.style.overflow = lockedBody
    r.style.overflow = lockedRoot
  }
}
watch(() => props.open, (v) => lock(v))
onBeforeUnmount(() => { if (props.open) lock(false) })

function onKey(e) { if (e.key === 'Escape') emit('close') }
watch(() => props.open, (v) => {
  if (typeof window === 'undefined') return
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => { if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey) })

const panel = ref(null)
const dy = ref(0)
const dragging = ref(false)
let startY = null

function onTouchStart(e) {
  if (panel.value && panel.value.scrollTop > 2) { startY = null; return }
  startY = e.touches[0].clientY
  dragging.value = false
}
function onTouchMove(e) {
  if (startY === null) return
  const delta = e.touches[0].clientY - startY
  if (delta <= 0 && !dragging.value) { startY = null; dy.value = 0; return }
  if (delta > 6) dragging.value = true
  dy.value = Math.max(0, delta)
  if (e.cancelable) e.preventDefault()
}
function onTouchEnd() {
  const closing = dragging.value && dy.value > 80
  dragging.value = false
  startY = null
  if (closing) emit('close')
  else dy.value = 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ls" @after-leave="dy = 0">
      <div
        v-if="open"
        class="ls-overlay kh-sheet-overlay"
        data-theme="uspeyu-dark"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
      >
        <div class="ls-scrim" @click="emit('close')"></div>
        <div
          ref="panel"
          class="ls-panel kh-scroll"
          :class="{ 'is-dragging': dragging }"
          :style="{ '--ls-dy': `${dy}px` }"
          @touchstart.passive="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
        >
          <div class="ls-grab" aria-hidden="true"><span></span></div>
          <h2 v-if="title" class="ls-h">{{ title }}</h2>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ls-overlay {
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}
.ls-scrim {
  position: absolute;
  inset: 0;
  background: var(--lp-scrim);
  -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}
.ls-panel {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 430px;
  max-height: 88%;
  overflow-y: auto;
  padding: 0 20px max(20px, env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: var(--lp-sheet);
  box-shadow: inset 0 1px 0 var(--rim-glow), 0 -24px 48px -24px rgba(0, 0, 0, 0.6);
  transform: translateY(var(--ls-dy, 0px));
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.ls-panel.is-dragging { transition: none; }
.ls-grab {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 10px 0 8px;
  background: var(--lp-sheet);
}
.ls-grab span { width: 36px; height: 4px; border-radius: 999px; background: var(--line); }
.ls-h {
  margin: 4px 0 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.ls-enter-active .ls-panel { transition: transform 0.42s cubic-bezier(0.32, 0.72, 0, 1); }
.ls-leave-active .ls-panel { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.ls-enter-from .ls-panel, .ls-leave-to .ls-panel { transform: translateY(100%); }
.ls-enter-active, .ls-leave-active { transition: opacity 0.3s ease; }
.ls-enter-from .ls-scrim, .ls-leave-to .ls-scrim { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .ls-panel, .ls-scrim,
  .ls-enter-active .ls-panel, .ls-leave-active .ls-panel { transition: none; }
}
</style>
