<script setup>
/*
  ГОРИЗОНТ — центр публичной страницы.

  ⛔ КАНОН БРЕНДА (docs/KANON-uspeyu.md, Д-40). Расхождение с ним = дефект
  сборки, и проверяет это дым:
    · вопрос «Успею ли я?» на экран НЕ выносится — он живёт в имени;
    · на экране слово «Горизонт» и вилка лет. Всё;
    · вилка «от–до» — и есть сообщение: точное число врало бы и было бы
      мёртвым, диапазон честен и меняется от данных;
    · «экстра-годы» (прежний термин — «годы на столе») — ОДНИМ числом,
      без разложения по рычагам
      (docs/PUBLIC-WHITELIST.md §2: рычаги поимённо — это медицина).

  ⛔ РАМКА ЧЕСТНОСТИ (ТЗ-2). Рядом с вилкой всегда стоит, что это среднее
  ожидание для профиля, а не срок человека. Оговорка едет вместе с числом,
  а не живёт сноской внизу: число, увиденное один раз, живёт дальше само.
*/
import HorizonScale from './HorizonScale.vue'

defineProps({
  horizon: { type: Object, required: true },
})
</script>

<template>
  <section class="up-card horizon">
    <!-- ⚠ Строка протокола стоит ЗДЕСЬ, над словом «Горизонт» (владелец,
         30.08.2026). Она отвечает на вопрос «чья это вилка», и стоять она
         обязана вплотную к самой вилке: висевшая наверху страницы, она
         прочитывалась как настройка витрины, а не как подпись под числом. -->
    <div class="who"><slot name="protocol" /></div>

    <!-- ⚠ ЕДИНИЦА УШЛА В ЗАГОЛОВОК: «Горизонт, лет» и чистое число под ним
         (владелец, 30.08.2026). Слово «лет», приставленное к вилке сбоку,
         спорило с ней кеглем и рвало число на две разные величины — «63–70» и
         «лет» читались как две строки, а не как одна. В заголовке единица
         стоит там, где её ищут в любой таблице, и число остаётся числом. -->
    <div class="label">Горизонт, лет</div>
    <div class="bracket up-digit">{{ horizon.current.label }}</div>
    <div class="unit">на текущих данных</div>

    <p v-if="horizon.old_picture" class="stale">⚠ {{ horizon.old_picture_note }}</p>

    <!-- ⚠ ШКАЛА ЖИЗНИ (Д-59). Стоит ПОД вилкой, а не над ней: вилка —
         сообщение продукта (канон), шкала — её раскладка. Строка «Целевой
         сценарий» из блока ниже убрана: то же число теперь стоит на шкале
         подписью «План», и повторять его дважды на одной карточке значило
         бы делать вид, что это две разные величины. -->
    <HorizonScale :horizon="horizon" />

    <div class="target">
      <div class="trow">
        <span class="up-muted">Экстра-годы</span>
        <span class="up-digit strong">
          +{{ horizon.on_the_table.years }}
          <i class="range">[{{ horizon.on_the_table.years_lo }}–{{ horizon.on_the_table.years_hi }}]</i>
        </span>
      </div>
    </div>

    <p class="note">
      Это среднее ожидание для профиля с такими данными, а не срок человека и не дата.
      Вилка дышит: сужается, когда данных больше, и расширяется, когда они стареют.
    </p>
  </section>
</template>

<style scoped>
.horizon { text-align: center; padding: 18px 18px 20px; }
.who {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 18px;
}
.label {
  font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--text-muted);
}
.bracket { font-size: 62px; line-height: 1.02; font-weight: 700; margin-top: 6px; }
.unit { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.stale {
  margin: 12px auto 0; max-width: 34ch; font-size: 12.5px;
  color: var(--sig-watch); background: var(--sig-watch-fill);
  border-radius: 10px; padding: 7px 10px;
}
.target {
  margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line);
  display: flex; flex-direction: column; gap: 7px; text-align: left;
}
.trow { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 14px; }
.strong { font-weight: 600; }
.range { font-style: normal; color: var(--text-muted); font-size: 12px; margin-left: 4px; }
.note {
  margin: 14px 0 0; font-size: 12.5px; line-height: 1.45;
  color: var(--text-muted); text-align: left;
}
</style>
