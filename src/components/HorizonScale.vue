<script setup>
/*
  ШКАЛА ЖИЗНИ: ФАКТ · ПРОГНОЗ · ПЛАН · ЦЕЛЬ (Д-59, 30.08.2026).

  Перенос карточки месяца из «Ранскейла» на ось лет. Там: факт · план ·
  прогноз · цель и метка цели над полосой. Здесь то же самое, только
  величина — годы, а «цель» — рубеж владельца.

  ⛔⛔ ЦЕЛЬ ПОСТАВЛЕНА, А НЕ ВЫЧИСЛЕНА. Это главное, что экран обязан
  сказать, и он говорит это словами под числом. Модель под рубеж не
  подгонялась: в разговоре 30.08.2026 звучало «взять HR 0,25, тогда
  выйдет 87» — коэффициент без источника запрещён (⛔2 методики), и с ним
  обесценились бы экстра-годы, потому что они разность двух вилок на
  одном честном базисе. Рубеж живёт в forecast/targets.md, сюда приезжает
  готовым числом через build_app_data.py.

  ⛔ РАМКА ЧЕСТНОСТИ. Ни прогноз, ни план не рисуются одной чертой: у
  каждого своя вилка, и вилка на полосе показана ШТРИХОВКОЙ — участком, а
  не линией. Сплошная граница означала бы точное знание, которого нет.

  ⚠ ПОЧЕМУ SVG, А НЕ ВЁРСТКА (правило Д-58). Позиции сегментов заданы
  числами на оси лет; в CSS-раскладке они превратились бы в проценты,
  которые браузер округляет каждый по-своему, и метка цели уехала бы от
  своего года. В `viewBox` координата 87 лет — это координата, и она не
  зависит от ширины телефона.

  ⚠ ЦВЕТ ЗАИМСТВОВАН У КАЛЕНДАРЯ ЖИЗНИ, а не выбран заново: синий —
  прожито, бледно-синий — впереди, фиолетовый — экстра-годы (Д-55/Д-56).
  Две картинки в одном приложении обязаны учить одному языку цвета.
  ⛔ Красного здесь нет ни в одном сегменте. Зазор — не тревога, а
  незакрытая работа; покрасить его красным значило бы сказать «ты не
  успеешь», то есть ровно то, чего продукт не говорит.
*/
import { computed } from 'vue'

const props = defineProps({
  horizon: { type: Object, required: true },
})

// Ось: от рождения до ближайшего ДЕСЯТКА за рубежом.
//
// ⚠ Первый заход брал «рубеж + 4» — то есть 91, число ниоткуда. Владелец
//   спросил прямо: «на сколько лет рассчитан бар?» — и это был честный
//   вопрос без ответа на экране. Круглый десяток отвечает сам: засечки
//   каждые 10 лет и подписанные концы говорят длину шкалы без текста.
// ⚠ ВЫСОТА viewBox ПОДОБРАНА ПОД РЕАЛЬНУЮ ШИРИНУ КАРТОЧКИ, а не «на глаз».
//   Ширина колонки на телефоне ≈ 340 px, значит масштаб ≈ 0,34: чтобы полоса
//   была видимыми 15 px, в координатах viewBox она обязана быть ~44. Первый
//   заход (BAR_H 14 при W 1000) давал на экране 4,8 px — нитку, на которой
//   штриховка вилки не читалась вовсе, а это единственное место, где на
//   полосе показана неопределённость.
const W = 1000
const PAD = 12
const BAR_Y = 56
const BAR_H = 44

const goal = computed(() => props.horizon?.goal || null)
const axisMax = computed(() =>
  goal.value ? Math.ceil((goal.value.age + 2) / 10) * 10 : 90)

// Засечки десятилетий — единственная разметка оси. Подписаны только концы:
// подписи внутри SVG масштабировались бы вместе с картинкой и на узком
// телефоне стали бы нечитаемыми, поэтому числа стоят HTML-строкой под ней.
const ticks = computed(() => {
  const t = []
  for (let y = 10; y < axisMax.value; y += 10) t.push(y)
  return t
})

function x(years) {
  const f = Math.max(0, Math.min(1, years / axisMax.value))
  return PAD + f * (W - PAD * 2)
}

const lived = computed(() => props.horizon.goal?.lived ?? 0)
const cur = computed(() => props.horizon.current)
const plan = computed(() => props.horizon.target)

// Сегменты слева направо. `hatch` — участок вилки: неопределённость.
const segs = computed(() => {
  const s = []
  s.push({ k: 'lived', x0: 0, x1: lived.value, fill: 'var(--wk-lived)' })
  s.push({ k: 'ahead', x0: lived.value, x1: cur.value.age_lo, fill: 'var(--wk-ahead)' })
  s.push({ k: 'cur', x0: cur.value.age_lo, x1: cur.value.age_hi, fill: 'url(#hAhead)' })
  s.push({ k: 'plan', x0: cur.value.age_hi, x1: plan.value.age_lo, fill: 'var(--wk-target)' })
  s.push({ k: 'planv', x0: plan.value.age_lo, x1: plan.value.age_hi, fill: 'url(#hTarget)' })
  return s.filter(v => v.x1 > v.x0)
})

const gapFrom = computed(() => plan.value.age_hi)
</script>

<template>
  <div v-if="goal" class="scale">
    <svg :viewBox="`0 0 ${W} 116`" class="svg" role="img"
         :aria-label="`Прожито ${goal.lived} лет, прогноз ${cur.label}, план ${plan.label}, рубеж ${goal.age}`">
      <defs>
        <!-- Штриховка вилки. Шаг в координатах viewBox, поэтому одинаков
             на любой ширине экрана. -->
        <!-- ⚠ Штриховка вилки прогноза бьётся ЦВЕТОМ ПРОЖИТОГО по фону
             «впереди», а не бледным по бледному: первый заход красил её
             бледно-синим на бледно-синем, и участок неопределённости —
             единственное место, где на полосе видно, что мы не знаем
             точно, — сливался с соседним сегментом. -->
        <pattern id="hAhead" width="14" height="14" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <rect width="14" height="14" fill="var(--wk-ahead)" />
          <rect width="6" height="14" fill="var(--wk-lived)" opacity=".55" />
        </pattern>
        <pattern id="hTarget" width="14" height="14" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <rect width="14" height="14" fill="var(--wk-target)" opacity=".28" />
          <rect width="6" height="14" fill="var(--wk-target)" />
        </pattern>
      </defs>

      <!-- Дорожка целиком: от рождения до конца оси -->
      <rect :x="x(0)" :y="BAR_Y" :width="x(axisMax) - x(0)" :height="BAR_H"
            rx="22" fill="var(--surface-2)" />

      <!-- Зазор до рубежа: пунктирный контур, без заливки. Пустота здесь
           значит ровно то, чем она является, — незакрытая работа. -->
      <rect :x="x(gapFrom)" :y="BAR_Y" :width="Math.max(0, x(goal.age) - x(gapFrom))"
            :height="BAR_H" rx="22" fill="none"
            stroke="var(--wk-target)" stroke-width="4" stroke-dasharray="12 10"
            opacity=".8" />

      <clipPath id="barClip">
        <rect :x="x(0)" :y="BAR_Y" :width="x(axisMax) - x(0)" :height="BAR_H" rx="22" />
      </clipPath>
      <g clip-path="url(#barClip)">
        <rect v-for="s in segs" :key="s.k"
              :x="x(s.x0)" :y="BAR_Y" :width="x(s.x1) - x(s.x0)" :height="BAR_H"
              :fill="s.fill" />
      </g>

      <!-- Метка рубежа: ▼ над полосой и черта сквозь неё. Знак вынесен
           НАД полосой, а не внутрь: цель не сегмент, она граница. -->
      <polygon :points="`${x(goal.age) - 15},8 ${x(goal.age) + 15},8 ${x(goal.age)},32`"
               fill="var(--text)" />
      <rect :x="x(goal.age) - 3" :y="BAR_Y - 10" width="6" :height="BAR_H + 20"
            rx="3" fill="var(--text)" />

      <!-- Засечки десятилетий: отвечают на вопрос «какой длины шкала»
           без единого слова. Стоят ПОД полосой, чтобы не спорить с
           сегментами и не читаться границей между ними. -->
      <rect v-for="t in ticks" :key="t" :x="x(t) - 1.5" :y="BAR_Y + BAR_H + 8"
            width="3" height="9" rx="1.5" fill="var(--text-muted)" opacity=".45" />
    </svg>

    <div class="axis up-muted">
      <span>0 · рождение</span>
      <span>шаг засечки — 10 лет</span>
      <span>{{ axisMax }}</span>
    </div>

    <div class="legend">
      <div class="li">
        <span class="sw" style="background:var(--wk-lived)"></span>
        <span class="lb">Факт</span>
        <span class="lv up-digit">{{ Math.floor(goal.lived) }}</span>
      </div>
      <div class="li">
        <span class="sw hatch-a"></span>
        <span class="lb">Прогноз</span>
        <span class="lv up-digit">{{ cur.label }}</span>
      </div>
      <div class="li">
        <span class="sw" style="background:var(--wk-target)"></span>
        <span class="lb">План</span>
        <span class="lv up-digit">{{ plan.label }}</span>
      </div>
      <div class="li">
        <!-- ⚠ Образец цели ПОВТОРЯЕТ знак на полосе (▼ с чертой), а не
             показывает квадратик своего цвета, как три соседа. Первый заход
             ставил здесь пустой квадрат с рамкой, и связь между строкой
             «Цель 87» и чёрной меткой на шкале не читалась вовсе —
             владелец спросил, что это за стрелка. Образец обязан быть тем
             же знаком, иначе легенда не легенда. -->
        <svg class="sw" viewBox="0 0 14 14" aria-hidden="true">
          <polygon points="2,1 12,1 7,7" fill="var(--text)" />
          <rect x="5.6" y="6" width="2.8" height="8" rx="1.4" fill="var(--text)" />
        </svg>
        <span class="lb">Цель</span>
        <span class="lv up-digit">{{ Math.round(goal.age) }}</span>
      </div>
    </div>

    <!-- ⚠ «КАК ЧИТАТЬ» — НЕ УКРАШЕНИЕ (владелец, 30.08.2026: «не понял, что
         означает прерывистая плашка и стрелка с чёрной полоской»). Две
         текстуры на полосе несут смысл, которого нет ни в одном числе:
         штриховка — что контур не знает точно, пунктир — что участок ничем
         не закрыт. Знак, который приходится объяснять голосом, на экране
         не работает. -->
    <div class="howto">
      <div class="hr">
        <span class="hs hatch-a"></span>
        <span>Штриховка — вилка: контур знает участок, но не точку внутри него.</span>
      </div>
      <div class="hr">
        <span class="hs dash"></span>
        <span>Пунктир — зазор до рубежа: годы, которых известные рычаги не дают.</span>
      </div>
    </div>

    <!-- ⛔ ЗАЗОР — ГЛАВНОЕ ЧИСЛО ЭТОГО БЛОКА, и он обязан идти вместе с тем,
         что с ним делать. Канон бренда (Д-40, следствие 1): экран, который
         добавляет тревоги, не давая управления, — дефект. Поэтому под
         зазором стоит не «не хватает», а «чем закрывается». -->
    <div v-if="!goal.reached_by_plan" class="gap">
      <div class="gtop">
        <span class="gl">Между планом и рубежом</span>
        <span class="gv up-digit">{{ goal.gap_label }} <i>лет</i></span>
      </div>
      <p class="gn">
        Столько известные контуру рычаги не дают. Это не приговор и не ошибка
        счёта — это список того, чего в контуре пока нет: неучтённые факторы,
        неизмеренные слои, неизвестная науке часть. Зазор — рабочее задание,
        и он сужается, когда данных становится больше.
      </p>
    </div>
    <div v-else class="gap reached">
      <span class="gl">Рубеж {{ Math.round(goal.age) }} достижим в плане контура.</span>
    </div>

    <p class="own">
      [ВАЖНО] Рубеж <b>{{ Math.round(goal.age) }}</b> поставлен решением владельца, а не выведен
      моделью. Ни один коэффициент «Горизонта» под него не подобран — иначе
      число перестало бы что-либо значить.
    </p>
  </div>
</template>

<style scoped>
.scale { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); text-align: left; }
.svg { display: block; width: 100%; height: auto; }

.legend {
  margin-top: 12px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.li { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.sw { width: 13px; height: 13px; border-radius: 4px; display: block; }
.hatch-a {
  background: repeating-linear-gradient(45deg,
    var(--wk-ahead) 0 3px, transparent 3px 6px), var(--surface-2);
}

.axis {
  display: flex; justify-content: space-between; gap: 8px;
  margin-top: 3px; font-size: 10.5px;
}

.howto { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.hr { display: flex; align-items: flex-start; gap: 8px; font-size: 11.5px;
      line-height: 1.4; color: var(--text-muted); }
.hs { flex: 0 0 auto; width: 22px; height: 13px; border-radius: 4px; margin-top: 1px; }
.dash {
  background: transparent;
  border: 2px dashed var(--wk-target);
  border-radius: 7px;
}
.lb { font-size: 11.5px; color: var(--text-muted); }
.lv { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }

.gap {
  margin-top: 16px; padding: 12px 13px; border-radius: 12px;
  background: var(--sig-blocked-fill);
}
.gtop { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.gl { font-size: 13px; color: var(--sig-blocked-ink); }
.gv { font-size: 24px; font-weight: 700; color: var(--sig-blocked-ink); }
.gv i { font-style: normal; font-size: 13px; font-weight: 500; }
.gn { margin: 8px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--sig-blocked-ink); }
.reached { display: block; }

.own { margin: 12px 0 0; font-size: 12px; line-height: 1.45; color: var(--text-muted); }
.own b { color: var(--text); }
</style>
