// ============================================================
// BENIN LODGE - Gestion des réservations
// ============================================================

// Référentiels
const HOTELS = {
    '1': 'Golden Tulip',
    '2': 'Azalaï Plage',
    '3': 'Auberge Grand-Popo'
};

const ROOM_TYPES = {
    '1': { name: 'Chambre Standard', price: 25000 },
    '2': { name: 'Chambre Supérieure', price: 35000 },
    '3': { name: 'Suite Junior', price: 55000 },
    '4': { name: 'Suite Présidentielle', price: 85000 }
};

const PAGE_SIZE = 10;
const MOBILE_BREAKPOINT = 1024; // aligné sur style.css

const DEFAULT_RESERVATIONS = [
    { id: 'RES-001', client: 'Koffi Mensah', email: 'koffi.m@example.com', phone: '+229 12 34 56 78', hotel: 'Golden Tulip', roomType: 'Suite Junior', guests: 2, checkIn: '2023-05-12', checkOut: '2023-05-15', nights: 3, amount: 165000, status: 'confirmed' },
    { id: 'RES-002', client: 'Aïcha Bello', email: 'aicha.b@example.com', phone: '+229 98 76 54 32', hotel: 'Azalaï Plage', roomType: 'Chambre Supérieure', guests: 1, checkIn: '2023-05-18', checkOut: '2023-05-20', nights: 2, amount: 70000, status: 'pending' },
    { id: 'RES-003', client: 'Thomas Johnson', email: 'thomas.j@example.com', phone: '+229 55 66 77 88', hotel: 'Auberge Grand-Popo', roomType: 'Chambre Standard', guests: 1, checkIn: '2023-05-22', checkOut: '2023-05-25', nights: 3, amount: 75000, status: 'cancelled' },
    { id: 'RES-004', client: 'Sophie Kouagou', email: 'sophie.k@example.com', phone: '+229 11 22 33 44', hotel: 'Golden Tulip', roomType: 'Suite Présidentielle', guests: 2, checkIn: '2023-06-01', checkOut: '2023-06-05', nights: 4, amount: 340000, status: 'confirmed' },
    { id: 'RES-005', client: 'Marc Adisso', email: 'marc.a@example.com', phone: '+229 99 88 77 66', hotel: 'Azalaï Plage', roomType: 'Chambre Standard', guests: 1, checkIn: '2023-06-10', checkOut: '2023-06-12', nights: 2, amount: 50000, status: 'pending' }
];

const DEFAULT_NOTIFICATIONS = [
    { id: 1, type: 'info', title: 'Nouvelle réservation en attente', message: 'Réservation RES-005 en attente de confirmation', reservationId: 'RES-005', time: 'Il y a 5 minutes', read: false },
    { id: 2, type: 'success', title: 'Paiement reçu', message: 'Paiement confirmé pour la réservation RES-004', reservationId: 'RES-004', time: 'Il y a 1 heure', read: false },
    { id: 3, type: 'danger', title: 'Annulation', message: 'Le client a annulé la réservation RES-003', reservationId: 'RES-003', time: 'Il y a 2 heures', read: false }
];

// ============================================================
// Persistance
// ============================================================
function loadFromStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        showAlert('danger', 'Impossible de sauvegarder les données localement.');
    }
}

let reservations = loadFromStorage('reservations', DEFAULT_RESERVATIONS.map(r => ({ ...r })));
let notifications = loadFromStorage('notifications', DEFAULT_NOTIFICATIONS.map(n => ({ ...n })));

function saveReservations() { saveToStorage('reservations', reservations); }
function saveNotifications() { saveToStorage('notifications', notifications); }

// ============================================================
// État de l'interface
// ============================================================
let reservationsViewTemplate = '';
let currentPage = 1;
let editingReservationId = null;
let viewedReservationId = null;
let dashboardCharts = [];

// ============================================================
// Initialisation
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) reservationsViewTemplate = mainContent.innerHTML;

    initTheme();
    setupNavigation();
    setupModalListeners();
    setupKeyboardShortcuts();
    setupResponsive();

    bindReservationsView();
    updateNotificationBadge();
});

// ============================================================
// Utilitaires
// ============================================================
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Échappe le texte puis surligne le terme recherché
function highlight(text, term) {
    const safe = escapeHtml(text);
    if (!term || term.length < 2) return safe;
    const regex = new RegExp(`(${escapeRegExp(escapeHtml(term))})`, 'gi');
    return safe.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function formatAmount(amount) {
    return (Number(amount) || 0).toLocaleString('fr-FR') + ' F';
}

// Parse 'AAAA-MM-JJ' en date locale (évite le décalage UTC)
function parseDate(dateString) {
    const [y, m, d] = String(dateString).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function formatDate(dateString) {
    if (!dateString) return '';
    return parseDate(dateString).toLocaleDateString('fr-FR');
}

function nightsBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const diff = parseDate(checkOut) - parseDate(checkIn);
    return Math.max(0, Math.round(diff / 86400000));
}

function getStatusText(status) {
    const statusMap = { confirmed: 'Confirmée', pending: 'En attente', cancelled: 'Annulée' };
    return statusMap[status] || status;
}

function statusBadge(status) {
    return `<span class="status-badge ${escapeHtml(status)}">${escapeHtml(getStatusText(status))}</span>`;
}

function generateReservationId() {
    const max = reservations.reduce((acc, r) => {
        const n = parseInt(String(r.id).replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return 'RES-' + String(max + 1).padStart(3, '0');
}

function findKeyByValue(obj, predicate) {
    return Object.keys(obj).find(k => predicate(obj[k])) || '';
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCsv(rows) {
    const escapeCell = cell => {
        const s = String(cell ?? '');
        return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // BOM UTF-8 pour qu'Excel affiche correctement les accents
    return '﻿' + rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '11000';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// ============================================================
// Navigation
// ============================================================
function setupNavigation() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.dataset.page;
            const actions = {
                reservations: showReservations,
                dashboard: showDashboard,
                clients: showClients,
                notifications: showNotifications,
                settings: showSettings
            };
            if (actions[page]) actions[page]();
            if (window.innerWidth <= MOBILE_BREAKPOINT) closeMobileMenu();
        });
    });
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

function setMainContent(html) {
    destroyCharts();
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return null;
    mainContent.innerHTML = html;
    addMobileMenuButton();
    return mainContent;
}

// ============================================================
// Vue Réservations
// ============================================================
function showReservations() {
    if (!setMainContent(reservationsViewTemplate)) return;
    setActiveNav('reservations');
    currentPage = 1;
    bindReservationsView();
}

function bindReservationsView() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', debounce(() => { currentPage = 1; renderReservationsTable(); }, 200));

    ['statusFilter', 'hotelFilter', 'startDateFilter', 'endDateFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => { currentPage = 1; renderReservationsTable(); });
    });

    addMobileMenuButton();
    updateStatistics();
    renderReservationsTable();
}

function getFilteredReservations() {
    const value = id => (document.getElementById(id) || {}).value || '';
    const term = value('searchInput').trim().toLowerCase();
    const status = value('statusFilter');
    const hotel = HOTELS[value('hotelFilter')] || '';
    const start = value('startDateFilter');
    const end = value('endDateFilter');

    return reservations.filter(r => {
        if (term && ![r.client, r.email, r.phone, r.id, r.hotel, r.roomType]
            .some(field => String(field || '').toLowerCase().includes(term))) return false;
        if (status && r.status !== status) return false;
        if (hotel && r.hotel !== hotel) return false;
        if (start && r.checkIn < start) return false;
        if (end && r.checkOut > end) return false;
        return true;
    });
}

function applyFilters() {
    currentPage = 1;
    renderReservationsTable();
}

// Conservé pour compatibilité avec l'ancien balisage
function performSearch() {
    applyFilters();
}

function renderReservationsTable() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;

    const filtered = getFilteredReservations();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const term = ((document.getElementById('searchInput') || {}).value || '').trim();

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">Aucune réservation trouvée</td></tr>`;
    } else {
        tbody.innerHTML = pageItems.map(r => {
            const id = escapeHtml(r.id);
            return `
            <tr class="fade-in" tabindex="0" data-id="${id}">
                <td>${highlight(r.id, term)}</td>
                <td>${highlight(r.client, term)}</td>
                <td>${highlight(r.email, term)}<br>${highlight(r.phone, term)}</td>
                <td><span class="hotel-badge">${highlight(r.hotel, term)}</span></td>
                <td>${highlight(r.roomType, term)}</td>
                <td>${formatDate(r.checkIn)} - ${formatDate(r.checkOut)}</td>
                <td>${Number(r.nights) || 0}</td>
                <td>${formatAmount(r.amount)}</td>
                <td>${statusBadge(r.status)}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-secondary" data-action="view" data-id="${id}" aria-label="Voir la réservation">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${r.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" data-action="confirm" data-id="${id}" aria-label="Confirmer la réservation">
                        <i class="bi bi-check-circle"></i>
                    </button>` : ''}
                    ${r.status !== 'cancelled' ? `
                    <button class="btn btn-sm btn-danger" data-action="cancel" data-id="${id}" aria-label="Annuler la réservation">
                        <i class="bi bi-x-circle"></i>
                    </button>` : ''}
                </td>
            </tr>`;
        }).join('');
    }

    // Délégation d'événements (pas d'ID injecté dans des attributs onclick)
    tbody.onclick = function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'view') viewReservation(id);
        if (action === 'confirm') confirmReservation(id);
        if (action === 'cancel') cancelReservation(id);
    };
    tbody.onkeydown = function (e) {
        const row = e.target.closest('tr[data-id]');
        if (!row || e.target !== row) return;
        if (e.key === 'Enter') viewReservation(row.dataset.id);
        if (e.key === 'ArrowDown' && row.nextElementSibling) { e.preventDefault(); row.nextElementSibling.focus(); }
        if (e.key === 'ArrowUp' && row.previousElementSibling) { e.preventDefault(); row.previousElementSibling.focus(); }
    };

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Précédent</a></li>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Suivant</a></li>`;
    pagination.innerHTML = html;

    pagination.onclick = function (e) {
        const link = e.target.closest('a[data-page]');
        if (!link) return;
        e.preventDefault();
        const page = parseInt(link.dataset.page, 10);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            renderReservationsTable();
        }
    };
}

function updateStatistics() {
    const confirmedList = reservations.filter(r => r.status === 'confirmed');
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    set('totalReservations', reservations.length);
    set('confirmedReservations', confirmedList.length);
    set('pendingReservations', reservations.filter(r => r.status === 'pending').length);
    set('totalRevenue', formatAmount(confirmedList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)));
}

function refreshReservationsView() {
    renderReservationsTable();
    updateStatistics();
}

// ============================================================
// Formulaire de réservation (création / modification)
// ============================================================
function setupModalListeners() {
    ['checkIn', 'checkOut', 'roomType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calculateNights);
    });

    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    if (checkIn && checkOut) {
        checkIn.addEventListener('change', () => {
            checkOut.min = checkIn.value;
        });
    }

    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            saveReservation();
        });
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) validateField(input);
            });
        });
    }

    const addModal = document.getElementById('addReservationModal');
    if (addModal) addModal.addEventListener('hidden.bs.modal', resetReservationForm);

    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList) {
        notificationsList.addEventListener('click', e => {
            const btn = e.target.closest('button[data-reservation]');
            if (!btn) return;
            const modal = bootstrap.Modal.getInstance(document.getElementById('notificationsModal'));
            if (modal) modal.hide();
            viewReservation(btn.dataset.reservation);
        });
    }
}

function calculateNights() {
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const roomType = document.getElementById('roomType');
    const nightsCount = document.getElementById('nightsCount');
    const pricePerNight = document.getElementById('pricePerNight');
    const totalAmount = document.getElementById('totalAmount');
    if (!checkIn || !checkOut || !roomType || !nightsCount || !pricePerNight || !totalAmount) return;

    const nights = nightsBetween(checkIn.value, checkOut.value);
    const room = ROOM_TYPES[roomType.value];
    const price = room ? room.price : 0;

    nightsCount.textContent = nights;
    pricePerNight.textContent = price.toLocaleString('fr-FR');
    totalAmount.textContent = (price * nights).toLocaleString('fr-FR');
}

function validateField(field) {
    const value = field.value.trim();
    let error = '';

    if (field.hasAttribute('required') && !value) {
        error = 'Ce champ est requis';
    } else if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Veuillez entrer une adresse email valide';
    } else if (value && field.type === 'tel' && !/^[\d\s\-+()]{6,}$/.test(value)) {
        error = 'Veuillez entrer un numéro de téléphone valide';
    } else if (field.id === 'checkOut' && value) {
        const checkIn = document.getElementById('checkIn');
        if (checkIn && checkIn.value && value <= checkIn.value) {
            error = 'La date de départ doit être postérieure à la date d\'arrivée';
        }
    }

    field.setCustomValidity(error);
    field.classList.toggle('is-invalid', !!error);
    field.classList.toggle('is-valid', !error);

    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (error) {
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.appendChild(feedback);
        }
        feedback.textContent = error;
    } else if (feedback) {
        feedback.remove();
    }
    return !error;
}

function resetReservationForm() {
    const form = document.getElementById('reservationForm');
    if (form) {
        form.reset();
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
            el.setCustomValidity('');
        });
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    }
    const checkOut = document.getElementById('checkOut');
    if (checkOut) checkOut.min = '';
    editingReservationId = null;
    const title = document.getElementById('reservationModalTitle');
    if (title) title.textContent = 'Nouvelle Réservation';
    calculateNights();
}

function showAddReservationModal() {
    resetReservationForm();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addReservationModal')).show();
}

function saveReservation() {
    const form = document.getElementById('reservationForm');
    if (!form) return;

    const fields = Array.from(form.querySelectorAll('input, select'));
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid || !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const get = id => document.getElementById(id).value.trim();
    const room = ROOM_TYPES[get('roomType')];
    const nights = nightsBetween(get('checkIn'), get('checkOut'));

    const data = {
        client: get('clientName'),
        email: get('clientEmail'),
        phone: get('clientPhone'),
        hotel: HOTELS[get('hotel')],
        roomType: room.name,
        guests: parseInt(get('guests'), 10) || 1,
        checkIn: get('checkIn'),
        checkOut: get('checkOut'),
        nights: nights,
        amount: room.price * nights
    };

    if (editingReservationId) {
        const existing = reservations.find(r => r.id === editingReservationId);
        if (existing) Object.assign(existing, data);
        saveReservations();
        addNotification('info', 'Réservation modifiée', `La réservation ${editingReservationId} a été modifiée`, editingReservationId);
        showAlert('success', 'Réservation modifiée avec succès !');
    } else {
        const newReservation = { id: generateReservationId(), ...data, status: 'pending' };
        reservations.push(newReservation);
        saveReservations();
        addNotification('info', 'Nouvelle réservation', `Réservation ${newReservation.id} créée avec succès`, newReservation.id);
        showAlert('success', 'Réservation créée avec succès !');
    }

    refreshReservationsView();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addReservationModal'));
    if (modal) modal.hide();
}

function editReservation(id = viewedReservationId) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewReservationModal'));
    if (viewModal) viewModal.hide();

    resetReservationForm();
    editingReservationId = reservation.id;

    const set = (fieldId, value) => {
        const el = document.getElementById(fieldId);
        if (el) el.value = value;
    };
    set('clientName', reservation.client);
    set('clientEmail', reservation.email);
    set('clientPhone', reservation.phone);
    set('hotel', findKeyByValue(HOTELS, name => name === reservation.hotel));
    set('roomType', findKeyByValue(ROOM_TYPES, room => room.name === reservation.roomType));
    set('guests', reservation.guests || 1);
    set('checkIn', reservation.checkIn);
    set('checkOut', reservation.checkOut);
    document.getElementById('checkOut').min = reservation.checkIn;
    calculateNights();

    const title = document.getElementById('reservationModalTitle');
    if (title) title.textContent = `Modifier la réservation ${reservation.id}`;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('addReservationModal')).show();
}

function viewReservation(id) {
    const r = reservations.find(res => res.id === id);
    const details = document.getElementById('reservationDetails');
    if (!r || !details) {
        if (!r) showAlert('warning', `La réservation ${id} est introuvable.`);
        return;
    }
    viewedReservationId = r.id;

    details.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Informations client</h6>
                <p><strong>Nom :</strong> ${escapeHtml(r.client)}</p>
                <p><strong>Email :</strong> ${escapeHtml(r.email)}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(r.phone)}</p>
                <p><strong>Personnes :</strong> ${Number(r.guests) || 1}</p>
            </div>
            <div class="col-md-6">
                <h6>Détails de la réservation</h6>
                <p><strong>ID :</strong> ${escapeHtml(r.id)}</p>
                <p><strong>Hôtel :</strong> ${escapeHtml(r.hotel)}</p>
                <p><strong>Chambre :</strong> ${escapeHtml(r.roomType)}</p>
                <p><strong>Dates :</strong> ${formatDate(r.checkIn)} - ${formatDate(r.checkOut)}</p>
                <p><strong>Nuits :</strong> ${Number(r.nights) || 0}</p>
                <p><strong>Montant :</strong> ${formatAmount(r.amount)}</p>
                <p><strong>Statut :</strong> ${statusBadge(r.status)}</p>
            </div>
        </div>
    `;

    const editBtn = document.getElementById('editReservationBtn');
    if (editBtn) editBtn.disabled = r.status === 'cancelled';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewReservationModal')).show();
}

function confirmReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    reservation.status = 'confirmed';
    saveReservations();
    addNotification('success', 'Réservation confirmée', `La réservation ${id} a été confirmée`, id);
    refreshReservationsView();
    showAlert('success', 'Réservation confirmée avec succès !');
}

function cancelReservation(id) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    reservation.status = 'cancelled';
    saveReservations();
    addNotification('danger', 'Réservation annulée', `La réservation ${id} a été annulée`, id);
    refreshReservationsView();
    showAlert('warning', 'Réservation annulée');
}

// ============================================================
// Exports
// ============================================================
function exportData() {
    const rows = [
        ['ID', 'Client', 'Email', 'Téléphone', 'Hôtel', 'Type de chambre', 'Personnes', 'Date d\'arrivée', 'Date de départ', 'Nuits', 'Montant', 'Statut'],
        ...reservations.map(r => [r.id, r.client, r.email, r.phone, r.hotel, r.roomType, r.guests || 1, r.checkIn, r.checkOut, r.nights, r.amount, getStatusText(r.status)])
    ];
    downloadFile(toCsv(rows), `reservations_${today()}.csv`, 'text/csv;charset=utf-8');
    showAlert('success', 'Données exportées avec succès !');
}

function getClientsData() {
    const clients = {};
    reservations.forEach(r => {
        const key = String(r.email || '').toLowerCase();
        if (!clients[key]) {
            clients[key] = { name: r.client, email: r.email, phone: r.phone, bookings: 0, spent: 0 };
        }
        clients[key].bookings++;
        if (r.status === 'confirmed') clients[key].spent += Number(r.amount) || 0;
    });
    return Object.values(clients);
}

function exportClients() {
    const rows = [
        ['Nom', 'Email', 'Téléphone', 'Total réservations', 'Total dépensé'],
        ...getClientsData().map(c => [c.name, c.email, c.phone, c.bookings, c.spent])
    ];
    downloadFile(toCsv(rows), `clients_${today()}.csv`, 'text/csv;charset=utf-8');
    showAlert('success', 'Clients exportés avec succès !');
}

// ============================================================
// Tableau de bord
// ============================================================
function showDashboard() {
    if (!setMainContent(`
        <header class="page-header">
            <div class="d-flex justify-content-between align-items-center w-100">
                <h1 class="page-title">Tableau de bord</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="showDashboard()">
                        <i class="bi bi-arrow-clockwise"></i> Actualiser
                    </button>
                </div>
            </div>
        </header>

        <div class="row mb-4">
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header"><h5>Statistiques des réservations</h5></div>
                    <div class="card-body"><div class="chart-container"><canvas id="reservationsChart"></canvas></div></div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header"><h5>Répartition par hôtel</h5></div>
                    <div class="card-body"><div class="chart-container"><canvas id="hotelsChart"></canvas></div></div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header"><h5>Revenus mensuels (réservations confirmées)</h5></div>
                    <div class="card-body"><div class="chart-container"><canvas id="revenueChart"></canvas></div></div>
                </div>
            </div>
        </div>
    `)) return;
    setActiveNav('dashboard');
    createDashboardCharts();
}

function destroyCharts() {
    dashboardCharts.forEach(chart => chart.destroy());
    dashboardCharts = [];
}

function createDashboardCharts() {
    if (typeof Chart === 'undefined') {
        showAlert('warning', 'Chart.js n\'a pas pu être chargé (connexion internet requise).');
        return;
    }
    destroyCharts();

    const statusCounts = ['confirmed', 'pending', 'cancelled'].map(s => reservations.filter(r => r.status === s).length);
    dashboardCharts.push(new Chart(document.getElementById('reservationsChart'), {
        type: 'doughnut',
        data: {
            labels: ['Confirmées', 'En attente', 'Annulées'],
            datasets: [{ data: statusCounts, backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));

    const hotelData = {};
    reservations.forEach(r => { hotelData[r.hotel] = (hotelData[r.hotel] || 0) + 1; });
    dashboardCharts.push(new Chart(document.getElementById('hotelsChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(hotelData),
            datasets: [{ label: 'Nombre de réservations', data: Object.values(hotelData), backgroundColor: '#007bff' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    }));

    const revenueData = {};
    reservations.filter(r => r.status === 'confirmed').forEach(r => {
        const month = String(r.checkIn).substring(0, 7);
        revenueData[month] = (revenueData[month] || 0) + (Number(r.amount) || 0);
    });
    // Les mois et les valeurs doivent être triés ensemble
    const months = Object.keys(revenueData).sort();
    dashboardCharts.push(new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: months.map(m => {
                const [y, mo] = m.split('-').map(Number);
                return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Revenus (FCFA)',
                data: months.map(m => revenueData[m]),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    }));
}

// ============================================================
// Clients
// ============================================================
function showClients() {
    if (!setMainContent(`
        <header class="page-header">
            <div class="d-flex justify-content-between align-items-center w-100">
                <h1 class="page-title">Gestion des Clients</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="exportClients()">
                        <i class="bi bi-download"></i> Exporter les clients
                    </button>
                </div>
            </div>
        </header>

        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Total réservations</th>
                        <th>Total dépensé</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="clientsTableBody">${renderClientsTable()}</tbody>
            </table>
        </div>
    `)) return;
    setActiveNav('clients');

    document.getElementById('clientsTableBody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-email]');
        if (btn) viewClientDetails(btn.dataset.email);
    });
}

function renderClientsTable() {
    const clients = getClientsData();
    if (clients.length === 0) {
        return `<tr><td colspan="6" class="text-center text-muted py-4">Aucun client</td></tr>`;
    }
    return clients.map(c => `
        <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.phone)}</td>
            <td>${c.bookings}</td>
            <td>${formatAmount(c.spent)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" data-email="${escapeHtml(c.email)}" aria-label="Voir le client">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewClientDetails(email) {
    const key = String(email).toLowerCase();
    const list = reservations.filter(r => String(r.email).toLowerCase() === key);
    if (list.length === 0) return;
    const c = list[0];
    const details = document.getElementById('reservationDetails');
    if (!details) return;

    viewedReservationId = null;
    details.innerHTML = `
        <h6>${escapeHtml(c.client)}</h6>
        <p class="mb-1"><strong>Email :</strong> ${escapeHtml(c.email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(c.phone)}</p>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead><tr><th>ID</th><th>Hôtel</th><th>Dates</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>
                    ${list.map(r => `
                        <tr>
                            <td>${escapeHtml(r.id)}</td>
                            <td>${escapeHtml(r.hotel)}</td>
                            <td>${formatDate(r.checkIn)} - ${formatDate(r.checkOut)}</td>
                            <td>${formatAmount(r.amount)}</td>
                            <td>${statusBadge(r.status)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
    const editBtn = document.getElementById('editReservationBtn');
    if (editBtn) editBtn.disabled = true;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewReservationModal')).show();
}

// ============================================================
// Notifications
// ============================================================
function formatNotificationTime(n) {
    if (!n.createdAt) return n.time || '';
    const diffMin = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 60000);
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH} heure${diffH > 1 ? 's' : ''}`;
    return new Date(n.createdAt).toLocaleDateString('fr-FR');
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = '<p class="text-center text-muted my-3">Aucune notification</p>';
        return;
    }

    const btnClass = { info: 'btn-primary', success: 'btn-success', danger: 'btn-danger', warning: 'btn-warning' };
    list.innerHTML = notifications.map(n => `
        <div class="list-group-item ${n.read ? '' : 'fw-semibold'}">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${escapeHtml(n.title)}</h6>
                <small>${escapeHtml(formatNotificationTime(n))}</small>
            </div>
            <p class="mb-1">${escapeHtml(n.message)}</p>
            ${n.reservationId ? `<button class="btn btn-sm ${btnClass[n.type] || 'btn-primary'}" data-reservation="${escapeHtml(n.reservationId)}">Voir</button>` : ''}
        </div>
    `).join('');
}

function showNotifications() {
    renderNotifications();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('notificationsModal')).show();

    // L'ouverture de la liste marque les notifications comme lues
    notifications.forEach(n => { n.read = true; });
    saveNotifications();
    updateNotificationBadge();
}

function addNotification(type, title, message, reservationId = null) {
    const maxId = notifications.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
    notifications.unshift({
        id: maxId + 1,
        type,
        title,
        message,
        reservationId,
        createdAt: new Date().toISOString(),
        read: false
    });
    notifications = notifications.slice(0, 50);
    saveNotifications();
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// ============================================================
// Paramètres
// ============================================================
function loadSettings() {
    const defaults = { name: 'BENIN LODGE', email: 'contact@beninlodge.bj', phone: '+229 12 34 56 78' };
    try {
        return { ...defaults, ...(JSON.parse(localStorage.getItem('settings')) || {}) };
    } catch (e) {
        return defaults;
    }
}

function showSettings() {
    const s = loadSettings();
    if (!setMainContent(`
        <header class="page-header">
            <div class="d-flex justify-content-between align-items-center w-100">
                <h1 class="page-title">Paramètres</h1>
                <div class="header-actions"></div>
            </div>
        </header>

        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header"><h5>Configuration générale</h5></div>
                    <div class="card-body">
                        <form id="settingsForm">
                            <div class="mb-3">
                                <label for="settingName" class="form-label">Nom de l'hôtel</label>
                                <input type="text" class="form-control" id="settingName" value="${escapeHtml(s.name)}" required>
                            </div>
                            <div class="mb-3">
                                <label for="settingEmail" class="form-label">Email de contact</label>
                                <input type="email" class="form-control" id="settingEmail" value="${escapeHtml(s.email)}">
                            </div>
                            <div class="mb-3">
                                <label for="settingPhone" class="form-label">Téléphone</label>
                                <input type="tel" class="form-control" id="settingPhone" value="${escapeHtml(s.phone)}">
                            </div>
                            <button type="submit" class="btn btn-primary">Enregistrer les paramètres</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header"><h5>Gestion des données</h5></div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="exportAllData()">
                                <i class="bi bi-download"></i> Exporter toutes les données
                            </button>
                            <button class="btn btn-outline-warning" onclick="importData()">
                                <i class="bi bi-upload"></i> Importer des données
                            </button>
                            <button class="btn btn-outline-danger" onclick="clearAllData()">
                                <i class="bi bi-trash"></i> Effacer toutes les données
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `)) return;
    setActiveNav('settings');

    document.getElementById('settingsForm').addEventListener('submit', e => {
        e.preventDefault();
        saveSettings();
    });
}

function saveSettings() {
    const form = document.getElementById('settingsForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const settings = {
        name: document.getElementById('settingName').value.trim(),
        email: document.getElementById('settingEmail').value.trim(),
        phone: document.getElementById('settingPhone').value.trim()
    };
    try {
        localStorage.setItem('settings', JSON.stringify(settings));
        showAlert('success', 'Paramètres enregistrés avec succès !');
    } catch (e) {
        showAlert('danger', 'Impossible d\'enregistrer les paramètres.');
    }
}

function exportAllData() {
    const allData = {
        reservations,
        notifications,
        settings: loadSettings(),
        exportDate: new Date().toISOString()
    };
    downloadFile(JSON.stringify(allData, null, 2), `benin_lodge_backup_${today()}.json`, 'application/json');
    showAlert('success', 'Données exportées avec succès !');
}

function isValidReservation(r) {
    return r && typeof r === 'object' && typeof r.id === 'string' && typeof r.client === 'string'
        && typeof r.checkIn === 'string' && typeof r.checkOut === 'string'
        && ['confirmed', 'pending', 'cancelled'].includes(r.status);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data.reservations) || !data.reservations.every(isValidReservation)) {
                    throw new Error('Format invalide');
                }
                reservations = data.reservations.map(r => ({ ...r, amount: Number(r.amount) || 0, nights: Number(r.nights) || 0 }));
                saveReservations();
                if (Array.isArray(data.notifications)) {
                    notifications = data.notifications;
                    saveNotifications();
                }
                if (data.settings && typeof data.settings === 'object') {
                    localStorage.setItem('settings', JSON.stringify(data.settings));
                }
                updateNotificationBadge();
                showAlert('success', `${reservations.length} réservation(s) importée(s) avec succès !`);
                showSettings();
            } catch (error) {
                showAlert('danger', 'Erreur lors de l\'importation : fichier invalide.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) return;
    ['reservations', 'notifications', 'settings'].forEach(key => localStorage.removeItem(key));
    reservations = [];
    notifications = [];
    updateNotificationBadge();
    showAlert('warning', 'Toutes les données ont été effacées.');
    showReservations();
}

// ============================================================
// Thème
// ============================================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'bi bi-moon' : 'bi bi-sun';
    if (themeText) themeText.textContent = theme === 'dark' ? 'Sombre' : 'Clair';
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* ignoré */ }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
}

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignoré */ }
}

// ============================================================
// Raccourcis clavier
// ============================================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Ctrl+K : focus sur la recherche
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
        }
        if (e.key === 'Escape') closeMobileMenu();
    });
}

// ============================================================
// Responsive / menu mobile
// ============================================================
function addMobileMenuButton() {
    const headerActions = document.querySelector('.page-header .header-actions');
    if (!headerActions || headerActions.querySelector('.mobile-menu-toggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mobile-menu-toggle btn btn-primary';
    btn.innerHTML = '<i class="bi bi-list"></i>';
    btn.setAttribute('aria-label', 'Menu');
    btn.addEventListener('click', toggleMobileMenu);
    headerActions.insertBefore(btn, headerActions.firstChild);
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (sidebar.classList.contains('open')) {
        closeMobileMenu();
    } else {
        sidebar.classList.add('open');
        createOverlay();
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    removeOverlay();
}

function createOverlay() {
    if (document.querySelector('.mobile-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.addEventListener('click', closeMobileMenu);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
}

function removeOverlay() {
    const overlay = document.querySelector('.mobile-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
}

function setupResponsive() {
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > MOBILE_BREAKPOINT) closeMobileMenu();
    }, 200));
}

// ============================================================
// Performance
// ============================================================
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
