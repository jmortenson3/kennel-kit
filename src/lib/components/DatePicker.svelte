<script lang="ts">
  import Calendar from '$lib/components/Calendar.svelte';
  import dayjs from 'dayjs/esm';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  }>();

  let nextMonth = dayjs().add(1, 'month');

  let selectedStartDate: dayjs.Dayjs;
  let selectedEndDate: dayjs.Dayjs;

  function handleClickCell(date: dayjs.Dayjs) {
    console.log(`handling cell click at ${new Date().getTime()}`);
    if (
      (selectedStartDate || (!selectedStartDate && !selectedEndDate)) &&
      date.isBefore(dayjs(), 'day')
    ) {
      selectedStartDate = null;
      selectedEndDate = null;
    } else if (selectedStartDate == null) {
      selectedStartDate = date;
    } else if (selectedStartDate.isAfter(date)) {
      selectedStartDate = date;
      selectedEndDate = null;
    } else {
      selectedEndDate = date;
    }

    console.log(`dispatching at ${new Date().getTime()}`);
    dispatch('change', {
      startDate: selectedStartDate,
      endDate: selectedEndDate,
    });
  }
</script>

<p>Drop off</p>
<small>{selectedStartDate?.format('ddd, MMM D') ?? 'Add dates'}</small>
<p>Pick up</p>
<small>{selectedEndDate?.format('ddd, MMM D') ?? 'Add dates'}</small>

<div>
  <Calendar
    onClickCell={handleClickCell}
    highlightStartAt={selectedStartDate}
    highlightEndAt={selectedEndDate}
  />
  <Calendar
    onClickCell={handleClickCell}
    highlightStartAt={selectedStartDate}
    highlightEndAt={selectedEndDate}
    date={nextMonth}
  />
</div>

<style>
  div {
    display: flex;
  }
</style>
