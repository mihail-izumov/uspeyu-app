<!-- ⚠ КОПИЯ из ultra.runscale.ru (`.vitepress/lp/titan/`), сама копия gderost (GR-68). Перенесена 15.10.2026 для витрины «Успею»; файл не правится, а заменяется копией из источника. -->
<script setup>
// ⚠ КОПИЯ из gderost (`app/src/components/TitanLayer.vue`, GR-68) от 24.09.2026.
// Источник правды — там; правка слоя делается там и переносится сюда файлом.
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { TITAN_STEPS, titanParseColor, titanStep, titanSvgBody, titanTile } from './titanFlakes.js'
import { titanGlint, titanSweepCss } from './titanGlint.js'

// Титановые хлопья (GR-68, слово Михаила 23.09): серый титан из случайных
// хлопьев — треугольников, четырёхугольников, осколков — и их перелив,
// «как будто волна, но не общим градиентом, а случайным… как будто близко
// смотрим на чешую дракона, который идёт».
//
// Слой служебный, как `TopoLayer.vue`: событий не ловит, ассистивным
// технологиям не виден и лежит ниже содержимого. Родитель обязан быть
// `relative isolate overflow-hidden` — первое даёт систему координат, второе
// кладёт слой под текст, третье режет его по скруглению карточки.
//
// Три показа, от лучшего к запасному:
//   · живой перелив на WebGL (`titanGlint.js`) — на всём, где есть видеокарта,
//     то есть на любом телефоне последних лет;
//   · тот же перелив неподвижным кадром — при системной настройке
//     «уменьшить движение» и при `still`;
//   · плитка SVG из той же геометрии — где WebGL нет совсем. Цвет у неё
//     из токенов, поэтому она не расходится с живым слоем.
//
// ⚠ Слой ПРОСТУПАЕТ, а не выскакивает: пока видеокарта собирает первый кадр,
// виден ровный цвет смолы `--titan-0`, потом хлопья проявляются за полсекунды.
//
// ⚠ Узор тёмный. Текст поверх него красится светлыми чернилами — решает
// экран, который ставит слой; сам слой про содержимое ничего не знает.

const props = defineProps({
  // Ключ узора. Разные ключи — разные россыпи хлопьев; один ключ — один
  // и тот же узор на любом устройстве.
  seed: { type: [String, Number], default: 'ranskeil' },
  // Плотность хлопьев: 1 — как на образце. Меньше — крупнее щели смолы.
  density: { type: Number, default: 1 },
  // Масштаб хлопьев: 1 — как на образце, меньше — мельче. Маленькому
  // предмету нужен мелкий узор, иначе на нём помещается десяток осколков
  // и материал читается рисунком.
  scale: { type: Number, default: 1 },
  // Скорость волны: 1 — гребень проходит телефон за четыре-пять секунд.
  speed: { type: Number, default: 1 },
  // Неподвижный кадр вместо перелива.
  still: { type: Boolean, default: false },
  // Фокус-волна: период в секундах, 0 — без неё. Полоса резкости проходит
  // по предмету слева направо (`titanGlint.js`), и её положение слой пишет
  // в `--titan-sweep-x` на РОДИТЕЛЯ — по этой переменной грань
  // `.gr-titan-rim` ведёт свой блик в ногу с полосой. Пишет прямо в стиль,
  // минуя реактивность: переменная меняется шестьдесят раз в секунду,
  // и перерисовывать компонент на каждый кадр незачем.
  sweep: { type: Number, default: 0 },
  // Отступ слоя от края предмета, в пикселях. Нужен под титановой гранью:
  // тёмная заливка, доходящая до самого края, просвечивает через
  // сглаживание светлой линии грани тонкой тёмной дугой на скруглении
  // (правка Михаила 23.09: «в углу, кажется, остался артефакт тонкой
  // линией»). Отступ в пиксель оставляет крайние пиксели одной грани.
  // Скругление слоя считается от `--titan-rim-r` грани.
  inset: { type: Number, default: 0 },
})

const host = ref(null)
const canvas = ref(null)
const mode = ref('gl')
const shown = ref(false)
const svg = ref('')
const patternId = `titan-${useId()}`
const hostStyle = computed(() => (props.inset > 0
  ? { inset: `${props.inset}px`, borderRadius: `max(0px, calc(var(--titan-rim-r, 0px) - ${props.inset}px))` }
  : null))

let glint = null
let resizeObs = null
let viewObs = null
let motion = null
let onScreen = true
let resizeTimer = 0
let sized = false

function reducedMotion() {
  return !!motion?.matches
}

function palette(el) {
  const cs = window.getComputedStyle(el)
  return Array.from({ length: TITAN_STEPS }, (_, i) => titanParseColor(cs.getPropertyValue(`--titan-${i}`)))
}

function showSvg() {
  const tile = titanTile({ seed: props.seed, density: props.density })
  const body = titanSvgBody(tile, {
    base: 'class="titan-t0"',
    paint: (tone) => `class="titan-t${titanStep(tone)}"`,
  })
  const k = props.scale > 0 ? props.scale : 1
  svg.value = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">'
    + `<defs><pattern id="${patternId}" width="${tile.size}" height="${tile.size}" patternUnits="userSpaceOnUse" patternTransform="scale(${k})">`
    + body
    + `</pattern></defs><rect width="100%" height="100%" fill="url(#${patternId})"/></svg>`
  mode.value = 'svg'
  shown.value = true
}

// Кадры идут, только пока слой на экране и вкладка впереди.
function sync() {
  if (!glint) return
  if (onScreen && !document.hidden) glint.start()
  else glint.stop()
}

function applySize(entry) {
  const { width, height } = entry.contentRect
  glint.resize(width, height, window.devicePixelRatio || 1)
}

onMounted(() => {
  const el = host.value
  if (!el || typeof window === 'undefined') return
  motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

  // jsdom и старые движки: WebGL нет — сразу плитка, без попытки создать
  // контекст (jsdom на ней сыплет ошибками в консоль).
  const colors = palette(el)
  if (typeof window.WebGLRenderingContext === 'undefined' || colors.some((c) => !c)) {
    showSvg()
    return
  }
  glint = titanGlint(canvas.value, {
    palette: colors,
    seed: props.seed,
    density: props.density,
    scale: props.scale,
    speed: props.speed,
    still: props.still || reducedMotion(),
    sweep: props.sweep,
    onSweep: (s) => el.parentElement?.style.setProperty('--titan-sweep-x', titanSweepCss(s)),
    onFirstFrame: () => { shown.value = true },
  })
  if (!glint) { showSvg(); return }

  // Первый размер — сразу, дальше с паузой: при растягивании окна узор
  // пересобирается один раз в конце, а не на каждый пиксель.
  resizeObs = new ResizeObserver(([entry]) => {
    if (!sized) { sized = true; applySize(entry); return }
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => applySize(entry), 150)
  })
  resizeObs.observe(el)
  viewObs = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    sync()
  }, { rootMargin: '64px' })
  viewObs.observe(el)
  document.addEventListener('visibilitychange', sync)
  motion?.addEventListener?.('change', onMotion)
  sync()
})

function onMotion() {
  glint?.setStill(props.still || reducedMotion())
  sync()
}

watch(() => props.still, onMotion)

onBeforeUnmount(() => {
  clearTimeout(resizeTimer)
  resizeObs?.disconnect()
  viewObs?.disconnect()
  document.removeEventListener('visibilitychange', sync)
  motion?.removeEventListener?.('change', onMotion)
  glint?.destroy()
  glint = null
  host.value?.parentElement?.style.removeProperty('--titan-sweep-x')
})
</script>

<template>
  <span ref="host" class="titan" :style="hostStyle" aria-hidden="true">
    <canvas v-if="mode === 'gl'" ref="canvas" class="titan__canvas" :class="{ 'is-shown': shown }"></canvas>
    <span v-else class="titan__svg" :class="{ 'is-shown': shown }" v-html="svg"></span>
  </span>
</template>

<style scoped>
.titan {
  position: absolute;
  inset: 0;
  z-index: -1;
  display: block;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  background: var(--titan-0);
}

.titan__canvas,
.titan__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  /* Проявление вместо появления: полсекунды из цвета смолы. */
  transition: opacity 480ms ease-out;
}

.titan__canvas.is-shown,
.titan__svg.is-shown { opacity: 1; }

/* Плитка SVG красится ступенями палитры: цвет только из токенов. */
.titan__svg :deep(.titan-t0) { fill: var(--titan-0); }
.titan__svg :deep(.titan-t1) { fill: var(--titan-1); }
.titan__svg :deep(.titan-t2) { fill: var(--titan-2); }
.titan__svg :deep(.titan-t3) { fill: var(--titan-3); }
.titan__svg :deep(.titan-t4) { fill: var(--titan-4); }
.titan__svg :deep(.titan-t5) { fill: var(--titan-5); }
.titan__svg :deep(.titan-t6) { fill: var(--titan-6); }

@media (prefers-reduced-motion: reduce) {
  .titan__canvas,
  .titan__svg { transition: none; }
}
</style>
