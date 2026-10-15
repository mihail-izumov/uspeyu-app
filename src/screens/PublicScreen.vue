<script setup>
/*
  ПУБЛИЧНАЯ ВХОДНАЯ СТРАНИЦА (Д-41, Д-42). Открывается без пароля.

  ⚠⚠ ПОРЯДОК ПЕРЕСОБРАН 30.08.2026 РЕШЕНИЕМ ВЛАДЕЛЬЦА (прежний — ТЗ-2 §В).
  Было: шапка со словом «Успею» → welcome-строка → Горизонт → «Как читать»
  целиком → календарь → телеметрия → метод целиком → версии целиком → футер.
  Страница получалась длиной в шесть экранов, из которых четыре — сплошной
  текст, и до Горизонта человек доходил, уже пролистав объяснение того, чего
  ещё не видел.

  Стало: герой → протокол и письмо → почта → Горизонт → баннеры (объяснения
  свёрнуты в шторки) → календарь → телеметрия → футер со знаком.

  ⛔ Каждое поле на этом экране обязано быть в docs/PUBLIC-WHITELIST.md §1.
  Захотелось показать ещё что-то — сперва решение владельца с кодом Д-NN
  в тот файл, потом поле в public.json, и только потом сюда. Обратный
  порядок — как раз тот, которым медкарта уезжает в интернет по кусочку.

  ⚠ ОБЪЯСНЕНИЕ НЕ ИСЧЕЗЛО, ОНО СВЁРНУТО. Д-43 требует, чтобы «Как читать»
  стояло рядом с числом, а не сноской внизу, — и баннер стоит ровно там, сразу
  под Горизонтом. Разница между «убрано» и «свёрнуто» здесь принципиальная:
  шторка открывается одним касанием и содержит тот же текст целиком.
*/
import { computed, ref } from 'vue'
import BottomSheet from '../components/BottomSheet.vue'
import BrandHero from '../components/BrandHero.vue'
import EmailCapture from '../components/EmailCapture.vue'
import HorizonCard from '../components/HorizonCard.vue'
import LifeCalendar from '../components/LifeCalendar.vue'
import PoweredBy from '../components/PoweredBy.vue'
import ProtocolLetter from '../components/ProtocolLetter.vue'
import ReadingBlocks from '../components/ReadingBlocks.vue'
import { plural } from '../composables/useData.js'
import { useProfile } from '../composables/useProfile.js'

const props = defineProps({ pub: { type: Object, required: true } })

/* Свежесть телеметрии — единственный статус на публичной странице.
   Три ступени; цвет и слово всегда вместе (цвет не бывает единственным
   носителем смысла). */
const fresh = computed(() => {
  const d = props.pub.telemetry.draw_days
  if (d == null) return { kind: 'alarm', text: 'данных о заборах нет' }
  if (d <= 180) return { kind: 'ok', text: `данные обновлены ${d} ${plural(d, 'день', 'дня', 'дней')} назад` }
  if (d <= 548) return { kind: 'watch', text: `данным ${d} ${plural(d, 'день', 'дня', 'дней')}` }
  return { kind: 'alarm', text: `данным ${d} ${plural(d, 'день', 'дня', 'дней')} — картина устарела` }
})

const streak = computed(() => props.pub.weeks.streak)

/* ПРОТОКОЛ — чей ряд показан. Состояние общее с окном входа
   (`composables/useProfile.js`): логин в шторке входа обязан называть тот же
   протокол, вилку которого человек только что смотрел. */
const { protocols: PROTOCOLS, current, name: whoName, select } = useProfile()
const who = computed(() => current.value.id)

const sheet = ref('')          // '' | 'letter' | 'reading' | 'method' | 'versions' | 'who'
const isOpen = (k) => sheet.value === k

const version = computed(() => (props.pub.versions && props.pub.versions[0]) || null)

/* ПИСЬМО ПРОЧИТАНО — конверт открывается и больше не закрывается.
   ⚠ Отметка живёт в браузере (localStorage), а не в памяти вкладки: смысл
   знака в том, чтобы на следующий заход человек видел, что письмо он уже
   открывал. Хранилище может быть недоступно (частный режим, запрет данных
   сайта) — тогда конверт просто всегда закрыт, и это не ошибка. */
const READ_KEY = 'uspeyu:letter-read'
const letterRead = ref(false)
try { letterRead.value = localStorage.getItem(READ_KEY) === '1' } catch { /* хранилище недоступно */ }

function openLetter() {
  sheet.value = 'letter'
  letterRead.value = true
  try { localStorage.setItem(READ_KEY, '1') } catch { /* хранилище недоступно */ }
}

function pick(p) {
  if (select(p)) sheet.value = ''
}
</script>

<template>
  <div class="up-wrap">
    <!-- ─── Герой: имя продукта во всю ширину ──────────────────────────── -->
    <header class="hero">
      <BrandHero :text="pub.product.name" :tagline="pub.product.welcome" />
      <EmailCapture />
    </header>

    <HorizonCard :horizon="pub.horizon">
      <!-- Строка протокола — подпись под числом, поэтому стоит внутри
           карточки Горизонта, а не отдельной строкой над страницей. -->
      <template #protocol>
        <span class="plabel">Протокол:</span>
        <button type="button" class="up-bubble" @click="sheet = 'who'">
          {{ whoName }}
          <svg viewBox="0 0 20 20" class="chev" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
        </button>
        <!-- Конверт закрыт, пока письмо не открывали, и распечатан после.
             ⚠ Знак меняется НАВСЕГДА, а не на сессию: «прочитано» — это про
             человека, а не про вкладку. -->
        <button
          type="button"
          class="up-round"
          :class="{ read: letterRead }"
          :aria-label="letterRead ? 'Письмо протокола (прочитано)' : 'Письмо протокола'"
          @click="openLetter"
        >
          <svg v-if="!letterRead" viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
            <path d="M3.8 7 12 13l8.2-6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 10.5 12 4l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5z" />
            <path d="M3 10.5 12 17l9-6.5" />
          </svg>
        </button>
      </template>
    </HorizonCard>

    <!-- Д-43: объяснение стоит СРАЗУ ПОД ЧИСЛОМ. Свёрнуто в баннер, но
         не унесено вниз страницы и не спрятано за пароль. -->
    <button type="button" class="up-banner mt" @click="sheet = 'reading'">
      <span class="min-w-0 flex-1">
        <span class="bt">Как читать</span>
        <span class="bs">Что означает вилка, откуда берётся и чего она не обещает</span>
      </span>
      <svg viewBox="0 0 20 20" class="arw" fill="none" stroke="currentColor" stroke-width="2.1"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l6 6-6 6" /></svg>
    </button>

    <button type="button" class="up-banner mt" @click="sheet = 'method'">
      <span class="min-w-0 flex-1">
        <span class="bt">Метод</span>
        <span class="bs">
          {{ pub.manifest.draft ? '⚠ черновик · ' : '' }}пять тезисов, на которых стоит счёт
        </span>
      </span>
      <svg viewBox="0 0 20 20" class="arw" fill="none" stroke="currentColor" stroke-width="2.1"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l6 6-6 6" /></svg>
    </button>

    <div class="up-sec">Календарь жизни</div>
    <section class="up-card">
      <LifeCalendar
        :born="pub.weeks.born"
        :lived="pub.weeks.lived"
        :to-current-lo="pub.weeks.to_current_lo"
        :to-current-hi="pub.weeks.to_current_hi"
        :to-target-hi="pub.weeks.to_target_hi"
        :reviewed="pub.weeks.reviewed"
      />
    </section>

    <div class="up-sec">Телеметрия</div>
    <section class="up-card tele">
      <div class="chip" :class="fresh.kind">{{ fresh.text }}</div>
      <div class="trow">
        <span class="up-muted">Недель в зачёте подряд</span>
        <span class="up-digit">{{ streak }}</span>
      </div>
      <div class="trow">
        <span class="up-muted">Недельных отметок внесено</span>
        <span class="up-digit">{{ pub.telemetry.weeks_filled }}</span>
      </div>
      <p class="honest">
        Свежесть показана нарочно. Система, которая скрывает возраст своих данных,
        выглядит живее, чем есть, — и первым же несвежим числом обесценивает все остальные.
      </p>
    </section>

    <!-- ⚠ Подвал БЕЗ ЛИНИИ СВЕРХУ (владелец, 30.08.2026). Разделитель делал
         девиз концом страницы — тем, что дочитывают по инерции. Без него
         фраза читается высказыванием, ради которого всё остальное. -->
    <footer class="foot">
      <p class="motto">{{ pub.product.motto }}</p>
      <p class="author">{{ pub.product.author }}</p>

      <!-- Версия — баблом. ⛔ Номер остаётся на виду: он отвечает на вопрос
           «то ли я вижу, что видел вчера». Всё остальное — журнал версий и
           знак «Модуль роста» — уехало внутрь шторки: подвал не место для
           двух блоков, которые открывают раз в жизни. -->
      <div class="vwrap">
        <button v-if="version" type="button" class="up-bubble flat" @click="sheet = 'versions'">
          Версия {{ version.version }}
        </button>
      </div>
    </footer>

    <!-- ═══ ШТОРКИ ═══ -->
    <BottomSheet :open="isOpen('who')" title="Протокол" @close="sheet = ''">
      <ul class="whos">
        <li v-for="p in PROTOCOLS" :key="p.id">
          <button type="button" class="whorow" :class="{ off: p.soon, on: p.id === who }" :disabled="p.soon" @click="pick(p)">
            <span>{{ p.name }}</span>
            <span v-if="p.soon" class="soon">скоро</span>
            <span v-else-if="p.id === who" class="mark">✓</span>
          </button>
        </li>
      </ul>
    </BottomSheet>

    <BottomSheet :open="isOpen('letter')" title="Жить — это команда." @close="sheet = ''">
      <ProtocolLetter />
    </BottomSheet>

    <BottomSheet
      :open="isOpen('reading')"
      :title="(pub.onboarding && pub.onboarding.title) || 'Как читать'"
      @close="sheet = ''"
    >
      <ReadingBlocks :sections="(pub.onboarding && pub.onboarding.sections) || []" />
    </BottomSheet>

    <BottomSheet :open="isOpen('method')" title="Метод" @close="sheet = ''">
      <p v-if="pub.manifest.draft" class="draft">
        ⚠ Черновик: текст метода ещё не принят владельцем.
      </p>
      <div v-for="(m, i) in pub.manifest.items" :key="i" class="thesis">
        <h3>{{ m.title }}</h3>
        <p>{{ m.text }}</p>
      </div>
    </BottomSheet>

    <BottomSheet :open="isOpen('versions')" title="Версии" @close="sheet = ''">
      <div v-for="v in pub.versions" :key="v.date + v.version" class="ver">
        <span class="up-muted up-digit">{{ v.date }} · {{ v.version }}</span>
        <p>{{ v.text }}</p>
      </div>
      <!-- ⚠ Знак «Модуль роста» стоит здесь, а не в подвале: он отвечает на
           тот же вопрос, что и номер версии, — «чем это сделано». -->
      <PoweredBy class="pb" />
    </BottomSheet>
  </div>
</template>

<style scoped>
.plabel { font-size: 13.5px; color: var(--text-muted); }
.chev { width: 15px; height: 15px; }
.ico { width: 19px; height: 19px; }
/* Прочитанное письмо теряет синеву: знак остаётся, приглашение — нет. */
.up-round.read { color: var(--text-muted); }

/* Верхний отступ — воздух под кнопкой «Войти» в шапке оболочки: safe-area
   отработала там, здесь остаётся только просвет. */
.hero { padding: 58px 0 26px; }

.mt { margin-top: 10px; }
/* Баннер верстается span'ами внутри кнопки — блочность возвращается здесь,
   иначе заголовок и подпись встают в одну строку. */
.up-banner .bt, .up-banner .bs { display: block; }
.arw { width: 18px; height: 18px; }

.tele { display: flex; flex-direction: column; gap: 10px; }
.chip {
  align-self: flex-start; font-size: 12.5px; font-weight: 600;
  padding: 5px 11px; border-radius: 999px;
}
.chip.ok { color: var(--sig-ok); background: var(--sig-ok-fill); }
.chip.watch { color: var(--sig-watch); background: var(--sig-watch-fill); }
.chip.alarm { color: var(--sig-alarm); background: var(--sig-alarm-fill); }
.trow { display: flex; justify-content: space-between; font-size: 14px; }
.honest { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); line-height: 1.45; }

.draft {
  margin: 0 0 14px; font-size: 12.5px; color: var(--sig-watch);
  background: var(--sig-watch-fill); border-radius: 10px; padding: 8px 10px;
}
.thesis + .thesis { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
.thesis h3 { font-size: 15px; }
.thesis p { margin: 5px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); }

.ver + .ver { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
.ver p { margin: 3px 0 0; font-size: 13px; color: var(--text-secondary); }
.ver .up-muted { font-size: 12px; }

.whos { list-style: none; margin: 0; padding: 0; }
.whorow {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; min-height: 52px; padding: 0 4px; border: 0; background: transparent;
  font: inherit; font-size: 16px; color: var(--text); cursor: pointer; text-align: left;
}
.whos li + li .whorow { border-top: 1px solid var(--line); }
.whorow.off { color: var(--text-muted); cursor: default; }
.whorow.on { font-weight: 600; }
.soon {
  font-size: 11.5px; text-transform: uppercase; letter-spacing: .05em;
  color: var(--text-muted); background: var(--surface-2);
  border-radius: 999px; padding: 3px 9px;
}
.mark { color: var(--action-text); }
.whonote { margin: 14px 0 0; font-size: 12.5px; line-height: 1.5; }

.foot { margin-top: 44px; text-align: center; }
/* ⚠ ПОДВАЛ ПО ОБРАЗЦУ ВИТРИНЫ gderost (`SiteFooter.vue`): крупная фраза
   чернилами текста, под ней вторая строка синим и мельче. Приём держится на
   контрасте кегля, а не цвета: раньше девиз был синим, имя — серым мелким, и
   страница заканчивалась подписью, которую не видно. Теперь заканчивается
   высказыванием, а имя стоит там, где в книге стоит имя автора. */
.motto {
  margin: 0; font-size: 26px; font-weight: 700; line-height: 1.15;
  letter-spacing: -.02em; color: var(--text); text-wrap: balance;
}
.author { margin: 12px 0 0; font-size: 17px; font-weight: 600; color: var(--action-text); }
.vwrap { margin-top: 16px; }
/* Бабл версии — без обводки, серой заливкой: в подвале он подпись, а не
   орган управления, и рамка ставила бы его в один ряд с кнопками. */
.up-bubble.flat {
  border: 0; background: var(--surface-2); color: var(--text-muted); font-weight: 500;
}
.pb { margin-top: 22px; }
</style>
