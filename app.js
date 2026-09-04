const people = [
    "Pablito", "Adri Sanz", "Borja", "Castu", "Iván", "Moyano", "Michi", "Nando", "Rafeta", "Raúl", "Xavi", "Xavo", "Mihail", "Agus", "Lupas", "Nadal", "Thiago"
];

const fines = [
    { label: "Retraso", amount: 1 },
    { label: "Ropa", amount: 1 },
    { label: "Consultar el móvil", amount: 5 },
    { label: "Retraso partido", amount: 5 },
    { label: "Ropa partido", amount: 5 },
    { label: "Prenda partido", amount: 10 },
    { label: "Amarilla por protestar", amount: 2 },
    { label: "Roja por protestar", amount: 5 }
];

const dateInput = document.querySelector("#date");
const personOptions = document.querySelector("#person-options");
const fineOptions = document.querySelector("#fine-options");
const form = document.querySelector("#fine-form");
const result = document.querySelector("#result");
const copyButton = document.querySelector("#copy-button");
const copyLabel = document.querySelector("#copy-label");
const copyFeedback = document.querySelector("#copy-feedback");
const clearButton = document.querySelector("#clear-button");
const generateButton = document.querySelector(".generate-button");
const formPanel = document.querySelector("#form-panel");
const previewPanel = document.querySelector("#preview-panel");
const previousFinesPanel = document.querySelector("#previous-fines-panel");
const paidFinesPanel = document.querySelector("#paid-fines-panel");
const formViewButton = document.querySelector("#form-view-button");
const resultViewButton = document.querySelector("#result-view-button");
const previousFinesViewButton = document.querySelector("#previous-fines-view-button");
const paidFinesViewButton = document.querySelector("#paid-fines-view-button");
const previousFinesInput = document.querySelector("#previous-fines-input");
const paidLinesContainer = document.querySelector("#paid-lines");
const paidDateLabel = document.querySelector("#paid-date-label");
const loadPreviousButton = document.querySelector("#load-previous-fines-button");
const paidToFormButton = document.querySelector("#paid-to-form-button");
const paidToResultButton = document.querySelector("#paid-to-result-button");
let generatedLines = [];
let loadedPreviousLines = [];

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
    const year = date.getFullYear();

    return `${capitalizedWeekday} - ${day}/${month}/${year}`;
}

function formatFine(fine, person) {
    return `${person} - ${fine.label} - ${fine.amount}€`;
}

function showView(view) {
    const forms = {
        form: formPanel,
        result: previewPanel,
        previous: previousFinesPanel,
        paid: paidFinesPanel
    };

    Object.entries(forms).forEach(([key, panel]) => {
        const isActive = key === view;
        panel.classList.toggle("is-active", isActive);
    });

    const viewButtons = {
        form: formViewButton,
        result: resultViewButton,
        previous: previousFinesViewButton,
        paid: paidFinesViewButton
    };

    Object.entries(viewButtons).forEach(([key, button]) => {
        const isActive = key === view;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    if (view === "paid") {
        renderPaidLines();
    }
}

function getSelectedLines() {
    const selectedPeople = Array.from(personOptions.querySelectorAll("input:checked"), (input) => input.value);
    const selectedFines = Array.from(fineOptions.querySelectorAll("input:checked"), (input) => fines[Number(input.value)]);
    return selectedPeople.flatMap((person) => selectedFines.map((fine) => ({
        key: `${person}-${fine.label}-${fine.amount}`,
        value: formatFine(fine, person)
    })));
}

function buildPaidLineId(groupHeader, rawValue, occurrenceIndex) {
    return `${groupHeader}::${occurrenceIndex}::${rawValue}`;
}

function getPaidKeys() {
    return new Set(Array.from(document.querySelectorAll(".paid-line:checked"), (input) => input.dataset.lineValue));
}

function isDateHeader(line) {
    return /^.* - \d{2}\/\d{2}\/\d{4}$/.test(line.trim());
}

function parseResultGroups() {
    const lines = result.textContent ? result.textContent.split(/\n/) : [];
    const groups = [];
    let currentGroup = null;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }

        if (isDateHeader(trimmed)) {
            currentGroup = { header: trimmed, lines: [] };
            groups.push(currentGroup);
            return;
        }

        if (!currentGroup) {
            currentGroup = { header: "Sin fecha", lines: [] };
            groups.push(currentGroup);
        }

        const cleanValue = trimmed.replace(/^~|~$/g, "");
        const occurrenceIndex = currentGroup.lines.length;
        currentGroup.lines.push({
            id: buildPaidLineId(currentGroup.header, cleanValue, occurrenceIndex),
            raw: cleanValue,
            checked: trimmed.startsWith("~") && trimmed.endsWith("~"),
            value: cleanValue
        });
    });

    return groups;
}

function getPaidItems() {
    const groups = parseResultGroups();
    if (groups.length === 0) {
        return [];
    }

    return groups.flatMap((group) => group.lines.map((line) => ({
        key: `${group.header}::${line.raw}`,
        value: line.raw,
        checked: line.checked,
        groupHeader: group.header
    })));
}

function getCurrentDateLabel() {
    const groups = parseResultGroups();
    if (groups.length === 0) {
        return "Fecha: -";
    }

    return `Fecha: ${groups[groups.length - 1].header}`;
}

function getPaidKeysFromResult() {
    const lines = result.textContent ? result.textContent.split(/\n/).filter((line) => line.trim()) : [];
    const keys = new Set();

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("~") && trimmed.endsWith("~")) {
            const rawValue = trimmed.slice(1, -1);
            keys.add(rawValue);
        }
    });

    return keys;
}

function updateResultFromPaidSelection() {
    const currentLines = result.textContent ? result.textContent.split(/\n/) : [];
    const groups = parseResultGroups();
    const lineEntries = groups.flatMap((group) => group.lines);
    const checkedById = new Map(Array.from(document.querySelectorAll(".paid-line"), (input) => [input.dataset.lineId, input.checked]));
    let entryIndex = 0;

    const updated = currentLines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || isDateHeader(trimmed)) {
            return line;
        }

        const entry = lineEntries[entryIndex++];
        const clean = entry ? entry.raw : trimmed.replace(/^~|~$/g, "");
        const checked = entry ? (checkedById.get(entry.id) ?? entry.checked) : (trimmed.startsWith("~") && trimmed.endsWith("~"));
        return checked ? `~${clean}~` : clean;
    });

    result.textContent = updated.join("\n");
}

function renderPaidLines() {
    const groups = parseResultGroups();
    paidDateLabel.textContent = getCurrentDateLabel();

    if (groups.length === 0 || groups.every((group) => group.lines.length === 0)) {
        paidLinesContainer.innerHTML = '<p class="empty-state">Selecciona al menos una persona y una multa para marcar las pagadas.</p>';
        return;
    }

    paidLinesContainer.innerHTML = groups.map((group) => `
        <div class="paid-group">
            <div class="paid-group-header">${group.header}</div>
            ${group.lines.map((line) => `
                <label class="paid-line-item">
                    <input class="paid-line" type="checkbox" data-line-id="${line.id}" data-line-key="${line.id}" data-line-value="${line.raw}" ${line.checked ? "checked" : ""}>
                    <span>${line.checked ? `~${line.raw}~` : line.raw}</span>
                </label>
            `).join("")}
        </div>
    `).join("");
}

function generateResult() {
    const selectedPeople = Array.from(personOptions.querySelectorAll("input:checked"), (input) => input.value);
    const selectedFines = Array.from(fineOptions.querySelectorAll("input:checked"), (input) => fines[Number(input.value)]);
    if (!form.reportValidity() || selectedPeople.length === 0 || selectedFines.length === 0) {
        copyFeedback.textContent = "Selecciona al menos una persona y una multa.";
        return;
    }

    const paidKeys = getPaidKeys();
    const newLines = selectedPeople.flatMap((person) => selectedFines.map((fine) => {
        const rawLine = formatFine(fine, person);
        const key = `${person}-${fine.label}-${fine.amount}`;
        return paidKeys.has(key) ? `~${rawLine}~` : rawLine;
    }));

    const currentLines = result.textContent ? result.textContent.split(/\n/).filter((line) => line.trim()) : [];
    const nextDateHeader = getDateHeader();

    const existingHeaderIndex = currentLines.findIndex((line) => line.trim() === nextDateHeader);
    let combinedLines;
    if (existingHeaderIndex === -1) {
        combinedLines = currentLines.length > 0
            ? [...currentLines, "", nextDateHeader, ...newLines]
            : [nextDateHeader, ...newLines];
    } else {
        let groupEndIndex = existingHeaderIndex + 1;
        while (groupEndIndex < currentLines.length && !isDateHeader(currentLines[groupEndIndex].trim())) {
            groupEndIndex += 1;
        }

        combinedLines = [
            ...currentLines.slice(0, groupEndIndex),
            ...newLines,
            ...currentLines.slice(groupEndIndex)
        ];
    }

    generatedLines = combinedLines.filter((line) => line !== "");
    loadedPreviousLines = generatedLines.filter((line) => !line.includes(" - ") || !/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ - \d{2}\/\d{2}\/\d{4}$/.test(line));
    result.textContent = combinedLines.filter((line) => line !== "").join("\n");
    copyButton.disabled = false;
    copyFeedback.textContent = "";
}

function clearResult() {
    generatedLines = [];
    loadedPreviousLines = [];
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
form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (generateButton.disabled) {
        return;
    }

    generateButton.disabled = true;
    generateResult();
    setTimeout(() => { generateButton.disabled = false; }, 700);
});
form.addEventListener("change", renderPaidLines);
copyButton.addEventListener("click", copyResult);
clearButton.addEventListener("click", clearResult);
formViewButton.addEventListener("click", () => showView("form"));
resultViewButton.addEventListener("click", () => showView("result"));
previousFinesViewButton.addEventListener("click", () => showView("previous"));
paidFinesViewButton.addEventListener("click", () => showView("paid"));
loadPreviousButton.addEventListener("click", () => {
    if (!previousFinesInput.value.trim()) {
        copyFeedback.textContent = "Pega una cadena antes de cargarla.";
        return;
    }

    const lines = previousFinesInput.value.split(/\n/).filter((line) => line.trim() && !/^\s*$/.test(line));
    if (lines.length === 0) {
        copyFeedback.textContent = "Pega una cadena antes de cargarla.";
        return;
    }

    const [header, ...fineLines] = lines;
    loadedPreviousLines = fineLines.map((line) => line.trim());
    result.textContent = [header, ...loadedPreviousLines].filter(Boolean).join("\n");
    generatedLines = [...loadedPreviousLines];
    copyButton.disabled = false;
    copyFeedback.textContent = "";
    renderPaidLines();
    showView("paid");
});
paidLinesContainer.addEventListener("change", (event) => {
    if (!event.target.matches(".paid-line")) {
        return;
    }

    updateResultFromPaidSelection();
    renderPaidLines();
});
paidToFormButton.addEventListener("click", () => {
    updateResultFromPaidSelection();
    showView("form");
});
paidToResultButton.addEventListener("click", () => {
    updateResultFromPaidSelection();
    showView("result");
});
document.querySelector("#current-year").textContent = new Date().getFullYear();
renderPaidLines();
