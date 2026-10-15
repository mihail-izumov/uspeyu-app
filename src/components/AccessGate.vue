<script setup>
import { computed, ref } from 'vue'

/* ВХОД — СОДЕРЖИМОЕ ШТОРКИ, А НЕ ОТДЕЛЬНЫЙ ЭКРАН (решение владельца
 * 30.08.2026). Раньше «Войти» уводило на полноэкранную тёмную страницу со
 * знаком контура, и оттуда нужен был собственный выход кнопкой «Назад» —
 * витрина при этом пропадала целиком, будто человек ушёл в другое приложение.
 * Теперь вход подчиняется общему правилу всех окон: шторка снизу, закрытие
 * фоном, крестиком и Escape.
 *
 * Что осталось от прежнего экрана и почему:
 *  · логин НЕ редактируется (readonly, а не disabled: disabled выключает поле
 *    из чтения скринридером и глушит его через opacity, а логин должен
 *    оставаться читаемым — это контекст входа);
 *  · крупный кегль маскировки включается только когда в поле есть что
 *    маскировать, иначе переключение глаза двигало бы placeholder;
 *  · цвет = сигнал: единственный цветной элемент — текст ошибки.
 *
 * ⚠ СТРОКА ПРО AES И СТОЙКОСТЬ ФРАЗЫ УБРАНА (владелец, 30.08.2026). Она
 *   стояла здесь как обязательная: окно входа, молчащее о своей границе,
 *   обещает больше, чем делает. Правда о границе никуда не делась — она в
 *   `config.js` и в `CLAUDE.md`, — но со страницы ушла. ⚠ Если вход когда-то
 *   увидит кто-то, кроме владельца, границу придётся вернуть словами: человек,
 *   вводящий фразу, не может знать из интерфейса, что от длины этой фразы
 *   зависит всё.
 */
const props = defineProps({
  login: { type: String, required: true },
  checking: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  notice: { type: String, default: null },
  unsupported: { type: Boolean, default: false },
})
const emit = defineEmits(['submit'])

const phrase = ref('')
const show = ref(false)

const masked = computed(() => !show.value && phrase.value.length > 0)

function onSubmit() {
  const v = phrase.value.trim()
  if (!v || props.checking) return
  emit('submit', v)
}
</script>

<template>
  <form class="pb-2" @submit.prevent="onSubmit">
    <!-- Д-70: поле в языке /join (`.fk-input`): белая заливка, обводка
         полтора пикселя, при ошибке — красная. Логин и пароль — одна
         группа: логин подписывает протокол, проверяется только фраза. -->
    <div
      class="overflow-hidden rounded-[14px]"
      :style="{
        background: 'var(--surface)',
        border: `1.5px solid ${error ? 'var(--sig-alarm)' : 'var(--line)'}`,
      }"
    >
      <div class="flex min-h-[52px] items-center px-4">
        <input
          type="text"
          :value="login"
          readonly
          tabindex="-1"
          aria-readonly="true"
          autocomplete="off"
          class="w-full cursor-default select-none border-none bg-transparent font-mono text-[1rem] outline-none"
          :style="{ color: 'var(--text-secondary)' }"
        />
      </div>
      <div class="h-px" :style="{ background: 'var(--line)' }" aria-hidden="true"></div>
      <div class="relative flex min-h-[52px] items-center pl-4 pr-1">
        <input
          v-model="phrase"
          :type="show ? 'text' : 'password'"
          autocomplete="current-password"
          autocapitalize="off"
          spellcheck="false"
          placeholder="пароль"
          :aria-invalid="error ? 'true' : 'false'"
          :disabled="checking || unsupported"
          class="w-full border-none bg-transparent pr-2 font-mono text-[1rem] leading-[1.5] outline-none disabled:opacity-60"
          :class="masked ? 'tracking-[0.14em]' : 'tracking-normal'"
          :style="{ color: 'var(--text)' }"
        />
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full outline-none active:opacity-60"
          :style="{ color: 'var(--text-secondary)' }"
          :aria-label="show ? 'Скрыть пароль' : 'Показать пароль'"
          :aria-pressed="show ? 'true' : 'false'"
          tabindex="-1"
          @click="show = !show"
        >
          <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M1.8 10S4.9 4.6 10 4.6 18.2 10 18.2 10 15.1 15.4 10 15.4 1.8 10 1.8 10z" />
            <circle cx="10" cy="10" r="2.6" />
            <path v-if="show" d="M3 17 17 3" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="error || unsupported" class="mt-3" role="alert">
      <p class="text-center text-[0.875rem]" :style="{ color: 'var(--sig-alarm)' }">
        {{ unsupported ? 'Браузер не даёт проверить пароль' : 'Неверный пароль' }}
      </p>
      <p
        v-if="unsupported"
        class="mt-1.5 text-center text-[0.8125rem] leading-snug"
        :style="{ color: 'var(--text-secondary)' }"
      >Проверка требует защищённого соединения. Откройте приложение по https или с localhost.</p>
    </div>
    <p v-else-if="notice" class="mt-3 text-center text-[0.875rem]" :style="{ color: 'var(--text-muted)' }">{{ notice }}</p>

    <button
      type="submit"
      :disabled="checking || unsupported"
      class="mt-4 w-full kh-btn kh-btn-primary"
      style="min-height: 52px"
    >{{ checking ? 'Проверяем…' : 'Войти' }}</button>

    <p class="kh-eyebrow mt-4 text-center">
      Не заменяет врача
    </p>
  </form>
</template>
