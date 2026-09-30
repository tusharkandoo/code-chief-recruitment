const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "codechef123";
const categories = ["Coding", "Hackathon", "Workshop", "Competition", "Seminar", "Other"];

const sampleEvents = [
  { id: "evt-1", name: "Clash Of Coders 2026", category: "Coding", date: "2026-10-24", time: "10:00", venue: "AB Basement Computer Lab 2", description: "A 3-hour individual coding contest with problems from easy to hard.", featured: true },
  { id: "evt-2", name: "Patronous Verse", category: "Hackathon", date: "2026-11-07", time: "09:00", venue: "Auditorium", description: "A 24-hour team hackathon to build something useful for campus life.", featured: false },
  { id: "evt-3", name: "Frontend Development", category: "Workshop", date: "2026-10-18", time: "14:00", venue: "Seminar Hall", description: "A hands-on workshop on HTML, CSS and JavaScript for beginners.", featured: false },
  { id: "evt-4", name: "TechTalk: Future of AI", category: "Seminar", date: "2026-11-14", time: "11:30", venue: "Seminar Hall", description: "An alumni-led talk on how AI is changing software jobs.", featured: false },
  { id: "evt-5", name: "FixIt", category: "Competition", date: "2026-09-12", time: "18:00", venue: "Online", description: "Find and fix bugs in a broken project before the other teams do.", featured: false }
];

function readList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    showToast("Could not save. Browser storage is unavailable.");
  }
}

function isValidEvent(item) {
  return item && item.id && item.name && item.date && item.time;
}

function loadEvents() {
  if (localStorage.getItem("events") === null) writeList("events", sampleEvents);
  return readList("events").filter(isValidEvent);
}

function loadRegistrations() {
  return readList("registrations").filter((item) => item && item.id && item.name);
}

let events = loadEvents();
let registrations = loadRegistrations();

function saveEvents() {
  writeList("events", events);
}

function saveRegistrations() {
  writeList("registrations", registrations);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : text;
  return div.innerHTML;
}

function formatDate(date) {
  const value = new Date(date + "T00:00:00");
  if (isNaN(value)) return date;
  return value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  if (isNaN(hours)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  return (hours % 12 || 12) + ":" + String(minutes).padStart(2, "0") + " " + suffix;
}

function todayString() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

function getUpcomingEvents() {
  return events.filter((item) => item.date >= todayString()).sort((a, b) => a.date.localeCompare(b.date));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function renderHeader() {
  const page = document.body.dataset.page;
  const links = [["index", "index.html", "Home"], ["events", "events.html", "Events"], ["about", "index.html#about", "About"], ["admin", "admin.html", "Admin"]];
  const items = links.map(([name, href, label]) => '<a href="' + href + '"' + (name === page ? ' class="active"' : "") + ">" + label + "</a>").join("");
  document.getElementById("siteHeader").innerHTML =
    '<div class="container nav"><a class="brand" href="index.html"><span>&lt;/&gt;</span>CodeChef Club</a>' +
    '<button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
    '<nav class="nav-links" id="navLinks">' + items + '<a class="btn btn-primary btn-small" href="events.html">Explore Events</a></nav></div>';
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.innerHTML = open ? "&times;" : "&#9776;";
  });
  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) navLinks.classList.remove("open");
  });
}

function isPast(item) {
  return item.date < todayString();
}

function eventCard(item) {
  const date = new Date(item.date + "T00:00:00");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  const action = isPast(item)
    ? '<span class="btn btn-disabled" aria-disabled="true">Event ended</span>'
    : '<a class="btn btn-primary" href="register.html?id=' + encodeURIComponent(item.id) + '">Register</a>';
  return '<article class="card"><div class="card-top"><div class="date-block"><b>' + date.getDate() + "</b><span>" + month + "</span></div>" +
    '<span class="badge">' + escapeHtml(item.category) + "</span></div><h3>" + escapeHtml(item.name) + "</h3>" +
    '<p class="meta">' + formatTime(item.time) + ", " + escapeHtml(item.venue) + "</p>" +
    '<p class="desc">' + escapeHtml(item.description) + "</p>" + action + "</article>";
}

function renderEvents(list, container, emptyMessage) {
  container.innerHTML = list.length ? list.map(eventCard).join("") : '<div class="empty">' + emptyMessage + "</div>";
}

function revealElements() {
  const items = document.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach((item) => observer.observe(item));
}

function renderNextEvent(item) {
  const box = document.getElementById("nextEvent");
  if (!item) {
    box.innerHTML = '<p class="next-label">Next event</p><p class="muted">No upcoming events right now. Check back soon.</p>';
    return;
  }
  box.innerHTML = '<p class="next-label">Next event</p><h3>' + escapeHtml(item.name) + "</h3><p>" + formatDate(item.date) + " at " + formatTime(item.time) +
    "</p><p class=\"muted\">" + escapeHtml(item.venue) + '</p><a class="btn btn-primary" href="register.html?id=' + encodeURIComponent(item.id) + '">Register</a>';
}

function initHome() {
  const upcoming = getUpcomingEvents();
  renderNextEvent(upcoming[0]);
  renderEvents(upcoming.slice(0, 4), document.getElementById("upcomingList"), "No events available right now.");
  const featured = upcoming.find((item) => item.featured) || upcoming[0];
  const box = document.getElementById("featured");
  if (!featured) {
    box.innerHTML = '<div class="empty">No events available right now.</div>';
    return;
  }
  box.innerHTML = '<div class="featured"><div><span class="badge">' + escapeHtml(featured.category) + "</span><h3>" + escapeHtml(featured.name) + "</h3><p class=\"muted\">" +
    escapeHtml(featured.description) + '</p><div class="actions"><a class="btn btn-primary" href="register.html?id=' + encodeURIComponent(featured.id) + '">Register</a></div></div>' +
    '<div class="meta"><p><strong>Date</strong><br>' + formatDate(featured.date) + "</p><p><strong>Time</strong><br>" + formatTime(featured.time) +
    "</p><p><strong>Venue</strong><br>" + escapeHtml(featured.venue) + "</p></div></div>";
}

function fillCategories(select, firstLabel) {
  const first = firstLabel ? '<option value="">' + firstLabel + "</option>" : "";
  select.innerHTML = first + categories.map((name) => "<option>" + name + "</option>").join("");
}

function filterEvents() {
  const text = document.getElementById("search").value.trim().toLowerCase();
  const category = document.getElementById("category").value;
  const list = events.filter((item) => item.name.toLowerCase().includes(text) && (!category || item.category === category)).sort((a, b) => a.date.localeCompare(b.date));
  const message = events.length ? 'No events found matching your search.<br><button class="btn btn-outline btn-small" id="clearFilters" type="button">Clear filters</button>' : "No events available right now.";
  renderEvents(list, document.getElementById("list"), message);
  document.getElementById("resultCount").textContent = events.length ? "Showing " + list.length + " of " + events.length + " events" : "";
}

function clearFilters() {
  document.getElementById("search").value = "";
  document.getElementById("category").value = "";
  filterEvents();
}

function initEventsPage() {
  fillCategories(document.getElementById("category"), "All Categories");
  document.getElementById("search").addEventListener("input", filterEvents);
  document.getElementById("category").addEventListener("change", filterEvents);
  document.getElementById("list").addEventListener("click", (event) => {
    if (event.target.id === "clearFilters") clearFilters();
  });
  filterEvents();
}

function setError(input, message) {
  const field = input.closest(".field");
  const error = field.querySelector(".error");
  field.classList.toggle("invalid", Boolean(message));
  error.textContent = message;
}

function watchFields(form, validate) {
  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.closest(".field") && input.closest(".field").classList.contains("invalid")) validate(true);
    });
  });
}

function validateForm(showAll) {
  const form = document.getElementById("registerForm").elements;
  const values = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    college: form.college.value.trim(),
    year: form.year.value,
    phone: form.phone.value.replace(/[\s-]/g, "")
  };
  const messages = {
    name: values.name.length < 2 ? "Please enter your full name." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email) ? "" : "Please enter a valid email address.",
    college: values.college ? "" : "Please enter your college name.",
    year: values.year ? "" : "Please select your year.",
    phone: /^\d{10}$/.test(values.phone) ? "" : "Please enter a valid 10-digit phone number."
  };
  let valid = true;
  Object.keys(messages).forEach((key) => {
    const field = form[key].closest(".field");
    if (messages[key]) valid = false;
    if (showAll === true || field.classList.contains("invalid")) setError(form[key], messages[key]);
  });
  return valid ? values : null;
}

function generateId() {
  return "REG-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function showSuccess(registration, eventItem) {
  document.getElementById("registerBox").hidden = true;
  document.getElementById("success").hidden = false;
  document.getElementById("successText").textContent = "You are registered for " + eventItem.name + ".";
  document.getElementById("receipt").innerHTML =
    "<div><dt>Registration ID</dt><dd>" + registration.id + "</dd></div><div><dt>Name</dt><dd>" + escapeHtml(registration.name) +
    "</dd></div><div><dt>Event</dt><dd>" + escapeHtml(eventItem.name) + "</dd></div><div><dt>Date</dt><dd>" + formatDate(eventItem.date) + "</dd></div>";
}

function initRegisterPage() {
  const id = new URLSearchParams(location.search).get("id");
  const eventItem = events.find((item) => item.id === id);
  const form = document.getElementById("registerForm");
  const selected = document.getElementById("selectedEvent");
  if (!eventItem) {
    selected.innerHTML = '<p>No event selected. <a class="link" href="events.html">Choose an event</a> to register.</p>';
    form.hidden = true;
    return;
  }
  if (isPast(eventItem)) {
    selected.innerHTML = "<h3>" + escapeHtml(eventItem.name) + '</h3><p>Registration is closed. This event has ended. <a class="link" href="events.html">See other events</a></p>';
    form.hidden = true;
    return;
  }
  selected.innerHTML = "<h3>" + escapeHtml(eventItem.name) + "</h3><p>" + formatDate(eventItem.date) + " at " + formatTime(eventItem.time) + ", " + escapeHtml(eventItem.venue) + "</p>";
  watchFields(form, validateForm);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = validateForm(true);
    if (!values) {
      form.querySelector(".field.invalid input, .field.invalid select").focus();
      return;
    }
    const duplicate = registrations.some((item) => item.eventId === eventItem.id && item.email.toLowerCase() === values.email.toLowerCase());
    if (duplicate) {
      setError(form.elements.email, "This email is already registered for this event.");
      return;
    }
    const registration = { id: generateId(), eventId: eventItem.id, eventName: eventItem.name, ...values, registeredAt: new Date().toISOString() };
    registrations.push(registration);
    saveRegistrations();
    showSuccess(registration, eventItem);
  });
}

function isLoggedIn() {
  return sessionStorage.getItem("adminLoggedIn") === "yes";
}

function showAdminView() {
  const loggedIn = isLoggedIn();
  document.getElementById("loginBox").hidden = loggedIn;
  document.getElementById("dashboard").hidden = !loggedIn;
  if (loggedIn) renderDashboard();
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "yes");
    document.getElementById("loginError").textContent = "";
    showAdminView();
  } else {
    document.getElementById("loginError").textContent = "Incorrect username or password.";
  }
}

function logout() {
  sessionStorage.removeItem("adminLoggedIn");
  showAdminView();
}

function renderStats() {
  const featured = events.find((item) => item.featured);
  const stats = [
    ["Total Events", events.length],
    ["Total Registrations", registrations.length],
    ["Upcoming Events", getUpcomingEvents().length],
    ["Featured Event", featured ? featured.name : "None"]
  ];
  document.getElementById("stats").innerHTML = stats.map(([label, value]) => '<div class="stat"><b>' + escapeHtml(value) + "</b><span>" + label + "</span></div>").join("");
}

function renderEventRows() {
  const rows = document.getElementById("eventRows");
  if (!events.length) {
    rows.innerHTML = '<tr><td class="empty" colspan="6">Nothing to show yet.</td></tr>';
    return;
  }
  rows.innerHTML = events.map((item) => "<tr><td>" + escapeHtml(item.name) + (item.featured ? ' <span class="badge">Featured</span>' : "") + "</td><td>" + escapeHtml(item.category) + "</td><td>" +
    formatDate(item.date) + "</td><td>" + escapeHtml(item.venue) + "</td><td>" + registrations.filter((entry) => entry.eventId === item.id).length +
    '</td><td><button class="btn btn-outline btn-small" type="button" data-edit="' + item.id +
    '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete="' + item.id + '">Delete</button></td></tr>').join("");
}

function renderRegEventFilter() {
  const select = document.getElementById("regEvent");
  const current = select.value;
  select.innerHTML = '<option value="">All Events</option>' + events.map((item) => '<option value="' + item.id + '">' + escapeHtml(item.name) + "</option>").join("");
  select.value = events.some((item) => item.id === current) ? current : "";
}

function renderRegistrations() {
  const text = document.getElementById("regSearch").value.trim().toLowerCase();
  const eventId = document.getElementById("regEvent").value;
  const list = registrations.filter((item) => {
    const haystack = [item.name, item.email, item.college, item.eventName, item.id].join(" ").toLowerCase();
    return haystack.includes(text) && (!eventId || item.eventId === eventId);
  });
  const rows = document.getElementById("regRows");
  if (!list.length) {
    const message = registrations.length ? "No registrations found." : "No registrations yet.";
    rows.innerHTML = '<tr><td class="empty" colspan="8">' + message + "</td></tr>";
    return;
  }
  rows.innerHTML = list.map((item) => "<tr><td>" + escapeHtml(item.id) + "</td><td>" + escapeHtml(item.name) + "</td><td>" + escapeHtml(item.email) + "</td><td>" + escapeHtml(item.college) +
    "</td><td>" + escapeHtml(item.year) + "</td><td>" + escapeHtml(item.phone) + "</td><td>" + escapeHtml(item.eventName) + "</td><td>" + formatDate(String(item.registeredAt).slice(0, 10)) + "</td></tr>").join("");
}

function renderDashboard() {
  renderStats();
  renderEventRows();
  renderRegEventFilter();
  renderRegistrations();
}

function validateEventForm(form) {
  const rules = {
    eventName: form.elements.eventName.value.trim().length < 3 ? "Please enter an event name (at least 3 characters)." : "",
    eventCategory: form.elements.eventCategory.value ? "" : "Please choose a category.",
    eventDate: form.elements.eventDate.value ? "" : "Please pick a date.",
    eventTime: form.elements.eventTime.value ? "" : "Please pick a time.",
    eventVenue: form.elements.eventVenue.value.trim() ? "" : "Please enter a venue.",
    eventDescription: form.elements.eventDescription.value.trim().length < 10 ? "Please add a short description (at least 10 characters)." : ""
  };
  Object.keys(rules).forEach((key) => setError(form.elements[key], rules[key]));
  return Object.values(rules).every((message) => !message);
}

function resetEventForm() {
  const form = document.getElementById("eventForm");
  form.reset();
  document.getElementById("eventId").value = "";
  document.getElementById("formTitle").textContent = "Add event";
  document.getElementById("eventSubmit").textContent = "Add Event";
  document.getElementById("cancelEdit").hidden = true;
  form.querySelectorAll(".field").forEach((field) => field.classList.remove("invalid"));
  form.querySelectorAll(".error").forEach((error) => { error.textContent = ""; });
}

function addEvent(data) {
  if (data.featured) clearFeatured();
  events.push({ id: "evt-" + Date.now(), ...data });
  saveEvents();
  showToast("Event added successfully.");
}

function clearFeatured() {
  events = events.map((item) => ({ ...item, featured: false }));
}

function updateEvent(id, data) {
  if (data.featured) clearFeatured();
  events = events.map((item) => (item.id === id ? { ...item, ...data } : item));
  saveEvents();
  showToast("Event updated successfully.");
}

function editEvent(id) {
  const item = events.find((entry) => entry.id === id);
  if (!item) return;
  const form = document.getElementById("eventForm");
  document.getElementById("eventId").value = item.id;
  form.elements.eventName.value = item.name;
  form.elements.eventCategory.value = item.category;
  form.elements.eventDate.value = item.date;
  form.elements.eventTime.value = item.time;
  form.elements.eventVenue.value = item.venue;
  form.elements.eventDescription.value = item.description;
  form.elements.eventFeatured.checked = Boolean(item.featured);
  document.getElementById("formTitle").textContent = "Edit event";
  document.getElementById("eventSubmit").textContent = "Update Event";
  document.getElementById("cancelEdit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.eventName.focus();
}

function deleteEvent(id) {
  events = events.filter((item) => item.id !== id);
  saveEvents();
  if (document.getElementById("eventId").value === id) resetEventForm();
  renderDashboard();
  showToast("Event deleted.");
}

function handleEventSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (!validateEventForm(form)) {
    form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea").focus();
    return;
  }
  const data = {
    name: form.elements.eventName.value.trim(),
    category: form.elements.eventCategory.value,
    date: form.elements.eventDate.value,
    time: form.elements.eventTime.value,
    venue: form.elements.eventVenue.value.trim(),
    description: form.elements.eventDescription.value.trim(),
    featured: form.elements.eventFeatured.checked
  };
  const id = document.getElementById("eventId").value;
  if (id) updateEvent(id, data);
  else addEvent(data);
  resetEventForm();
  renderDashboard();
}

function initAdminPage() {
  const modal = document.getElementById("modal");
  let pendingDeleteId = null;
  const form = document.getElementById("eventForm");
  fillCategories(document.getElementById("eventCategory"), "Select category");
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  form.addEventListener("submit", handleEventSubmit);
  watchFields(form, () => validateEventForm(form));
  document.getElementById("cancelEdit").addEventListener("click", resetEventForm);
  document.getElementById("regSearch").addEventListener("input", renderRegistrations);
  document.getElementById("regEvent").addEventListener("change", renderRegistrations);
  document.getElementById("eventRows").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    if (editButton) editEvent(editButton.dataset.edit);
    if (deleteButton) {
      pendingDeleteId = deleteButton.dataset.delete;
      modal.classList.add("open");
      document.getElementById("modalCancel").focus();
    }
  });
  document.getElementById("modalCancel").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("modalDelete").addEventListener("click", () => {
    modal.classList.remove("open");
    deleteEvent(pendingDeleteId);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") modal.classList.remove("open");
  });
  showAdminView();
}

renderHeader();
const page = document.body.dataset.page;
if (page === "index") initHome();
if (page === "events") initEventsPage();
if (page === "register") initRegisterPage();
if (page === "admin") initAdminPage();
revealElements();
