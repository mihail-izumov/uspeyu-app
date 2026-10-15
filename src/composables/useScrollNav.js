import { ref } from 'vue'

/*
  ПОВЕДЕНИЕ ШАПКИ И НИЖНЕЙ КАПСУЛЫ ПРИ ПРОКРУТКЕ.

  Перенесено из «Где рост?» (`gderost/app/src/components/AppShell.vue`) вместе
  с обоими порогами. Пороги разные нарочно и подбору не подлежат:

    · COLLAPSE_AT = 28 — заголовок сворачивается почти сразу. Липкая полоса
      нужна ровно затем, чтобы человек, уехавший вниз, не потерял, где он.
    · NAV_HIDE_AT = 240 — капсула уезжает заметно позже. Она должна пережить
      первый экран целиком: орган управления, исчезающий от первого же
      движения пальцем, читается как сбой, а не как жест интерфейса.

  ⚠ Уехавшая капсула ОБЯЗАНА оставить после себя круглую кнопку. Иначе
  навигация становится недостижимой до тех пор, пока человек не догадается
  проскроллить обратно вверх — то есть ровно тогда, когда он этого не хочет.

  ⚠ `pinned` — согласие человека, а не состояние прокрутки. Вернул капсулу
  кнопкой — она больше не прячется до конца этой страницы, потому что второй
  побег на глазах у того, кто её только что позвал, выглядит издевательством.
*/

export const COLLAPSE_AT = 28
export const NAV_HIDE_AT = 240

export function useScrollNav() {
  const collapsed = ref(false)
  const navHidden = ref(false)
  const navPinned = ref(false)

  function onScroll(e) {
    const top = e.target ? e.target.scrollTop : 0
    collapsed.value = top > COLLAPSE_AT
    if (top <= NAV_HIDE_AT) {
      navHidden.value = false
      navPinned.value = false
    } else if (!navPinned.value) {
      navHidden.value = true
    }
  }

  function showNav() {
    navPinned.value = true
    navHidden.value = false
  }

  function reset() {
    collapsed.value = false
    navHidden.value = false
    navPinned.value = false
  }

  return { collapsed, navHidden, navPinned, onScroll, showNav, reset }
}
