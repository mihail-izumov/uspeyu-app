<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AccessGate from './components/AccessGate.vue'
import AppShell from './components/AppShell.vue'
import BottomSheet from './components/BottomSheet.vue'
import SurveySheet from './components/SurveySheet.vue'
import ChargeScreen from './screens/ChargeScreen.vue'
import DayScreen from './screens/DayScreen.vue'
import SystemsScreen from './screens/SystemsScreen.vue'
import ProgressScreen from './screens/ProgressScreen.vue'
import DataScreen from './screens/DataScreen.vue'
import LandingScreen from './screens/LandingScreen.vue'
import RiskScreen from './screens/RiskScreen.vue'
import { useGate } from './composables/useGate.js'
import { useData, usePublicData } from './composables/useData.js'
import { useWeekly } from './composables/useWeekly.js'
import { useIntake } from './composables/useIntake.js'
import { computeCharge, chargeSeries } from './composables/chargeModel.js'

const gate = useGate()
const { data, error: dataError, load } = useData()

/* Д-45: ДВА СЛОЯ ОДНОГО ПРИЛОЖЕНИЯ.
 *
 * До входа — публичная страница «Успею»: вилка Горизонта, календарь недель,
 * «Как читать», манифест. После входа — медкарта.
 *
 * ⚠ Раньше это были ДВА приложения с двумя входами и двумя шифрованными
 *   файлами. Владелец увидел последствие на живом сайте 30.08.2026: «у меня
 *   два закрытых слоя, а нужен один». Слито сюда, потому что закрытый слой
 *   тут уже был, а витрина добавляла второй на ровном месте.
 *
 * ⛔ Публичные данные грузятся СРАЗУ и не ждут пароля; медкарта — только
 *   после входа. Порядок именно такой, а не наоборот. */
const { publicData, loadPublic } = usePublicData()
const showGate = ref(false)

const masterWeeks = computed(() => data.value?.weekly || [])
const weekly = useWeekly(masterWeeks)

/* Химический слой (SYS-10, Д-33). События из мастера приезжают в генерате;
 * отметки, ещё не перенесённые в мастер, живут в телефоне — как у недельного
 * слоя, и по той же причине: мастер остаётся единственным источником истины. */
const masterEvents = computed(() => data.value?.chemistry?.events || [])
const intake = useIntake(masterEvents)

/* ⚠ Пятая вкладка, а не шестая. «День» — единственный экран, куда пишут, и
 *   он стоит вторым, сразу за «Зарядом». «Задачи» отдельной вкладкой не
 *   заводились: они живут разделом внутри «Данных», где уже стоят просрочки,
 *   пробелы и препараты. Шесть вкладок в капсуле перестают читаться —
 *   и первым перестаёт читаться то, что реже открывают. */
const TABS = [
  /* ⚠ ШЕСТАЯ ВКЛАДКА — решение владельца 30.08.2026, и оно осознанно
     отменяет прежнее правило «вкладок пять» (комментарий ниже оставлен как
     повод, а не как действующий запрет). Повод отмены: войдя в контур,
     владелец не мог вернуться на публичную страницу вообще никак — она
     показывалась только до входа, и единственным выходом была перезагрузка.
     «Горизонт» стоит первым, потому что это лицо продукта. */
  /* ⚠ Свой знак, а не батарея «Заряда»: с одинаковыми знаками две первые
     вкладки различались только подписью, и палец промахивался. */
  { id: 'horizon', label: 'Горизонт', icon: 'horizon', title: 'Горизонт' },
  { id: 'charge', label: 'Заряд', icon: 'charge', title: 'Заряд' },
  { id: 'day', label: 'День', icon: 'day', title: 'День' },
  { id: 'data', label: 'Данные', icon: 'data', title: 'Данные' },
]

/* ⚠⚠ ЧЕТЫРЕ ВКЛАДКИ, А НЕ ШЕСТЬ (владелец, 30.08.2026). «Системы» и
   «Прогресс» ушли из капсулы в плитки «Заряда»: шесть подписей по десять
   пикселей в одной капсуле перестали читаться, и первыми перестали читаться
   как раз те, что открывают реже всех. В капсуле осталось то, что открывают
   каждый день; всё остальное — плиткой с живым числом на первом экране, что
   даже заметнее иконки. */
const OFF_TAB = ['systems', 'progress', 'risk']
const active = ref('charge')
const surveyOpen = ref(false)
const surveyWeek = ref(null)

/* Данные грузятся ТОЛЬКО после входа. Это не про безопасность (файл лежит
 * открыто, его видно и без приложения), а про честность интерфейса: экран
 * входа, за которым в сети уже проехали все диагнозы, обещает не то, что
 * делает. Заодно первый экран рисуется быстрее. */
watch(() => gate.authed.value, (v) => { if (v) load() })
/* ⚠ Выход СБРАСЫВАЕТ showGate. Без этого после «Выйти» показывался экран
   ввода пароля: гейт оставался «открытым» с момента входа, и человек, вместо
   того чтобы оказаться на публичной странице, упирался в форму — то есть
   выйти по-настоящему было нельзя. */
function signOut() {
  gate.logout()
  showGate.value = false
  active.value = 'charge'
}

onMounted(loadPublic)

/* ⚠ С 15.10.2026 исключение одно — главная до входа (`LandingScreen`): она
 * стоит на титане Ранскеила своим скоупным набором токенов и сама красит
 * подложку документа и строку состояния, пока смонтирована. Всё, что ниже,
 * относится к оболочке контура и окну входа — они остались светлыми.
 *
 * ⚠ ТЁМНОЙ ТЕМЫ БОЛЬШЕ НЕТ НИ НА ОДНОМ СОСТОЯНИИ (30.08.2026). Она красила
 * полноэкранный вход; вход стал шторкой поверх светлой витрины, и чёрный фон
 * под ней означал бы, что страница сменилась, тогда как она осталась. Набор
 * `auth-dark` в `main.css` оставлен: он ещё пригодится, если вход когда-нибудь
 * снова станет отдельным экраном, — но со старта его нужно СНЯТЬ, потому что
 * `index.html` ставит его атрибутом ради правильного цвета строки состояния до
 * загрузки приложения. */
watch(() => gate.authed.value, () => {
  document.documentElement.setAttribute('data-theme', '')
  /* Д-70: строка состояния красится холстом контура, а не литералом —
     литерал разъехался бы с `--bg` при первой правке токенов. */
  const meta = document.querySelector('meta[name="theme-color"]')
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (meta && bg) meta.setAttribute('content', bg)
}, { immediate: true })

const charge = computed(() => {
  if (!data.value) return null
  return computeCharge(data.value, weekly.latest.value, new Date())
})

const series = computed(() =>
  data.value ? chargeSeries(data.value, [...weekly.weeks.value].reverse()) : [],
)

const currentWeekFilled = computed(() =>
  weekly.weeks.value.some((w) => w.week === weekly.currentWeek.value),
)

/* Опрос «пора» в воскресенье и в понедельник: воскресенье — день отметки,
 * понедельник — законный хвост для тех, кто в воскресенье не открыл телефон.
 * Дальше баннер остаётся, но перестаёт быть синим: настойчивость, которая
 * длится всю неделю, перестаёт читаться как напоминание. */
const isSurveyDue = computed(() => {
  const d = new Date().getDay()
  return (d === 0 || d === 1) && !currentWeekFilled.value
})

function openSurvey() {
  surveyWeek.value = weekly.editableWeeks.value.find(
    (w) => !weekly.weeks.value.some((x) => x.week === w),
  ) || weekly.currentWeek.value
  surveyOpen.value = true
}

function saveSurvey(fields) {
  weekly.save(surveyWeek.value, fields)
  surveyOpen.value = false
  active.value = 'progress'
}

/* ⚠ «Риски» открываются плиткой с «Заряда», а не вкладкой: шесть пунктов в
   капсуле — уже предел, седьмой перестал бы читаться. Но заголовок в шапке
   ему нужен так же, как остальным, иначе экран выглядит подвешенным. */
const OFF_TAB_TITLES = { risk: 'Контроль рисков', systems: 'Системы', progress: 'Прогресс' }
const shellTitle = computed(
  () => TABS.find((t) => t.id === active.value)?.title || OFF_TAB_TITLES[active.value] || '',
)
const shellSubtitle = computed(() => {
  if (!data.value) return ''
  if (active.value === 'charge') return `Метод ${charge.value?.method || ''}`
  if (active.value === 'day') return 'Химический слой · только отклонения от схемы'
  if (active.value === 'systems') return 'Шесть систем · органы-мишени контура'
  if (active.value === 'progress') return `${weekly.weeks.value.length} отметок в ряду`
  return `Данные собраны ${data.value.built}`
})

onMounted(() => {
  // Регистрация service worker — только на защищённом соединении и только в
  // собранном виде. В dev он мешает: кэш переживает правки и приходится
  // гадать, почему изменения не видны.
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const base = import.meta.env.BASE_URL || './'
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {})
  }
})
</script>

<template>
  <!-- ═══ ПУБЛИЧНЫЙ СЛОЙ — без пароля (Д-41/Д-45) ═══
       ⚠⚠ С 15.10.2026 ГЛАВНАЯ — СВОЙ ЭКРАН `LandingScreen`, а не оболочка
       контура с `PublicScreen` внутри (решение владельца: главная по
       стандарту Ранскеила — титан, знак K3 с числом 87 в левом верхнем углу
       рядом со словом «Успею», приборы как в Треке). `PublicScreen` остался
       вкладкой «Горизонт» внутри контура и этой правкой не тронут: «внутри
       после кнопки не трогай». Вход — та же шторка ниже. -->
  <LandingScreen
    v-if="!gate.authed.value"
    :pub="publicData"
    @enter="showGate = true"
  />

  <!-- ⚠ ВХОД — ШТОРКА ПОВЕРХ ВИТРИНЫ, а не отдельный экран (владелец,
       30.08.2026). Отдельному экрану нужна была своя кнопка «Назад» и своя
       тёмная тема, а витрина под ним пропадала целиком. У шторки выход общий
       для всех окон приложения: фон, крестик, Escape — и учить ему отдельно
       не нужно. -->
  <BottomSheet
    :open="!gate.authed.value && showGate"
    title="Доступ в контур"
    @close="showGate = false"
  >
    <AccessGate
      :login="gate.login.value"
      :checking="gate.checking.value"
      :error="gate.error.value"
      :notice="gate.notice.value"
      :unsupported="gate.unsupported.value"
      @submit="gate.submit"
    />
  </BottomSheet>

  <!-- ⚠ v-if, а НЕ v-else. Кнопка «Назад» между гейтом и оболочкой разорвала
       цепочку v-if/v-else-if/v-else, и `v-else` стал относиться к AccessGate:
       на публичной странице отрисовывалась оболочка медкарты с вкладками
       «Заряд · День · Системы · Прогресс · Данные». Данных в ней не было, но
       структура приложения была видна до входа. Поймано дымом 30.08.2026
       (стоп-слово «Заряд» на странице до входа), глазами не заметно —
       вкладки уезжали ниже первого экрана. -->
  <AppShell
    v-if="gate.authed.value"
    :tabs="TABS"
    :active="active"
    :title="shellTitle"
    :subtitle="shellSubtitle"
    :big-title="active !== 'horizon'"
    :back="OFF_TAB.includes(active)"
    @select="active = $event"
    @back="active = 'charge'"
  >
    <!-- ⛔ ВЫХОД ОБЯЗАТЕЛЕН И СТОИТ НА КАЖДОМ ЭКРАНЕ. Его не было вовсе:
         войдя, человек оставался внутри до перезагрузки вкладки — а на
         телефоне в полноэкранном режиме перезагрузить нечем. Поймано
         владельцем 30.08.2026 на живом приложении. -->
    <template #header-trailing>
      <!-- Д-70: нажимаемая пилюля носит объём (§11б), а не обводку. -->
      <button
        type="button"
        class="kh-pill kh-rim inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[0.875rem] font-semibold active:opacity-80"
        :style="{ color: 'var(--text-secondary)' }"
        @click="signOut"
      >Выйти</button>
    </template>

    <div v-if="dataError" class="kh-solid kh-rim rounded-[20px] px-5 py-5" :style="{ background: 'var(--sig-alarm-fill)' }">
      <p class="text-[0.9375rem] leading-relaxed" :style="{ color: 'var(--sig-alarm-ink)' }">{{ dataError }}</p>
    </div>

    <div v-else-if="!data" class="flex flex-col gap-3">
      <div class="kh-skeleton h-64 rounded-[20px]"></div>
      <div class="kh-skeleton h-24 rounded-[20px]"></div>
      <div class="kh-skeleton h-24 rounded-[20px]"></div>
    </div>

    <template v-else>
      <!-- ⚠ ТА ЖЕ страница, что видна до входа, а не её копия: копия разошлась
           бы с оригиналом в первую же правку текста. С Д-71 (15.10.2026) это
           экран главной `LandingScreen` в режиме `inside` — светлый, без
           своей шапки и без почты. Прежняя витрина `PublicScreen.vue` больше
           нигде не показывается. -->
      <LandingScreen v-if="active === 'horizon' && publicData && publicData.horizon" :pub="publicData" inside />
      <ChargeScreen
        v-else-if="active === 'charge'"
        :data="data"
        :charge="charge"
        :series="series"
        :week-filled="currentWeekFilled"
        :is-survey-due="isSurveyDue"
        @open-survey="openSurvey"
        @go="active = $event"
      />
      <DayScreen
        v-else-if="active === 'day'"
        :chemistry="data.chemistry || {}"
        :entries="intake.entries.value"
        :editable-days="intake.editableDays.value"
        :pending-export="intake.pendingExport.value"
        @save="intake.save"
      />
      <SystemsScreen v-else-if="active === 'systems'" :data="data" />
      <ProgressScreen
        v-else-if="active === 'progress'"
        :weeks="weekly.weeks.value"
        :series="series"
        :pending-export="weekly.pendingExport.value"
        :current-week="weekly.currentWeek.value"
        :charge-method="charge?.method || ''"
        :life="data.life || {}"
        :onboarding="data.onboarding || { sections: [] }"
        :reviewed="(publicData && publicData.weeks && publicData.weeks.reviewed) || []"
        :streak="(publicData && publicData.weeks && publicData.weeks.streak) || 0"
        @open-survey="openSurvey"
      />
      <RiskScreen v-else-if="active === 'risk'" :risk="data.risk || {}" />
      <DataScreen v-else :data="data" />
    </template>
  </AppShell>

  <SurveySheet
    v-if="surveyWeek"
    :open="surveyOpen"
    :week="surveyWeek"
    :initial="weekly.localAnswers.value[surveyWeek] || {}"
    @close="surveyOpen = false"
    @save="saveSurvey"
  />
</template>
