"use strict";

const EVENT_STORAGE_KEY = "codechef-campus-events";
const REGISTRATION_STORAGE_KEY = "codechef-campus-registrations";
const ADMIN_SESSION_KEY = "codechef-campus-admin-session";
const ADMIN_CREDENTIALS = { username: "admin", password: "codechef123" };
const categories = ["Coding", "Hackathon", "Workshop", "Competition", "Seminar", "Other"];

const sampleEvents = [
  {
    id: "evt-codesprint-2026",
    name: "CodeSprint 2026",
    category: "Coding",
    date: "2026-10-15",
    time: "10:00 AM – 1:00 PM",
    venue: "Computer Lab 2, Block A",
    description: "A friendly algorithm challenge for curious coders. Bring your laptop, pick a problem, and find a clever way through it.",
    featured: true
  },
  {
    id: "evt-hackforge-2026",
    name: "HackForge",
    category: "Hackathon",
    date: "2026-11-06",
    time: "9:00 AM – 6:00 PM",
    venue: "Innovation Hub, Main Building",
    description: "Turn one campus-sized problem into a working prototype with a team of makers, mentors, and friendly competition.",
    featured: false
  },
  {
    id: "evt-frontend-fundamentals",
    name: "Frontend Fundamentals",
    category: "Workshop",
    date: "2026-10-08",
    time: "2:00 PM – 4:00 PM",
    venue: "Design Studio, Block C",
    description: "Build a responsive mini-site from scratch and learn how HTML, CSS, and JavaScript fit together.",
    featured: false
  },
  {
    id: "evt-tech-talk-ai",
    name: "TechTalk: Future of AI",
    category: "Seminar",
    date: "2026-10-28",
    time: "11:30 AM – 1:00 PM",
    venue: "Seminar Hall 1",
    description: "A student-friendly conversation about practical AI, responsible tools, and the ideas shaping what comes next.",
    featured: false
  }
];

let toastTimer;
let pendingDeleteId = "";
let events = [];
let registrations = [];
let revealObserver;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatDate(dateString, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!isValidDate(dateString)) return "Date to be announced";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en", options).format(date);
}

function isValidEvent(event) {
  return Boolean(
    event &&
    typeof event.id === "string" && event.id &&
    typeof event.name === "string" && event.name.trim() &&
    categories.includes(event.category) &&
    isValidDate(event.date) &&
    typeof event.time === "string" && event.time.trim() &&
    typeof event.venue === "string" && event.venue.trim() &&
    typeof event.description === "string" && event.description.trim()
  );
}

function cleanEvent(event) {
  if (!isValidEvent(event)) return null;
  return {
    id: event.id,
    name: event.name.trim().slice(0, 80),
    category: event.category,
    date: event.date,
    time: event.time.trim().slice(0, 50),
    venue: event.venue.trim().slice(0, 100),
    description: event.description.trim().slice(0, 360),
    featured: event.featured === true
  };
}

function readStoredArray(key) {
  let value;
  try {
    value = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (value === null) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEvents(nextEvents) {
  try {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(nextEvents));
    events = nextEvents;
    return true;
  } catch {
    showToast("Couldn’t save events in this browser. Check local storage settings.");
    return false;
  }
}

function loadEvents() {
  const stored = readStoredArray(EVENT_STORAGE_KEY);
  if (stored === null) {
    const starterEvents = sampleEvents.map(event => ({ ...event }));
    try {
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(starterEvents));
    } catch {
      showToast("Local storage is unavailable. Changes may not remain after you close this page.");
    }
    return starterEvents;
  }

  const validEvents = [];
  const seenIds = new Set();
  stored.forEach(item => {
    const event = cleanEvent(item);
    if (!event || seenIds.has(event.id)) return;
    seenIds.add(event.id);
    validEvents.push(event);
  });
  if (validEvents.length !== stored.length) {
    try {
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(validEvents));
    } catch {
      showToast("Some saved event details couldn’t be repaired in local storage.");
    }
  }
  return validEvents;
}

function isValidRegistration(registration) {
  return Boolean(
    registration &&
    typeof registration.id === "string" && registration.id &&
    typeof registration.eventId === "string" && registration.eventId &&
    typeof registration.eventName === "string" && registration.eventName &&
    typeof registration.name === "string" && registration.name &&
    typeof registration.email === "string" && registration.email &&
    typeof registration.college === "string" && registration.college &&
    typeof registration.year === "string" && registration.year &&
    typeof registration.phone === "string" && registration.phone &&
    typeof registration.registeredAt === "string" && !Number.isNaN(Date.parse(registration.registeredAt))
  );
}

function loadRegistrations() {
  return (readStoredArray(REGISTRATION_STORAGE_KEY) || []).filter(isValidRegistration);
}

function saveRegistrations(nextRegistrations) {
  try {
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(nextRegistrations));
    registrations = nextRegistrations;
    return true;
  } catch {
    showToast("Couldn’t save your registration. Check local storage settings and try again.");
    return false;
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("toast-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("toast-visible");
    toast.hidden = true;
  }, 3400);
}

function setupSharedPage() {
  document.querySelectorAll("[data-current-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-menu");
  if (!toggle || !menu) return;

  function setMenuOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menu.classList.toggle("menu-open", open);
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", event => {
    if (event.target.closest("a")) setMenuOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      toggle.focus();
    }
  });
}

function sortEvents(list) {
  return [...list].sort((first, second) => first.date.localeCompare(second.date) || first.name.localeCompare(second.name));
}

function eventDateBits(event) {
  const date = new Date(`${event.date}T00:00:00`);
  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(date).toUpperCase();
  return `<span class="event-date-block"><strong>${escapeHtml(day)}</strong><small>${escapeHtml(monthYear)}</small></span>`;
}

function eventDetailsMarkup(event) {
  return `<span class="category-pill">${escapeHtml(event.category)}</span><h2 id="dialog-event-name">${escapeHtml(event.name)}</h2><p class="dialog-event-description">${escapeHtml(event.description)}</p><div class="dialog-facts"><span><small>DATE</small><strong>${escapeHtml(formatDate(event.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}</strong></span><span><small>TIME</small><strong>${escapeHtml(event.time)}</strong></span><span><small>VENUE</small><strong>${escapeHtml(event.venue)}</strong></span></div><a class="button button-red" href="register.html?event=${encodeURIComponent(event.id)}">Register for this event <span aria-hidden="true">↗</span></a>`;
}

function eventCardMarkup(event, options = {}) {
  const isHome = options.home === true;
  const detailsControl = isHome
    ? `<a class="card-link" href="events.html?event=${encodeURIComponent(event.id)}" aria-label="View details for ${escapeHtml(event.name)}">Event details <span aria-hidden="true">↗</span></a>`
    : `<button class="card-link" type="button" data-event-action="details" data-event-id="${escapeHtml(event.id)}" aria-label="View details for ${escapeHtml(event.name)}">Event details <span aria-hidden="true">↗</span></button>`;
  return `<article class="event-card"><div class="event-card-top">${eventDateBits(event)}<span class="category-pill">${escapeHtml(event.category)}</span></div><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.description)}</p><div class="event-card-info"><span><i aria-hidden="true">◷</i>${escapeHtml(event.time)}</span><span><i aria-hidden="true">⌖</i>${escapeHtml(event.venue)}</span></div><div class="event-card-actions">${detailsControl}<a class="card-register" href="register.html?event=${encodeURIComponent(event.id)}" aria-label="Register for ${escapeHtml(event.name)}">Register <span aria-hidden="true">↗</span></a></div></article>`;
}

function renderHomeEvents() {
  const featuredSlot = document.querySelector("#featured-event");
  const eventsGrid = document.querySelector("#home-events");
  if (!featuredSlot || !eventsGrid) return;

  const upcoming = sortEvents(events.filter(event => event.date >= getTodayString()));
  const featured = upcoming.find(event => event.featured);
  if (featured) {
    featuredSlot.innerHTML = `<article class="featured-event"><div class="featured-art" aria-hidden="true"><span class="featured-art-kicker">A LITTLE<br />BIG IDEA</span><span class="featured-art-symbol">&lt;/&gt;</span><span class="featured-art-date">${escapeHtml(formatDate(featured.date, { month: "short", day: "numeric" }).toUpperCase())}</span></div><div class="featured-copy"><span class="eyebrow">✳ &nbsp; FEATURED EVENT</span><span class="category-pill">${escapeHtml(featured.category)}</span><h3>${escapeHtml(featured.name)}</h3><p>${escapeHtml(featured.description)}</p><div class="featured-facts"><span><small>WHEN</small><strong>${escapeHtml(formatDate(featured.date))} · ${escapeHtml(featured.time)}</strong></span><span><small>WHERE</small><strong>${escapeHtml(featured.venue)}</strong></span></div><a class="button button-red" href="register.html?event=${encodeURIComponent(featured.id)}" aria-label="Register for ${escapeHtml(featured.name)}">Save your place <span aria-hidden="true">↗</span></a></div></article>`;
  } else {
    featuredSlot.innerHTML = "";
  }

  const rest = upcoming.filter(event => event.id !== featured?.id).slice(0, 3);
  if (!upcoming.length) {
    eventsGrid.innerHTML = `<div class="empty-state"><span aria-hidden="true">✳</span><strong>No events available right now.</strong><p>Check back soon. The club is always planning something.</p></div>`;
    return;
  }
  if (!rest.length && !featured) {
    eventsGrid.innerHTML = `<div class="empty-state"><strong>No more events to show.</strong><p>Browse the events page to see what’s happening.</p></div>`;
    return;
  }
  eventsGrid.innerHTML = rest.map(event => eventCardMarkup(event, { home: true })).join("");
}

function renderEventsPage() {
  const grid = document.querySelector("#all-events");
  if (!grid) return;
  const search = document.querySelector("#event-search");
  const categoryFilter = document.querySelector("#category-filter");
  const count = document.querySelector("#event-count");

  function filterEvents() {
    const searchText = search.value.trim().toLocaleLowerCase();
    const selectedCategory = categoryFilter.value;
    const matching = sortEvents(events).filter(event => {
      const matchesName = event.name.toLocaleLowerCase().includes(searchText);
      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
      return matchesName && matchesCategory;
    });

    count.textContent = `${matching.length} ${matching.length === 1 ? "event" : "events"}`;
    grid.innerHTML = matching.length
      ? matching.map(event => eventCardMarkup(event)).join("")
      : events.length
        ? `<div class="empty-state"><span aria-hidden="true">⌕</span><strong>No events found matching your search.</strong><p>Try another name or choose a different category.</p></div>`
        : `<div class="empty-state"><span aria-hidden="true">✳</span><strong>No events available right now.</strong><p>The club is planning what’s next. Check back soon.</p></div>`;
  }

  search.addEventListener("input", filterEvents);
  categoryFilter.addEventListener("change", filterEvents);
  grid.addEventListener("click", event => {
    const trigger = event.target.closest("[data-event-action='details']");
    if (!trigger) return;
    openEventDetails(trigger.dataset.eventId);
  });
  filterEvents();

  const requestedId = new URLSearchParams(window.location.search).get("event");
  if (requestedId && events.some(event => event.id === requestedId)) openEventDetails(requestedId);
}

function openEventDetails(eventId) {
  const event = events.find(item => item.id === eventId);
  const dialog = document.querySelector("#event-dialog");
  const content = document.querySelector("#event-dialog-content");
  if (!event || !dialog || !content) return;
  content.innerHTML = eventDetailsMarkup(event);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function setupEventDialog() {
  const dialog = document.querySelector("#event-dialog");
  if (!dialog) return;
  dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
}

function displaySelectedEvent(event) {
  const card = document.querySelector("#selected-event");
  const form = document.querySelector("#register-form-view");
  const eventIdField = document.querySelector("#selected-event-id");
  if (!card || !form) return;

  if (!event) {
    card.innerHTML = `<div class="missing-event"><span class="eyebrow eyebrow-light">EVENT NOT FOUND</span><h2>Let’s find you<br />the right one.</h2><p>Choose an event from the calendar before you register.</p><a class="button button-outline" href="events.html">Browse events <span aria-hidden="true">↗</span></a></div>`;
    form.hidden = true;
    return;
  }

  eventIdField.value = event.id;
  card.innerHTML = `<span class="selected-label"><i></i> YOU’RE REGISTERING FOR</span><span class="category-pill">${escapeHtml(event.category)}</span><h2>${escapeHtml(event.name)}</h2><p>${escapeHtml(event.description)}</p><div class="selected-fact"><span>DATE</span><strong>${escapeHtml(formatDate(event.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}</strong></div><div class="selected-fact"><span>TIME</span><strong>${escapeHtml(event.time)}</strong></div><div class="selected-fact"><span>VENUE</span><strong>${escapeHtml(event.venue)}</strong></div>`;
}

function validateRegistrationField(field) {
  const value = field.value.trim();
  let error = "";
  if (field.name === "name") {
    if (!value) error = "Please enter your full name.";
    else if (value.length < 2 || !/[\p{L}]/u.test(value)) error = "Please enter a valid full name.";
  } else if (field.name === "email") {
    if (!value) error = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) error = "Please enter a valid email address.";
  } else if (field.name === "college") {
    if (!value) error = "Please enter your college name.";
    else if (value.length < 2) error = "Please enter at least 2 characters for your college.";
  } else if (field.name === "year") {
    if (!value) error = "Please select your year of study.";
  } else if (field.name === "phone") {
    const digits = value.replace(/\D/g, "");
    if (!value) error = "Please enter your phone number.";
    else if (!/^[+\d\s().-]+$/.test(value) || digits.length !== 10) error = "Please enter a valid 10-digit phone number.";
  }

  const errorNode = document.querySelector(`#${field.id}-error`);
  field.classList.toggle("field-invalid", Boolean(error));
  field.setAttribute("aria-invalid", String(Boolean(error)));
  errorNode.textContent = error;
  return !error;
}

function createRegistrationId(existing) {
  let id;
  do {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
    id = `CC${String(new Date().getFullYear()).slice(-2)}-${suffix}`;
  } while (existing.some(registration => registration.id === id));
  return id;
}

function setupRegistrationPage() {
  const form = document.querySelector("#registration-form");
  if (!form) return;
  const eventId = new URLSearchParams(window.location.search).get("event");
  const event = events.find(item => item.id === eventId);
  displaySelectedEvent(event);
  if (!event) return;

  const fields = [...form.querySelectorAll("input:not([type='hidden']), select")];
  fields.forEach(field => {
    field.addEventListener("blur", () => validateRegistrationField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("field-invalid")) validateRegistrationField(field);
    });
    field.addEventListener("change", () => {
      if (field.classList.contains("field-invalid")) validateRegistrationField(field);
    });
  });

  form.addEventListener("submit", submitRegistration);
}

function submitRegistration(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const eventId = form.elements.namedItem("eventId").value;
  const selectedEvent = events.find(item => item.id === eventId);
  const fields = [...form.querySelectorAll("input:not([type='hidden']), select")];
  const invalidFields = fields.filter(field => !validateRegistrationField(field));
  const formAlert = document.querySelector("#register-form-alert");

  if (!selectedEvent) {
    formAlert.textContent = "That event is no longer available. Please choose another event.";
    formAlert.hidden = false;
    return;
  }
  if (invalidFields.length) {
    formAlert.textContent = "A couple of details need a quick check. See the note below each field.";
    formAlert.hidden = false;
    invalidFields[0].focus();
    return;
  }

  formAlert.hidden = true;
  const saved = loadRegistrations();
  const registration = {
    id: createRegistrationId(saved),
    eventId: selectedEvent.id,
    eventName: selectedEvent.name,
    name: form.elements.namedItem("name").value.trim().replace(/\s+/g, " "),
    email: form.elements.namedItem("email").value.trim(),
    college: form.elements.namedItem("college").value.trim().replace(/\s+/g, " "),
    year: form.elements.namedItem("year").value,
    phone: form.elements.namedItem("phone").value.trim(),
    registeredAt: new Date().toISOString()
  };

  if (!saveRegistrations([...saved, registration])) return;

  document.querySelector("#register-form-view").hidden = true;
  const success = document.querySelector("#registration-success");
  document.querySelector("#success-id").textContent = registration.id;
  document.querySelector("#success-name").textContent = registration.name;
  document.querySelector("#success-event").textContent = registration.eventName;
  document.querySelector("#success-date").textContent = formatDate(selectedEvent.date);
  document.querySelector("#success-message").textContent = `You are registered for ${registration.eventName}. We’ll see you there.`;
  success.hidden = false;
  success.focus({ preventScroll: true });
  success.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setupAdminPage() {
  const loginForm = document.querySelector("#admin-login-form");
  if (!loginForm) return;

  const loginPanel = document.querySelector("#admin-login");
  const dashboard = document.querySelector("#admin-dashboard");
  const usernameField = loginForm.elements.namedItem("username");
  const passwordField = loginForm.elements.namedItem("password");
  const loginError = document.querySelector("#login-error");
  const sessionExists = () => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
    } catch {
      return false;
    }
  };

  function showDashboard(isLoggedIn) {
    loginPanel.hidden = isLoggedIn;
    dashboard.hidden = !isLoggedIn;
    if (isLoggedIn) renderDashboard();
  }

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const username = usernameField.value.trim();
    const password = passwordField.value;
    const usernameError = document.querySelector("#admin-username-error");
    const passwordError = document.querySelector("#admin-password-error");
    usernameError.textContent = username ? "" : "Please enter your username.";
    passwordError.textContent = password ? "" : "Please enter your password.";
    usernameField.setAttribute("aria-invalid", String(!username));
    passwordField.setAttribute("aria-invalid", String(!password));
    usernameField.classList.toggle("field-invalid", !username);
    passwordField.classList.toggle("field-invalid", !password);
    if (!username || !password) return;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
      } catch {
        showToast("Session storage is unavailable. You can still use this dashboard for this visit.");
      }
      loginError.hidden = true;
      showDashboard(true);
      return;
    }
    loginError.hidden = false;
  });

  [usernameField, passwordField].forEach(field => {
    field.addEventListener("input", () => {
      const error = document.querySelector(`#${field.id}-error`);
      const hasValue = field.name === "username" ? Boolean(field.value.trim()) : Boolean(field.value);
      if (hasValue) {
        error.textContent = "";
        field.removeAttribute("aria-invalid");
        field.classList.remove("field-invalid");
      }
      loginError.hidden = true;
    });
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      showToast("The demo session could not be cleared from this browser.");
    }
    loginForm.reset();
    showDashboard(false);
    usernameField.focus();
  });

  setupEventEditor();
  setupEventManagement();
  setupRegistrationManagement();
  showDashboard(sessionExists());
}

function updateDashboardStats() {
  const upcomingCount = events.filter(event => event.date >= getTodayString()).length;
  const featured = events.find(event => event.featured && event.date >= getTodayString());
  document.querySelector("[data-stat='events']").textContent = String(events.length);
  document.querySelector("[data-stat='registrations']").textContent = String(registrations.length);
  document.querySelector("[data-stat='upcoming']").textContent = String(upcomingCount);
  document.querySelector("[data-stat='featured']").textContent = featured ? featured.name : "None";
}

function renderDashboard() {
  updateDashboardStats();
  renderAdminEvents();
  renderAdminRegistrations();
}

function setupEventEditor() {
  const form = document.querySelector("#event-form");
  const fieldIds = ["event-name", "event-category", "event-date", "event-time", "event-venue", "event-description"];
  const submitButton = document.querySelector("#event-submit-button");
  const cancelButton = document.querySelector("#cancel-edit-button");

  function validateEventField(field) {
    const value = field.value.trim();
    const minimum = field.id === "event-description" ? 20 : field.id === "event-name" ? 3 : 1;
    let message = "";
    if (!value) message = `Please enter ${field.labels[0].textContent.replace(" *", "").toLowerCase()}.`;
    else if (value.length < minimum) message = field.id === "event-description" ? "Add a little more detail (at least 20 characters)." : `Please enter at least ${minimum} characters.`;
    else if (field.id === "event-category" && !categories.includes(value)) message = "Please choose a category from the list.";
    else if (field.id === "event-date" && !isValidDate(value)) message = "Please choose a valid event date.";

    const errorNode = document.querySelector(`#${field.id}-error`);
    field.classList.toggle("field-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    errorNode.textContent = message;
    return !message;
  }

  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    field.addEventListener("blur", () => validateEventField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("field-invalid")) validateEventField(field);
    });
    field.addEventListener("change", () => {
      if (field.classList.contains("field-invalid")) validateEventField(field);
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const fields = fieldIds.map(id => document.getElementById(id));
    const invalidFields = fields.filter(field => !validateEventField(field));
    if (invalidFields.length) {
      invalidFields[0].focus();
      return;
    }

    const editingId = document.querySelector("#editing-event-id").value;
    const eventDetails = {
      name: document.querySelector("#event-name").value.trim().replace(/\s+/g, " "),
      category: document.querySelector("#event-category").value,
      date: document.querySelector("#event-date").value,
      time: document.querySelector("#event-time").value.trim(),
      venue: document.querySelector("#event-venue").value.trim().replace(/\s+/g, " "),
      description: document.querySelector("#event-description").value.trim().replace(/\s+/g, " "),
      featured: document.querySelector("#event-featured").checked
    };

    let nextEvents;
    if (editingId) {
      nextEvents = events.map(item => item.id === editingId ? { ...item, ...eventDetails } : item);
      if (eventDetails.featured) nextEvents = nextEvents.map(item => item.id === editingId ? item : { ...item, featured: false });
    } else {
      const newEvent = { id: createEventId(events), ...eventDetails };
      nextEvents = [...events, newEvent];
      if (eventDetails.featured) nextEvents = nextEvents.map(item => item.id === newEvent.id ? item : { ...item, featured: false });
    }

    if (saveEvents(nextEvents)) {
      form.reset();
      document.querySelector("#editing-event-id").value = "";
      fieldIds.forEach(id => {
        const field = document.getElementById(id);
        field.classList.remove("field-invalid");
        field.removeAttribute("aria-invalid");
        document.querySelector(`#${id}-error`).textContent = "";
      });
      submitButton.innerHTML = "Add event <span aria-hidden=\"true\">↗</span>";
      cancelButton.hidden = true;
      document.querySelector("#event-editor-title").innerHTML = "Add an event<span>.</span>";
      registrations = loadRegistrations();
      renderDashboard();
      showToast(editingId ? "Event updated." : "Event added to the calendar.");
    }
  });

  cancelButton.addEventListener("click", () => resetEventEditor());
}

function createEventId(existing) {
  let id;
  do {
    id = `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  } while (existing.some(event => event.id === id));
  return id;
}

function resetEventEditor() {
  const form = document.querySelector("#event-form");
  if (!form) return;
  form.reset();
  document.querySelector("#editing-event-id").value = "";
  ["event-name", "event-category", "event-date", "event-time", "event-venue", "event-description"].forEach(id => {
    const field = document.getElementById(id);
    field.classList.remove("field-invalid");
    field.removeAttribute("aria-invalid");
    document.querySelector(`#${id}-error`).textContent = "";
  });
  document.querySelector("#event-submit-button").innerHTML = "Add event <span aria-hidden=\"true\">↗</span>";
  document.querySelector("#cancel-edit-button").hidden = true;
  document.querySelector("#event-editor-title").innerHTML = "Add an event<span>.</span>";
}

function editEvent(eventId) {
  const event = events.find(item => item.id === eventId);
  if (!event) return;
  document.querySelector("#editing-event-id").value = event.id;
  document.querySelector("#event-name").value = event.name;
  document.querySelector("#event-category").value = event.category;
  document.querySelector("#event-date").value = event.date;
  document.querySelector("#event-time").value = event.time;
  document.querySelector("#event-venue").value = event.venue;
  document.querySelector("#event-description").value = event.description;
  document.querySelector("#event-featured").checked = event.featured;
  document.querySelector("#event-submit-button").innerHTML = "Update event <span aria-hidden=\"true\">↗</span>";
  document.querySelector("#cancel-edit-button").hidden = false;
  document.querySelector("#event-editor-title").innerHTML = "Edit an event<span>.</span>";
  document.querySelector("#event-name").focus();
  document.querySelector("#event-editor-title").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAdminEvents() {
  const list = document.querySelector("#admin-event-list");
  if (!list) return;
  const sorted = sortEvents(events);
  if (!sorted.length) {
    list.innerHTML = `<div class="empty-state"><strong>Nothing to show yet.</strong><p>Add an event above to start your calendar.</p></div>`;
    return;
  }

  list.innerHTML = sorted.map(event => `<article class="manage-event-row"><div class="manage-event-date">${eventDateBits(event)}</div><div class="manage-event-main"><div class="manage-event-title"><h3>${escapeHtml(event.name)}</h3>${event.featured ? `<span class="featured-mini">✳ FEATURED</span>` : ""}</div><p><span class="category-pill">${escapeHtml(event.category)}</span><span>${escapeHtml(event.time)}</span><span>${escapeHtml(event.venue)}</span></p></div><div class="manage-event-actions"><button class="button button-muted button-small" type="button" data-admin-action="edit" data-event-id="${escapeHtml(event.id)}" aria-label="Edit ${escapeHtml(event.name)}">Edit</button><button class="button button-danger-ghost button-small" type="button" data-admin-action="delete" data-event-id="${escapeHtml(event.id)}" aria-label="Delete ${escapeHtml(event.name)}">Delete</button></div></article>`).join("");
}

function setupEventManagement() {
  const list = document.querySelector("#admin-event-list");
  const dialog = document.querySelector("#delete-dialog");
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-admin-action]");
    if (!button) return;
    if (button.dataset.adminAction === "edit") editEvent(button.dataset.eventId);
    if (button.dataset.adminAction === "delete") openDeleteDialog(button.dataset.eventId);
  });

  document.querySelector("[data-cancel-delete]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  document.querySelector("#confirm-delete").addEventListener("click", () => {
    if (!pendingDeleteId) return;
    const target = events.find(event => event.id === pendingDeleteId);
    const nextEvents = events.filter(event => event.id !== pendingDeleteId);
    if (saveEvents(nextEvents)) {
      if (document.querySelector("#editing-event-id").value === pendingDeleteId) resetEventEditor();
      registrations = loadRegistrations();
      renderDashboard();
      showToast(target ? `${target.name} removed from events.` : "Event removed.");
    }
    pendingDeleteId = "";
    dialog.close();
  });
}

function openDeleteDialog(eventId) {
  const target = events.find(event => event.id === eventId);
  const dialog = document.querySelector("#delete-dialog");
  if (!target || !dialog) return;
  pendingDeleteId = eventId;
  document.querySelector("#delete-description").textContent = `Are you sure you want to delete “${target.name}”? Existing registrations will remain in the dashboard.`;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function setupRevealAnimations() {
  const selectors = [".intro-layout", ".values-row", ".section-heading", ".featured-event", ".events-grid", ".join-layout", ".page-hero", ".filter-bar", ".register-layout", ".admin-login", ".dashboard-top", ".stat-cards", ".admin-panel"];
  const targets = document.querySelectorAll(selectors.join(","));
  targets.forEach(target => target.classList.add("reveal-item"));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    targets.forEach(target => target.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
  targets.forEach(target => revealObserver.observe(target));
}

function buildRegistrationEventFilter() {
  const filter = document.querySelector("#registration-event-filter");
  const previous = filter.value;
  const eventOptions = new Map();
  registrations.forEach(registration => {
    if (registration.eventId && registration.eventName) eventOptions.set(registration.eventId, registration.eventName);
  });
  events.forEach(event => eventOptions.set(event.id, event.name));
  const options = [...eventOptions.entries()].sort((first, second) => first[1].localeCompare(second[1]));
  filter.innerHTML = `<option value="all">All events</option>${options.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join("")}`;
  if (options.some(([id]) => id === previous)) filter.value = previous;
}

function renderAdminRegistrations() {
  const body = document.querySelector("#registration-rows");
  const empty = document.querySelector("#registration-empty");
  if (!body || !empty) return;
  const query = document.querySelector("#registration-search").value.trim().toLocaleLowerCase();
  const selectedEvent = document.querySelector("#registration-event-filter").value;
  const sorted = [...registrations].sort((first, second) => String(second.registeredAt || "").localeCompare(String(first.registeredAt || "")));
  const matching = sorted.filter(registration => {
    const searchable = [registration.id, registration.name, registration.email, registration.college, registration.eventName].join(" ").toLocaleLowerCase();
    const matchesSearch = searchable.includes(query);
    const matchesEvent = selectedEvent === "all" || registration.eventId === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  document.querySelector("#registration-total").textContent = `${registrations.length} ${registrations.length === 1 ? "STUDENT" : "STUDENTS"}`;
  body.innerHTML = matching.map(registration => {
    const registeredDate = registration.registeredAt ? formatDate(registration.registeredAt.slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable";
    return `<tr><td><span class="registration-code">${escapeHtml(registration.id)}</span></td><td><strong>${escapeHtml(registration.name)}</strong></td><td>${escapeHtml(registration.email)}</td><td>${escapeHtml(registration.college)}</td><td>${escapeHtml(registration.year)}</td><td>${escapeHtml(registration.phone)}</td><td>${escapeHtml(registration.eventName)}</td><td>${escapeHtml(registeredDate)}</td></tr>`;
  }).join("");
  empty.hidden = matching.length > 0;
  if (!matching.length) {
    empty.textContent = registrations.length ? "No registrations found." : "No registrations yet.";
    empty.classList.toggle("empty-filtered", registrations.length > 0);
  }

  buildRegistrationEventFilter();
}

function setupRegistrationManagement() {
  document.querySelector("#registration-search").addEventListener("input", renderAdminRegistrations);
  document.querySelector("#registration-event-filter").addEventListener("change", renderAdminRegistrations);
}

function initialize() {
  document.documentElement.classList.add("has-js");
  setupSharedPage();
  events = loadEvents();
  registrations = loadRegistrations();
  renderHomeEvents();
  setupEventDialog();
  renderEventsPage();
  setupRegistrationPage();
  setupAdminPage();
  setupRevealAnimations();
}

initialize();
