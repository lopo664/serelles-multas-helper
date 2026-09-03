const people = [
    "Pablito", "Adri Sanz", "Borja", "Castu", "Iván", "Moyano", "Michi", "Nando", "Rafeta", "Raúl", "Xavi", "Xavo", "Mihail", "Agus", "Lupas", "Nadal", "Thiago"
];

const fines = [
    { label: "Retraso entreno", amount: 1, activity: "training" },
    { label: "Ropa entreno", amount: 1, activity: "training" },
    { label: "Consultar el móvil", amount: 5, activity: "training" },
    { label: "Retraso partido", amount: 5, activity: "match" },
    { label: "Ropa partido", amount: 5, activity: "match" },
    { label: "Prenda partido", amount: 10, activity: "match" },
    { label: "Amarilla por protestar", amount: 2, activity: "match" },
    { label: "Roja por protestar", amount: 5, activity: "match" }
];

const dateInput = document.querySelector("#date");
const personOptions = document.querySelector("#person-options");
const fineOptions = document.querySelector("#fine-options");
const matchInput = document.querySelector("#is-match");
const activityLabel = document.querySelector("#activity-label");
const form = document.querySelector("#fine-form");
const result = document.querySelector("#result");
const copyButton = document.querySelector("#copy-button");
const copyLabel = document.querySelector("#copy-label");
const copyFeedback = document.querySelector("#copy-feedback");
const clearButton = document.querySelector("#clear-button");
const formPanel = document.querySelector("#form-panel");
const previewPanel = document.querySelector("#preview-panel");
const formViewButton = document.querySelector("#form-view-button");
const resultViewButton = document.querySelector("#result-view-button");
let generatedLines = [];

function addOptions(container, options, getValue, getLabel, name) {
    options.forEach((option, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const text = document.createElement("span");
        input.type = "checkbox";
        input.name = name;
        input.value = getValue(option, index);
        input.dataset.activity = option.activity || "";
        text.textContent = getLabel(option, index);
        label.className = "choice-card";
        label.append(input, text);
        container.append(label);
    });
}

function getToday() {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getDateHeader() {
    const date = new Date(`${dateInput.value}T12:00:00`);
    const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const activity = matchInput.checked ? "Partido" : "Entreno";

    return `${capitalizedWeekday} - ${day}/${month} - ${activity}`;
}

function formatFine(fine, person) {
    return `${person} - ${fine.label} - ${fine.amount}€`;
}

function updateActivityLabel() {
    const activity = matchInput.checked ? "Partido" : "Entreno";
    activityLabel.textContent = activity;
}

function updateFineAvailability() {
    const activity = matchInput.checked ? "match" : "training";
    fineOptions.querySelectorAll("input").forEach((input) => {
        const unavailable = input.dataset.activity !== activity;
        input.disabled = unavailable;
        if (unavailable) input.checked = false;
        input.parentElement.classList.toggle("is-unavailable", unavailable);
    });
}

function showView(view) {
    const showingForm = view === "form";
    formPanel.classList.toggle("is-active", showingForm);
    previewPanel.classList.toggle("is-active", !showingForm);
    formViewButton.classList.toggle("is-active", showingForm);
    resultViewButton.classList.toggle("is-active", !showingForm);
    formViewButton.setAttribute("aria-selected", showingForm);
    resultViewButton.setAttribute("aria-selected", !showingForm);
}

function generateResult() {
    const selectedPeople = Array.from(personOptions.querySelectorAll("input:checked"), (input) => input.value);
    const selectedFines = Array.from(fineOptions.querySelectorAll("input:checked"), (input) => fines[Number(input.value)]);
    if (!form.reportValidity() || selectedPeople.length === 0 || selectedFines.length === 0) {
        copyFeedback.textContent = "Selecciona al menos una persona y una multa.";
        return;
    }
    const lines = selectedPeople.flatMap((person) => selectedFines.map((fine) => formatFine(fine, person)));
    generatedLines.push(...lines);
    result.textContent = `${getDateHeader()}\n${generatedLines.join("\n")}`;
    copyButton.disabled = false;
    copyFeedback.textContent = "";
}

function clearResult() {
    generatedLines = [];
    result.textContent = "";
    copyButton.disabled = true;
    copyLabel.textContent = "Copiar al portapapeles";
    copyFeedback.textContent = "";
}

async function copyResult() {
    try {
        await navigator.clipboard.writeText(result.textContent);
        copyLabel.textContent = "Cadena copiada";
        copyFeedback.textContent = "Ya puedes pegarla donde quieras.";
        setTimeout(() => { copyLabel.textContent = "Copiar al portapapeles"; }, 1800);
    } catch {
        copyFeedback.textContent = "No se pudo copiar automáticamente.";
    }
}

addOptions(personOptions, people, (person) => person, (person) => person, "person");
addOptions(fineOptions, fines, (_, index) => index, (fine) => `${fine.label} · ${fine.amount}€`, "fine");
dateInput.value = getToday();
matchInput.addEventListener("change", () => {
    updateActivityLabel();
    updateFineAvailability();
});
form.addEventListener("submit", (event) => { event.preventDefault(); generateResult(); });
copyButton.addEventListener("click", copyResult);
clearButton.addEventListener("click", clearResult);
formViewButton.addEventListener("click", () => showView("form"));
resultViewButton.addEventListener("click", () => showView("result"));
document.querySelector("#current-year").textContent = new Date().getFullYear();
updateActivityLabel();
updateFineAvailability();
