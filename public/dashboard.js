const STATUS = [
  'Vendidas',
  '250 disparos',
  '2.000 disparos',
  '10.000 disparos',
  '100.000 disparos'
];

let buscaTimeout = null;

function escapeHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatarData(dataIso) {
  if (!dataIso) return '-';

  const data = new Date(dataIso);

  if (isNaN(data.getTime())) return '-';

  return data.toLocaleString('pt-BR');
}

function getClasseStatus(status) {
  if (status === 'Vendidas') return 'badge badge-analise';
  if (status === '250 disparos') return 'badge badge-250';
  if (status === '2.000 disparos') return 'badge badge-2000';
  if (status === '10.000 disparos') return 'badge badge-10000';
  if (status === '100.000 disparos') return 'badge badge-100000';
  return 'badge';
}

function getBarraStatusClass(status) {
  if (status === 'Vendidas') return 'top-status-analise';
  if (status === '250 disparos') return 'top-status-250';
  if (status === '2.000 disparos') return 'top-status-2000';
  if (status === '10.000 disparos') return 'top-status-10000';
  if (status === '100.000 disparos') return 'top-status-100000';
  return '';
}

function montarQueryString() {
  const perfil_id = document.getElementById('filtroPerfil').value;
  const q = document.getElementById('buscaNome').value.trim();

  const params = new URLSearchParams();

  if (perfil_id) params.set('perfil_id', perfil_id);
  if (q) params.set('q', q);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

async function carregarPerfis() {
  const res = await fetch('/api/perfis');
  const perfis = await res.json();

  const filtroPerfil = document.getElementById('filtroPerfil');
  filtroPerfil.innerHTML = '<option value="">Todos os perfis</option>';

  perfis.forEach((perfil) => {
    filtroPerfil.innerHTML += `<option value="${perfil.id}">${escapeHtml(perfil.nome)}</option>`;
  });
}

async function atualizarStatus(id, novoStatus) {
  const res = await fetch(`/api/bms/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: novoStatus })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Erro ao atualizar status.');
    return;
  }

  await atualizarTela();
}

async function excluirBM(id) {
  const confirmar = confirm('Tem certeza que deseja excluir esta BM?');
  if (!confirmar) return;

  const res = await fetch(`/api/bms/${id}`, {
    method: 'DELETE'
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Erro ao excluir BM.');
    return;
  }

  await atualizarTela();
}

async function editarBM(id, nomeAtual, observacaoAtual, perfilAtual, statusAtual) {
  const novoNome = prompt('Digite o novo nome da BM:', nomeAtual);
  if (novoNome === null) return;

  const novaObservacao = prompt('Digite a observação da BM:', observacaoAtual || '');
  if (novaObservacao === null) return;

  const res = await fetch(`/api/bms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome_bm: novoNome,
      observacao: novaObservacao,
      perfil_id: perfilAtual,
      status: statusAtual
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Erro ao editar BM.');
    return;
  }

  await atualizarTela();
}

async function carregarResumo() {
  const queryString = montarQueryString();
  const res = await fetch(`/api/bms/resumo${queryString}`);
  const resumo = await res.json();

  document.getElementById('statTotal').textContent = resumo.total ?? 0;
  document.getElementById('statAnalise').textContent = resumo.emAnalise ?? 0;
  document.getElementById('stat250').textContent = resumo.status250 ?? 0;
  document.getElementById('stat2000').textContent = resumo.status2000 ?? 0;
  document.getElementById('stat10000').textContent = resumo.status10000 ?? 0;
  document.getElementById('stat100000').textContent = resumo.status100000 ?? 0;
}

async function carregarBMs() {
  const queryString = montarQueryString();
  const res = await fetch(`/api/bms${queryString}`);
  const bms = await res.json();

  const cards = document.getElementById('bmCards');
  const contadorLista = document.getElementById('contadorLista');

  cards.innerHTML = '';
  contadorLista.textContent = `${Array.isArray(bms) ? bms.length : 0} registro(s)`;

  if (!Array.isArray(bms) || bms.length === 0) {
    cards.innerHTML = `<div class="empty-state">Nenhuma BM encontrada.</div>`;
    return;
  }

  bms.forEach((bm) => {
    const options = STATUS.map((status) => {
      const selected = bm.status === status ? 'selected' : '';
      return `<option value="${status}" ${selected}>${status}</option>`;
    }).join('');

    const nomeSeguro = escapeHtml(bm.nome_bm);
    const obsSegura = escapeHtml(bm.observacao || 'Sem observação');
    const nomeJs = JSON.stringify(bm.nome_bm || '');
    const obsJs = JSON.stringify(bm.observacao || '');
    const statusJs = JSON.stringify(bm.status || '');
    const perfilIdJs = JSON.stringify(bm.perfil_id);

    cards.innerHTML += `
      <div class="bm-card ${getBarraStatusClass(bm.status)}">
        <div class="bm-card-top">
          <div>
            <h3 class="bm-title">${nomeSeguro}</h3>
            <div class="bm-meta">Atualizada em: ${formatarData(bm.updated_at)}</div>
          </div>
          <span class="${getClasseStatus(bm.status)}">${escapeHtml(bm.status)}</span>
        </div>

        <div class="bm-profile">Perfil: ${escapeHtml(bm.perfis?.nome || '-')}</div>
        <div class="bm-observacao">${obsSegura}</div>

        <div class="card-actions">
          <select class="status-select" onchange="atualizarStatus(${bm.id}, this.value)">
            ${options}
          </select>

          <button class="mini-btn" onclick='editarBM(${bm.id}, ${nomeJs}, ${obsJs}, ${perfilIdJs}, ${statusJs})'>
            Editar
          </button>

          <button class="mini-btn danger-btn" onclick="excluirBM(${bm.id})">
            Excluir
          </button>
        </div>
      </div>
    `;
  });
}

async function atualizarTela() {
  await carregarResumo();
  await carregarBMs();
}

function limparFiltros() {
  document.getElementById('filtroPerfil').value = '';
  document.getElementById('buscaNome').value = '';
  atualizarTela();
}

function digitarBusca() {
  clearTimeout(buscaTimeout);
  buscaTimeout = setTimeout(() => {
    atualizarTela();
  }, 300);
}

async function iniciar() {
  await carregarPerfis();
  await atualizarTela();
}

iniciar();
