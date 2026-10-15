<script setup>
/*
  ШАПКА ГЛАВНОЙ: знак со словом слева, «Войти» справа.

  ⚠⚠ ЗНАК — В ЛЕВОМ ВЕРХНЕМ УГЛУ, РЯДОМ СО СЛОВОМ «УСПЕЮ», И С ЧИСЛОМ 87
  (владелец, 15.10.2026). Прежняя шапка ставила знак справа, левее «Войти»,
  в состоянии `min` — голая буква без числа. Владелец увидел на живом сайте:
  «лого не того дизайна, как согласовали, и нет цифры 87 внутри». Клетка K3
  без числа — уже не тот знак (Д-60), поэтому здесь состояние `mid`: число и
  буква. Связка «знак + имя» — как у Трека: шеврон и «РАНСКЕИЛ ТРЕК» одной
  строкой слева.

  ⚠ ДВА ПОКАЗА ОДНОЙ ШАПКИ — приём лендинга Ультры (`StickyHeader.vue`):
    · вверху страницы — открытая строка на титане;
    · когда первый экран ушёл за верх окна, сверху выезжает стеклянная
      капсула с той же связкой и той же кнопкой. Вход доступен всегда.
  Капсула не занимает места в потоке и уезжает только `transform`'ом.

  ⚠ ЗНАК НАВЫВОРОТ (Д-64, слово владельца 15.10.2026: «иконку в стики-меню
  сверху сделай навыворот, когда на тёмном фоне, и в других местах тоже»).
  Тёмная клетка на титане и на тёмном стекле капсулы держалась только
  обводкой; светлая стоит сама. Файл — тот же генератор, `*-inv.svg`.

  ⚠ С Д-65 здесь клетка `head` — число 87 вдвое крупнее, чем в `mid`
  (слово владельца: «в лого 87 сделай сильно крупнее»). В капсуле у знака
  своё поле: квадрат 36 px стоит в круглом торце капсулы с запасом 12 px
  слева и 7 px сверху и снизу, иначе угол квадрата упирался в скругление
  («поправь отступ вокруг иконки лого в стики-меню»).
*/
import BrandMark from '../BrandMark.vue'

defineProps({
  // Показать стеклянную капсулу (первый экран прокручен).
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['enter', 'top'])
</script>

<template>
  <header class="lh">
    <a href="#" class="lockup" aria-label="Успею 87 — наверх" @click.prevent="emit('top')">
      <BrandMark state="head" :size="48" inverse class="lk-mark" />
      <span class="lk-word">Успею 87</span>
    </a>
    <button type="button" class="go" @click="emit('enter')">
      Войти
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>
    </button>
  </header>

  <div
    class="pill"
    :class="{ on: compact }"
    :aria-hidden="compact ? undefined : 'true'"
    :inert="compact ? undefined : true"
  >
    <a href="#" class="lockup small" aria-label="Успею 87 — наверх" @click.prevent="emit('top')">
      <BrandMark state="head" :size="36" inverse class="lk-mark" />
      <span class="lk-word">Успею 87</span>
    </a>
    <button type="button" class="go small" @click="emit('enter')">
      Войти
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>
    </button>
  </div>
</template>

<style scoped>
.lh {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(env(safe-area-inset-top) + 14px) 18px 0;
}
/* Знак — в самом левом верхнем углу и на компьютере (как «РАНСКЕИЛ» у
   Ультры), а не у края колонки текста. */
@media (min-width: 760px) {
  .lh { padding: calc(env(safe-area-inset-top) + 20px) 28px 0; }
}

.lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: var(--text);
  text-decoration: none;
}
.lockup:focus-visible { outline: 2px solid var(--action-text); outline-offset: 4px; }
.lk-mark {
  flex: 0 0 auto;
  box-shadow: 0 0 0 1px var(--lp-glass-line), 0 10px 24px -10px var(--lp-shadow);
}
.lk-word {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  white-space: nowrap;
}
.lockup.small { gap: 10px; }
.lockup.small .lk-word { font-size: 20px; }

/* «Войти» — заливка действием, как «Старт» в шапке Ультры. */
.go {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 14px 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--action);
  color: var(--action-ink);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px -10px var(--lp-halo);
  transition: transform 0.15s ease, filter 0.15s ease;
}
.go svg { width: 16px; height: 16px; }
.go:hover { filter: brightness(1.08); }
.go:active { transform: scale(0.97); }
.go:focus-visible { outline: 2px solid var(--action-text); outline-offset: 3px; }
.go.small { min-height: 40px; padding: 0 12px 0 16px; font-size: 14px; }

/* Стеклянная капсула — копия приёма Ультры: blur 16, тон стекла, свет по
   верхней кромке, тень под ней. */
.pill {
  position: fixed;
  z-index: 40;
  top: calc(env(safe-area-inset-top) + 10px);
  left: 50%;
  width: calc(100% - 24px);
  max-width: 560px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 7px 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--lp-glass-line);
  background: var(--lp-glass);
  -webkit-backdrop-filter: blur(16px) saturate(170%);
          backdrop-filter: blur(16px) saturate(170%);
  box-shadow:
    0 14px 36px var(--lp-shadow),
    inset 0 1px 0 var(--lp-glass-hi);
  transform: translate(-50%, calc(-100% - 28px));
  pointer-events: none;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
.pill.on { transform: translate(-50%, 0); pointer-events: auto; }
.pill .lk-mark { box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  .pill { transition: none; }
}
</style>
