<script setup>
/*
  Разметчик онбординга. Один на обе стороны витрины: публичную страницу и
  приватный экран «Как читать».

  ⛔ Текст здесь НЕ живёт. Мастер — `docs/ONBOARDING-gorizont.md` в контуре
  здоровья; генератор режет его по меткам `{публично}` / `{внутри}` и кладёт
  в public.json и uspeyu.json соответственно. Правка текста в этом файле —
  дефект: мастер и экран разойдутся молча, и через месяц будет непонятно,
  какая версия объяснения верна.

  ⚠ Компонент общий нарочно. Двумя копиями разметчик разошёлся бы по отступам
  и по обработке таблиц, и один и тот же абзац читался бы на двух экранах
  по-разному — а это один и тот же абзац из одного файла.

  Разметка нарочно бедная: заголовки, абзацы, списки, таблицы, **жирный** и
  `код`. Ничего, чем текст в мастере мог бы оформить себя произвольно.
*/
import { computed } from 'vue'

const props = defineProps({
  sections: { type: Array, default: () => [] },
})

function inline(s) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function blocks(body) {
  const out = []
  let table = null
  let list = null
  const flush = () => {
    if (table) { out.push({ kind: 'table', rows: table }); table = null }
    if (list) { out.push({ kind: 'list', items: list }); list = null }
  }
  for (const raw of String(body || '').split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim())
      // Строка-разделитель шапки состоит только из дефисов и двоеточий —
      // её рисовать не нужно, она разметка, а не данные.
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue
      table = table || []
      table.push(cells.map(inline))
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      list = list || []
      list.push(inline(line.replace(/^[-*]\s+/, '')))
      continue
    }
    flush()
    out.push({ kind: 'p', html: inline(line) })
  }
  flush()
  return out
}

const parsed = computed(() => props.sections.map((s) => ({
  title: s.title,
  blocks: blocks(s.body),
})))
</script>

<template>
  <!-- ⚠⚠ ВЁРСТКА ПЕРЕНЕСЕНА ИЗ РАЗДЕЛА «УЛЬТРА» gderost
       (`app/src/components/ultra/UltraChapter.vue`), 30.08.2026. Прежняя была
       компактной справкой: заголовок 15px, абзац 13,5px, секции разделены
       тонкой линией. На длинном объяснении это читается сплошной серой
       простынёй — а «Как читать» и есть самое длинное чтение витрины.

       Что перенесено дословно и почему:
        · ТРИ ступени размера вместо двух: eyebrow-номер, заголовок 26px,
          текст 15px. Между заголовком и текстом должен быть скачок, иначе
          глазу не за что зацепиться при перелистывании;
        · ЧЕРЕДОВАНИЕ ХОЛСТА И СЛОЯ вместо разделительных линий — в оригинале
          прямо записано: «без него одиннадцать одинаковых блоков читаются
          одним нескончаемым». Линия отделяет, но не даёт ритма;
        · ВОЗДУХ 44px сверху и снизу секции. Это база, работает всегда;
        · ПЕРВЫЙ АБЗАЦ — ведущий: крупнее и темнее остальных. -->
  <div v-for="(s, i) in parsed" :key="i" class="sec" :class="{ raised: i % 2 === 1 }">
    <span class="eyebrow kh-caps">Шаг {{ i + 1 }}</span>
    <h3 class="kh-balance">{{ s.title }}</h3>
    <template v-for="(b, j) in s.blocks" :key="j">
      <p v-if="b.kind === 'p'" :class="{ lead: j === 0 }" v-html="b.html"></p>
      <ul v-else-if="b.kind === 'list'">
        <li v-for="(it, k) in b.items" :key="k" v-html="it"></li>
      </ul>
      <div v-else class="tw">
        <table>
          <tr v-for="(row, k) in b.rows" :key="k">
            <component :is="k === 0 ? 'th' : 'td'" v-for="(c, m) in row" :key="m"
                       v-html="c"></component>
          </tr>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sec { padding: 30px 0; }
.sec:first-child { padding-top: 6px; }
.sec:last-child { padding-bottom: 8px; }
/* Поднятая секция уходит на всю ширину шторки и красится слоем. Отступ в
   20px совпадает с полем шторки и полем витрины — если одно изменится,
   изменить и здесь, иначе фон поедет ступенькой. */
.sec.raised {
  margin: 0 -20px; padding: 30px 20px;
  background: var(--surface);
}
.eyebrow {
  display: block; font-size: 12px; text-transform: uppercase;
  color: var(--text-muted); --caps-track: .14em;
}
h3 {
  margin: 12px 0 0; font-size: 26px; font-weight: 700;
  line-height: 1.12; letter-spacing: -.02em; color: var(--text);
}
p { margin: 14px 0 0; font-size: 15px; line-height: 1.62; color: var(--text-secondary); }
/* Ведущий абзац — тот, ради которого секцию открывают: он темнее и чуть
   крупнее, и по нему одному можно понять, о чём весь блок. */
p.lead { color: var(--text); font-size: 15.5px; text-wrap: pretty; }
ul { margin: 14px 0 0; padding-left: 20px; }
li { font-size: 15px; line-height: 1.55; color: var(--text-secondary); margin-bottom: 7px; }
li:last-child { margin-bottom: 0; }
/* Таблица шире экрана скроллится внутри своего контейнера, а не тащит
   за собой всю страницу вбок. */
.tw { overflow-x: auto; margin: 16px 0 0; }
table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--text-muted); font-weight: 500; }
code { font-size: 13px; background: var(--surface-2); padding: 1px 5px; border-radius: 5px; }
</style>
