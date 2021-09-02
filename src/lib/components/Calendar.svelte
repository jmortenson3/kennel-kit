<script lang="ts">
  import dayjs from 'dayjs/esm';

  export let highlightStartAt: dayjs.Dayjs = undefined;
  export let highlightEndAt: dayjs.Dayjs = undefined;
  export let onClickCell: any;
  export let date = dayjs();
  let now = dayjs();

  let daysOfWeek = Array.from(Array(7).keys()).map((_, i) => {
    return date.day(i).format('ddd');
  });
  let thisMonth = date;
  let daysInThisMonth = thisMonth.daysInMonth();
  let beginningOfMonthOffset = date.startOf('month').day();

  function isPastRange(
    date: dayjs.Dayjs,
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
  ) {
    return date.isBefore(now);
  }

  function isMiddleRange(
    date: dayjs.Dayjs,
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
  ) {
    const val = date.isBefore(end, 'day') && date.isAfter(start, 'day');
    return val;
  }

  function isEndRange(date: dayjs.Dayjs, start: dayjs.Dayjs, end: dayjs.Dayjs) {
    return (
      (highlightStartAt && date.isSame(start, 'day')) ||
      (highlightEndAt && date.isSame(end, 'day'))
    );
  }
</script>

<div class="container">
  <h3>{thisMonth.format('MMMM YYYY')}</h3>
  <div class="header">
    {#each daysOfWeek as day}
      <div>{day}</div>
    {/each}
  </div>
  <div class="body">
    {#each Array(beginningOfMonthOffset) as _, i}
      <div class="past" />
    {/each}
    {#each Array(daysInThisMonth) as _, i}
      <div
        class="
          {isPastRange(
          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),
          highlightStartAt,
          highlightEndAt
        )
          ? 'past'
          : 'future'}
          {isEndRange(
          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),
          highlightStartAt,
          highlightEndAt
        )
          ? 'rangeEnd'
          : ''}
          {isMiddleRange(
          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),
          highlightStartAt,
          highlightEndAt
        )
          ? 'rangeMiddle'
          : ''}
        "
        on:click={onClickCell(
          thisMonth.subtract(thisMonth.date() - (i + 1), 'd')
        )}
      >
        <div>
          {thisMonth.subtract(thisMonth.date() - (i + 1), 'd').format('D')}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    max-width: 400px;
    padding: 1rem;
  }

  .header,
  .body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .body div {
    padding: 5px;
    text-align: center;
    width: 40px;
    height: 40px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .past {
    color: hsla(var(--fontColor), 0.2);
  }

  .future {
    color: hsl(var(--fontColor));
    /* transition: all 0.25s; */
  }

  .future:hover {
    cursor: pointer;
    /* border: 1px solid black;
    border-radius: 50%; */
    box-shadow: 1px 2px 6px hsla(var(--darkgray), 0.5);
  }

  .rangeEnd {
    background-color: hsl(var(--colorSecondary));
  }

  .rangeMiddle {
    background-color: hsla(var(--colorSecondary), 0.3);
  }

  h3 {
    text-align: center;
  }
</style>
