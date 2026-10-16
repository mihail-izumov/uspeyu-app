/* Service worker. Ровно столько, сколько нужно, чтобы приложение открывалось
 * без сети, — и ни строкой больше.
 *
 * ── СТРАТЕГИЯ ───────────────────────────────────────────────────────────
 * Файлы бандла (assets/ с хешем в имени) — cache-first: под одним именем
 * всегда одно содержимое, ходить за ними в сеть незачем.
 * СТРАНИЦА, иконки, манифест и ДАННЫЕ — network-first с откатом в кэш.
 *
 * ⚠⚠ v3 (Д-74, 16.10.2026): до v3 cache-first стояла и сама страница.
 *   index.html, однажды попавший в кэш, отдавался, пока браузер сам не
 *   сверит sw.js с сервером, а это бывает раз в сутки: сборки 15–16.10
 *   лежали на сервере, а у владельца в Chrome главная оставалась вчерашней —
 *   знак в синей плашке без 87, мелкое 87 в шапке (его слово: «почему то
 *   опять маленькое и без цифры 87»). Имя у index.html и у иконок одно на
 *   все сборки, поэтому их берём из сети, а кэш — только без сети.
 *
 * ⚠⚠ ЭТО ГЛАВНОЕ РЕШЕНИЕ ФАЙЛА, И ОНО НЕ ПРО СКОРОСТЬ. Если данные отдавать
 * из кэша, приложение после внесения новых анализов покажет старую картину и
 * ничем не даст этого понять: те же цифры, тот же светофор, та же дата
 * сборки. Человек сделает вывод по данным двухлетней давности, считая их
 * свежими. В приложении о здоровье это худший из возможных отказов —
 * молчаливый и правдоподобный. Поэтому за данными идём в сеть всегда, а кэш
 * — только запасной выход, когда сети нет.
 *
 * ⚠ Версия кэша поднимается при каждой сборке через плейсхолдер? Нет: он
 *   тут статический и меняется руками. Ошибиться нестрашно — файлы бандла
 *   имеют хеш в имени, и старые записи кэша просто перестают запрашиваться.
 *   Правило одно: при изменении структуры кэша поднять CACHE.
 */
/* ⚠ v2 (30.08.2026): сменились index.html (title, мета-теги установки) и
   манифест. Не подняв версию, установленное на телефон приложение осталось бы
   со старой оболочкой из кэша — и правки были бы не видны именно там, где их
   проверяют. */
/* v3 (16.10.2026): страница и файлы без хеша — из сети. Смена версии
   заодно выметает кэш v2, где застряла старая главная. */
const CACHE = 'uspeyu-v3'

const SHELL = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Файлы бандла с хешем в имени — из кэша (ниже). Всё остальное: страница,
  // иконки, манифест, данные контура — через сеть, кэш как запасной выход.
  const hashed = url.pathname.includes('/assets/')
  if (!hashed || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        // Без сети страница по любому адресу — последняя сохранённая главная;
        // остальному (данным, иконкам) подмены нет: JSON-у нельзя отдать HTML.
        .catch(() => caches.match(request).then((hit) => (
          hit || (request.mode === 'navigate' ? caches.match('./index.html') : undefined)
        ))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
    }),
  )
})
