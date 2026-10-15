<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

/* Шторка снизу — стандартный способ показать подробность, не теряя место,
 * из которого её открыли.
 *
 * ⚠ Позиционируется по ВИДИМОЙ области (класс .kh-sheet-overlay), а не по
 *   окну. Причина — клавиатура на iOS: `fixed` привязан к layout viewport,
 *   клавиатура страницу не двигает, зато Safari сам подтягивает её вверх — и
 *   нижний край панели уходит под клавиатуру целиком.
 *
 * ⚠⚠ КРЕСТИКА НЕТ (владелец, 30.08.2026). Закрытий осталось три, и все —
 *   привычные для iOS: смахнуть вниз, коснуться затемнения, Escape с
 *   клавиатуры. Крестик в углу дублировал жест и забирал место у заголовка.
 *
 * ⛔ СМАХИВАНИЕ РАБОТАЕТ ТОЛЬКО СВЕРХУ ПАНЕЛИ И ТОЛЬКО С САМОГО ВЕРХА
 *   ПРОКРУТКИ. Два правила, и оба выведены из того, как жест ломается:
 *     · тянуть можно за шапку (ручка, заголовок) — или за тело, но лишь
 *       когда содержимое не прокручено. Иначе палец, листающий длинный
 *       текст вверх, утаскивал бы за собой всю шторку;
 *     · пока панель тянут, `touchmove` отменяется — без этого Safari
 *       начинает свой резиновый отскок и жест дёргается.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})
const emit = defineEmits(['close'])

// Прокрутка страницы под открытой шторкой — классическая беда мобильных
// модалок: палец тянет фон вместо содержимого панели.
watch(() => props.open, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (!v) drag.value = 0
})
onBeforeUnmount(() => { document.body.style.overflow = '' })

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

/* ── СМАХИВАНИЕ ВНИЗ ──────────────────────────────────────────────────── */
const CLOSE_AT = 110          // пикселей, после которых панель уходит
const drag = ref(0)           // текущий сдвиг
const dragging = ref(false)
const scrollBody = ref(null)
let startY = 0

function canDrag(fromHeader) {
  if (fromHeader) return true
  const el = scrollBody.value
  return !el || el.scrollTop <= 0
}

function onStart(e, fromHeader = false) {
  if (!canDrag(fromHeader)) return
  startY = e.touches[0].clientY
  dragging.value = true
}

function onMove(e) {
  if (!dragging.value) return
  const dy = e.touches[0].clientY - startY
  if (dy <= 0) { drag.value = 0; return }
  // Отменяем прокрутку страницы, пока панель едет за пальцем.
  if (e.cancelable) e.preventDefault()
  drag.value = dy
}

function onEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (drag.value > CLOSE_AT) emit('close')
  drag.value = 0
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="kh-sheet-overlay z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @keydown="onKey"
    >
      <div
        class="absolute inset-0"
        :style="{ background: 'var(--scrim)' }"
        @click="emit('close')"
      ></div>

      <!-- Д-70: панель держится своей светлотой (`--sheet` светлее холста) и
           затемнением под ней; канта по верхнему краю нет — на достаточной
           светлоте линия поверх края читается обводкой (D-351, D-353). -->
      <div
        class="kh-fade-in relative flex max-h-[90%] w-full max-w-[430px] flex-col rounded-t-[24px]"
        :style="{
          background: 'var(--sheet)',
          boxShadow: 'inset 0 1px 0 var(--rim-glow), var(--card-shadow-float)',
          transform: drag ? `translateY(${drag}px)` : '',
          transition: dragging ? 'none' : 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1)',
        }"
        @touchmove="onMove"
        @touchend="onEnd"
        @touchcancel="onEnd"
      >
        <!-- Шапка — рукоятка жеста целиком: и полоска, и заголовок. Ручка не
             декор: она сообщает, что панель тянется, до того как человек
             начнёт искать крестик. -->
        <div @touchstart.passive="onStart($event, true)">
          <div class="flex justify-center pb-1 pt-2.5">
            <span class="block h-[5px] w-9 rounded-full" :style="{ background: 'var(--rim)' }"></span>
          </div>

          <div v-if="title || subtitle" class="px-5 pb-3 pt-2">
            <!-- Заголовок шторки — `.fk-sheet-h` /join, на ступень мельче. -->
            <h2 v-if="title" class="font-brand text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-[0.8125rem] leading-snug" :style="{ color: 'var(--text-muted)' }">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <div
          ref="scrollBody"
          class="kh-scroll flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          @touchstart.passive="onStart($event, false)"
        >
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
