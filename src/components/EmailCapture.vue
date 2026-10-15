<script setup>
/*
  СБОР ПОЧТЫ НА ВИТРИНЕ.

  ⚠⚠ БЭКЕНДА У ВИТРИНЫ НЕТ И НЕ БУДЕТ В ЭТОЙ ВЕРСИИ. Пока адрес уезжает
  письмом через почтовый клиент человека (`mailto:`), а приём в таблицу — это
  задача SYS-23 в `workspace/ЗАДАЧИ.md`. Форма, которая делает вид, что
  отправила, и не отправляет ничего, хуже отсутствующей формы: человек считает,
  что записался, и второй раз уже не придёт.

  ⛔ ПРОВЕРКА ФОРМАТА ДО ОТПРАВКИ. Опечатка в адресе на `mailto:` не видна
  вообще никак — письмо просто не доходит, и обе стороны об этом не узнают.

  ⚠ Ошибка печатается СЛОВОМ под полем, а не одной красной рамкой: рамка
  сообщает, что что-то не так, но не что именно.
*/
import { computed, ref } from 'vue'

const TO = 'mihail.izyumov@gmail.com'
/* Не «полный RFC», а ровно то, что ловит опечатку: одна собака, точка в
   домене, никаких пробелов. Строгие регулярки на почту отсекают законные
   адреса и тем вредят больше, чем помогают. */
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const email = ref('')
/* ⛔ Согласие НЕ проставлено заранее (владелец, 30.08.2026). Галочка,
   стоящая по умолчанию, — это не согласие, а надежда, что человек не
   заметит. Пока она не поставлена рукой, кнопка отправки не работает. */
const wants = ref(false)
const touched = ref(false)
const sent = ref(false)

const bad = computed(() => touched.value && !RE.test(email.value.trim()))
const ready = computed(() => wants.value && RE.test(email.value.trim()))

function submit() {
  touched.value = true
  const v = email.value.trim()
  if (!RE.test(v) || !wants.value) return
  const subject = encodeURIComponent('Успею — хочу узнать свой горизонт')
  const body = encodeURIComponent(
    `Почта: ${v}\nХочу узнать свой горизонт: ${wants.value ? 'да' : 'нет'}\n`,
  )
  window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`
  sent.value = true
}
</script>

<template>
  <section class="cap">
    <template v-if="!sent">
      <div class="row">
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          spellcheck="false"
          class="up-field"
          :class="{ bad }"
          placeholder="укажите почту"
          aria-label="Ваша почта"
          @blur="touched = true"
          @keyup.enter="submit"
        />
        <button type="button" class="go" :class="{ off: !ready }" :disabled="!ready" @click="submit">→</button>
      </div>
      <p v-if="bad" class="err">Похоже на опечатку: нужен адрес вида имя@почта.ру</p>

      <!-- Флажок нарисован свой: системный на iOS — синий квадрат с галкой,
           который на светлой карточке кричит громче, чем сама строка. Здесь
           он тонкий, в цвет текста, и заливается только когда выбран. -->
      <label class="check" :class="{ on: wants }">
        <input v-model="wants" type="checkbox" class="sr" />
        <span class="box" aria-hidden="true">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7.4l2.6 2.6L11 4.6" />
          </svg>
        </span>
        <span class="lbl">Хочу узнать свой горизонт</span>
      </label>
    </template>

    <p v-else class="ok">
      Открылся почтовый клиент — письмо нужно отправить самому.
      Если он не открылся, напишите на <a :href="`mailto:${TO}`">{{ TO }}</a>.
    </p>
  </section>
</template>

<style scoped>
.cap { margin-top: 22px; }
.row { display: flex; gap: 8px; }
.go {
  flex: 0 0 52px; border: 0; border-radius: 14px; cursor: pointer;
  background: var(--action); color: var(--action-ink); font-size: 20px;
}
.go:active { opacity: .85; }
/* Кнопка гаснет, пока согласие не дано: серая заливка вместо синей говорит
   «сюда пока нельзя» до нажатия, а не после. */
.go.off { background: var(--surface-2); color: var(--text-muted); cursor: default; }
.err { margin: 8px 2px 0; font-size: 12.5px; color: var(--sig-alarm); }

/* ⚠ Согласие вплотную к полю — один блок, а не две отдельные мысли. Между
   ними стояло 14px, и на глаз галочка относилась скорее к тексту ниже, чем
   к полю ввода над ней. */
.check {
  display: flex; align-items: center; gap: 10px; margin-top: 6px;
  min-height: 40px; font-size: 14px; color: var(--text-muted); cursor: pointer;
  transition: color .15s ease;
}
.check.on { color: var(--text); }
/* Настоящий input оставлен в разметке и доступен клавиатуре и скринридеру —
   он лишь уведён с глаз. `display:none` выключил бы его из обоих. */
.sr {
  position: absolute; width: 1px; height: 1px; margin: -1px;
  padding: 0; border: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}
.box {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; flex: 0 0 20px; border-radius: 7px;
  border: 1.5px solid var(--line); color: transparent;
  transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.box svg { width: 13px; height: 13px; }
.check.on .box { background: var(--text); border-color: var(--text); color: var(--surface); }
.sr:focus-visible + .box { outline: 2px solid var(--action); outline-offset: 2px; }
.lbl { line-height: 1.3; }
@media (prefers-reduced-motion: reduce) {
  .check, .box { transition: none; }
}
.ok { margin: 0; font-size: 14px; line-height: 1.5; color: var(--text-secondary); }
.ok a { color: var(--action-text); }
</style>
