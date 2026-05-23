/* ========================================
   APPOINTMENT PAGE JAVASCRIPT - Juicy Face
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initializeDateGrid();
    initializeTimeSelection();
    initializeServiceSelection();
    initializeLiveSummary();
    initializeFormValidation();
    initializeWizard();
});

// =========== GLOBAL STATE ===========
let currentStep = 1;
const totalSteps = 4;
let selectedDate = null;
let selectedTime = null;
let selectedServices = [];

// =========== DATE GRID ===========
function initializeDateGrid() {
    const dateGrid = document.getElementById('date-grid');
    if (!dateGrid) return;

    const today = new Date();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isToday = i === 0;

        const slot = document.createElement('div');
        slot.className = 'date-slot' + (isWeekend ? ' disabled' : '') + (isToday ? ' today' : '');
        slot.dataset.date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        slot.dataset.full = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        slot.innerHTML = `
            <span class="day-name">${dayNames[d.getDay()]}</span>
            <span class="day-num">${d.getDate()}</span>
        `;

        if (!isWeekend) {
            slot.addEventListener('click', () => selectDate(slot));
        }

        dateGrid.appendChild(slot);
    }
}

function selectDate(slot) {
    document.querySelectorAll('.date-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    selectedDate = slot.dataset.full;
    updateSummary();

    const errorEl = document.getElementById('err-date');
    if (errorEl) errorEl.classList.remove('show');
}

// =========== TIME SELECTION ===========
function initializeTimeSelection() {
    document.querySelectorAll('.time-slot:not(.busy)').forEach(slot => {
        slot.addEventListener('click', () => selectTime(slot));
    });
}

function selectTime(slot) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    selectedTime = slot.dataset.time;
    updateSummary();

    const errorEl = document.getElementById('err-time');
    if (errorEl) errorEl.classList.remove('show');
}

// =========== SERVICE SELECTION ===========
function initializeServiceSelection() {
    document.querySelectorAll('.svc-pill').forEach(pill => {
        pill.addEventListener('click', () => toggleService(pill));
    });
}

function toggleService(pill) {
    pill.classList.toggle('selected');
    const svc = pill.dataset.svc;

    if (pill.classList.contains('selected')) {
        if (!selectedServices.includes(svc)) selectedServices.push(svc);
    } else {
        selectedServices = selectedServices.filter(s => s !== svc);
    }

    updateSummary();

    const errorEl = document.getElementById('err-service');
    if (errorEl && selectedServices.length > 0) {
        errorEl.classList.remove('show');
    }
}

// =========== LIVE SUMMARY ===========
function initializeLiveSummary() {
    const nameInput = document.getElementById('full-name');
    const patientType = document.getElementById('patient-type');

    if (nameInput) {
        nameInput.addEventListener('input', updateSummary);
    }

    if (patientType) {
        patientType.addEventListener('change', updateSummary);
    }
}

function updateSummary() {
    const nameInput = document.getElementById('full-name');
    const patientType = document.getElementById('patient-type');

    // Update name
    const sumName = document.getElementById('sum-name');
    if (sumName && nameInput) {
        const name = nameInput.value.trim();
        if (name) {
            sumName.textContent = name;
            sumName.classList.remove('empty');
        } else {
            sumName.textContent = 'Not entered';
            sumName.classList.add('empty');
        }
    }

    // Update service
    const sumService = document.getElementById('sum-service');
    if (sumService) {
        if (selectedServices.length) {
            sumService.textContent = selectedServices.join(', ');
            sumService.classList.remove('empty');
        } else {
            sumService.textContent = 'Not selected';
            sumService.classList.add('empty');
        }
    }

    // Update date
    const sumDate = document.getElementById('sum-date');
    if (sumDate) {
        if (selectedDate) {
            sumDate.textContent = selectedDate;
            sumDate.classList.remove('empty');
        } else {
            sumDate.textContent = 'Not selected';
            sumDate.classList.add('empty');
        }
    }

    // Update time
    const sumTime = document.getElementById('sum-time');
    if (sumTime) {
        if (selectedTime) {
            sumTime.textContent = selectedTime;
            sumTime.classList.remove('empty');
        } else {
            sumTime.textContent = 'Not selected';
            sumTime.classList.add('empty');
        }
    }

    // Update patient type
    const sumType = document.getElementById('sum-type');
    if (sumType && patientType) {
        const pt = patientType.value;
        if (pt) {
            sumType.textContent = pt === 'new' ? 'New Patient' : 'Existing Patient';
            sumType.classList.remove('empty');
        } else {
            sumType.textContent = 'Not selected';
            sumType.classList.add('empty');
        }
    }
}

// =========== WIZARD LOGIC ===========
function initializeWizard() {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const form = document.getElementById('booking-form');

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateWizard();
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            currentStep--;
            updateWizard();
        });
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Clear errors on input
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
        el.addEventListener('input', () => {
            el.classList.remove('error');
            const errEl = document.getElementById('err-' + el.id.split('-')[0]);
            if (errEl) errEl.classList.remove('show');
        });

        el.addEventListener('change', () => {
            el.classList.remove('error');
            const errEl = document.getElementById('err-' + el.id.split('-')[0]);
            if (errEl) errEl.classList.remove('show');
        });
    });

    // Initial wizard state
    updateWizard();
}

function updateWizard() {
    // Hide/Show Steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active');
        }
    });

    // Update Buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    const navContainer = document.querySelector('.wizard-nav');

    if (btnPrev) btnPrev.style.display = currentStep === 1 ? 'none' : 'block';
    if (navContainer) navContainer.style.justifyContent = currentStep === 1 ? 'flex-end' : 'space-between';

    if (currentStep === totalSteps) {
        if (btnNext) btnNext.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'block';
    } else {
        if (btnNext) btnNext.style.display = 'block';
        if (btnSubmit) btnSubmit.style.display = 'none';
    }

    // Update Progress Bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const fillPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressFill.style.width = `${fillPercentage}%`;
    }

    // Update Dots
    document.querySelectorAll('.step-dot').forEach(dot => {
        const dotStep = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (dotStep === currentStep) {
            dot.classList.add('active');
        } else if (dotStep < currentStep) {
            dot.classList.add('completed');
        }
    });

    // Scroll to top of form
    const formSection = document.querySelector('.booking-form-section');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function validateStep(step) {
    let valid = true;

    if (step === 1) {
        const required = [
            { id: 'full-name', err: 'err-name' },
            { id: 'email', err: 'err-email', type: 'email' },
            { id: 'phone', err: 'err-phone' },
            { id: 'dob', err: 'err-dob' },
            { id: 'patient-type', err: 'err-patient' }
        ];

        required.forEach(({ id, err, type }) => {
            const el = document.getElementById(id);
            const errEl = document.getElementById(err);
            if (!el || !errEl) return;

            let isValid = el.value.trim() !== '';

            // Email validation
            if (type === 'email' && isValid) {
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
            }

            if (!isValid) {
                el.classList.add('error');
                errEl.classList.add('show');
                valid = false;
            } else {
                el.classList.remove('error');
                errEl.classList.remove('show');
            }
        });
    }

    if (step === 3) {
        if (selectedServices.length === 0) {
            const errEl = document.getElementById('err-service');
            if (errEl) errEl.classList.add('show');
            valid = false;
        }
    }

    return valid;
}

// =========== FORM SUBMISSION ===========
function handleSubmit(e) {
    e.preventDefault();
    let valid = true;

    // Validate Final Step (Date, Time, Consent)
    if (!selectedDate) {
        const errEl = document.getElementById('err-date');
        if (errEl) errEl.classList.add('show');
        valid = false;
    }
    if (!selectedTime) {
        const errEl = document.getElementById('err-time');
        if (errEl) errEl.classList.add('show');
        valid = false;
    }
    const consent = document.getElementById('consent');
    if (consent && !consent.checked) {
        consent.style.outline = '2px solid var(--error-color)';
        valid = false;
    } else if (consent) {
        consent.style.outline = '';
    }

    if (!valid) return;

    // Simulate submission
    const btn = document.getElementById('btn-submit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
            </svg>
            Submitting...
        `;
    }

    setTimeout(() => {
        const overlay = document.getElementById('success-overlay');
        if (overlay) overlay.classList.add('show');
    }, 1500);
}

// =========== FORM VALIDATION (Clear errors) ===========
function initializeFormValidation() {
    // Clear errors on input - already handled in initializeWizard
}

// Add spin animation for loader
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('Juicy Face Appointment Page - Scripts Loaded Successfully!');