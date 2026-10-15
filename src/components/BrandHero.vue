<script setup>
/*
  ГЕРОЙ ВИТРИНЫ: имя продукта во всю ширину экрана.

  ⚠⚠ КЕГЛЬ НЕ ЗАДАН, А ИЗМЕРЕН. Приём перенесён из «Где рост?»
  (`app/src/components/HeroBlock.vue`). Фиксированный кегль в CSS верен ровно
  для одной ширины экрана: на iPhone SE слово переносится, на Pro Max рядом с
  ним остаётся пустое поле. Здесь строка меряется пробным кеглем в 100px, и
  дальше ставится тот, при котором она ровно занимает доступную ширину.

  ⚠ Мерить нужно ДВАЖДЫ: сразу и после `document.fonts.ready`. Первый замер
  идёт по подменному шрифту, и когда приезжает настоящий, ширина букв другая —
  слово либо не достаёт до края, либо вылезает за него.

  ⛔ Насыщенность 600, а не 700 (решение владельца 30.08.2026). На кегле в
  полэкрана жирное начертание превращается в плашку: буквы смыкаются, и слово
  читается пятном. Шестьсот на таком размере держит и вес, и просветы.
*/
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  tagline: { type: String, default: '' },
  maxPx: { type: Number, default: 120 },
})

const PROBE = 100

const box = ref(null)
const word = ref(null)

function fit() {
  const b = box.value
  const el = word.value
  if (!b || !el) return
  const avail = b.clientWidth
  if (!avail) return
  el.style.fontSize = `${PROBE}px`
  const w = el.scrollWidth
  if (!w) return
  const size = Math.min(props.maxPx, Math.max(28, Math.floor((PROBE * avail) / w)))
  el.style.fontSize = `${size}px`
}

onMounted(() => {
  fit()
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fit).catch(fit)
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', fit)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', fit)
})
</script>

<template>
  <div class="hero">
    <div ref="box" class="box">
      <h1 ref="word" class="word">{{ text }}</h1>
    </div>
    <p v-if="tagline" class="tag">{{ tagline }}</p>
  </div>
</template>

<style scoped>
.hero { text-align: center; }
.box { width: 100%; }
.word {
  display: block; margin: 0; white-space: nowrap;
  font-weight: 600; line-height: 1.02; letter-spacing: -.03em;
  color: var(--text);
}
/* Подзаголовок — не сноска. Это единственная строка, объясняющая, что
   продукт вообще делает, и на витрине она обязана читаться со спины. */
.tag {
  margin: 14px 0 0; font-size: 19px; font-weight: 600; line-height: 1.3;
  color: var(--text-secondary); text-wrap: balance;
}
</style>
