const dateButton = document.getElementById("dateButton");

const timeButton = document.getElementById("timeButton");

const dateValue = document.getElementById("dateValue");

const timeValue = document.getElementById("timeValue");

const proceedButton = document.getElementById("proceedButton");

const errorMessage = document.getElementById("errorMessage");

const dateModal = document.getElementById("dateModal");

const timeModal = document.getElementById("timeModal");

const calendarGrid = document.getElementById("calendarGrid");

const monthSelector = document.getElementById("monthSelector");

const monthDropdownButton = document.getElementById("monthDropdownButton");

const monthDropdownLabel = document.getElementById("monthDropdownLabel");

const monthDropdownMenu = document.getElementById("monthDropdownMenu");

const monthDropdownWrap = monthDropdownButton ? monthDropdownButton.closest(".month-selector-wrap") : null;

const currentYear = document.getElementById("currentYear");

const hourField = document.getElementById("hourField");

const minuteField = document.getElementById("minuteField");

const hourInput = document.getElementById("hourInput");

const minuteInput = document.getElementById("minuteInput");

const amButton = document.getElementById("amButton");

const pmButton = document.getElementById("pmButton");

const cancelTimeButton = document.getElementById("cancelTimeButton");

const okTimeButton = document.getElementById("okTimeButton");

const timeError = document.getElementById("timeError");

let selectedDate = localStorage.getItem("selectedDate") || "";

let selectedTime = localStorage.getItem("selectedTime") || "";

let temporaryHour = 12;

let temporaryMinute = 0;

let temporaryPeriod = "AM";

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayDate() {
  const today = new Date();

  return (
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0")
  );
}

function isDateValid(dateString) {
  if (!dateString) {
    return false;
  }

  return dateString > getTodayDate();
}

function updateDisplay() {
  if (selectedDate) {
    dateValue.textContent = formatDate(new Date(selectedDate + "T00:00:00"));
  } else {
    dateValue.textContent = "";
  }

  if (selectedTime) {
    const parts = selectedTime.split(":");

    let hour = parseInt(parts[0], 10);

    const minute = parseInt(parts[1], 10);

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    const displayMinute = String(minute).padStart(2, "0");

    timeValue.textContent = `${hour}:${displayMinute} ${period}`;
  } else {
    timeValue.textContent = "";
  }
}

function getAllowedMonths() {
  const year = new Date().getFullYear();

  return [
    { month: 8, year: year }, // September
    { month: 9, year: year }, // October
  ];
}

function getInitialCalendarMonth() {
  const today = new Date();
  const allowedMonths = getAllowedMonths();

  if (selectedDate) {
    const selected = new Date(selectedDate + "T00:00:00");
    const matchingMonth = allowedMonths.find(
      (item) =>
        item.year === selected.getFullYear() && item.month === selected.getMonth(),
    );

    if (matchingMonth) {
      return matchingMonth.month;
    }
  }

  if (today.getFullYear() === allowedMonths[1].year && today.getMonth() >= 9) {
    return 9;
  }

  return 8;
}

function updateMonthSelector(year, month) {
  monthSelector.value = String(month);
  currentYear.textContent = year;

  if (monthDropdownLabel) {
    const selectedOption = monthSelector.options[monthSelector.selectedIndex];
    monthDropdownLabel.textContent = selectedOption ? selectedOption.textContent : "";
  }

  if (monthDropdownMenu) {
    monthDropdownMenu.querySelectorAll(".month-dropdown-option").forEach((option) => {
      const isActive = option.dataset.month === String(month);
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", String(isActive));
    });
  }
}

function renderCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = Number(monthSelector.value);
  const todayString = getTodayDate();
  const allowedMonths = getAllowedMonths();
  const isAllowedMonth = allowedMonths.some(
    (item) => item.year === year && item.month === month,
  );

  updateMonthSelector(year, month);
  calendarGrid.innerHTML = "";

  if (!isAllowedMonth) {
    return;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("span");
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const button = document.createElement("button");

    const dayDate = new Date(year, month, day);

    const isoDate =
      year +
      "-" +
      String(month + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0");

    button.textContent = day;

    if (dayDate.getDay() === 0) {
      button.classList.add("sunday");
    }

    if (isoDate === selectedDate) {
      button.classList.add("selected");
    }

    if (isoDate <= todayString) {
      button.disabled = true;
      button.classList.add("disabled");
    }

    button.addEventListener("click", function () {
      if (isoDate <= todayString) {
        return;
      }

      selectedDate = isoDate;

      localStorage.setItem("selectedDate", selectedDate);

      errorMessage.textContent = "";

      updateDisplay();

monthSelector.value = String(getInitialCalendarMonth());

      renderCalendar();
    });

    calendarGrid.appendChild(button);
  }
}

function getCurrentTimeForPicker() {
  if (selectedTime) {
    const parts = selectedTime.split(":");

    let hour = parseInt(parts[0], 10);

    const minute = parseInt(parts[1], 10);

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return {
      hour: hour,
      minute: minute,
      period: period,
    };
  }

  const now = new Date();

  let hour = now.getHours();

  const minute = now.getMinutes();

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return {
    hour: hour,
    minute: minute,
    period: period,
  };
}

function openTimePicker() {
  const time = getCurrentTimeForPicker();

  temporaryHour = time.hour;

  temporaryMinute = time.minute;

  temporaryPeriod = time.period;

  hourInput.value = String(temporaryHour);

  minuteInput.value = String(temporaryMinute).padStart(2, "0");

  updatePeriodButtons();

  timeError.textContent = "";

  hourField.classList.add("active");

  minuteField.classList.remove("active");

  timeModal.classList.remove("hidden");

  setTimeout(function () {
    hourInput.focus();

    hourInput.select();
  }, 50);
}

function updatePeriodButtons() {
  if (temporaryPeriod === "AM") {
    amButton.classList.add("active");

    pmButton.classList.remove("active");
  } else {
    pmButton.classList.add("active");

    amButton.classList.remove("active");
  }
}

function validateTime() {
  const hour = parseInt(hourInput.value, 10);

  const minute = parseInt(minuteInput.value, 10);

  if (Number.isNaN(hour) || hour < 1 || hour > 12) {
    timeError.textContent = "Please enter an hour from 1 to 12.";

    hourField.classList.add("active");

    minuteField.classList.remove("active");

    return false;
  }

  if (Number.isNaN(minute) || minute < 0 || minute > 59) {
    timeError.textContent = "Please enter minutes from 00 to 59.";

    minuteField.classList.add("active");

    hourField.classList.remove("active");

    return false;
  }

  temporaryHour = hour;

  temporaryMinute = minute;

  timeError.textContent = "";

  return true;
}

function convertTo24Hour(hour, minute, period) {
  let convertedHour = hour;

  if (period === "AM" && hour === 12) {
    convertedHour = 0;
  }

  if (period === "PM" && hour !== 12) {
    convertedHour = hour + 12;
  }

  return (
    String(convertedHour).padStart(2, "0") +
    ":" +
    String(minute).padStart(2, "0")
  );
}

function saveTime() {
  if (!validateTime()) {
    return;
  }

  selectedTime = convertTo24Hour(
    temporaryHour,
    temporaryMinute,
    temporaryPeriod,
  );

  localStorage.setItem("selectedTime", selectedTime);

  updateDisplay();

  timeModal.classList.add("hidden");
}

if (monthDropdownButton && monthDropdownWrap && monthDropdownMenu) {
  monthDropdownButton.addEventListener("click", function () {
    const isOpen = monthDropdownWrap.classList.toggle("open");
    monthDropdownButton.setAttribute("aria-expanded", String(isOpen));
  });

  monthDropdownMenu.querySelectorAll(".month-dropdown-option").forEach((option) => {
    option.addEventListener("click", function () {
      monthSelector.value = option.dataset.month;
      monthSelector.dispatchEvent(new Event("change", { bubbles: true }));
      monthDropdownWrap.classList.remove("open");
      monthDropdownButton.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (event) {
    if (!monthDropdownWrap.contains(event.target)) {
      monthDropdownWrap.classList.remove("open");
      monthDropdownButton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      monthDropdownWrap.classList.remove("open");
      monthDropdownButton.setAttribute("aria-expanded", "false");
    }
  });
}

monthSelector.addEventListener("change", function () {
  renderCalendar();
});

dateButton.addEventListener("click", function () {
  errorMessage.textContent = "";

  dateModal.classList.remove("hidden");

  renderCalendar();
});

timeButton.addEventListener("click", function () {
  errorMessage.textContent = "";

  openTimePicker();
});

document
  .getElementById("closeDateModal")
  .addEventListener("click", function () {
    dateModal.classList.add("hidden");
  });

hourInput.addEventListener("focus", function () {
  hourField.classList.add("active");

  minuteField.classList.remove("active");

  hourInput.select();
});

minuteInput.addEventListener("focus", function () {
  minuteField.classList.add("active");

  hourField.classList.remove("active");

  minuteInput.select();
});

hourInput.addEventListener("input", function () {
  let value = hourInput.value;

  if (value.length > 2) {
    value = value.slice(0, 2);

    hourInput.value = value;
  }

  timeError.textContent = "";
});

minuteInput.addEventListener("input", function () {
  let value = minuteInput.value;

  if (value.length > 2) {
    value = value.slice(0, 2);

    minuteInput.value = value;
  }

  timeError.textContent = "";
});

hourInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();

    minuteInput.focus();
  }
});

minuteInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();

    saveTime();
  }
});

amButton.addEventListener("click", function () {
  temporaryPeriod = "AM";

  updatePeriodButtons();
});

pmButton.addEventListener("click", function () {
  temporaryPeriod = "PM";

  updatePeriodButtons();
});

cancelTimeButton.addEventListener("click", function () {
  timeModal.classList.add("hidden");

  timeError.textContent = "";
});

okTimeButton.addEventListener("click", function () {
  saveTime();
});

proceedButton.addEventListener("click", function () {
  if (!selectedDate || !selectedTime) {
    errorMessage.textContent = "Please set both the date and time first.";

    return;
  }

  if (!isDateValid(selectedDate)) {
    errorMessage.textContent = "Please select a date later than today.";

    return;
  }

  window.location.href = "ticket.html";
});

timeModal.addEventListener("click", function (event) {
  if (event.target === timeModal) {
    timeModal.classList.add("hidden");
  }
});

dateModal.addEventListener("click", function (event) {
  if (event.target === dateModal) {
    dateModal.classList.add("hidden");
  }
});

updateDisplay();
