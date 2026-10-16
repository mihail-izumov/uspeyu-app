<script setup>
import { nextTick, ref, watch } from 'vue'
import TabBar from './TabBar.vue'
import TabIcon from './TabIcon.vue'
import BrandMark from './BrandMark.vue'
import { useScrollNav } from '../composables/useScrollNav.js'

/*
  ОБОЛОЧКА ОБОИХ СЛОЁВ: витрины до входа и контура после.

  ⚠⚠ ОДНА ОБОЛОЧКА НА ДВА СЛОЯ (правка 30.08.2026). До этого витрина верстала
  свою шапку сама (`.up-topbar`), и слово «Успею» стояло на странице ДВАЖДЫ:
  мелким в шапке и крупным в первом экране. Теперь шапка одна, а слой задаётся
  пропами: витрина идёт без вкладок и без крупного заголовка в потоке, у неё
  есть свой герой.

  ПОВЕДЕНИЕ ПРИ ПРОКРУТКЕ — один в один с «Где рост?»:

  ⛔ ЛИПКАЯ ПОЛОСА НЕ ЗАНИМАЕТ МЕСТА В ПОТОКЕ (`h-0`). Полоса, имеющая высоту,
  на пороге прокрутки двигает содержимое вниз, порог перестаёт быть пройден,
  полоса убирается — и страница дёргается в бесконечном цикле. Видимая часть
  лежит внутри `absolute` и появляется прозрачностью.

  ⚠ ПРОКРУТКА ЖИВЁТ В ОБОЛОЧКЕ, А НЕ НА СТРАНИЦЕ. Иначе на iOS резиновый отскок
  body таскает за собой плавающую капсулу, и она отрывается от нижнего края.

  ⚠ Уход капсулы — только `transform`, без `opacity`: панель гасла раньше, чем
  доезжала до края, и движение читалось рывком, а не жестом.

  ⚠⚠ Д-70 (15.10.2026): шапка снята с главной. Слово владельца: «причесать
  дизайн всего, что внутри, стандарты — из лендинга Ультры и /join».
    · Наверху в потоке — та же связка, что на главной: знак `head` и
      «Успею 87» (тёмная клетка: холст светлый, навыворот не нужен).
      На разделах вне капсулы на её месте стоит возврат.
    · При прокрутке выезжает стеклянная капсула, как у главной и Ультры,
      а не полоса во всю ширину: знак, имя раздела и «Выйти». Скрытая
      капсула `inert` — палец и экранный диктор её не находят.
    · Холст — `--bg` со светом и зерном `--bg-veil` (D-618, D-676). Свет
      стоит на оболочке, а не на ленте: уехав с содержимым, пятно стало бы
      светлой полосой, гуляющей по странице.
*/
const props = defineProps({
  tabs: { type: Array, default: () => [] },
  active: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  /* Крупный заголовок в потоке. Витрина ставит false: её первый экран —
     герой, и второй заголовок над ним был бы тем самым дубликатом. */
  bigTitle: { type: Boolean, default: true },
  /* Экран вне капсулы (Системы, Прогресс, Риски) — у него в шапке кнопка
     возврата. Без неё человек стоит на разделе, который ни одна вкладка не
     подсвечивает, и «назад» ему заменяет только угадывание. */
  back: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'back'])

const scrollEl = ref(null)
const { collapsed, navHidden, onScroll, showNav, reset } = useScrollNav()

/* Смена раздела возвращает и прокрутку, и оба состояния навигации. Без этого
   новый экран открывался в середине с уехавшей капсулой — то есть выглядел
   так, будто человек уже что-то на нём делал. */
watch(() => props.active, async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = 0
  reset()
})

const activeIcon = () => (props.tabs.find((t) => t.id === props.active) || {}).icon || ''
</script>

<template>
  <div
    class="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:border-x"
    :style="{ backgroundColor: 'var(--bg)', backgroundImage: 'var(--bg-veil, none)', borderColor: 'var(--line)' }"
  >
    <div
      ref="scrollEl"
      class="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      @scroll="onScroll"
    >
      <!-- Строка контекста в потоке: связка «Успею 87» или возврат слева,
           действие справа. Уезжает вместе со страницей; дальше её держит
           стеклянная капсула. -->
      <!-- Строка стоит и над витриной «Горизонт» (Д-71): у той больше нет
           своей шапки, это тот же экран, что главная. -->
      <div
        class="flex items-center justify-between gap-3 pl-4 pr-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
      >
        <button
          v-if="back"
          type="button"
          class="kh-pill kh-rim -ml-0.5 inline-flex h-9 items-center gap-0.5 rounded-full pl-1.5 pr-3.5 text-[0.9375rem] font-semibold active:opacity-80"
          :style="{ color: 'var(--action-text)' }"
          @click="emit('back')"
        >
          <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 4 6 10l6 6" />
          </svg>
          Заряд
        </button>
        <span v-else class="inline-flex min-w-0 items-center gap-2.5" aria-label="Успею 87">
          <BrandMark state="head" :size="36" class="sh-mark" />
          <span class="sh-word">Успею 87</span>
        </span>
        <div class="flex min-h-[44px] shrink-0 items-center"><slot name="header-trailing" /></div>
      </div>

      <!-- Крупный заголовок в потоке (внутренние экраны контура). -->
      <div v-if="bigTitle" class="px-5 pb-4 pt-3">
        <h1 class="sh-h1 truncate">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 truncate text-[0.8125rem]" :style="{ color: 'var(--text-muted)' }">{{ subtitle }}</p>
      </div>

      <main :class="tabs.length ? 'px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]' : 'pb-[calc(2rem+env(safe-area-inset-bottom))]'">
        <slot />
      </main>
    </div>

    <!-- Стеклянная капсула при прокрутке — приём главной и Ультры: blur 16,
         стекло холста, свет по верхней кромке, тень под ней. -->
    <div
      class="sh-pill"
      :class="{ on: collapsed }"
      :aria-hidden="collapsed ? undefined : 'true'"
      :inert="collapsed ? undefined : true"
    >
      <button
        v-if="back"
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full active:opacity-70"
        :style="{ color: 'var(--action-text)' }"
        aria-label="Назад, к «Заряду»"
        @click="emit('back')"
      >
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 4 6 10l6 6" />
        </svg>
      </button>
      <BrandMark v-else state="head" :size="30" class="shrink-0" />
      <span data-test="nav-compact-title" class="min-w-0 flex-1 truncate text-[1rem] font-bold tracking-[-0.01em]">{{ title }}</span>
      <div class="flex shrink-0 items-center"><slot name="header-trailing" /></div>
    </div>

    <!-- Подложка: холст набирает плотность к нижнему краю, чтобы содержимое
         не упиралось в капсулу обрезанным. -->
    <div
      v-if="tabs.length"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-28"
      :style="{ background: 'linear-gradient(to top, var(--bg) 22%, color-mix(in srgb, var(--bg) 70%, transparent) 58%, transparent 100%)' }"
      aria-hidden="true"
    ></div>

    <div
      v-if="tabs.length"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <div class="relative">
        <div
          class="pointer-events-auto"
          :class="navHidden ? '-translate-x-[120%]' : 'translate-x-0'"
          style="transition: transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)"
        >
          <TabBar :tabs="tabs" :active="active" @select="emit('select', $event)" />
        </div>

        <!-- Круглая кнопка на месте уехавшей капсулы. ⚠ pointer-events задаются
             инлайном, а не классом: класс спорил с привязкой, и невидимая
             кнопка ловила тапы поверх содержимого. -->
        <button
          type="button"
          class="absolute bottom-0 left-0 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:opacity-90"
          :class="navHidden ? 'opacity-100' : 'opacity-0'"
          :style="{
            background: 'var(--nav-accent)',
            pointerEvents: navHidden ? 'auto' : 'none',
            transition: 'opacity 0.42s cubic-bezier(0.32, 0.72, 0, 1)',
          }"
          aria-label="Показать навигацию"
          @click="showNav"
        >
          <TabIcon :icon="activeIcon()" class="h-7 w-7" :style="{ color: 'var(--nav-accent-ink)' }" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Связка — как на главной (`LandingHeader.vue`, `.lk-word`), на ступень
   мельче: внутри она подпись места, а не первый экран. */
.sh-word {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  white-space: nowrap;
  color: var(--text);
}
.sh-mark { flex: 0 0 auto; box-shadow: var(--card-shadow-sm); }

/* Заголовок раздела — плотный жирный, как заголовки /join. */
.sh-h1 {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 2.125rem;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.sh-pill {
  position: absolute;
  z-index: 35;
  top: calc(env(safe-area-inset-top) + 8px);
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 8px;
  border-radius: 999px;
  border: 1px solid var(--nav-line);
  background: color-mix(in srgb, var(--nav-surface) 74%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(170%);
          backdrop-filter: blur(16px) saturate(170%);
  box-shadow: inset 0 1px 0 var(--rim-glow, transparent), var(--card-shadow-float, none);
  /* Уезжает за край с запасом на тень: плавающая тень выходит вниз на
     сорок с лишним пикселей и иначе оставалась бы полосой под чёлкой. */
  transform: translateY(calc(-100% - 64px));
  pointer-events: none;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
.sh-pill.on { transform: none; pointer-events: auto; }
@media (prefers-reduced-motion: reduce) { .sh-pill { transition: none; } }
</style>
