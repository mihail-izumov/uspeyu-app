import { ref } from 'vue'

/* ═══════════════════════════════════════════════════════════════════════
   ЗАГРУЗКА ГЕНЕРАТА

   Приложение — ПОТРЕБИТЕЛЬ (CLAUDE.md, «Три сущности»). Оно не разбирает
   мастера, не считает СКФ и не переписывает формулировки: всё это делает
   `tools/build_app_data.py`, а сюда приезжает готовый `data/health.json`.
   Направление одностороннее. Если чего-то не хватает на экране — правится
   мастер и генератор, а не этот файл.

   ⚠ Путь относительный (`./data/health.json`) — под base:'./' из vite.config.js.
     Абсолютный `/data/...` сломался бы на GitHub Pages, где приложение живёт
     не в корне домена.
   ═══════════════════════════════════════════════════════════════════════ */

const data = ref(null)
const loading = ref(false)
const error = ref(null)

let started = false
let pendingCipher = null // health.enc.json, ждущий ключа от гейта (SYS-6)

/* ═══ SYS-6 (Д-32): шифрованные данные ═══
 * В публичном репозитории лежит только health.enc.json (AES-256-GCM,
 * scripts/encrypt-data.mjs). Открытый health.json существует лишь локально
 * у владельца — если он есть в сборке (dev, дымовая проверка), берётся он.
 * Ключ приезжает из гейта после верного пароля (setDataKey) — эта сторона
 * данные не расшифрует, пока человек не введёт фразу. */

async function decryptPending(key) {
  const iv = Uint8Array.from(atob(pendingCipher.iv), (c) => c.charCodeAt(0))
  const ct = Uint8Array.from(atob(pendingCipher.ct), (c) => c.charCodeAt(0))
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  data.value = JSON.parse(new TextDecoder().decode(buf))
  pendingCipher = null
}

/** Гейт зовёт после успешного входа. Расшифровка здесь, ключ дальше не живёт. */
export async function setDataKey(key) {
  if (!pendingCipher) return
  try {
    await decryptPending(key)
    error.value = null
  } catch {
    // Пароль верен для гейта, но файл им не расшифровался — значит .enc
    // собран другой фразой. Это ошибка сборки, и сказать нужно именно это.
    error.value =
      'Пароль принят, но данные им не расшифровались: health.enc.json собран другой фразой. ' +
      "Пересоберите: KONTUR_PASS='текущая фраза' npm run data:encrypt — и запушьте."
  }
}

/** Есть ли расшифровка, которую ждём (для экрана ожидания). */
export function waitingForKey() {
  return pendingCipher !== null
}

/* ═══ Д-45: ПУБЛИЧНЫЙ СЛОЙ ═══
 * `data/public.json` — открытый файл, его читает страница ДО входа. Собран
 * генератором строго по списку `docs/PUBLIC-WHITELIST.md`: вилки, агрегаты
 * недель, свежесть, манифест. Ни показателей, ни тревог, ни препаратов там
 * нет и быть не может.
 *
 * ⛔ Грузится ОТДЕЛЬНО от health.enc.json и НЕ ждёт пароля — иначе публичная
 *   страница окажется заложником приватной половины, и ошибка шифрования
 *   погасит сайт для всех. Обратный порядок тоже неверен: медкарта не
 *   грузится, пока человек не вошёл (см. комментарий выше про честность).
 */
/* Вложенные сборкой данные (Д-74) берутся сразу при загрузке модуля, а не
   в onMounted: иначе первый кадр рисуется без них, и под знаком на миг
   остаётся пустое место. */
const publicData = ref(globalThis.__KONTUR_PUBLIC__ || null)
/* Файл так и не пришёл после всех попыток. Отдельно от «ещё грузится»:
   пока идёт загрузка, первый экран не пишет ничего, а запасная фраза
   стоит только на настоящий сбой (Д-74). */
const publicFailed = ref(false)
let publicStarted = false

export function usePublicData() {
  async function loadPublic() {
    if (publicStarted) return
    publicStarted = true
    publicFailed.value = false
    // Обычный путь с Д-74: данные уже вложены сборкой в index.html.
    if (globalThis.__KONTUR_PUBLIC__) {
      publicData.value = globalThis.__KONTUR_PUBLIC__
      return
    }
    // Запасной — запросом. ⚠ До Д-74 попытка была одна, и ответ не 200
    // оставлял страницу на запасной фразе до перезагрузки: повтора не было.
    const base = import.meta.env.BASE_URL || './'
    for (const pause of [0, 800, 2500, 6000]) {
      if (pause) await new Promise((r) => setTimeout(r, pause))
      try {
        const res = await fetch(`${base}data/public.json`, { cache: 'no-cache' })
        if (res.ok) {
          publicData.value = await res.json()
          return
        }
      } catch { /* следующая попытка */ }
    }
    publicFailed.value = true
    publicStarted = false
  }
  return { publicData, publicFailed, loadPublic }
}

export function useData() {
  async function load() {
    if (started) return
    started = true
    loading.value = true
    try {
      // Однофайловая сборка (scripts/build-preview.mjs) вкладывает данные
      // прямо в страницу: там нечего запрашивать, файл один. Обычная сборка
      // этой ветки не видит — глобали нет.
      if (globalThis.__KONTUR_DATA__) {
        data.value = globalThis.__KONTUR_DATA__
        return
      }
      const base = import.meta.env.BASE_URL || './'
      const res = await fetch(`${base}data/health.json`, { cache: 'no-cache' })
      if (res.ok) {
        data.value = await res.json()
        return
      }
      // Открытого файла нет — штатно для публичной сборки: берём шифрованный
      // и ждём ключ от гейта.
      const enc = await fetch(`${base}data/health.enc.json`, { cache: 'no-cache' })
      if (!enc.ok) throw new Error(`HTTP ${enc.status}`)
      pendingCipher = await enc.json()
    } catch (e) {
      // Честная формулировка вместо «что-то пошло не так»: единственная
      // реальная причина здесь — файла нет в сборке, то есть забыли прогнать
      // генератор перед пушем. Так и написано, чтобы чинилось за минуту.
      error.value =
        'Не удалось прочитать данные контура. Проверьте, что перед сборкой были ' +
        'выполнены python3 tools/build_app_data.py и npm run data:encrypt, ' +
        'и файл data/health.enc.json попал в репозиторий.'
      started = false
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
}

/** Возраст записи в днях. null, если даты нет. */
export function ageDays(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

/** «943 дня», «2 года 7 месяцев» — человеческая длительность без ложной точности. */
export function humanAge(days) {
  if (days === null || days === undefined) return '—'
  if (days < 45) return `${days} ${plural(days, 'день', 'дня', 'дней')}`
  const months = Math.round(days / 30.4)
  if (months < 18) return `${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = `${years} ${plural(years, 'год', 'года', 'лет')}`
  return rest ? `${y} ${rest} ${plural(rest, 'месяц', 'месяца', 'месяцев')}` : y
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

/** '2024-01-25' → '25.01.2024' */
export function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
