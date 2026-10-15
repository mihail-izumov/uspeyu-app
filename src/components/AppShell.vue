<script setup>
import { nextTick, ref, watch } from 'vue'
import TabBar from './TabBar.vue'
import TabIcon from './TabIcon.vue'
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
    :style="{ background: 'var(--bg)', borderColor: 'var(--line)' }"
  >
    <div
      ref="scrollEl"
      class="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      @scroll="onScroll"
    >
      <!-- Липкая полоса: h-0, появляется прозрачностью. -->
      <header class="sticky top-0 z-20 h-0">
        <div
          class="absolute inset-x-0 top-0 w-full pt-[env(safe-area-inset-top)] transition-opacity duration-200"
          :class="collapsed ? 'opacity-100 backdrop-blur' : 'pointer-events-none opacity-0'"
          :style="collapsed
            ? { background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderBottom: '1px solid var(--line)' }
            : {}"
        >
          <div class="grid h-11 w-full grid-cols-[1fr_7.5rem] items-center pl-5">
            <div data-test="nav-compact-title" class="pointer-events-none flex min-w-0 items-center">
              <span class="truncate text-[1.0625rem] font-semibold">{{ title }}</span>
            </div>
            <div class="min-h-[44px]" aria-hidden="true"></div>
          </div>
        </div>

        <!-- ⛔ Действие справа — ОТДЕЛЬНЫМ слоем поверх полосы: полоса гаснет
             вместе с заголовком, а «Войти» и «Выйти» гаснуть не должны. Раньше
             кнопка жила внутри полосы и до первой прокрутки её не было. -->
        <div class="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
          <div class="flex h-11 items-center justify-end pr-4">
            <div class="pointer-events-auto"><slot name="header-trailing" /></div>
          </div>
        </div>
      </header>

      <!-- Крупный заголовок в потоке (внутренние экраны контура). -->
      <div
        v-if="bigTitle"
        class="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+3.25rem)]"
      >
        <button
          v-if="back"
          type="button"
          class="-ml-1 mb-1 inline-flex min-h-[36px] items-center gap-1 pr-2 text-[0.9375rem] active:opacity-60"
          :style="{ color: 'var(--action-text)' }"
          @click="emit('back')"
        >
          <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 4 6 10l6 6" />
          </svg>
          Заряд
        </button>
        <h1 class="truncate text-[2.125rem] font-bold leading-tight tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 truncate text-[0.8125rem]" :style="{ color: 'var(--text-muted)' }">{{ subtitle }}</p>
      </div>

      <main :class="tabs.length ? 'px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]' : 'pb-[calc(2rem+env(safe-area-inset-bottom))]'">
        <slot />
      </main>
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
