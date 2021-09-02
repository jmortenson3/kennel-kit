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
    if (
      ((selectedStartDate || (!selectedStartDate && !selectedEndDate)) &&
        date.isBefore(dayjs(), 'day')) ||
      (selectedStartDate &&
        selectedEndDate &&
        selectedStartDate.isSame(date, 'day'))
    ) {
      selectedStartDate = null;
      selectedEndDate = null;
    } else if (selectedStartDate == null) {
      selectedStartDate = date;
    } else if (selectedStartDate.isAfter(date, 'day')) {
      selectedStartDate = date;
      selectedEndDate = null;
    } else {
      selectedEndDate = date;
    }

    dispatch('change', {
      startDate: selectedStartDate,
      endDate: selectedEndDate,
    });
  }
</script>

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
    box-shadow: 1px 1px 3px var(--shadowColor);
  }
</style>
