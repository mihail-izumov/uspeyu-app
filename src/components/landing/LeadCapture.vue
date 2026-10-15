<script setup>
/*
  ПОЧТА С ГЛАВНОЙ — заявка уходит в Google Таблицу Михаила.

  Повод (Д-64, слово владельца 15.10.2026): «настрой приём заявок через
  Google-таблицу и Google-скрипт». Таблица «Успею — заявки с главной» и
  скрипт «Успею — приём заявок» заведены в его аккаунте; скрипт развёрнут
  веб-приложением и дописывает строку в лист «Заявки».

  Почему отдельный компонент, а не правка `EmailCapture.vue`: тот живёт и
  внутри контура (вкладка «Горизонт»), а всё, что после «Войти», владелец
  трогать запретил.

  ⚠ АДРЕС — развёртывание «Заявки с главной uspeyu.ru, v1» от 15.10.2026, 15:26.
    Новое развёртывание в Apps Script даёт НОВЫЙ адрес; чтобы адрес не менялся,
    правку скрипта выкладывают через «Управление развертываниями» → карандаш →
    «Новая версия». Пустой LEADS_URL возвращает форму к `mailto:`.

  ⚠ Запрос — простой POST формой (`application/x-www-form-urlencoded`): такой
    браузер шлёт без предварительного OPTIONS, а Apps Script на OPTIONS не
    отвечает. Ответ скрипта приходит через переадресацию на
    googleusercontent.com с разрешением CORS, поэтому его можно прочитать.

  ⛔ Согласие НЕ проставлено заранее (владелец, 30.08.2026): галочка по
    умолчанию — не согласие, а надежда, что человек не заметит.

  ⚠ Поле `website` скрыто от людей и ловит ботов: человек его не заполняет.
*/
import { computed, ref } from 'vue'

const LEADS_URL = 'https://script.google.com/macros/s/AKfycbwy9qtWhP6sCI2uCgrpAqAKIgs97FG4kbdjfaUsbBnJB0pwmDZLfFoVLkES8ur2hqEL/exec'
const TO = 'mihail.izyumov@gmail.com'
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const email = ref('')
const wants = ref(false)
const trap = ref('')
const touched = ref(false)
const state = ref('idle') // idle · sending · sent · mail · fail

const bad = computed(() => touched.value && !RE.test(email.value.trim()))
const ready = computed(() => wants.value && RE.test(email.value.trim()) && state.value !== 'sending')

async function submit() {
  touched.value = true
  const v = email.value.trim()
  if (!RE.test(v) || !wants.value || state.value === 'sending') return

  if (!LEADS_URL) {
    const subject = encodeURIComponent('Успею 87 — хочу узнать свой горизонт')
    const body = encodeURIComponent(`Почта: ${v}\nХочу узнать свой горизонт: да\n`)
    window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`
    state.value = 'mail'
    return
  }

  state.value = 'sending'
  try {
    const res = await fetch(LEADS_URL, {
      method: 'POST',
      body: new URLSearchParams({
        email: v,
        consent: 'yes',
        source: 'главная',
        page: window.location.href.slice(0, 200),
        ua: (navigator.userAgent || '').slice(0, 300),
        website: trap.value,
      }),
    })
    const out = await res.json().catch(() => null)
    state.value = out && out.ok ? 'sent' : 'fail'
  } catch {
    state.value = 'fail'
  }
}
</script>

<template>
  <section class="cap">
    <template v-if="state === 'idle' || state === 'sending' || state === 'fail'">
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
        <button
          type="button"
          class="go"
          :class="{ off: !ready, busy: state === 'sending' }"
          :disabled="!ready"
          :aria-label="state === 'sending' ? 'Отправляется' : 'Отправить'"
          @click="submit"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 10h12" /><path d="M11 5l5 5-5 5" />
          </svg>
        </button>
      </div>
      <input v-model="trap" type="text" name="website" class="trap" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <p v-if="bad" class="err">Похоже на опечатку: нужен адрес вида имя@почта.ру.</p>
      <p v-else-if="state === 'fail'" class="err">
        Не получилось отправить. Попробуйте ещё раз или напишите на <a :href="`mailto:${TO}`">{{ TO }}</a>.
      </p>

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

    <p v-else-if="state === 'sent'" class="ok">
      <span class="ok-dot" aria-hidden="true"></span>
      Готово, почта у меня. Напишу вам сам.
    </p>
    <p v-else class="ok">
      Открылось почтовое приложение, письмо нужно отправить самому. Если оно не открылось,
      напишите на <a :href="`mailto:${TO}`">{{ TO }}</a>.
    </p>
  </section>
</template>

<style scoped>
.row { display: flex; gap: 8px; }
.go {
  display: inline-flex; align-items: center; justify-content: center;
  flex: 0 0 52px; border: 0; border-radius: 14px; cursor: pointer;
  background: var(--action); color: var(--action-ink);
  transition: background 0.2s ease, color 0.2s ease;
}
.go svg { width: 20px; height: 20px; }
.go:active { opacity: .85; }
.go.off { background: var(--surface-2); color: var(--text-muted); cursor: default; }
.go.busy svg { animation: lc-nudge 0.9s ease-in-out infinite; }
@keyframes lc-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
.go:focus-visible { outline: 2px solid var(--action-text); outline-offset: 2px; }
.err { margin: 8px 2px 0; font-size: 12.5px; line-height: 1.45; color: var(--sig-alarm-ink); }
.err a { color: inherit; }

.trap { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

.check {
  display: flex; align-items: center; gap: 10px; margin-top: 6px;
  min-height: 40px; font-size: 14px; color: var(--text-muted); cursor: pointer;
  transition: color .15s ease;
}
.check.on { color: var(--text); }
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
.check.on .box { background: var(--text); border-color: var(--text); color: var(--bg); }
.sr:focus-visible + .box { outline: 2px solid var(--action); outline-offset: 2px; }
.lbl { line-height: 1.3; }

.ok { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 15px; line-height: 1.5; color: var(--text); }
.ok a { color: var(--action-text); }
.ok-dot { width: 10px; height: 10px; flex: 0 0 10px; border-radius: 999px; background: var(--sig-ok); box-shadow: 0 0 0 4px var(--sig-ok-fill); }

@media (prefers-reduced-motion: reduce) {
  .check, .box, .go { transition: none; }
  .go.busy svg { animation: none; }
}
</style>
