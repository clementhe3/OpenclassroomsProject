const habitForm = document.getElementById("habit-form");
const habitName = document.getElementById("habit-name");
const habitFrequency = document.getElementById("habit-frequency");
const habitList = document.getElementById("habit-list");
const template = document.getElementById("habit-template");
const activeCount = document.getElementById("active-count");
const doneCount = document.getElementById("done-count");
const bestStreak = document.getElementById("best-streak");
const resetDayButton = document.getElementById("reset-day");

const STORAGE_KEY = "habit-tracker-data-v1";

const state = {
  habits: [],
};

const todayStamp = () => new Date().toISOString().slice(0, 10);

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.habits)) {
      state.habits = parsed.habits;
    }
  } catch (error) {
    console.warn("Impossible de charger les habitudes", error);
  }
};

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const resetIfNewDay = () => {
  const today = todayStamp();
  state.habits.forEach((habit) => {
    if (habit.lastUpdated !== today) {
      habit.doneToday = false;
      habit.lastUpdated = today;
    }
  });
};

const updateStats = () => {
  const total = state.habits.length;
  const done = state.habits.filter((habit) => habit.doneToday).length;
  const best = state.habits.reduce((max, habit) => Math.max(max, habit.bestStreak), 0);

  activeCount.textContent = String(total);
  doneCount.textContent = String(done);
  bestStreak.textContent = String(best);
};

const renderHabits = () => {
  habitList.innerHTML = "";

  if (state.habits.length === 0) {
    habitList.innerHTML = "<p class=\"empty\">Ajoutez votre première habitude pour commencer.</p>";
    updateStats();
    return;
  }

  state.habits.forEach((habit) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".habit-card");
    const title = clone.querySelector(".habit-card__title");
    const meta = clone.querySelector(".habit-card__meta");
    const streak = clone.querySelector(".habit-card__streak");
    const toggle = clone.querySelector(".toggle");
    const remove = clone.querySelector(".remove");

    title.textContent = habit.name;
    meta.textContent = `Fréquence: ${habit.frequency}`;
    streak.textContent = `Série actuelle: ${habit.currentStreak} jour(s) — meilleure: ${habit.bestStreak} jour(s)`;

    if (habit.doneToday) {
      card.classList.add("completed");
      toggle.textContent = "Annuler";
    }

    toggle.addEventListener("click", () => toggleHabit(habit.id));
    remove.addEventListener("click", () => removeHabit(habit.id));

    habitList.appendChild(clone);
  });

  updateStats();
};

const addHabit = (name, frequency) => {
  const today = todayStamp();
  state.habits.unshift({
    id: crypto.randomUUID(),
    name,
    frequency,
    doneToday: false,
    currentStreak: 0,
    bestStreak: 0,
    lastUpdated: today,
  });
  saveState();
  renderHabits();
};

const toggleHabit = (id) => {
  const today = todayStamp();
  const habit = state.habits.find((entry) => entry.id === id);
  if (!habit) {
    return;
  }

  if (habit.lastUpdated !== today) {
    habit.doneToday = false;
    habit.lastUpdated = today;
  }

  habit.doneToday = !habit.doneToday;

  if (habit.doneToday) {
    habit.currentStreak += 1;
    habit.bestStreak = Math.max(habit.bestStreak, habit.currentStreak);
  } else {
    habit.currentStreak = Math.max(0, habit.currentStreak - 1);
  }

  saveState();
  renderHabits();
};

const removeHabit = (id) => {
  state.habits = state.habits.filter((habit) => habit.id !== id);
  saveState();
  renderHabits();
};

const resetDay = () => {
  const today = todayStamp();
  state.habits.forEach((habit) => {
    habit.doneToday = false;
    habit.lastUpdated = today;
  });
  saveState();
  renderHabits();
};

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitName.value.trim();
  if (!name) {
    habitName.focus();
    return;
  }
  addHabit(name, habitFrequency.value);
  habitForm.reset();
  habitName.focus();
});

resetDayButton.addEventListener("click", resetDay);

loadState();
resetIfNewDay();
renderHabits();
