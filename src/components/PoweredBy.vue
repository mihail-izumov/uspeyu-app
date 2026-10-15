<script setup>
/*
  «Работает на технологиях» — карточка со знаком «Модуль роста».

  Один в один с витриной «Где рост?» (`WhereGrowthSheet.vue`, блок 84–101):
  та же надпись прописными в разрядку, тот же знак маской, тот же тач-таргет
  в 44 точки вокруг ссылки.

  ⚠ Раньше на этом месте стояла строка текста «работает на технологиях модуля
  роста» в подвале — фраза, которую никто не читает и которая ничего не
  показывает. Знак сообщает то же самое одним взглядом и связывает витрину с
  продуктом, из которого она выросла.

  ⚠ Обёртка ссылки добирает высоту до 44px: сам знак 22px высотой, и попасть
  по нему пальцем без этого нельзя.
*/
import { logoStyle } from '../composables/brandMask.js'

const logo = logoStyle(22)
</script>

<template>
  <div class="pb">
    <p class="cap">Работает на технологиях</p>
    <a
      href="https://runscale.ru"
      target="_blank"
      rel="noopener noreferrer"
      class="lnk"
      aria-label="Модуль роста — открыть runscale.ru"
    >
      <span class="mark" :style="logo" aria-hidden="true"></span>
    </a>
  </div>
</template>

<style scoped>
.pb {
  display: flex; flex-direction: column; align-items: center;
  background: var(--surface); border-radius: 16px; padding: 12px 16px;
}
.cap {
  margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; color: var(--text-muted);
}
.lnk {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px;
}
.lnk:active { opacity: .7; }
.mark { display: block; background: var(--text); }
</style>
