/*
  Знак «Модуль роста» — CSS-маской, а не картинкой.

  Перенесено из «Где рост?» (`app/src/composables/brandMask.js`) вместе с двумя
  граблями, каждая из которых уже стоила прода:

  ⛔ ЗАЛИВКА ВНУТРИ SVG ДОЛЖНА БЫТЬ БЕЛОЙ. WebKit для `mask-image` считает
     светлоту, а не альфу: чёрный знак маскируется целиком и на сборке
     становится невидимым — при том что в вёрстке всё на месте.

  ⛔ ШИРИНА ЗАДАЁТСЯ ЯВНО. Пустой блок во flex-колонке с `align-items: center`
     получает ширину ноль, и знака нет вовсе. Отношение сторон 1859/523 — из
     самого файла.

  ⚠ Маска, а не <img>: знак берёт цвет текста и потому одинаково живёт на
    светлом холсте витрины и на тёмном экране входа. Картинка потребовала бы
    двух файлов и рассинхронизировалась бы при первой же правке знака.
*/
const base = (import.meta.env && import.meta.env.BASE_URL) || '/'

function maskOf(file) {
  const url = `url("${base}${file}")`
  return {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }
}

/** Знак «Модуль роста» заданной высоты в пикселях. */
export function logoStyle(heightPx) {
  const h = Number(heightPx) || 28
  return {
    ...maskOf('runscale_logo.svg'),
    height: `${h}px`,
    width: `${Math.round(h * (1859 / 523))}px`,
  }
}
