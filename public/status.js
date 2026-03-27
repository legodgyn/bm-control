const STATUS = [
  'Vendidas',
  '250 disparos',
  '2.000 disparos',
  '10.000 disparos',
  '100.000 disparos'
];

let statusSelecionado = '';

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

function atualizarBotoesStatus() {
  document.querySelectorAll('.status-filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const alvo = document.querySelector(`[data-status-btn="${statusSelecionado || 'todos'}"]`);
  if (alvo) alvo.classList.add('active');
}

function setStatusAtivo(status) {
  statusSelecionado = status;
  atualizarBotoesStatus();
  carregarListaStatus();
}

async function carregarPerfisFiltro() {
  const res = await fetch('/api/perfis');
  const perfis = await res.json();

  const select = document.getElementById('filtroPerfil');
  if (!select) return;

  select.innerHTML = '<option value="">Todos os perfis</option>';

  if (Array.isArray(perfis)) {
    perfis.forEach((perfil) => {
      select.innerHTML += `<option value="${perfil.id}">${escapeHtml(perfil.nome)}</option>`;
    });
  }
}

function getFiltroPerfil() {
  const el = document.getElementById('filtroPerfil');
  return el ? el.value : '';
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

  await carregarResumoStatus();
  await carregarListaStatus();
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

  await carregarResumoStatus();
  await carregarListaStatus();
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

  await carregarResumoStatus();
  await carregarListaStatus();
}

async function carregarResumoStatus() {
  const res = await fetch('/api/bms/resumo');
  const resumo = await res.json();

  document.getElementById('countAnalise').textContent = resumo.vendidas ?? 0;
  document.getElementById('count250').textContent = resumo.status250 ?? 0;
  document.getElementById('count2000').textContent = resumo.status2000 ?? 0;
  document.getElementById('count10000').textContent = resumo.status10000 ?? 0;
  document.getElementById('count100000').textContent = resumo.status100000 ?? 0;
}

async function carregarListaStatus() {
  const perfil_id = getFiltroPerfil();
  let url = '/api/bms';

  if (perfil_id) {
    url += `?perfil_id=${encodeURIComponent(perfil_id)}`;
  }

  const res = await fetch(url);
  const bms = await res.json();

  const lista = document.getElementById('statusCards');
  const contador = document.getElementById('contadorStatus');

  lista.innerHTML = '';

  if (!Array.isArray(bms)) {
    contador.textContent = '0 registro(s)';
    lista.innerHTML = `<div class="empty-state">Não foi possível carregar os registros.</div>`;
    return;
  }

  const filtradas = statusSelecionado
    ? bms.filter((bm) => bm.status === statusSelecionado)
    : bms;

  contador.textContent = `${filtradas.length} registro(s)`;

  if (filtradas.length === 0) {
    lista.innerHTML = `<div class="empty-state">Nenhuma BM encontrada para esse filtro.</div>`;
    return;
  }

  filtradas.forEach((bm) => {
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

    lista.innerHTML += `
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

async function iniciar() {
  await carregarPerfisFiltro();
  await carregarResumoStatus();
  await carregarListaStatus();
  atualizarBotoesStatus();

  const selectPerfil = document.getElementById('filtroPerfil');
  if (selectPerfil) {
    selectPerfil.addEventListener('change', () => {
      carregarListaStatus();
    });
  }
}

iniciar();
