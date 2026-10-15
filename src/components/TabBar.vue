<script setup>
/* Таб-бар — плавающая капсула по стандарту iOS: скруглённая плашка с воздухом
 * по периметру, а не полоса во всю ширину экрана. Так она читается контролом
 * поверх содержимого, а не краем окна. Перенесено из «Где рост?».
 *
 * ⚠ Цвета берутся из набора `--nav-*`, объявленного только в `:root`, и от
 *   холста страницы не зависят. Капсула принадлежит приложению, а не разделу:
 *   она стоит на всех экранах и отвечает на вопрос «где я и куда могу
 *   перейти». Перекрашиваясь вместе со страницей, она сообщала бы, что
 *   изменился сам орган управления, тогда как изменилась только страница.
 *
 * ⚠ Пустой `active` — законное состояние, а не ошибка. Человек стоит на
 *   под-странице (карточка системы, опрос), и она не принадлежит ни одной
 *   вкладке: подсвеченные «Системы» над экраном опроса сообщали бы, что
 *   человек находится там, где его нет.
 *
 * Стекло — Tailwind-утилита backdrop-blur, а не своё свойство: autoprefixer
 * добавляет -webkit-backdrop-filter, без которого на iOS Safari размытие не
 * рисуется вовсе.
 */
import TabIcon from './TabIcon.vue'

defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, default: '' },
})
defineEmits(['select'])
</script>

<template>
  <nav
    role="tablist"
    class="flex items-stretch gap-1 rounded-full border p-1 shadow-lg backdrop-blur"
    :style="{
      borderColor: 'var(--nav-line)',
      background: 'color-mix(in srgb, var(--nav-surface) 88%, transparent)',
    }"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="active === tab.id"
      class="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 outline-none transition-colors duration-150"
      :style="active === tab.id ? { background: 'var(--nav-accent)' } : {}"
      @click="$emit('select', tab.id)"
    >
      <TabIcon
        :icon="tab.icon"
        class="h-[20px] w-[20px]"
        :style="{ color: active === tab.id ? 'var(--nav-accent-ink)' : 'var(--nav-muted)' }"
      />
      <span
        class="kh-caps text-[0.625rem] uppercase"
        style="--caps-track: 0.06em"
        :style="{ color: active === tab.id ? 'var(--nav-accent-ink)' : 'var(--nav-muted)' }"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>
