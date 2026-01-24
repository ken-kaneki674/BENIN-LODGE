// Base de données localStorage
let reservations = JSON.parse(localStorage.getItem('reservations')) || [
    { id: 'RES-001', client: 'Koffi Mensah', email: 'koffi.m@example.com', phone: '+229 12 34 56 78', hotel: 'Golden Tulip', roomType: 'Suite Junior', checkIn: '2023-05-12', checkOut: '2023-05-15', nights: 3, amount: 165000, status: 'confirmed' },
    { id: 'RES-002', client: 'Aïcha Bello', email: 'aicha.b@example.com', phone: '+229 98 76 54 32', hotel: 'Azalaï Plage', roomType: 'Chambre Supérieure', checkIn: '2023-05-18', checkOut: '2023-05-20', nights: 2, amount: 70000, status: 'pending' },
    { id: 'RES-003', client: 'Thomas Johnson', email: 'thomas.j@example.com', phone: '+229 55 66 77 88', hotel: 'Auberge Grand-Popo', roomType: 'Chambre Standard', checkIn: '2023-05-22', checkOut: '2023-05-25', nights: 3, amount: 75000, status: 'cancelled' },
    { id: 'RES-004', client: 'Sophie Kouagou', email: 'sophie.k@example.com', phone: '+229 11 22 33 44', hotel: 'Golden Tulip', roomType: 'Suite Présidentielle', checkIn: '2023-06-01', checkOut: '2023-06-05', nights: 4, amount: 340000, status: 'confirmed' },
    { id: 'RES-005', client: 'Marc Adisso', email: 'marc.a@example.com', phone: '+229 99 88 77 66', hotel: 'Azalaï Plage', roomType: 'Chambre Standard', checkIn: '2023-06-10', checkOut: '2023-06-12', nights: 2, amount: 50000, status: 'pending' }
];

let notifications = JSON.parse(localStorage.getItem('notifications')) || [
    { id: 1, type: 'info', title: 'Nouvelle réservation en attente', message: 'Réservation RES-006 en attente de confirmation', time: 'Il y a 5 minutes', read: false },
    { id: 2, type: 'success', title: 'Paiement reçu', message: 'Paiement confirmé pour la réservation RES-004', time: 'Il y a 1 heure', read: false },
    { id: 3, type: 'danger', title: 'Annulation', message: 'Le client a annulé la réservation RES-003', time: 'Il y a 2 heures', read: false }
];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    updateStatistics();
    renderReservationsTable();
    updateNotificationBadge();
    setupCalculationListeners();
}

function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    
    // Filtres
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const hotelFilter = document.getElementById('hotelFilter');
    if (hotelFilter) {
        hotelFilter.addEventListener('change', applyFilters);
    }
    
    const startDateFilter = document.getElementById('startDateFilter');
    if (startDateFilter) {
        startDateFilter.addEventListener('change', applyFilters);
    }
    
    const endDateFilter = document.getElementById('endDateFilter');
    if (endDateFilter) {
        endDateFilter.addEventListener('change', applyFilters);
    }
    
    // Exportation
    // Exportation (prefer explicit id then fallback)
    const exportBtn = document.getElementById('exportBtn') || document.querySelector("button[onclick='exportData()']") || document.querySelector('.btn-outline-secondary');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Optional search button (for older markup)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

function setupCalculationListeners() {
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const roomType = document.getElementById('roomType');
    
    if (checkIn) checkIn.addEventListener('change', calculateNights);
    if (checkOut) checkOut.addEventListener('change', calculateNights);
    if (roomType) roomType.addEventListener('change', calculateNights);
}

// Calcul des nuits et montant
function calculateNights() {
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const roomType = document.getElementById('roomType');
    const nightsCount = document.getElementById('nightsCount');
    const pricePerNight = document.getElementById('pricePerNight');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!checkIn || !checkOut || !roomType || !nightsCount || !pricePerNight || !totalAmount) {
        return;
    }
    
    const roomPrices = { '1': 25000, '2': 35000, '3': 55000, '4': 85000 };
    
    if (checkIn.value && checkOut.value) {
        const startDate = new Date(checkIn.value);
        const endDate = new Date(checkOut.value);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        nightsCount.textContent = nights > 0 ? nights : 0;
        
        if (roomType.value && nights > 0) {
            const price = roomPrices[roomType.value];
            pricePerNight.textContent = price.toLocaleString();
            const total = price * nights;
            totalAmount.textContent = total.toLocaleString();
        }
    }
}

// Gestion des réservations
function showAddReservationModal() {
    const modal = new bootstrap.Modal(document.getElementById('addReservationModal'));
    modal.show();
}

function saveReservation() {
    const form = document.getElementById('reservationForm');
    if (!form) return;
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const clientName = document.getElementById('clientName');
    const clientEmail = document.getElementById('clientEmail');
    const clientPhone = document.getElementById('clientPhone');
    const hotel = document.getElementById('hotel');
    const roomType = document.getElementById('roomType');
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const nightsCount = document.getElementById('nightsCount');
    const totalAmount = document.getElementById('totalAmount');
    const pricePerNight = document.getElementById('pricePerNight');
    
    if (!clientName || !clientEmail || !clientPhone || !hotel || !roomType || !checkIn || !checkOut) {
        return;
    }
    
    const newReservation = {
        id: 'RES-' + String(reservations.length + 1).padStart(3, '0'),
        client: clientName.value,
        email: clientEmail.value,
        phone: clientPhone.value,
        hotel: hotel.options[hotel.selectedIndex].text.split(' - ')[0],
        roomType: roomType.options[roomType.selectedIndex].text.split(' - ')[0],
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        nights: parseInt(nightsCount.textContent) || 0,
        amount: parseInt(totalAmount.textContent.replace(/\s/g, '')) || 0,
        status: 'pending'
    };
    
    reservations.push(newReservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    
    addNotification('info', 'Nouvelle réservation', `Réservation ${newReservation.id} créée avec succès`);
    
    renderReservationsTable();
    updateStatistics();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addReservationModal'));
    if (modal) modal.hide();
    
    form.reset();
    if (nightsCount) nightsCount.textContent = '0';
    if (pricePerNight) pricePerNight.textContent = '0';
    if (totalAmount) totalAmount.textContent = '0';
    
    showAlert('success', 'Réservation créée avec succès!');
}

function viewReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6>Informations client</h6>
                <p><strong>Nom:</strong> ${reservation.client}</p>
                <p><strong>Email:</strong> ${reservation.email}</p>
                <p><strong>Téléphone:</strong> ${reservation.phone}</p>
            </div>
            <div class="col-md-6">
                <h6>Détails de la réservation</h6>
                <p><strong>ID:</strong> ${reservation.id}</p>
                <p><strong>Hôtel:</strong> ${reservation.hotel}</p>
                <p><strong>Chambre:</strong> ${reservation.roomType}</p>
                <p><strong>Dates:</strong> ${formatDate(reservation.checkIn)} - ${formatDate(reservation.checkOut)}</p>
                <p><strong>Nuits:</strong> ${reservation.nights}</p>
                <p><strong>Montant:</strong> ${reservation.amount.toLocaleString()} F</p>
                <p><strong>Statut:</strong> <span class="reservation-status status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
            </div>
        </div>
    `;
    
    const reservationDetails = document.getElementById('reservationDetails');
    if (reservationDetails) {
        reservationDetails.innerHTML = detailsHtml;
        const modal = new bootstrap.Modal(document.getElementById('viewReservationModal'));
        modal.show();
    }
}

function confirmReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
        reservation.status = 'confirmed';
        localStorage.setItem('reservations', JSON.stringify(reservations));
        addNotification('success', 'Réservation confirmée', `La réservation ${id} a été confirmée`);
        renderReservationsTable();
        updateStatistics();
        showAlert('success', 'Réservation confirmée avec succès!');
    }
}

function cancelReservation(id) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
        const reservation = reservations.find(r => r.id === id);
        if (reservation) {
            reservation.status = 'cancelled';
            localStorage.setItem('reservations', JSON.stringify(reservations));
            addNotification('danger', 'Réservation annulée', `La réservation ${id} a été annulée`);
            renderReservationsTable();
            updateStatistics();
            showAlert('warning', 'Réservation annulée');
        }
    }
}

// Recherche et filtres
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filteredReservations = reservations.filter(r => 
        r.client.toLowerCase().includes(searchTerm) ||
        r.email.toLowerCase().includes(searchTerm) ||
        r.id.toLowerCase().includes(searchTerm) ||
        r.hotel.toLowerCase().includes(searchTerm)
    );
    renderReservationsTable(filteredReservations);
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const hotelFilter = document.getElementById('hotelFilter');
    const startDateFilter = document.getElementById('startDateFilter');
    const endDateFilter = document.getElementById('endDateFilter');
    
    let filtered = reservations;
    
    if (statusFilter && statusFilter.value) {
        filtered = filtered.filter(r => r.status === statusFilter.value);
    }
    
    if (hotelFilter && hotelFilter.value) {
        const hotelName = hotelFilter.options[hotelFilter.selectedIndex].text.split(' ')[0];
        filtered = filtered.filter(r => r.hotel.toLowerCase().includes(hotelName.toLowerCase()));
    }
    
    if (startDateFilter && startDateFilter.value) {
        filtered = filtered.filter(r => r.checkIn >= startDateFilter.value);
    }
    
    if (endDateFilter && endDateFilter.value) {
        filtered = filtered.filter(r => r.checkOut <= endDateFilter.value);
    }
    
    renderReservationsTable(filtered);
}

// Exportation
function exportData() {
    const csvContent = [
        ['ID', 'Client', 'Email', 'Téléphone', 'Hôtel', 'Type de chambre', 'Date d\'arrivée', 'Date de départ', 'Nuits', 'Montant', 'Statut'],
        ...reservations.map(r => [r.id, r.client, r.email, r.phone, r.hotel, r.roomType, r.checkIn, r.checkOut, r.nights, r.amount, r.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservations_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    
    showAlert('success', 'Données exportées avec succès!');
}

// Tableau de bord
function showDashboard() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <header class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h3">Tableau de bord</h1>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Actualiser
            </button>
        </header>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Statistiques des réservations</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="reservationsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Répartition par hôtel</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="hotelsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Revenus mensuels</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => createDashboardCharts(), 100);
}

function createDashboardCharts() {
    const statusData = {
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: reservations.filter(r => r.status === 'pending').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
    
    const reservationsChart = document.getElementById('reservationsChart');
    if (reservationsChart) {
        new Chart(reservationsChart, {
            type: 'doughnut',
            data: {
                labels: ['Confirmées', 'En attente', 'Annulées'],
                datasets: [{
                    data: [statusData.confirmed, statusData.pending, statusData.cancelled],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    const hotelData = {};
    reservations.forEach(r => {
        hotelData[r.hotel] = (hotelData[r.hotel] || 0) + 1;
    });
    
    const hotelsChart = document.getElementById('hotelsChart');
    if (hotelsChart) {
        new Chart(hotelsChart, {
            type: 'bar',
            data: {
                labels: Object.keys(hotelData),
                datasets: [{
                    label: 'Nombre de réservations',
                    data: Object.values(hotelData),
                    backgroundColor: '#007bff'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    const revenueData = {};
    reservations.filter(r => r.status === 'confirmed').forEach(r => {
        const month = r.checkIn.substring(0, 7);
        revenueData[month] = (revenueData[month] || 0) + r.amount;
    });
    
    const revenueChart = document.getElementById('revenueChart');
    if (revenueChart) {
        new Chart(revenueChart, {
            type: 'line',
            data: {
                labels: Object.keys(revenueData).sort(),
                datasets: [{
                    label: 'Revenus (FCFA)',
                    data: Object.values(revenueData),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// Gestion des clients
function showClients() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <header class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h3">Gestion des Clients</h1>
            <button class="btn btn-primary" onclick="exportClients()">
                <i class="bi bi-download"></i> Exporter les clients
            </button>
        </header>
        
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
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
                        <tbody id="clientsTableBody">
                            ${renderClientsTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderClientsTable() {
    const clientsData = {};
    reservations.forEach(r => {
        if (!clientsData[r.email]) {
            clientsData[r.email] = {
                name: r.client,
                email: r.email,
                phone: r.phone,
                bookings: 0,
                spent: 0
            };
        }
        clientsData[r.email].bookings++;
        if (r.status === 'confirmed') {
            clientsData[r.email].spent += r.amount;
        }
    });
    
    return Object.values(clientsData).map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.bookings}</td>
            <td>${client.spent.toLocaleString()} F</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewClientDetails('${client.email}')">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewClientDetails(email) {
    const clientReservations = reservations.filter(r => r.email === email);
    const client = clientReservations[0];
    
    if (client) {
        alert(`Détails du client: ${client.client}\nEmail: ${client.email}\nTéléphone: ${client.phone}\nNombre de réservations: ${clientReservations.length}`);
    }
}

function exportClients() {
    const clientsData = {};
    reservations.forEach(r => {
        if (!clientsData[r.email]) {
            clientsData[r.email] = {
                name: r.client,
                email: r.email,
                phone: r.phone,
                bookings: 0,
                spent: 0
            };
        }
        clientsData[r.email].bookings++;
        if (r.status === 'confirmed') {
            clientsData[r.email].spent += r.amount;
        }
    });
    
    const csvContent = [
        ['Nom', 'Email', 'Téléphone', 'Total réservations', 'Total dépensé'],
        ...Object.values(clientsData).map(c => [c.name, c.email, c.phone, c.bookings, c.spent])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    
    showAlert('success', 'Clients exportés avec succès!');
}

// Notifications
function showNotifications() {
    const modal = new bootstrap.Modal(document.getElementById('notificationsModal'));
    modal.show();
    updateNotificationBadge();
}

function addNotification(type, title, message) {
    const notification = {
        id: notifications.length + 1,
        type: type,
        title: title,
        message: message,
        time: 'Maintenant',
        read: false
    };
    notifications.unshift(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
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

// Paramètres
function showSettings() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <header class="mb-4">
            <h1 class="h3">Paramètres</h1>
        </header>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Configuration générale</h5>
                    </div>
                    <div class="card-body">
                        <form>
                            <div class="mb-3">
                                <label class="form-label">Nom de l'hôtel</label>
                                <input type="text" class="form-control" value="BENIN LODGE">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email de contact</label>
                                <input type="email" class="form-control" value="contact@beninlodge.bj">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Téléphone</label>
                                <input type="tel" class="form-control" value="+229 12 34 56 78">
                            </div>
                            <button type="button" class="btn btn-primary" onclick="saveSettings()">
                                Enregistrer les paramètres
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Gestion des données</h5>
                    </div>
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
    `;
}

function saveSettings() {
    showAlert('success', 'Paramètres enregistrés avec succès!');
}

function exportAllData() {
    const allData = {
        reservations: reservations,
        notifications: notifications,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benin_lodge_backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    
    showAlert('success', 'Données exportées avec succès!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                if (data.reservations) {
                    reservations = data.reservations;
                    localStorage.setItem('reservations', JSON.stringify(reservations));
                }
                if (data.notifications) {
                    notifications = data.notifications;
                    localStorage.setItem('notifications', JSON.stringify(notifications));
                }
                location.reload();
            } catch (error) {
                showAlert('danger', 'Erreur lors de l\'importation des données');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données? Cette action est irréversible.')) {
        localStorage.clear();
        location.reload();
    }
}

// Fonctions utilitaires
function renderReservationsTable(reservationsToRender = reservations) {
    const tbody = document.getElementById('reservationsTableBody') || document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = reservationsToRender.map(r => `
        <tr class="fade-in">
            <td>${r.id}</td>
            <td>${r.client}</td>
            <td>${r.email}<br>${r.phone}</td>
            <td><span class="hotel-badge">${r.hotel}</span></td>
            <td>${r.roomType}</td>
            <td>${formatDate(r.checkIn)} - ${formatDate(r.checkOut)}</td>
            <td>${r.nights}</td>
            <td>${r.amount.toLocaleString()} F</td>
            <td><span class="reservation-status status-${r.status}">${getStatusText(r.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="viewReservation('${r.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                ${r.status === 'pending' ? `
                    <button class="btn btn-sm btn-outline-success" onclick="confirmReservation('${r.id}')">
                        <i class="bi bi-check-circle"></i>
                    </button>
                ` : ''}
                ${r.status !== 'cancelled' ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelReservation('${r.id}')">
                        <i class="bi bi-x-circle"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function updateStatistics() {
    const total = reservations.length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const revenue = reservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.amount, 0);

    const totalEl = document.getElementById('totalReservations');
    const confirmedEl = document.getElementById('confirmedReservations');
    const pendingEl = document.getElementById('pendingReservations');
    const revenueEl = document.getElementById('totalRevenue');

    if (totalEl) totalEl.textContent = total;
    if (confirmedEl) confirmedEl.textContent = confirmed;
    if (pendingEl) pendingEl.textContent = pending;
    if (revenueEl) revenueEl.textContent = revenue.toLocaleString() + ' F';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmée',
        'pending': 'En attente',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
// THEME SWITCHER FUNCTIONALITY
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeIcon.className = 'bi bi-sun';
        themeText.textContent = 'Clair';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'bi bi-moon';
        themeText.textContent = 'Sombre';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    html.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        themeIcon.className = 'bi bi-moon';
        themeText.textContent = 'Sombre';
    } else {
        themeIcon.className = 'bi bi-sun';
        themeText.textContent = 'Clair';
    }
});

// ENHANCED PAGE TRANSITIONS
function showPage(pageName, animationType = 'slideInFromRight') {
    const mainContent = document.getElementById('mainContent');
    
    // Add leaving animation
    mainContent.classList.add('page-transition-leave');
    
    setTimeout(() => {
        // Update content based on page
        updatePageContent(pageName);
        
        // Remove leaving animation and add entering animation
        mainContent.classList.remove('page-transition-leave');
        mainContent.classList.add('page-transition-enter');
        
        setTimeout(() => {
            mainContent.classList.remove('page-transition-enter');
        }, 600);
    }, 300);
}

function updatePageContent(pageName) {
    const mainContent = document.getElementById('mainContent');
    
    switch(pageName) {
        case 'reservations':
            // Update to reservations view
            mainContent.innerHTML = getReservationsHTML();
            break;
        case 'dashboard':
            // Update to dashboard view
            mainContent.innerHTML = getDashboardHTML();
            initializeCharts();
            break;
        case 'clients':
            // Update to clients view
            mainContent.innerHTML = getClientsHTML();
            break;
        case 'notifications':
            // Update to notifications view
            mainContent.innerHTML = getNotificationsHTML();
            break;
        case 'settings':
            // Update to settings view
            mainContent.innerHTML = getSettingsHTML();
            break;
    }
    
    // Re-initialize event listeners
    initializeEventListeners();
}

// ENHANCED ANIMATION HELPERS
function animateElement(element, animationName, duration = 600) {
    element.style.animation = `${animationName} ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
    
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

function addStaggeredAnimation(elements, animationName, staggerDelay = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            animateElement(element, animationName);
        }, index * staggerDelay);
    });
}

// ENHANCED NOTIFICATION SYSTEM
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        animation: slideInFromRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideInFromRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) reverse';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle-fill',
        'error': 'x-circle-fill',
        'danger': 'x-circle-fill',
        'warning': 'exclamation-triangle-fill',
        'info': 'info-circle-fill'
    };
    return icons[type] || 'info-circle-fill';
}

// ENHANCED LOADING STATES
function showLoadingState(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
            <div class="loading-spinner"></div>
        </div>
    `;
}

function showSkeletonLoading(container, itemCount = 5) {
    let skeletonHTML = '';
    for (let i = 0; i < itemCount; i++) {
        skeletonHTML += `
            <div class="mb-3">
                <div class="loading-skeleton" style="height: 20px; width: 60%; margin-bottom: 10px;"></div>
                <div class="loading-skeleton" style="height: 16px; width: 40%; margin-bottom: 10px;"></div>
                <div class="loading-skeleton" style="height: 16px; width: 80%;"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

// ENHANCED INTERACTIONS
function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// ENHANCED SEARCH FUNCTIONALITY
function setupEnhancedSearch() {
    const searchInput = document.getElementById('searchInput');
    const tableRows = document.querySelectorAll('#reservationsTableBody tr');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            
            if (isVisible) {
                row.style.display = '';
                row.classList.add('fade-in');
            } else {
                row.style.display = 'none';
            }
        });
        
        // Highlight search term
        if (searchTerm.length > 2) {
            highlightSearchTerm(searchTerm);
        } else {
            removeHighlight();
        }
    });
}

function highlightSearchTerm(term) {
    const tableRows = document.querySelectorAll('#reservationsTableBody tr:not([style*="display: none"])');
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            const text = cell.textContent;
            const regex = new RegExp(`(${term})`, 'gi');
            const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            cell.innerHTML = highlightedText;
        });
    });
}

function removeHighlight() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

// ENHANCED FORM VALIDATION
function setupEnhancedValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid') || this.classList.contains('is-valid')) {
                    validateField(this);
                }
            });
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (isValid) {
                submitForm(this);
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    const type = field.type;
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous validation states
    field.classList.remove('is-valid', 'is-invalid');
    
    // Check if required and empty
    if (isRequired && !value) {
        isValid = false;
        errorMessage = 'Ce champ est requis';
    }
    
    // Type-specific validation
    if (value && isValid) {
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Veuillez entrer une adresse email valide';
                }
                break;
            case 'tel':
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Veuillez entrer un numéro de téléphone valide';
                }
                break;
        }
    }
    
    // Apply validation state
    if (isValid) {
        field.classList.add('is-valid');
        removeFieldError(field);
    } else {
        field.classList.add('is-invalid');
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    removeFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

// ENHANCED KEYBOARD NAVIGATION
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+K for search focus
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modal = bootstrap.Modal.getInstance(openModal);
                modal.hide();
            }
        }
        
        // Arrow keys for table navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.tagName === 'TR') {
                navigateTable(e.key === 'ArrowDown' ? 1 : -1);
            }
        }
    });
}

function navigateTable(direction) {
    const rows = Array.from(document.querySelectorAll('#reservationsTableBody tr:not([style*="display: none"])'));
    const currentIndex = rows.findIndex(row => row === document.activeElement);
    
    let newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < rows.length) {
        rows[newIndex].focus();
    }
}

// ENHANCED ACCESSIBILITY
function setupAccessibility() {
    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        const text = button.textContent.trim();
        if (text) {
            button.setAttribute('aria-label', text);
        }
    });
    
    // Add keyboard navigation to tables
    const tableRows = document.querySelectorAll('#reservationsTableBody tr');
    tableRows.forEach(row => {
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', `Réservation: ${row.cells[0].textContent}`);
    });
    
    // Add live region for notifications
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    document.body.appendChild(liveRegion);
}

// Initialize all enhanced features
document.addEventListener('DOMContentLoaded', function() {
    setupEnhancedSearch();
    setupEnhancedValidation();
    setupKeyboardNavigation();
    setupAccessibility();
    
    // Add ripple effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(addRippleEffect);
    
    // Add staggered animations to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    addStaggeredAnimation(statCards, 'bounceIn', 100);
    
    // Add animations to table rows
    const tableRows = document.querySelectorAll('#reservationsTableBody tr');
    addStaggeredAnimation(tableRows, 'slideInFromTop', 100);
});

// Performance optimization
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
// MOBILE RESPONSIVE FIXES & MENU TOGGLE

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('open');
    
    // Add overlay for mobile
    if (sidebar.classList.contains('open')) {
        createOverlay();
    } else {
        removeOverlay();
    }
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: auto;
        bottom: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    overlay.addEventListener('click', toggleMobileMenu);
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

function removeOverlay() {
    const overlay = document.querySelector('.mobile-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Add mobile menu button
function addMobileMenuButton() {
    const header = document.querySelector('.page-header');
    if (!header) return;
    
    // Check if button already exists
    if (header.querySelector('.mobile-menu-toggle')) return;
    
    const mobileButton = document.createElement('button');
    mobileButton.className = 'mobile-menu-toggle btn btn-primary';
    mobileButton.innerHTML = '<i class="bi bi-list"></i>';
    mobileButton.setAttribute('aria-label', 'Menu');
    mobileButton.style.cssText = `
        display: none;
        padding: 0.5rem 1rem;
        font-size: 1.2rem;
    `;
    
    mobileButton.addEventListener('click', toggleMobileMenu);
    
    // Insert at the beginning of header actions
    const headerActions = header.querySelector('.header-actions');
    if (headerActions) {
        headerActions.insertBefore(mobileButton, headerActions.firstChild);
    }
}

// Responsive adjustments
function handleResponsive() {
    const width = window.innerWidth;
    const mobileButton = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (width <= 992) {
        // Show mobile menu button
        if (mobileButton) {
            mobileButton.style.display = 'flex';
        }
        
        // Hide sidebar by default on mobile
        if (sidebar && !sidebar.classList.contains('open')) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    } else {
        // Hide mobile menu button
        if (mobileButton) {
            mobileButton.style.display = 'none';
        }
        
        // Show sidebar on desktop
        if (sidebar) {
            sidebar.style.transform = 'translateX(0)';
            sidebar.classList.remove('open');
        }
        
        // Remove overlay if exists
        removeOverlay();
    }
}

// Fix table overflow
function fixTableOverflow() {
    const tableContainers = document.querySelectorAll('.table-container');
    
    tableContainers.forEach(container => {
        const table = container.querySelector('.table');
        if (!table) return;
        
        // Check if table needs scrolling
        if (table.scrollWidth > container.clientWidth) {
            container.style.overflowX = 'auto';
            container.style.webkitOverflowScrolling = 'touch';
            
            // Add shadow indicators for scroll
            container.addEventListener('scroll', function() {
                const scrollLeft = this.scrollLeft;
                const maxScroll = this.scrollWidth - this.clientWidth;
                
                // Remove existing shadows
                this.classList.remove('scroll-left', 'scroll-right');
                
                // Add shadows based on scroll position
                if (scrollLeft > 0) {
                    this.classList.add('scroll-left');
                }
                if (scrollLeft < maxScroll) {
                    this.classList.add('scroll-right');
                }
            });
        }
    });
}

// Fix modal positioning on mobile
function fixModalPositioning() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('show.bs.modal', function() {
            const dialog = this.querySelector('.modal-dialog');
            
            if (window.innerWidth <= 768) {
                dialog.style.margin = '0';
                dialog.style.maxWidth = '100%';
                dialog.style.height = '100%';
                dialog.style.display = 'flex';
                dialog.style.alignItems = 'center';
            }
        });
    });
}

// Optimize images for responsive
function optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading="lazy" for performance
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Make images responsive
        if (!img.hasAttribute('style')) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
    });
}

// Fix viewport issues
function fixViewportIssues() {
    // Prevent zoom on input focus on iOS
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                document.querySelector('meta[name="viewport"]').setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            }
        });
        
        input.addEventListener('blur', function() {
            document.querySelector('meta[name="viewport"]').setAttribute('content', 
                'width=device-width, initial-scale=1.0');
        });
    });
}

// Add touch-friendly interactions
function addTouchInteractions() {
    // Add ripple effect for touch devices
    if ('ontouchstart' in window) {
        const buttons = document.querySelectorAll('.btn, .nav-link, .stat-card');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
}

// Fix search on mobile
function fixMobileSearch() {
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('.search-input');
    
    if (!searchContainer || !searchInput) return;
    
    if (window.innerWidth <= 768) {
        // Expand search on focus
        searchInput.addEventListener('focus', function() {
            searchContainer.style.position = 'fixed';
            searchContainer.style.top = '10px';
            searchContainer.style.left = '10px';
            searchContainer.style.right = '10px';
            searchContainer.style.zIndex = '1000';
            searchContainer.style.maxWidth = 'none';
        });
        
        searchInput.addEventListener('blur', function() {
            setTimeout(() => {
                searchContainer.style.position = '';
                searchContainer.style.top = '';
                searchContainer.style.left = '';
                searchContainer.style.right = '';
                searchContainer.style.zIndex = '';
                searchContainer.style.maxWidth = '';
            }, 200);
        });
    }
}

// Initialize responsive fixes
document.addEventListener('DOMContentLoaded', function() {
    addMobileMenuButton();
    handleResponsive();
    fixTableOverflow();
    fixModalPositioning();
    optimizeImages();
    fixViewportIssues();
    addTouchInteractions();
    fixMobileSearch();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            handleResponsive();
            fixTableOverflow();
            fixMobileSearch();
        }, 250);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            handleResponsive();
            fixTableOverflow();
        }, 100);
    });
});

// Add CSS for scroll indicators
const scrollStyles = `
    .table-container.scroll-left::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 100%);
        pointer-events: none;
        z-index: 1;
    }
    
    .table-container.scroll-right::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(270deg, rgba(0,0,0,0.1) 0%, transparent 100%);
        pointer-events: none;
        z-index: 1;
    }
    
    .mobile-overlay {
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
    }
    
    @media (max-width: 992px) {
        .sidebar {
            transition: transform 0.3s ease;
        }
        
        .sidebar.open {
            transform: translateX(0) !important;
        }
    }
    
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: stretch;
        }
        
        .header-actions {
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .search-container {
            width: 100%;
        }
        
        .btn {
            width: 100%;
            justify-content: center;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = scrollStyles;
document.head.appendChild(styleSheet);
