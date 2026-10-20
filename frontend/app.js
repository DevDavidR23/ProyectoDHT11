const API_URL = `${window.location.port === '5173' ? 'http://localhost:3000' : ''}/api/mediciones`;

const $ = (id) => document.getElementById(id);

const state = {
  mediciones: [],
  modo: 'crear',
  detalle: null,
  aEliminar: null,
  emptyMode: 'empty',
};

const icons = {
  eye: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
  trash: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  x: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  check: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  alert: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  info: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  spinner: `<svg class="h-4 w-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>`,
};

const fechaFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fechaCortaFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : '—';
};

const formatFecha = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : fechaFormatter.format(date);
};

const formatFechaCorta = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : fechaCortaFormatter.format(date);
};

const toDateTimeLocal = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const tempBadgeClass = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'border-slate-400/20 bg-slate-400/10 text-slate-300';
  if (number < 18) return 'border-sky-400/20 bg-sky-400/10 text-sky-300';
  if (number <= 26) return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  if (number <= 30) return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
  return 'border-rose-400/20 bg-rose-400/10 text-rose-300';
};

async function apiFetch(path = '', options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  let data = null;
  if (response.status !== 204) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(data?.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

const toastStyles = {
  success: {
    border: 'border-emerald-400/20',
    icon: 'bg-emerald-400/10 text-emerald-300',
    title: 'text-emerald-300',
    label: 'Listo',
    svg: icons.check,
  },
  error: {
    border: 'border-rose-400/20',
    icon: 'bg-rose-400/10 text-rose-300',
    title: 'text-rose-300',
    label: 'Error',
    svg: icons.alert,
  },
  warning: {
    border: 'border-amber-400/20',
    icon: 'bg-amber-400/10 text-amber-300',
    title: 'text-amber-300',
    label: 'Atención',
    svg: icons.alert,
  },
  info: {
    border: 'border-cyan-400/20',
    icon: 'bg-cyan-400/10 text-cyan-300',
    title: 'text-cyan-300',
    label: 'Información',
    svg: icons.info,
  },
};

function showToast(message, type = 'success') {
  const style = toastStyles[type] || toastStyles.info;
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 rounded-xl border bg-slate-900/95 p-4 shadow-2xl shadow-slate-950/60 backdrop-blur animate-toast-in ${style.border}`;
  toast.innerHTML = `
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}">${style.svg}</div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold ${style.title}">${style.label}</p>
      <p class="mt-0.5 text-xs leading-relaxed text-slate-400">${escapeHtml(message)}</p>
    </div>
    <button type="button" data-dismiss class="ml-1 rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200" aria-label="Cerrar notificación">
      ${icons.x}
    </button>
  `;

  let timeout;
  const dismiss = () => {
    clearTimeout(timeout);
    toast.classList.add('translate-x-4', 'opacity-0', 'transition', 'duration-200');
    setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector('[data-dismiss]').addEventListener('click', dismiss);
  $('toast-container').appendChild(toast);
  timeout = setTimeout(dismiss, 4500);
}

function setApiStatus(status) {
  const styles = {
    connecting: {
      container: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
      dot: 'bg-amber-400 animate-pulse-soft',
      text: 'Conectando...',
    },
    online: {
      container: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
      dot: 'bg-emerald-400',
      text: 'API conectada',
    },
    offline: {
      container: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
      dot: 'bg-rose-400',
      text: 'API desconectada',
    },
  };

  const style = styles[status] || styles.connecting;
  $('api-status').className = `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition ${style.container}`;
  $('api-status-dot').className = `h-2 w-2 rounded-full ${style.dot}`;
  $('api-status-text').textContent = style.text;
}

function setTableLoading(loading) {
  const overlay = $('table-loading');
  overlay.classList.toggle('hidden', !loading);
  overlay.classList.toggle('flex', loading);
  $('refresh-btn').disabled = loading;
  $('refresh-icon').classList.toggle('animate-spin-slow', loading);
}

async function fetchAll({ notify = false } = {}) {
  setTableLoading(true);
  try {
    const data = await apiFetch();
    state.mediciones = Array.isArray(data)
      ? data.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];
    state.emptyMode = 'empty';
    setApiStatus('online');
    render();
    if (notify) showToast('Historial actualizado correctamente.', 'success');
  } catch (error) {
    state.mediciones = [];
    state.emptyMode = 'error';
    setApiStatus('offline');
    render();
    showToast(
      error.status ? error.message : 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
      'error',
    );
  } finally {
    setTableLoading(false);
  }
}

function render() {
  renderStats();
  renderTable();
}

function renderStats() {
  const latest = state.mediciones[0];
  const total = state.mediciones.length;
  const promedio =
    total > 0 ? state.mediciones.reduce((sum, medicion) => sum + Number(medicion.temperatura), 0) / total : null;

  $('stat-total').textContent = total;
  $('stat-temperatura').textContent = latest ? formatNumber(latest.temperatura) : '—';
  $('stat-promedio').textContent = promedio === null ? '—' : formatNumber(promedio);

  $('stat-temperatura-info').textContent = latest
    ? `Última lectura · ${formatFechaCorta(latest.timestamp)}`
    : 'Sin datos todavía';
}

function renderTable() {
  const total = state.mediciones.length;
  const hasData = total > 0;
  const isError = state.emptyMode === 'error';

  $('table-count').textContent = total;
  $('table-info').textContent = `${total} ${total === 1 ? 'medición registrada' : 'mediciones registradas'}`;

  $('tabla-wrapper').classList.toggle('hidden', !hasData);
  $('empty-state').classList.toggle('hidden', hasData);
  $('empty-state').classList.toggle('flex', !hasData);

  if (!hasData) {
    $('empty-title').textContent = isError ? 'No se pudo cargar el historial' : 'Sin mediciones todavía';
    $('empty-text').textContent = isError
      ? 'Verifica que el backend esté corriendo en http://localhost:3000 e inténtalo de nuevo.'
      : 'Usa el formulario para registrar la primera lectura del sensor DHT11.';
    $('empty-action').hidden = !isError;
  }

  $('tabla-mediciones').innerHTML = state.mediciones
    .map((medicion) => {
      const badge = tempBadgeClass(medicion.temperatura);
      return `
        <tr class="group transition hover:bg-white/[0.03]" data-row="${medicion.id}">
          <td class="px-6 py-4">
            <span class="inline-flex items-center rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 font-mono text-xs text-slate-400">#${medicion.id}</span>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold ${badge}">
              <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
              ${formatNumber(medicion.temperatura)} °C
            </span>
          </td>
          <td class="px-6 py-4 text-slate-300">${formatFecha(medicion.timestamp)}</td>
          <td class="px-6 py-4">
            <div class="flex justify-end gap-1">
              <button type="button" data-action="ver" data-id="${medicion.id}" class="icon-btn" title="Ver detalle" aria-label="Ver detalle de la medición ${medicion.id}">${icons.eye}</button>
              <button type="button" data-action="editar" data-id="${medicion.id}" class="icon-btn hover:text-cyan-300" title="Editar" aria-label="Editar la medición ${medicion.id}">${icons.edit}</button>
              <button type="button" data-action="eliminar" data-id="${medicion.id}" class="icon-btn hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300" title="Eliminar" aria-label="Eliminar la medición ${medicion.id}">${icons.trash}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function openModal(id) {
  const modal = $(id);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
}

function closeModal(id) {
  const modal = $(id);
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  const anyOpen = ['detail-modal', 'delete-modal'].some((modalId) => !$(modalId).classList.contains('hidden'));
  if (!anyOpen) document.body.classList.remove('overflow-hidden');
}

function highlightRow(id) {
  const row = $('tabla-mediciones').querySelector(`tr[data-row="${id}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.remove('row-highlight');
  void row.offsetWidth;
  row.classList.add('row-highlight');
  setTimeout(() => row.classList.remove('row-highlight'), 2600);
}

function openDetail(medicion) {
  if (!medicion) return;
  state.detalle = medicion;
  $('detail-id').textContent = `#${medicion.id}`;
  $('detail-temperatura').textContent = formatNumber(medicion.temperatura);
  $('detail-fecha').textContent = formatFecha(medicion.timestamp);
  openModal('detail-modal');
}

function askDelete(medicion) {
  if (!medicion) return;
  state.aEliminar = medicion;
  $('delete-id').textContent = `#${medicion.id}`;
  openModal('delete-modal');
}

function setSearchLoading(loading) {
  const button = $('search-btn');
  button.disabled = loading;
  button.classList.toggle('animate-pulse-soft', loading);
}

async function searchById(id) {
  setSearchLoading(true);
  try {
    const medicion = await apiFetch(`/${id}`);
    if (!state.mediciones.some((item) => item.id === medicion.id)) {
      state.mediciones.push(medicion);
      state.mediciones.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      state.emptyMode = 'empty';
      render();
    }
    openDetail(medicion);
    highlightRow(medicion.id);
  } catch (error) {
    if (error.status === 404) {
      showToast(`No existe una medición con el ID ${id}.`, 'warning');
    } else {
      showToast(error.message || 'No se pudo buscar la medición.', 'error');
    }
  } finally {
    setSearchLoading(false);
  }
}

function setMode(mode) {
  state.modo = mode;
  const isUpdate = mode === 'actualizar';

  $('tab-crear').classList.toggle('tab-active', !isUpdate);
  $('tab-actualizar').classList.toggle('tab-active', isUpdate);
  $('tab-crear').setAttribute('aria-pressed', String(!isUpdate));
  $('tab-actualizar').setAttribute('aria-pressed', String(isUpdate));

  $('group-id').classList.toggle('hidden', !isUpdate);
  $('form-title').textContent = isUpdate ? 'Actualizar medición' : 'Nueva medición';
  $('form-submit-text').textContent = isUpdate ? 'Actualizar medición' : 'Guardar medición';
  $('form-hint').textContent = isUpdate
    ? 'Modifica los campos que necesites. La fecha vacía conserva la original.'
    : 'Si no indicas una fecha, se usará el momento actual.';

  if (!isUpdate) {
    $('form-id').value = '';
  }
}

function resetForm({ notify = false } = {}) {
  $('medicion-form').reset();
  setMode('crear');
  if (notify) showToast('Formulario limpio.', 'info');
}

function setFormLoading(loading) {
  const button = $('form-submit');
  button.disabled = loading;
  $('form-submit-icon').classList.toggle('hidden', loading);
  $('form-submit-spinner').classList.toggle('hidden', !loading);
  $('form-submit-text').textContent = loading
    ? state.modo === 'actualizar'
      ? 'Actualizando...'
      : 'Guardando...'
    : state.modo === 'actualizar'
      ? 'Actualizar medición'
      : 'Guardar medición';
}

function switchToUpdate(medicion) {
  if (!medicion) return;
  setMode('actualizar');
  $('form-id').value = medicion.id;
  $('form-temperatura').value = medicion.temperatura;
  $('form-fecha').value = toDateTimeLocal(medicion.timestamp);
  $('form-title').textContent = `Actualizar medición #${medicion.id}`;

  if (window.innerWidth < 1280) {
    $('form-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('form-temperatura').focus({ preventScroll: true });
}

function setLoadButtonLoading(loading) {
  const button = $('load-id-btn');
  button.disabled = loading;
  if (loading) {
    button.dataset.original = button.innerHTML;
    button.innerHTML = `${icons.spinner}<span>Cargando</span>`;
  } else if (button.dataset.original) {
    button.innerHTML = button.dataset.original;
    delete button.dataset.original;
  }
}

async function loadFromFormId() {
  const id = parseId($('form-id').value);
  if (!id) {
    showToast('Ingresa un ID válido para cargar la medición.', 'warning');
    $('form-id').focus();
    return;
  }

  setLoadButtonLoading(true);
  try {
    const medicion = await apiFetch(`/${id}`);
    switchToUpdate(medicion);
    showToast(`Medición #${id} cargada en el formulario.`, 'info');
  } catch (error) {
    if (error.status === 404) {
      showToast(`No existe una medición con el ID ${id}.`, 'warning');
    } else {
      showToast(error.message || 'No se pudo cargar la medición.', 'error');
    }
  } finally {
    setLoadButtonLoading(false);
  }
}

function setDeleteLoading(loading) {
  const button = $('delete-confirm');
  button.disabled = loading;
  if (loading) {
    button.dataset.original = button.innerHTML;
    button.innerHTML = `${icons.spinner}<span>Eliminando...</span>`;
  } else if (button.dataset.original) {
    button.innerHTML = button.dataset.original;
    delete button.dataset.original;
  }
}

async function confirmDelete() {
  const medicion = state.aEliminar;
  if (!medicion) return;

  setDeleteLoading(true);
  try {
    await apiFetch(`/${medicion.id}`, { method: 'DELETE' });
    closeModal('delete-modal');
    if (state.detalle?.id === medicion.id) {
      state.detalle = null;
      closeModal('detail-modal');
    }
    state.aEliminar = null;
    showToast(`Medición #${medicion.id} eliminada correctamente.`, 'success');
    await fetchAll();
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la medición.', 'error');
  } finally {
    setDeleteLoading(false);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const isUpdate = state.modo === 'actualizar';
  const id = isUpdate ? parseId($('form-id').value) : null;
  const temperaturaRaw = $('form-temperatura').value.trim();
  const temperatura = Number(temperaturaRaw);
  const fechaInput = $('form-fecha').value;

  if (isUpdate && !id) {
    showToast('Indica el ID de la medición que deseas actualizar.', 'warning');
    $('form-id').focus();
    return;
  }

  if (temperaturaRaw === '' || !Number.isFinite(temperatura)) {
    showToast('La temperatura es obligatoria y debe ser numérica.', 'warning');
    $('form-temperatura').focus();
    return;
  }

  if (temperatura < -40 || temperatura > 80) {
    showToast('La temperatura debe estar entre -40 °C y 80 °C.', 'warning');
    $('form-temperatura').focus();
    return;
  }

  const body = { temperatura };
  if (fechaInput) body.timestamp = new Date(fechaInput).toISOString();

  setFormLoading(true);
  try {
    if (isUpdate) {
      await apiFetch(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast(`Medición #${id} actualizada correctamente.`, 'success');
    } else {
      const creada = await apiFetch('', { method: 'POST', body: JSON.stringify(body) });
      showToast(`Medición #${creada.id} creada correctamente.`, 'success');
    }
    resetForm();
    await fetchAll();
  } catch (error) {
    if (error.status === 404) {
      showToast(`No existe una medición con el ID ${id}.`, 'warning');
    } else {
      showToast(error.message || 'No se pudo guardar la medición.', 'error');
    }
  } finally {
    setFormLoading(false);
  }
}

function bindEvents() {
  $('refresh-btn').addEventListener('click', () => fetchAll({ notify: true }));
  $('empty-action').addEventListener('click', () => fetchAll());

  $('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const id = parseId($('search-id').value);
    if (!id) {
      showToast('Ingresa un ID válido para buscar.', 'warning');
      $('search-id').focus();
      return;
    }
    searchById(id);
  });

  $('tabla-mediciones').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const medicion = state.mediciones.find((item) => item.id === Number(button.dataset.id));
    if (!medicion) return;

    if (button.dataset.action === 'ver') openDetail(medicion);
    if (button.dataset.action === 'editar') switchToUpdate(medicion);
    if (button.dataset.action === 'eliminar') askDelete(medicion);
  });

  $('tab-crear').addEventListener('click', () => setMode('crear'));
  $('tab-actualizar').addEventListener('click', () => {
    setMode('actualizar');
    $('form-id').focus();
  });

  $('load-id-btn').addEventListener('click', loadFromFormId);
  $('form-reset').addEventListener('click', () => resetForm({ notify: true }));
  $('medicion-form').addEventListener('submit', handleSubmit);

  $('detail-edit').addEventListener('click', () => {
    if (!state.detalle) return;
    closeModal('detail-modal');
    switchToUpdate(state.detalle);
  });

  $('detail-delete').addEventListener('click', () => {
    if (!state.detalle) return;
    const medicion = state.detalle;
    closeModal('detail-modal');
    askDelete(medicion);
  });

  $('delete-confirm').addEventListener('click', confirmDelete);

  document.querySelectorAll('[data-close]').forEach((element) => {
    element.addEventListener('click', () => closeModal(element.dataset.close));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeModal('detail-modal');
    closeModal('delete-modal');
  });
}

function init() {
  bindEvents();
  setMode('crear');
  setApiStatus('connecting');
  fetchAll();
}

init();
