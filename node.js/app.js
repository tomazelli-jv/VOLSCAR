/* ==========================================================
   Volkswagen Fleet Manager — app.js
   ========================================================== */

const API_BASE = "/api";
let authToken = null;

const authStorageKey  = "carManagerAuth";
const tokenStorageKey = "carManagerToken";
const settingsPassword = "352155++";

/* ── DOM refs ── */
const loginScreen           = document.getElementById("loginScreen");
const loginButton           = document.getElementById("loginButton");
const loginError            = document.getElementById("loginError");
const loginUsername         = document.getElementById("loginUsername");
const loginPassword         = document.getElementById("loginPassword");
const appShell              = document.getElementById("appShell");
const welcomeText           = document.getElementById("welcomeText");
const userRoleBadge         = document.getElementById("userRoleBadge");
const logoutButton          = document.getElementById("logoutButton");
const newCarButton          = document.getElementById("newCarButton");
const carModal              = document.getElementById("carModal");
const closeModal            = document.getElementById("closeModal");
const cancelModal           = document.getElementById("cancelModal");
const carForm               = document.getElementById("carForm");
const carName               = document.getElementById("carName");
const carModel              = document.getElementById("carModel");
const carPlate              = document.getElementById("carPlate");
const carChassis            = document.getElementById("carChassis");
const carArrival            = document.getElementById("carArrival");
const carScheduledDeparture = document.getElementById("carScheduledDeparture");
const modalTitle            = document.getElementById("modalTitle");
const saveCarButton         = document.getElementById("saveCarButton");
const carsTableBody         = document.getElementById("carsTableBody");
const carsCards             = document.getElementById("carsCards");
const filterText            = document.getElementById("filterText");
const filterStatus          = document.getElementById("filterStatus");
const totalCars             = document.getElementById("totalCars");
const inStockCars           = document.getElementById("inStockCars");
const outCars               = document.getElementById("outCars");
const scheduledExitsCount   = document.getElementById("scheduledExitsCount");
const avgStockDays          = document.getElementById("avgStockDays");
const modelsCount           = document.getElementById("modelsCount");
const modelsCtx             = document.getElementById("modelsChart").getContext("2d");
const exitsCtx              = document.getElementById("exitsChart").getContext("2d");
const statusCtx             = document.getElementById("statusChart").getContext("2d");
const arrivalsCtx           = document.getElementById("arrivalsChart").getContext("2d");
const appMessage            = document.getElementById("appMessage");
const tabButtons            = Array.from(document.querySelectorAll(".tab-button"));
const inventoryPanel        = document.getElementById("inventoryPanel");
const dashboardPanel        = document.getElementById("dashboardPanel");
const settingsPanel         = document.getElementById("settingsPanel");
const settingsAuthModal     = document.getElementById("settingsAuthModal");
const closeSettingsAuth     = document.getElementById("closeSettingsAuth");
const cancelSettingsAuth    = document.getElementById("cancelSettingsAuth");
const settingsAuthForm      = document.getElementById("settingsAuthForm");
const settingsPasswordInput = document.getElementById("settingsPassword");
const settingsError         = document.getElementById("settingsError");

// Elementos de Configurações (Usuários e Permissões)
const newUserButton         = document.getElementById("newUserButton");
const usersTableBody        = document.getElementById("usersTableBody");
const usersTab              = document.getElementById("usersTab");
const userModal             = document.getElementById("userModal");
const userPermissionsContainer = document.getElementById("userPermissionsContainer");
const userPermissionCount   = document.getElementById("userPermissionCount");
const userModalTitle        = document.getElementById("userModalTitle");
const closeUserModal        = document.getElementById("closeUserModal");
const cancelUserModal       = document.getElementById("cancelUserModal");
const userForm              = document.getElementById("userForm");
const userName              = document.getElementById("userName");
const userEmail             = document.getElementById("userEmail");
const userPassword          = document.getElementById("userPassword");
const userRole              = document.getElementById("userRole");
const userStatus            = document.getElementById("userStatus");
const saveUserButton        = document.getElementById("saveUserButton");
const userFormError         = document.getElementById("userFormError");

// Agenda
const agendaPanel       = document.getElementById("agendaPanel");
const newEventButton    = document.getElementById("newEventButton");
const calGrid           = document.getElementById("calGrid");
const calMonthLabel     = document.getElementById("calMonthLabel");
const calPrev           = document.getElementById("calPrev");
const calNext           = document.getElementById("calNext");
const calToday          = document.getElementById("calToday");
const agendaEventsList  = document.getElementById("agendaEventsList");

// Modal evento
const eventModal        = document.getElementById("eventModal");
const closeEventModal   = document.getElementById("closeEventModal");
const cancelEventModal  = document.getElementById("cancelEventModal");
const eventForm         = document.getElementById("eventForm");
const exitModal         = document.getElementById("exitModal");
const closeExitModal    = document.getElementById("closeExitModal");
const cancelExitModal   = document.getElementById("cancelExitModal");
const backExitSelection = document.getElementById("backExitSelection");
const exitForm          = document.getElementById("exitForm");
const exitCarsGrid      = document.getElementById("exitCarsGrid");
const exitStepSelection = document.getElementById("exitStepSelection");
const exitStepForm      = document.getElementById("exitStepForm");
const exitSelectedCard  = document.getElementById("exitSelectedCard");
const exitDate          = document.getElementById("exitDate");
const exitTime          = document.getElementById("exitTime");
const exitVendor        = document.getElementById("exitVendor");
const exitClient        = document.getElementById("exitClient");
const exitNote          = document.getElementById("exitNote");
const exitModalTitle    = document.getElementById("exitModalTitle");
const exitModalSubtitle = document.getElementById("exitModalSubtitle");
const eventTitle        = document.getElementById("eventTitle");
const eventDate         = document.getElementById("eventDate");
const eventTime         = document.getElementById("eventTime");
const eventType         = document.getElementById("eventType");
const eventCar          = document.getElementById("eventCar");
const eventVendor       = document.getElementById("eventVendor");
const eventClient       = document.getElementById("eventClient");
const eventNote         = document.getElementById("eventNote");
const eventModalTitle   = document.getElementById("eventModalTitle");

// Modal dia
const dayModal          = document.getElementById("dayModal");
const closeDayModal     = document.getElementById("closeDayModal");
const closeDayModalBtn  = document.getElementById("closeDayModalBtn");
const dayModalTitle     = document.getElementById("dayModalTitle");
const dayModalBody      = document.getElementById("dayModalBody");
const addEventFromDay   = document.getElementById("addEventFromDay");

/* NOVOS ELEMENTOS PARA NOTIFICAÇÕES */
const notificationBell       = document.getElementById("notificationBell");
const notificationBadge      = document.getElementById("notificationBadge");
const upcomingExitsButton    = document.getElementById("upcomingExitsButton");
const notificationModal      = document.getElementById("notificationModal");
const closeNotificationModal = document.getElementById("closeNotificationModal");
const notificationModalBody  = document.getElementById("notificationModalBody");
const upcomingModal          = document.getElementById("upcomingModal");
const closeUpcomingModal     = document.getElementById("closeUpcomingModal");
const upcomingModalBody      = document.getElementById("upcomingModalBody");
const confirmModal   = document.getElementById("confirmModal");
const confirmTitle   = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCancel  = document.getElementById("confirmCancel");
const confirmOk      = document.getElementById("confirmOk");

/* ── State ── */
let currentUser        = null;
let cars               = [];
let users              = [];
let allPermissions     = [];
let userPermissions    = {};
let events             = [];
let editingId          = null;
let editingEventId     = null;
let editingUserId      = null;
let calCurrentDate     = new Date();
let dayModalDate       = null;
let eventDateFixed     = false;
let activeTabName      = "consulta";
let selectedExitCarId  = null;
let modelsChart        = null;
let exitsChart         = null;
let statusChart        = null;
let arrivalsChart      = null;
let settingsAuthorized = false;

/* ── Cores VW para gráficos ── */
const VW = {
  blue:      "#001E50",
  blueLight: "#1a56c4",
  green:     "#059669",
  purple:    "#7C3AED",
  amber:     "#D97706",
};

/* ==========================================================
   DATA
   ========================================================== */
function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

function getRolePermissions(role) {
  if (!role) return [];
  if (role === "admin") return ["view", "add", "edit", "delete", "dashboard", "settings"];
  if (role === "user") return ["view", "dashboard"];
  return ["view"];
}

function canAdd(module = "cars") {

  if (!currentUser) return false;

  return hasPermission(`create_${module}`);

}

function canEdit(module = "cars") {

  if (!currentUser) return false;

  return hasPermission(`edit_${module}`);

}

function canDelete(module = "cars") {

  if (!currentUser) return false;

  return hasPermission(`delete_${module}`);

}

async function loadCars() {
  try {
    const response = await apiFetch('/cars');
    if (response.ok) {
      cars = await response.json();
    } else {
      cars = [];
     if (response.status === 401) {
    clearAuth();
    return;
}

if (response.status === 403) {
    throw new Error("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
}
    }
  } catch (error) {
    console.error('Error loading cars:', error);
    cars = [];
  }
}

async function createCar(data) {
  const response = await apiFetch('/cars', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao salvar veículo');
  }
  return await response.json();
}

async function updateCarData(id, data) {
  const response = await apiFetch(`/cars/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao atualizar veículo');
  }
  return await response.json();
}

async function deleteCarData(id) {
  const response = await apiFetch(`/cars/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao excluir veículo');
  }
  return await response.json();
}

function setAuth(user) {
  console.log("CURRENT USER APÓS LOGIN"); // 29-07-2026
  console.log(currentUser); // 29-07-2026
  currentUser = user;
  localStorage.setItem(authStorageKey, JSON.stringify(user));
}

function hasPermission(permission) {
  if (!currentUser || !currentUser.permissions) return false;

  return currentUser.permissions.some(p => p.name === permission);
}

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem(tokenStorageKey, token);
}

function clearAuth() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem(authStorageKey);
  localStorage.removeItem(tokenStorageKey);
}

function loadAuth() {
  const storedUser = localStorage.getItem(authStorageKey);
  const storedToken = localStorage.getItem(tokenStorageKey);
  if (storedUser && storedToken) {
    currentUser = JSON.parse(storedUser);
    authToken = storedToken;
  }
}

async function loadEvents() {
  try {
    const response = await apiFetch('/events');
    if (response.ok) {
      events = await response.json();
    } else {
      events = [];
      if (response.status === 401) {
    clearAuth();
    return;
}

if (response.status === 403) {
    throw new Error("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
}
    }
  } catch (error) {
    console.error('Error loading events:', error);
    events = [];
  }
}

async function createEvent(data) {
  const response = await apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao salvar evento');
  }
  return await response.json();
}

async function updateEventData(id, data) {
  const response = await apiFetch(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao atualizar evento');
  }
  return await response.json();
}

async function deleteEventData(id) {
  const response = await apiFetch(`/events/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao excluir evento');
  }
  return await response.json();
}

// ========== USER MANAGEMENT FUNCTIONS ==========

function normalizeResponseArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.permissions)) return payload.permissions;
  if (Array.isArray(payload.result)) return payload.result;
  return [];
}

async function loadUsers() {
  try {
    const response = await apiFetch('/users');
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      users = normalizeResponseArray(payload);
    } else {
      users = [];
    }
  } catch (error) {
    console.error('Error loading users:', error);
    users = [];
  }
}

async function loadPermissions() {
  try {
    const response = await apiFetch('/permissions');
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      allPermissions = normalizeResponseArray(payload);
    } else {
      allPermissions = [];
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
    allPermissions = [];
  }
}

async function loadUserPermissions(userId) {
  try {
    const response = await apiFetch(`/users/${userId}/permissions`);
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      userPermissions[userId] = normalizeResponseArray(payload);
    } else {
      userPermissions[userId] = [];
    }
  } catch (error) {
    console.error('Error loading user permissions:', error);
    userPermissions[userId] = [];
  }
}

async function createUser(data) {
  const response = await apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao criar usuário');
  }
  return await response.json();
}

async function updateUser(userId, data) {
  const response = await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao atualizar usuário');
  }
  return await response.json();
}

async function updateUserPassword(userId, password) {
  const response = await apiFetch(`/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao atualizar senha');
  }
  return await response.json();
}

async function deleteUser(userId) {
  const response = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao deletar usuário');
  }
  return await response.json();
}

async function grantPermission(userId, permissionId) {
  const response = await apiFetch(`/users/${userId}/permissions/${permissionId}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao conceder permissão');
  }
  return await response.json();
}

async function revokePermission(userId, permissionId) {
  const response = await apiFetch(`/users/${userId}/permissions/${permissionId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Erro ao revogar permissão');
  }
  return await response.json();
}

function getUserPermissionIds(userId = null) {
  const permissions = userId && userPermissions[userId] ? userPermissions[userId] : [];
  const normalizedPermissions = normalizeResponseArray(permissions);
  return normalizedPermissions
    .map(permission => permission.id ?? permission.permission_id ?? permission.permissionId)
    .filter(permissionId => permissionId !== undefined && permissionId !== null && permissionId !== '')
    .map(permissionId => Number(permissionId))
    .filter(permissionId => Number.isFinite(permissionId) && permissionId > 0);
}

const PERMISSION_DISPLAY = {
  view_cars: {
    title: 'Ver veículos',
    description: 'Acessar a listagem de veículos disponíveis.'
  },
  add_car: {
    title: 'Adicionar veículos',
    description: 'Incluir um novo veículo no estoque.'
  },
  edit_car: {
    title: 'Editar veículos',
    description: 'Alterar dados do veículo cadastrado.'
  },
  delete_car: {
    title: 'Apagar veículos',
    description: 'Remover um veículo do sistema.'
  },
  view_events: {
    title: 'Ver agenda',
    description: 'Acessar o calendário e visualizar eventos.'
  },
  add_event: {
    title: 'Adicionar eventos',
    description: 'Criar novos registros de evento na agenda.'
  },
  edit_event: {
    title: 'Editar eventos',
    description: 'Alterar detalhes de eventos agendados.'
  },
  delete_event: {
    title: 'Apagar eventos',
    description: 'Excluir um evento agendado.'
  },
  view_dashboard: {
    title: 'Ver dashboard',
    description: 'Acessar o painel de indicadores da frota.'
  },
  manage_users: {
    title: 'Gerenciar usuários',
    description: 'Criar e editar contas de usuários.'
  },
  manage_permissions: {
    title: 'Gerenciar permissões',
    description: 'Controlar quais ações cada usuário pode executar.'
  },
  view_reports: {
    title: 'Ver relatórios',
    description: 'Acessar relatórios e dados resumidos.'
  }
};


  function showConfirm(title, message) {

    return new Promise(resolve => {

        confirmTitle.textContent = title;

        confirmMessage.innerHTML = message;

        confirmModal.classList.remove("hidden");

        const close = result => {

            confirmModal.classList.add("hidden");

            confirmCancel.onclick = null;
            confirmOk.onclick = null;

            resolve(result);

        };

        confirmCancel.onclick = () => close(false);

        confirmOk.onclick = () => close(true);

    });

}



function renderUserPermissionOptions(selectedUserId = null) {
  userPermissionsContainer.innerHTML = "";
  const selectedIds = new Set(getUserPermissionIds(selectedUserId));
  const categories = {};
  const permissionsList = normalizeResponseArray(allPermissions);

  permissionsList.forEach(permission => {
    const category = permission.category || "Outro";
    if (!categories[category]) categories[category] = [];
    categories[category].push(permission);
  });

  Object.keys(categories).sort().forEach(categoryName => {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "user-permissions-category";

    const title = document.createElement("h4");
    title.textContent = categoryName;
    categoryBlock.appendChild(title);

    categories[categoryName].forEach(permission => {
      const label = document.createElement("label");
      label.className = "user-permission-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.permissionId = permission.id;
      checkbox.checked = selectedIds.has(permission.id);
      checkbox.addEventListener("change", updateUserPermissionCount);

      const meta = PERMISSION_DISPLAY[permission.name] || {
        title: permission.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        description: permission.description || ''
      };

      const text = document.createElement("div");
      text.innerHTML = `<strong>${meta.title}</strong><div>${meta.description}</div>`;

      label.appendChild(checkbox);
      label.appendChild(text);
      categoryBlock.appendChild(label);
    });

    userPermissionsContainer.appendChild(categoryBlock);
  });

  updateUserPermissionCount();
}

function updateUserPermissionCount() {
  const count = userPermissionsContainer.querySelectorAll('input[type="checkbox"]:checked').length;
  userPermissionCount.textContent = `${count} selecionada${count === 1 ? "" : "s"}`;
}

async function openUserModal(editId = null) {
  editingUserId = editId;
  userFormError.textContent = "";

  if (!Array.isArray(allPermissions) || allPermissions.length === 0) {
    await loadPermissions();
  }

  if (editId) {
    const user = users.find(u => u.id === editId);
    if (user) {
      userModalTitle.textContent = `Editar usuário: ${user.username}`;
      userName.value = user.username;
      userEmail.value = user.email || "";
      userPassword.value = "";
      userPassword.placeholder = "Deixe em branco para não alterar";
      userRole.value = user.role;
      userStatus.value = user.status || "active";
      userName.disabled = true;
      await loadUserPermissions(editId);
      renderUserPermissionOptions(editId);
    }
  } else {
    userModalTitle.textContent = "Novo usuário";
    userName.value = "";
    userEmail.value = "";
    userPassword.value = "";
    userPassword.placeholder = "Digite uma senha";
    userRole.value = "user";
    userStatus.value = "active";
    userName.disabled = false;
    renderUserPermissionOptions();
  }

  userModal.classList.remove("hidden");
}

function closeUserModalWindow() {
  userModal.classList.add("hidden");
  editingUserId = null;
  userName.disabled = false;
  userPermissionsContainer.innerHTML = "";
  userPermissionCount.textContent = "0 selecionadas";
}

function renderUsersTable() {
  usersTableBody.innerHTML = "";
  
  if (!users || users.length === 0) {
    usersTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Nenhum usuário encontrado</td></tr>`;
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    const statusBadge = user.status === 'active' 
      ? '<span style="background:#059669;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">Ativo</span>'
      : '<span style="background:#dc2626;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">Inativo</span>';
    
    row.innerHTML = `
      <td><strong>${user.username}</strong></td>
      <td>${user.email || "—"}</td>
      <td><span style="background:#001E50;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">${user.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
      <td>${statusBadge}</td>
      <td class="actions"></td>
    `;

    const actions = row.querySelector(".actions");
    
    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.textContent = "Editar";
    editBtn.onclick = () => openUserModal(user.id);
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.textContent = "Deletar";
    deleteBtn.onclick = () => removeUser(user.id, user.username);
    actions.appendChild(deleteBtn);

    usersTableBody.appendChild(row);
  });
}

async function removeUser(userId, username) {
  if (currentUser && currentUser.id === userId) {
    alert("Você não pode deletar sua própria conta!");
    return;
  }

  const ok = await showConfirm(

    "Confirmar exclusão",

    "Deseja realmente excluir este registro?<br><br><strong>Não poderá recuperá-lo caso o faça.</strong>"

);

if (!ok) return;

  try {
    await deleteUser(userId);
    showAppMessage(`Usuário "${username}" deletado com sucesso.`, "info");
    await loadUsers();
    renderUsersTable();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(error.message || 'Erro ao deletar usuário');
  }
}

function switchSettingsTab() {
  usersTab.classList.remove("hidden");
}

/* ==========================================================
   UI HELPERS
   ========================================================== */
function showAppMessage(message, type = "danger") {
  appMessage.textContent = message;
  appMessage.classList.remove("hidden", "info");
  if (type === "info") appMessage.classList.add("info");
  clearTimeout(appMessage._timeout);
  appMessage._timeout = setTimeout(() => appMessage.classList.add("hidden"), 4500);
}

function clearAppMessage() {
  appMessage.classList.add("hidden");
  appMessage.textContent = "";
  clearTimeout(appMessage._timeout);
}

function updatePermissionUI() {

  // Botão Novo Veículo
  newCarButton.style.display = canCreate("cars")
    ? "inline-flex"
    : "none";

  // Permissões das abas
  const permissionMap = {
    consulta: "view_cars",
    agenda: "view_events",
    dashboard: "view_dashboard",
    settings: "manage_settings"
  };

  let firstAllowedTab = null;

  tabButtons.forEach(button => {

    const permission = permissionMap[button.dataset.tab];

    if (!permission) return;

    const allowed = hasPermission(permission);

    button.style.display = allowed ? "" : "none";

    if (allowed && !firstAllowedTab) {
      firstAllowedTab = button.dataset.tab;
    }

  });

  // Se a aba atual ficou sem permissão,
  // muda automaticamente para a primeira permitida.
  const currentPermission = permissionMap[activeTabName];

  if (
    currentPermission &&
    !hasPermission(currentPermission)
  ) {

    if (firstAllowedTab) {

      activeTabName = firstAllowedTab;

    } else {

      activeTabName = null;

      inventoryPanel.classList.add("hidden");
      dashboardPanel.classList.add("hidden");
      agendaPanel.classList.add("hidden");
      settingsPanel.classList.add("hidden");

      showAppMessage(
        "SUA CONTA NÃO POSSUI PERMISSÃO PARA ACESSAR NENHUM MÓDULO DO SISTEMA."
      );

      return;

    }

  }

}

//==================================//
//ALTERAÇÃO FEITA 04-08-2026 - TOMAZ//
//==================================//

function setActiveTab(tabName) {

  // Verificação de permissões
  const permissions = {
    dashboard: "view_dashboard",
    consulta: "view_cars",
    agenda: "view_events",
    settings: "manage_settings"
  };

  const requiredPermission = permissions[tabName];

 if (requiredPermission && !hasPermission(requiredPermission)) {

  showAppMessage(
    "VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!"
  );

  return;
}

  activeTabName = tabName;

  inventoryPanel.classList.toggle("hidden", tabName !== "consulta");
  dashboardPanel.classList.toggle("hidden", tabName !== "dashboard");
  agendaPanel.classList.toggle("hidden", tabName !== "agenda");
  settingsPanel.classList.toggle("hidden", tabName !== "settings");

  tabButtons.forEach(button =>
    button.classList.toggle("active", button.dataset.tab === tabName)
  );

  if (tabName === "dashboard") {
    updateDashboard();
  }

  if (tabName === "agenda") {
    renderCalendar();
  }
}

function formatDateTime(str) {
  if (!str) return "";

  const normalized = str.replace(" ", "T");
  const [datePart, timePart = "00:00"] = normalized.split("T");
  const [year, month, day] = datePart.split("-");

  return `${day}/${month}/${year} ${timePart.substring(0, 5)}`;
}

/* ==========================================================
   NOTIFICAÇÕES
   ========================================================== */
function getScheduledExitWindow(daysAhead = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const future = new Date(today);
  future.setDate(today.getDate() + daysAhead);

  const items = [];

  cars.forEach(car => {
    if (!car.scheduledDeparture || car.departureDate) return;

    const exit = new Date(car.scheduledDeparture);
    exit.setHours(0, 0, 0, 0);

    if (exit >= today && exit <= future) {
      items.push({
        id: `car-${car.id}`,
        kind: "car",
        title: car.name,
        model: car.model,
        plate: car.plate,
        vendor: "",
        displayDate: car.scheduledDeparture,
        relatedCar: car
      });
    }
  });

  events.forEach(ev => {
    if (ev.type !== "saida" || !ev.date) return;

    const eventDay = new Date(`${ev.date}T00:00:00`);
    if (eventDay < today || eventDay > future) return;

    const relatedCar = ev.carId ? cars.find(c => c.id === ev.carId) : null;

    items.push({
      id: `event-${ev.id}`,
      kind: "event",
      title: ev.title || (relatedCar ? relatedCar.name : "Saída"),
      model: relatedCar ? relatedCar.model : "",
      plate: relatedCar ? relatedCar.plate : "",
      vendor: ev.vendor || "",
      displayDate: `${ev.date}T${ev.time || "00:00"}`,
      relatedCar
    });
  });

  return items.sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate));
}

function getImmediateExits() {
  return getScheduledExitWindow(1);
}

function getUpcomingExits(daysAhead = 7) {
  return getScheduledExitWindow(daysAhead);
}

function updateNotifications() {
  const immediate = getImmediateExits();
  notificationBadge.classList.toggle("hidden", immediate.length === 0);
}

function showNotificationModal() {
  const immediate = getImmediateExits();
  notificationModalBody.innerHTML = "";
  if (immediate.length === 0) {
    notificationModalBody.innerHTML = "<p>Nenhuma saída programada para hoje ou amanhã.</p>";
  } else {
    immediate.forEach(item => {
      const card = document.createElement("div");
      card.className = "notification-item";
      card.innerHTML = `
        <strong>${item.title}</strong><br>
        ${item.model ? `Modelo: ${item.model}<br>` : ""}
        ${item.plate ? `Placa: ${item.plate}<br>` : ""}
        ${item.vendor ? `Vendedor: ${item.vendor}<br>` : ""}
        Saída: ${formatDateTime(item.displayDate)}
      `;
      notificationModalBody.appendChild(card);
    });
  }
  notificationModal.classList.remove("hidden");
}

function showUpcomingModal() {
  const upcoming = getUpcomingExits(7);
  upcomingModalBody.innerHTML = "";
  if (upcoming.length === 0) {
    upcomingModalBody.innerHTML = "<p>Nenhuma saída programada nos próximos 7 dias.</p>";
  } else {
    upcoming.forEach(item => {
      const card = document.createElement("div");
      card.className = "notification-item";
      card.innerHTML = `
        <strong>${item.title}</strong><br>
        ${item.model ? `Modelo: ${item.model}<br>` : ""}
        ${item.plate ? `Placa: ${item.plate}<br>` : ""}
        ${item.vendor ? `Vendedor: ${item.vendor}<br>` : ""}
        Saída: ${formatDateTime(item.displayDate)}
      `;
      upcomingModalBody.appendChild(card);
    });
  }
  upcomingModal.classList.remove("hidden");
}

/* ==========================================================
   SETTINGS
   ========================================================== */
function openSettingsAuth() {
  settingsPasswordInput.value = "";
  settingsError.textContent   = "";
  settingsAuthModal.classList.remove("hidden");
}

function closeSettingsAuthModal() { settingsAuthModal.classList.add("hidden"); }

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${user.username}</strong></td>
      <td><span class="role-badge">${user.role}</span></td>
      ${["view","add","edit","delete","dashboard"].map(p => `
        <td><input type="checkbox" data-user="${user.username}" data-permission="${p}" ${user.permissions.includes(p) ? "checked" : ""} /></td>
      `).join("")}
    `;
    settingsTableBody.appendChild(row);
  });


function handleSettingsPermissionChange(event) {
  if (event.target.tagName !== "INPUT") return;
  if (!users.length) return;
  const username   = event.target.dataset.user;
  const permission = event.target.dataset.permission;
  const user = users.find(u => u.username === username);
  if (!user) return;
  if (event.target.checked) {
    if (!user.permissions.includes(permission)) user.permissions.push(permission);
  } else {
    user.permissions = user.permissions.filter(p => p !== permission);
  }
  if (currentUser && currentUser.username === username) { setAuth(user); updatePermissionUI(); }
}

/* ==========================================================
   MODAL VEÍCULO
   ========================================================== */
function openModal(editId = null) {

  // Editando
  if (editId && !canEdit("cars")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

  // Criando
  if (!editId && !canCreate("cars")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

  editingId = editId;
  carModal.classList.remove("hidden");

  if (editingId) {
    const car = cars.find(c => c.id === editingId);

    if (car) {
      modalTitle.textContent      = "Editar veículo";
      carName.value               = car.name;
      carModel.value              = car.model;
      carPlate.value              = car.plate;
      carChassis.value            = car.chassis;
      carArrival.value            = car.arrivalDate;
    }

  } else {

    modalTitle.textContent      = "Registrar chegada";
    carName.value               = "";
    carModel.value              = "";
    carPlate.value              = "";
    carChassis.value            = "";
    carArrival.value            = new Date().toISOString().slice(0, 16);

  }

}

function closeModalWindow() { carModal.classList.add("hidden"); editingId = null; }

/* ==========================================================
   TABELA
   ========================================================== */
function getFilteredCars() {
  const query  = filterText.value.trim().toLowerCase();
  const status = filterStatus.value;
  return cars.filter(car => {
    const matchText = [car.name, car.model, car.plate, car.chassis].some(f => f.toLowerCase().includes(query));
    const matchStatus = status === "all" ? true : status === "in" ? car.departureDate === "" : car.departureDate !== "";
    return matchText && matchStatus;
  });
}

async function checkScheduledDepartures() {
  const now = new Date();
  const updates = [];

  for (const car of cars) {
    if (car.scheduledDeparture && inStock) {
      const scheduled = new Date(car.scheduledDeparture);
      if (!isNaN(scheduled) && scheduled <= now) {
        car.departureDate = car.scheduledDeparture;
        updates.push(updateCarData(car.id, { departureDate: car.departureDate }));
      }
    }
  }

  if (updates.length > 0) {
    try {
      await Promise.all(updates);
      await loadCars();
      if (currentUser) {
        renderCarsTable();
        updateDashboard();
        showAppMessage("Saídas agendadas processadas automaticamente.", "info");
      }
    } catch (error) {
      console.error('Error processing scheduled departures:', error);
    }
  }
}

function renderCarsTable() {
  carsTableBody.innerHTML = "";
  const carsCards = document.getElementById("carsCards");
  carsCards.innerHTML = "";
  const filtered  = getFilteredCars();
  const canEditFlag   = canEdit("cars");
  const canDeleteFlag = canDelete("cars");

  if (filtered.length === 0) {
    carsTableBody.innerHTML = `<tr><td colspan="8" class="empty-row">Nenhum veículo encontrado</td></tr>`;
    carsCards.innerHTML = `<div class="empty-row" style="padding: 48px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Nenhum veículo encontrado</div>`;
    return;
  }

  filtered.forEach(car => {
    const hasExited =
    car.departureDate &&
    car.departureDate.trim() !== "";

const inStock = !hasExited;
    const row = document.createElement("tr");
    row.classList.toggle("scheduled-row", !!(car.scheduledDeparture && inStock));

    row.innerHTML = `
      <td data-label="Veículo"><strong>${car.name}</strong></td>
      <td data-label="Modelo">${car.model}</td>
      <td data-label="Placa"><span class="plate-code">${car.plate}</span></td>
      <td data-label="Chassi"><span class="chassis-code">${car.chassis}</span></td>
      <td data-label="Chegada">${formatDateTime(car.arrivalDate)}</td>
      <td data-label="Saída prevista">
        ${car.scheduledDeparture
          ? `${formatDateTime(car.scheduledDeparture)} ${!car.departureDate ? "<span class='scheduled-badge'>Agendado</span>" : ""}`
          : "—"}
      </td>
      <td data-label="Status">
  ${statusHtml}
</td>
      <td class="actions" data-label="Ações"></td>
    `;

    const actions = row.querySelector(".actions");

    if (canEditFlag) {
      const btn = document.createElement("button");
      btn.className = "edit"; btn.textContent = "Editar";
      btn.onclick = () => openModal(car.id);
      actions.appendChild(btn);
    }

    if (canDeleteFlag) {
      const btn = document.createElement("button");
      btn.className = "delete"; btn.textContent = "Excluir";
      btn.onclick = () => removeCar(car.id);
      actions.appendChild(btn);
    }

    if (inStock && canEditFlag) {
      const btn = document.createElement("button");
      btn.className = "exit"; btn.textContent = "Registrar saída";
      btn.onclick = () => openExitModal();
      actions.appendChild(btn);
    }

    carsTableBody.appendChild(row);

    // Render card for mobile
    const card = document.createElement("div");
    card.className = "car-card";
    card.classList.toggle("scheduled-row", !!(car.scheduledDeparture && inStock));

    card.innerHTML = `
      <div class="car-card-header">
        <div class="car-card-title">${car.name}</div>
        <div class="car-card-status">
          ${inStock
            ? `<span class="status-pill status-in">Em estoque</span>`
            : `<span class="status-pill status-out">Saiu</span>`}
        </div>
      </div>
      <div class="car-card-detail">
        <strong>Modelo:</strong> <span>${car.model}</span>
      </div>
      <div class="car-card-detail">
        <strong>Placa:</strong> <span class="plate-code">${car.plate}</span>
      </div>
      <div class="car-card-detail">
        <strong>Chassi:</strong> <span class="chassis-code">${car.chassis}</span>
      </div>
      <div class="car-card-detail">
        <strong>Chegada:</strong> <span>${formatDateTime(car.arrivalDate)}</span>
      </div>
      <div class="car-card-detail">
        <strong>Saída prevista:</strong> <span>${car.scheduledDeparture ? formatDateTime(car.scheduledDeparture) + (inStock ? " (Agendado)" : "") : "—"}</span>
      </div>
      <div class="car-card-actions"></div>
    `;

    const cardActions = card.querySelector(".car-card-actions");

    if (canEditFlag) {
      const btn = document.createElement("button");
      btn.className = "edit"; btn.textContent = "Editar";
      btn.onclick = () => openModal(car.id);
      cardActions.appendChild(btn);
    }

    if (canDeleteFlag) {
      const btn = document.createElement("button");
      btn.className = "delete"; btn.textContent = "Excluir";
      btn.onclick = () => removeCar(car.id);
      cardActions.appendChild(btn);
    }

    if (inStock && canEditFlag) {
      const btn = document.createElement("button");
      btn.className = "exit"; btn.textContent = "Registrar saída";
      btn.onclick = () => openExitModal();
      cardActions.appendChild(btn);
    }

    carsCards.appendChild(card);
  });
}

async function removeCar(id) {

  if (!canDelete("cars")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

 const ok = await showConfirm(

    "Confirmar exclusão",

    "Deseja realmente excluir este registro?<br><br><strong>Não poderá recuperá-lo caso o faça.</strong>"

);

if (!ok) return;

  try {

    await deleteCarData(id);
    await refreshAppData();

  } catch (error) {

    console.error(error);

    showAppMessage("Erro ao excluir veículo.");

  }

}

function closeExitModalWindow() {
  exitModal.classList.add("hidden");
  selectedExitCarId = null;
  exitStepForm.classList.add("hidden");
  exitStepSelection.classList.remove("hidden");
  exitForm.reset();
}

function showExitSelectionStep() {
  exitStepSelection.classList.remove("hidden");
  exitStepForm.classList.add("hidden");
}

function renderExitCarsGrid() {
  const availableCars = cars.filter(car => !car.departureDate || car.departureDate.trim() === "");
  exitCarsGrid.innerHTML = "";

  if (availableCars.length === 0) {
    exitCarsGrid.innerHTML = '<div class="empty-row">Nenhum carro disponível para saída no momento.</div>';
    return;
  }

  availableCars.forEach(car => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "exit-car-card";
    card.innerHTML = `
      <div class="exit-car-card__title">${car.name}</div>
      <div class="exit-car-card__meta">Modelo: ${car.model}</div>
      <div class="exit-car-card__meta">Placa: <strong>${car.plate}</strong></div>
      <div class="exit-car-card__meta">Chassi: ${car.chassis || "—"}</div>
      <div class="exit-car-card__meta">Chegada: ${formatDateTime(car.arrivalDate)}</div>
    `;
    card.onclick = () => selectExitCar(car);
    exitCarsGrid.appendChild(card);
  });
}

function selectExitCar(car) {
  selectedExitCarId = car.id;
  exitModalTitle.textContent = "Dados da saída";
  exitModalSubtitle.textContent = `Preencha as informações da saída para ${car.name}.`;
  exitSelectedCard.innerHTML = `
    <div class="exit-selected-card__title">${car.name}</div>
    <div class="exit-selected-card__meta">Modelo: ${car.model}</div>
    <div class="exit-selected-card__meta">Placa: ${car.plate}</div>
    <div class="exit-selected-card__meta">Chassi: ${car.chassis || "—"}</div>
  `;
  exitDate.value = new Date().toISOString().slice(0, 10);
  exitTime.value = "08:00";
  exitVendor.value = "";
  exitClient.value = "";
  exitNote.value = "";
  exitStepSelection.classList.add("hidden");
  exitStepForm.classList.remove("hidden");
}

function openExitModal() {
  exitModalTitle.textContent = "Registrar saída";
  exitModalSubtitle.textContent = "Escolha o veículo e preencha os dados da saída.";
  renderExitCarsGrid();
  showExitSelectionStep();
  exitForm.reset();
  exitModal.classList.remove("hidden");
}

async function submitExitRegistration(event) {
  event.preventDefault();

  if (!selectedExitCarId) {
    alert("Selecione um veículo antes de salvar.");
    return;
  }

  const car = cars.find(c => c.id === selectedExitCarId);
  if (!car) {
    alert("Veículo não encontrado.");
    return;
  }

  const exitDateTime = `${exitDate.value}T${exitTime.value}`;
  const vendor = exitVendor.value.trim();
  const client = exitClient.value.trim();
  const note = exitNote.value.trim();

  if (!exitDate.value || !exitTime.value || !vendor) {
    alert("Preencha data, horário e vendedor.");
    return;
  }

  try {
    await updateCarData(car.id, {
      name: car.name,
      model: car.model,
      plate: car.plate,
      chassis: car.chassis,
      arrivalDate: car.arrivalDate,
      scheduledDeparture: car.scheduledDeparture,
      departureDate: exitDateTime
    });

    await createEvent({
      type: "saida",
      title: `Saída - ${car.name}`,
      date: exitDate.value,
      time: exitTime.value,
      carId: car.id,
      vendor,
      client: client || null,
      note: note || null
    });

    await refreshAppData();
    closeExitModalWindow();
    showAppMessage(`Saída registrada para ${car.name}.`, "info");
  } catch (error) {
    console.error("Error registering exit:", error);
    alert("Erro ao registrar saída");
  }
}

/* ==========================================================
   DASHBOARD
   ========================================================== */
function renderDashboard() {
  const total          = cars.length;
  const exited         = cars.filter(c => c.departureDate !== "").length;
  const inStock        = total - exited;
  const scheduledCount = cars.filter(c => c.scheduledDeparture && !c.departureDate).length;
  const models = {}, exitsByMonth = {}, arrivalsByMonth = {}, stockDays = [];

  cars.forEach(car => {
    models[car.model] = (models[car.model] || 0) + 1;
    const am = new Date(car.arrivalDate).toLocaleString("pt-BR", { month: "2-digit", year: "numeric" });
    arrivalsByMonth[am] = (arrivalsByMonth[am] || 0) + 1;
    if (car.departureDate) {
      const m = new Date(car.departureDate).toLocaleString("pt-BR", { month: "2-digit", year: "numeric" });
      exitsByMonth[m] = (exitsByMonth[m] || 0) + 1;
      const d = (new Date(car.departureDate) - new Date(car.arrivalDate)) / 86400000;
      if (!isNaN(d) && d >= 0) stockDays.push(d);
    }
  });

  totalCars.textContent           = total;
  inStockCars.textContent         = inStock;
  outCars.textContent             = exited;
  scheduledExitsCount.textContent = scheduledCount;
  modelsCount.textContent         = Object.keys(models).length;
  avgStockDays.textContent        = stockDays.length
    ? (stockDays.reduce((a, b) => a + b, 0) / stockDays.length).toFixed(1) : "0";

  const gridOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(0,0,0,0.04)" } },
      x: { grid: { display: false } }
    }
  };

  if (modelsChart) modelsChart.destroy();
  modelsChart = new Chart(modelsCtx, {
    type: "bar",
    data: { labels: Object.keys(models), datasets: [{ label: "Quantidade", data: Object.values(models), backgroundColor: VW.blue, borderRadius: 8 }] },
    options: gridOpts
  });

  if (exitsChart) exitsChart.destroy();
  const exitLabels = Object.keys(exitsByMonth).sort();
  exitsChart = new Chart(exitsCtx, {
    type: "line",
    data: { labels: exitLabels, datasets: [{ label: "Saídas", data: exitLabels.map(l => exitsByMonth[l]), borderColor: VW.blue, backgroundColor: "rgba(0,30,80,0.08)", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: VW.blue }] },
    options: gridOpts
  });

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(statusCtx, {
    type: "doughnut",
    data: { labels: ["Em estoque", "Saíram"], datasets: [{ data: [inStock, exited], backgroundColor: [VW.blue, VW.green], hoverOffset: 8, borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: "bottom", labels: { padding: 16, boxWidth: 14, usePointStyle: true } } } }
  });

  if (arrivalsChart) arrivalsChart.destroy();
  const arrivalLabels = Object.keys(arrivalsByMonth).sort();
  arrivalsChart = new Chart(arrivalsCtx, {
    type: "bar",
    data: { labels: arrivalLabels, datasets: [{ label: "Entradas", data: arrivalLabels.map(l => arrivalsByMonth[l]), backgroundColor: VW.green, borderRadius: 8 }] },
    options: gridOpts
  });
}

function updateDashboard() { renderDashboard(); }

async function refreshAppData() {
  if (!currentUser) return;

  welcomeText.textContent   = `Olá, ${currentUser.role}`;
  userRoleBadge.textContent = currentUser.role;
  updatePermissionUI();

 const promises = [];

if (hasPermission('view_cars')) {
  promises.push(loadCars());
} else {
  cars = [];
}

if (hasPermission('view_events')) {
  promises.push(loadEvents());
} else {
  events = [];
}

await Promise.all(promises);

const adminPromises = [];

if (hasPermission('view_users')) {
  adminPromises.push(loadUsers());
} else {
  users = [];
}

if (hasPermission('manage_settings')) {
  adminPromises.push(loadPermissions());
} else {
  allPermissions = [];
}

await Promise.all(adminPromises);

  renderCarsTable();
  renderCalendar();
  updateDashboard();
  updateNotifications();

  if (currentUser.role === 'admin') {
    renderUsersTable();
  }

clearAppMessage();

if (activeTabName) {
  setActiveTab(activeTabName);
}
}

/* ==========================================================
   APP INIT / AUTH
   ========================================================== */
async function renderApp() {
  console.log("renderApp()"); // 29-07-2026
  console.log(currentUser); // 29-07-2026
  await refreshAppData();
  setActiveTab("consulta");
}

function showApp()   { loginScreen.classList.add("hidden");    appShell.classList.remove("hidden"); }
function showLogin() { loginScreen.classList.remove("hidden"); appShell.classList.add("hidden"); }

/* ==========================================================
   AGENDA — CALENDÁRIO
   ========================================================== */

const EVENT_TYPES = {
  saida:   { label: "Saída",      icon: "🚗" },
  chegada: { label: "Chegada",    icon: "📦" },
  revisao: { label: "Revisão",    icon: "🔧" },
  entrega: { label: "Entrega",    icon: "🤝" },
  outro:   { label: "Outro",      icon: "📌" },
};

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function getEventDateTime(event) {
  if (!event || !event.date) return new Date(0);
  const time = event.time || "12:00";
  return new Date(`${event.date}T${time}`);
}

function eventsForDate(dateStr) {
  return events.filter(e => e.date === dateStr);
}

function eventsForMonth(year, month) {
  const prefix = `${year}-${String(month+1).padStart(2,"0")}`;
  return events.filter(e => e.date.startsWith(prefix));
}

function renderCalendar() {
  const year  = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  calMonthLabel.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  calGrid.innerHTML = "";

  // Dias do mês anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const y2 = month === 0 ? year-1 : year;
    const m2 = month === 0 ? 11 : month-1;
    const cell = buildDayCell(y2, m2, d, true, todayStr);
    calGrid.appendChild(cell);
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = buildDayCell(year, month, d, false, todayStr);
    calGrid.appendChild(cell);
  }

  // Completar a última linha
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  const y2 = month === 11 ? year+1 : year;
  const m2 = month === 11 ? 0 : month+1;
  for (let d = 1; d <= remaining; d++) {
    const cell = buildDayCell(y2, m2, d, true, todayStr);
    calGrid.appendChild(cell);
  }

  renderEventsList(year, month);
}

function buildDayCell(year, month, day, otherMonth, todayStr) {
  const dStr = dateKey(year, month, day);
  const dayEvs = eventsForDate(dStr);
  const isToday = dStr === todayStr;

  const cell = document.createElement("div");
  cell.className = "cal-day" +
    (otherMonth ? " other-month" : "") +
    (isToday ? " today" : "") +
    (dayEvs.length > 0 ? " has-events" : "");
  cell.dataset.date = dStr;

  const numEl = document.createElement("div");
  numEl.className = "cal-day-num";
  numEl.textContent = day;
  cell.appendChild(numEl);

  // Mostrar até 2 chips de evento
  const visible = dayEvs.slice(0, 2);
  visible.forEach(ev => {
    const chip = document.createElement("span");
    chip.className = `cal-event-chip type-${ev.type}`;
    const t = EVENT_TYPES[ev.type] || EVENT_TYPES.outro;
    const label = ev.title ? ev.title : t.label;
    const time = ev.time ? ` ${ev.time}` : "";
    chip.textContent = `${t.icon}${time} ${label}`;
    chip.title = label;
    cell.appendChild(chip);
  });

  if (dayEvs.length > 2) {
    const more = document.createElement("div");
    more.className = "cal-more";
    more.textContent = `+${dayEvs.length - 2} mais`;
    cell.appendChild(more);
  }

  cell.addEventListener("click", () => openDayModal(dStr, dayEvs));
  return cell;
}

function renderEventsList(year, month) {
  const monthEvs = eventsForMonth(year, month)
    .slice()
    .sort((a,b) => a.date.localeCompare(b.date));

  agendaEventsList.innerHTML = "";

  const title = document.createElement("h4");
  title.textContent = "Todos os eventos do mês";
  agendaEventsList.appendChild(title);

  if (monthEvs.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-events-msg";
    msg.textContent = "Nenhum evento registrado neste mês.";
    agendaEventsList.appendChild(msg);
    return;
  }

  monthEvs.forEach(ev => {
    const car = ev.carId ? cars.find(c => c.id === ev.carId) : null;
    const t   = EVENT_TYPES[ev.type] || EVENT_TYPES.outro;

    const [y, m, d] = ev.date.split("-");
    const dateFormatted = new Date(ev.date + "T12:00").toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short" });
    const timeLabel = ev.time ? `⏰ ${ev.time}` : "";

    const item = document.createElement("div");
    item.className = "event-list-item";
    item.innerHTML = `
      <div class="event-list-dot dot-${ev.type}"></div>
      <div class="event-list-info">
        <div class="event-list-title">${t.icon} ${ev.title || t.label}</div>
        <div class="event-list-meta">
          <span>📅 ${dateFormatted}</span>
          ${timeLabel ? `<span>${timeLabel}</span>` : ""}
          <span>${t.label}</span>
          ${car ? `<span class="event-list-car">🚗 ${car.name} · ${car.plate}</span>` : ""}
          <span>🧑‍💼 ${ev.vendor}</span>
          ${ev.client ? `<span>👤 ${ev.client}</span>` : ""}
          ${ev.note ? `<span>📝 ${ev.note}</span>` : ""}
        </div>
      </div>
      <div class="event-list-actions"></div>
    `;

    const acts = item.querySelector(".event-list-actions");

    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.textContent = "Editar";
    editBtn.onclick = () => openEventModal(ev.id);
    acts.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "delete";
    delBtn.textContent = "Excluir";
    delBtn.onclick = () => deleteEvent(ev.id);
    acts.appendChild(delBtn);

    agendaEventsList.appendChild(item);
  });
}


function canView(module) {

  if (!currentUser) return false;

  return hasPermission(`view_${module}`);

}

function canCreate(module) {

  if (!currentUser) return false;

  return hasPermission(`create_${module}`);

}

function canEdit(module) {

  if (!currentUser) return false;

  return hasPermission(`edit_${module}`);

}

function canDelete(module) {

  if (!currentUser) return false;

  return hasPermission(`delete_${module}`);

}


/* ── Modal Dia ── */
function openDayModal(dateStr, dayEvs) {
  dayModalDate = dateStr;
  const [y, m, d] = dateStr.split("-");
  const label = new Date(dateStr + "T12:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
  dayModalTitle.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  dayModalBody.innerHTML = "";
  const canCreateEvents = canCreate("events");
  const canEditEvents = canEdit("events");
  const canDeleteEvents = canDelete("events");

  if (dayEvs.length === 0) {
    dayModalBody.innerHTML = `<p class="day-no-events">Nenhum evento neste dia. Clique em "+ Adicionar evento" para criar.</p>`;
  } else {
    dayEvs.forEach(ev => {
      const car = ev.carId ? cars.find(c => c.id === ev.carId) : null;
      const t   = EVENT_TYPES[ev.type] || EVENT_TYPES.outro;
      const item = document.createElement("div");
      item.className = "day-event-item";
      item.innerHTML = `
<div class="day-event-content">

    <div class="day-event-title">
        <span class="day-event-type-badge cal-event-chip type-${ev.type}">
            ${t.icon} ${t.label}
        </span>

        <strong>${ev.title || t.label}</strong>
    </div>

    ${ev.time ? `<div class="day-info">⏰ ${ev.time}</div>` : ""}

    ${car ? `<div class="day-info">🚗 ${car.name} · <span class="plate-code">${car.plate}</span></div>` : ""}

    <div class="day-info">🧑‍💼 ${ev.vendor}</div>

    ${ev.client ? `<div class="day-info">👤 ${ev.client}</div>` : ""}

    ${ev.note ? `<div class="day-info">📝 ${ev.note}</div>` : ""}

    <div class="day-event-actions"></div>

</div>
`;
      const acts = item.querySelector("div:last-child");
     

      const editBtn = document.createElement("button");
      editBtn.className = "actions"; // reutiliza estilos
    if (canEditEvents) {

  const eb = document.createElement("button");
  eb.className = "edit";
  eb.textContent = "Editar";

  eb.onclick = () => {
    closeDayModalFn();
    openEventModal(ev.id);
  };

  acts.appendChild(eb);

}

     if (canDeleteEvents) {

  const db = document.createElement("button");
  db.className = "delete";
  db.textContent = "Excluir";

  db.onclick = () => {
    deleteEvent(ev.id);
    closeDayModalFn();
  };

  acts.appendChild(db);

}

      dayModalBody.appendChild(item);
    });
  }

  dayModal.classList.remove("hidden");
}

function closeDayModalFn() { dayModal.classList.add("hidden"); dayModalDate = null; }

/* ── Modal Evento ── */
function hasExitRecorded(car) {

  // Se a saída já foi registrada manualmente
  if (car.departureDate && car.departureDate.trim() !== "") {
    return true;
  }

  const now = new Date();

  return events.some(ev => {

    if (ev.carId !== car.id) return false;
    if (ev.type !== "saida") return false;

    const eventDate = new Date(`${ev.date}T${ev.time || "00:00"}`);

    // Só considera que saiu se a data/hora já passou
    return eventDate <= now;

  });

}

function hasScheduledExit(car) {

  const now = new Date();

  return events.some(ev => {

    if (ev.carId !== car.id) return false;
    if (ev.type !== "saida") return false;

    const eventDate = new Date(`${ev.date}T${ev.time || "00:00"}`);

    return eventDate > now;

  });

}

function populateEventCarSelect(selectedCarId = null) {
  eventCar.innerHTML = `<option value="">— Nenhum veículo —</option>`;

  const availableCars = cars.filter(c => !hasExitRecorded(c));

  if (selectedCarId && !availableCars.some(c => c.id === selectedCarId)) {
    const selectedCar = cars.find(c => c.id === selectedCarId);
    if (selectedCar) {
      availableCars.unshift(selectedCar);
    }
  }

  availableCars.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.model} • Chassi: ${c.chassis}`;
    eventCar.appendChild(opt);
  });
}

function openEventModal(editId = null, prefillDate = null) {

  // Editando
  if (editId && !canEdit("events")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

  // Criando
  if (!editId && !canCreate("events")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

  editingEventId = editId;

  const selectedCarId = editId
    ? (events.find(e => e.id === editId)?.carId || null)
    : null;

  populateEventCarSelect(selectedCarId);

  eventModalTitle.textContent = editId
    ? "Editar Evento"
    : "Novo Evento";

  eventDateFixed = !!prefillDate;

  if (editId) {

    const ev = events.find(e => e.id === editId);

    if (ev) {
      eventTitle.value   = ev.title || "";
      eventDate.value    = ev.date;
      eventTime.value    = ev.time || "";
      eventType.value    = ev.type || "saida";
      eventCar.value     = ev.carId || "";
      eventVendor.value  = ev.vendor || "";
      eventClient.value  = ev.client || "";
      eventNote.value    = ev.note || "";
    }

  } else {

    eventTitle.value   = "";
    eventDate.value    = prefillDate || new Date().toISOString().slice(0, 10);
    eventTime.value    = "";
    eventType.value    = "saida";
    eventCar.value     = "";
    eventVendor.value  = "";
    eventClient.value  = "";
    eventNote.value    = "";

  }

  eventDate.disabled = eventDateFixed;
  eventModal.classList.remove("hidden");

}

function closeEventModalFn() { eventModal.classList.add("hidden"); editingEventId = null; eventDate.disabled = false; eventDateFixed = false; }

async function deleteEvent(id) {

  if (!canDelete("events")) {
    showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
    return;
  }

  if (!confirm("Excluir este evento?")) {
    return;
  }

  try {

    await deleteEventData(id);
    await refreshAppData();

  } catch (error) {

    console.error("Error deleting event:", error);

    showAppMessage(error.message || "Erro ao excluir evento");

  }

}

/* ==========================================================
   EVENTOS
   ========================================================== */
loginButton.addEventListener("click", async () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

if (!response.ok) {
  const txt = await response.text();
  console.log(txt);
  throw new Error('Login failed');
}

    const data = await response.json();
    console.log("LOGIN RESPONSE"); // 29-07-2026
    console.log(data); // 29-07-2026
    setAuthToken(data.token);
    setAuth(data.user);
    loginError.textContent = "";
    settingsAuthorized = false;
    await renderApp();
    showApp();
  } catch (error) {
    loginError.textContent = "Usuário ou senha inválidos.";
    loginPassword.value = "";
    loginPassword.focus();
  }
});

loginUsername.addEventListener("input", () => { loginError.textContent = ""; });
loginPassword.addEventListener("input", () => { loginError.textContent = ""; });
loginPassword.addEventListener("keydown", e => { if (e.key === "Enter") loginButton.click(); });

logoutButton.addEventListener("click", () => { clearAuth(); settingsAuthorized = false; showLogin(); });

newCarButton.addEventListener("click", () => openModal());
closeModal.addEventListener("click",   closeModalWindow);
cancelModal.addEventListener("click",  closeModalWindow);
filterText.addEventListener("input",   renderCarsTable);
filterStatus.addEventListener("change", renderCarsTable);

// Eventos de Usuários
newUserButton.addEventListener("click", () => openUserModal());
closeUserModal.addEventListener("click", closeUserModalWindow);
cancelUserModal.addEventListener("click", closeUserModalWindow);

userForm.addEventListener("submit", async e => {
  e.preventDefault();
  userFormError.textContent = "";

  const permissions = Array.from(userPermissionsContainer.querySelectorAll('input[type="checkbox"]:checked'))
    .map(input => Number(input.dataset.permissionId))
    .filter(Boolean);

  if (permissions.length === 0) {
    userFormError.textContent = "Selecione pelo menos uma permissão antes de salvar.";
    return;
  }

  const userData = {
    username: userName.value.trim(),
    email: userEmail.value.trim() || null,
    role: userRole.value,
    status: userStatus.value,
    permissions
  };

  if (!userData.username) {
    userFormError.textContent = "Nome de usuário é obrigatório";
    return;
  }

  if (!editingUserId && !userPassword.value) {
    userFormError.textContent = "Senha é obrigatória para novo usuário";
    return;
  }

  try {
    if (editingUserId) {
      // Atualizar usuário existente
      await updateUser(editingUserId, userData);
      
      // Atualizar senha se fornecida
      if (userPassword.value.trim()) {
        await updateUserPassword(editingUserId, userPassword.value.trim());
      }
      
      showAppMessage(`Usuário atualizado com sucesso.`, "info");
    } else {
      // Criar novo usuário
      userData.password = userPassword.value.trim();
      await createUser(userData);
      showAppMessage(`Usuário criado com sucesso.`, "info");
    }

    await refreshAppData();
    closeUserModalWindow();
  } catch (error) {
    console.error('Error saving user:', error);
    userFormError.textContent = error.message || 'Erro ao salvar usuário';
  }
});

settingsAuthForm.addEventListener("submit", e => {
  e.preventDefault();
  if (currentUser.role !== "admin") { settingsError.textContent = "Acesso negado: somente administrador pode abrir configurações."; return; }
  if (settingsPasswordInput.value.trim() !== settingsPassword) { settingsError.textContent = "Senha incorreta."; return; }
  settingsAuthorized = true;
  closeSettingsAuthModal();
  setActiveTab("settings");
});

closeSettingsAuth.addEventListener("click",  closeSettingsAuthModal);
cancelSettingsAuth.addEventListener("click", closeSettingsAuthModal);

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    if (tab === "settings") {
      if (currentUser.role !== "admin") { showAppMessage("Acesso negado: somente administrador pode ver esta área.", "danger"); return; }
      if (!settingsAuthorized) { openSettingsAuth(); return; };
    }
    if (tab !== "settings") clearAppMessage();
    setActiveTab(tab);
  });
});

carForm.addEventListener("submit", async e => {
  e.preventDefault();

  const carData = {
    name: carName.value.trim(),
    model: carModel.value.trim(),
    plate: carPlate.value.trim().toUpperCase(),
    chassis: carChassis.value.trim(),
    arrivalDate: carArrival.value,
  };

  if (!carData.name || !carData.model || !carData.plate) {
    alert("Preencha nome, modelo e placa.");
    return;
  }

 try {

  if (editingId) {

    if (!canEdit("cars")) {
      showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
      return;
    }

    await updateCarData(editingId, carData);

  } else {

    if (!canCreate("cars")) {
      showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
      return;
    }

    await createCar(carData);

  }

  await refreshAppData();
  closeModalWindow();

} catch (error) {

  console.error("Error saving car:", error);

  showAppMessage(error.message || "Erro ao salvar veículo");

}
});

// Agenda
newEventButton.addEventListener("click", () => openEventModal());
calPrev.addEventListener("click", () => { calCurrentDate.setMonth(calCurrentDate.getMonth()-1); renderCalendar(); });
calNext.addEventListener("click", () => { calCurrentDate.setMonth(calCurrentDate.getMonth()+1); renderCalendar(); });
calToday.addEventListener("click", () => { calCurrentDate = new Date(); renderCalendar(); });
closeEventModal.addEventListener("click",  closeEventModalFn);
cancelEventModal.addEventListener("click", closeEventModalFn);
closeExitModal.addEventListener("click", closeExitModalWindow);
cancelExitModal.addEventListener("click", closeExitModalWindow);
backExitSelection.addEventListener("click", () => {
  selectedExitCarId = null;
  exitSelectedCard.innerHTML = "";
  showExitSelectionStep();
  exitModalTitle.textContent = "Registrar saída";
  exitModalSubtitle.textContent = "Escolha o veículo e preencha os dados da saída.";
  exitForm.reset();
});
closeDayModal.addEventListener("click",    closeDayModalFn);
closeDayModalBtn.addEventListener("click", closeDayModalFn);
addEventFromDay.addEventListener("click",  () => { closeDayModalFn(); openEventModal(null, dayModalDate); });

exitForm.addEventListener("submit", submitExitRegistration);

eventForm.addEventListener("submit", async e => {
  e.preventDefault();
  const evData = {
    type: eventType.value,
    title: eventTitle.value.trim() || null,
    date: eventDate.value,
    time: eventTime.value,
    carId: eventCar.value || null,
    vendor: eventVendor.value.trim(),
    client: eventClient.value.trim() || null,
    note: eventNote.value.trim() || null
  };

  if (!evData.date || !evData.time || !evData.vendor) {
    alert("Preencha data, horário e vendedor.");
    return;
  }

  try {

  if (editingEventId) {

    if (!canEdit("events")) {
      showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
      return;
    }

    await updateEventData(editingEventId, evData);

  } else {

    if (!canCreate("events")) {
      showAppMessage("VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!");
      return;
    }

    await createEvent(evData);

  }

  await refreshAppData();
  closeEventModalFn();

} catch (error) {

  console.error("Error saving event:", error);

  showAppMessage(error.message || "Erro ao salvar evento");

}
});

window.addEventListener("click", e => {
  if (e.target === carModal)          closeModalWindow();
  if (e.target === settingsAuthModal) closeSettingsAuthModal();
  if (e.target === eventModal)        closeEventModalFn();
  if (e.target === exitModal)         closeExitModalWindow();
  if (e.target === dayModal)          closeDayModalFn();
  if (e.target === notificationModal) notificationModal.classList.add("hidden");
  if (e.target === upcomingModal)     upcomingModal.classList.add("hidden");
});

/* NOVOS EVENT LISTENERS */
notificationBell.addEventListener("click", showNotificationModal);
upcomingExitsButton.addEventListener("click", showUpcomingModal);
closeNotificationModal.addEventListener("click", () => notificationModal.classList.add("hidden"));
closeUpcomingModal.addEventListener("click", () => upcomingModal.classList.add("hidden"));

/* ==========================================================
   START
   ========================================================== */
async function init() {

    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    authToken = null;
    currentUser = null;

    showLogin();

}

init();
