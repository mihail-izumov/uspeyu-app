<script setup>
/*
  ЗНАК НА ПЕРВОМ ЭКРАНЕ — клетка K3 крупно, со светом за ней.

  Приём перенесён с первого экрана Ультры (`AppIcon.vue`, UD-34/UD-39):
    1. СВЕТ ЗА ЗНАКОМ — тот же живой титан, что на фоне, только синий.
       Гаснет к краю круглой маской и дышит; при прокрутке тает (`fade`
       приходит от страницы), иначе свет уезжал бы вверх вместе со знаком;
    2. ПЛИТКА — сам знак как есть, файлом из генератора;
    3. КАНТ — по грани идёт синий блик кругом за восемь секунд.

  ⚠ Знак — навыворот, светлой клеткой (Д-64): на тёмном титане главной так
     решил владелец 15.10.2026. Файл `icons/icon-full-inv.svg` — тот же
     генератор, поменяны местами два цвета.

  ⛔ ЗНАК НЕ ПЕРЕРИСОВЫВАЕТСЯ. Клетка — файл `icons/icon-full.svg`, который
     собирает `tools/build_brand.py` из геометрии K3 и мастера целей
     (Д-60): число 87 в углу, буква У, слово «Успею» под буквой. Здесь
     только постановка — свет, кант, наклон. Квадрат остаётся квадратом без
     скруглений: скругление было бы уже другим знаком.

  💡 НАКЛОН ЗА УКАЗАТЕЛЕМ — знак ведёт себя как предмет, а не как картинка:
     поворачивается к курсору на несколько градусов, и по нему скользит блик.
     На телефоне указателя нет — знак едва заметно плавает. При системной
     настройке «уменьшить движение» стоит неподвижно.
*/
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BrandMark from '../BrandMark.vue'
import TitanLayer from '../titan/TitanLayer.vue'

const props = defineProps({
  // 1 — свет полный, 0 — погас (страница прокручена ниже середины знака).
  fade: { type: Number, default: 1 },
  /* Клетка навыворот — на тёмном титане главной (Д-64). На светлом холсте
     кабинета (Д-71) стоит тёмная клетка, как во всём контуре. */
  inverse: { type: Boolean, default: true },
})

const shown = ref(false)
const rx = ref(0)
const ry = ref(0)
const gx = ref(50)
const gy = ref(28)
const hover = ref(false)
let still = false
let raf = 0
let pending = null

onMounted(() => {
  still = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => { shown.value = true })
})
onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })

function apply() {
  raf = 0
  if (!pending) return
  const { x, y } = pending
  ry.value = (x - 0.5) * 14
  rx.value = (0.5 - y) * 14
  gx.value = x * 100
  gy.value = y * 100
}

function onMove(e) {
  if (still || e.pointerType === 'touch') return
  const r = e.currentTarget.getBoundingClientRect()
  pending = {
    x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  }
  hover.value = true
  if (!raf) raf = requestAnimationFrame(apply)
}

function onLeave() {
  pending = null
  hover.value = false
  rx.value = 0
  ry.value = 0
  gx.value = 50
  gy.value = 28
}

const tileStyle = computed(() => ({
  transform: `rotateX(${rx.value.toFixed(2)}deg) rotateY(${ry.value.toFixed(2)}deg)`,
  '--hm-gx': `${gx.value}%`,
  '--hm-gy': `${gy.value}%`,
}))
const haloStyle = computed(() => ({ '--hm-fade': Math.max(0, Math.min(1, props.fade)).toFixed(3) }))
</script>

<template>
  <div class="hm" :class="{ 'is-shown': shown, 'is-hover': hover }" @pointermove="onMove" @pointerleave="onLeave">
    <div class="hm-halo" :style="haloStyle" aria-hidden="true">
      <div class="hm-glow">
        <TitanLayer seed="uspeyu-glow" :scale="0.8" :sweep="6" />
      </div>
    </div>

    <div class="hm-float">
      <div class="hm-tile" :style="tileStyle">
        <BrandMark state="full" :size="300" :inverse="inverse" class="hm-mark" />
        <span class="hm-shine" aria-hidden="true"></span>
        <span class="hm-rim" aria-hidden="true"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hm {
  position: relative;
  width: clamp(208px, 60vw, 300px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  perspective: 900px;
}

/* 1. Свет: синий титан за знаком. Слой лежит ПОД словами страницы
   (z-index −1 внутри слоя содержимого) и над фоновым титаном. */
.hm-halo {
  position: absolute;
  inset: -52%;
  z-index: -1;
  pointer-events: none;
  opacity: var(--hm-fade, 1);
  transform: scale(calc(0.9 + 0.1 * var(--hm-fade, 1)));
}
.hm-glow {
  --titan-0: var(--glow-0);
  --titan-1: var(--glow-1);
  --titan-2: var(--glow-2);
  --titan-3: var(--glow-3);
  --titan-4: var(--glow-4);
  --titan-5: var(--glow-5);
  --titan-6: var(--glow-6);
  position: absolute;
  inset: 0;
  isolation: isolate;
  overflow: hidden;
  border-radius: 50%;
  -webkit-mask: radial-gradient(closest-side, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%);
          mask: radial-gradient(closest-side, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%);
  animation: hm-appear 0.8s ease both, hm-breathe 6s ease-in-out 0.8s infinite;
}
@keyframes hm-appear { from { opacity: 0; } to { opacity: 0.72; } }
@keyframes hm-breathe { 0%, 100% { opacity: 0.72; } 50% { opacity: 1; } }

/* 2. Плитка. Проявляется при открытии, плавает, наклоняется к указателю. */
.hm-float {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: translateY(10px) scale(0.97);
  transition: opacity 0.8s ease, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.hm.is-shown .hm-float {
  opacity: 1;
  transform: none;
  animation: hm-float 7s ease-in-out 1s infinite;
}
.hm.is-hover .hm-float { animation-play-state: paused; }
@keyframes hm-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.hm-tile {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow:
    0 40px 80px -24px var(--lp-shadow),
    0 0 72px -8px var(--lp-halo);
}
.hm.is-hover .hm-tile { transition-duration: 0.12s; }
.hm-mark { width: 100% !important; height: 100% !important; }

/* Блик по поверхности — за указателем. Без указателя стоит у верхней кромки:
   свет сверху, как у плашек Ранскеила. */
.hm-shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* На светлой клетке блик белым по белому не виден, поэтому свет здесь —
     тень, уходящая от точки блика к краям. */
  background: radial-gradient(
    circle at var(--hm-gx, 50%) var(--hm-gy, 28%),
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 38%,
    rgba(10, 10, 10, 0.10) 100%
  );
  mix-blend-mode: multiply;
}

/* 3. Кант: тонкая грань, по которой кругом идёт синий блик. */
.hm-rim {
  position: absolute;
  inset: -1px;
  pointer-events: none;
  border: 1.5px solid transparent;
  background:
    conic-gradient(from var(--lp-rim-a),
      rgba(0, 0, 0, 0) 0deg,
      rgba(0, 0, 0, 0) 250deg,
      var(--lp-glint) 300deg,
      rgba(0, 0, 0, 0) 340deg) border-box;
  -webkit-mask: linear-gradient(var(--text) 0 0) padding-box, linear-gradient(var(--text) 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(var(--text) 0 0) padding-box, linear-gradient(var(--text) 0 0);
          mask-composite: exclude;
  animation: hm-rim 8s linear infinite;
}
@keyframes hm-rim { to { --lp-rim-a: 360deg; } }

@media (prefers-reduced-motion: reduce) {
  .hm-glow { animation: none; opacity: 0.8; }
  .hm-float { transition: none; opacity: 1; transform: none; }
  .hm.is-shown .hm-float { animation: none; }
  .hm-tile { transition: none; }
  .hm-rim { animation: none; }
}
</style>
