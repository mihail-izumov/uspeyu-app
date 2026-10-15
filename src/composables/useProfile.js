import { computed, ref } from 'vue'

/*
  ПРОТОКОЛ — ЧЕЙ РЯД ПОКАЗАН.

  Синглтон, а не проп: выбранный протокол нужен сразу трём местам — карточке
  Горизонта (чья вилка), окну входа (чей логин) и письму (чья подпись). Пропом
  он тащился бы через всю оболочку, и первая же новая точка потребления
  завела бы вторую копию состояния.

  ⛔ ВЫБРАТЬ МОЖНО ТОЛЬКО ТОТ ПРОТОКОЛ, ЗА КОТОРЫМ ЕСТЬ СОБРАННЫЕ ДАННЫЕ.
  «Мария» и «Павел» помечены `soon` и некликабельны: витрина, вся ценность
  которой в честности данных, не может показывать выдуманного человека с
  пустой вилкой. Механика смены готова целиком — ждёт данных, а не кода.

  ⚠ ЛОГИН — ПОДПИСЬ, А НЕ ФАКТОР ПРОВЕРКИ (решение владельца 30.08.2026).
  Во входе участвует только фраза: она же выводит ключ расшифровки данных
  (SYS-6, Д-32), и второго ключа у контура нет. Логин говорит, в чей контур
  человек входит, — и меняется вместе с выбранным протоколом.
*/

export const PROTOCOLS = [
  { id: 'mikhail', name: 'Михаил', login: 'mihizyumov', soon: false },
  { id: 'maria', name: 'Мария', login: 'maria', soon: true },
  { id: 'pavel', name: 'Павел', login: 'pavel', soon: true },
]

const currentId = ref(PROTOCOLS[0].id)

export function useProfile() {
  const current = computed(
    () => PROTOCOLS.find((p) => p.id === currentId.value) || PROTOCOLS[0],
  )

  function select(p) {
    const item = typeof p === 'string' ? PROTOCOLS.find((x) => x.id === p) : p
    if (!item || item.soon) return false
    currentId.value = item.id
    return true
  }

  return {
    protocols: PROTOCOLS,
    current,
    name: computed(() => current.value.name),
    login: computed(() => current.value.login),
    select,
  }
}
