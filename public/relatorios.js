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

function contarPorStatus(bms) {
  return {
    'Vendidas': bms.filter((bm) => bm.status === 'Vendidas').length,
    '250 disparos': bms.filter((bm) => bm.status === '250 disparos').length,
    '2.000 disparos': bms.filter((bm) => bm.status === '2.000 disparos').length,
    '10.000 disparos': bms.filter((bm) => bm.status === '10.000 disparos').length,
    '100.000 disparos': bms.filter((bm) => bm.status === '100.000 disparos').length
  };
}

function montarRankingPerfis(bms) {
  const mapa = {};

  bms.forEach((bm) => {
    const nomePerfil = bm.perfis?.nome || 'Sem perfil';
    mapa[nomePerfil] = (mapa[nomePerfil] || 0) + 1;
  });

  return Object.entries(mapa)
    .map(([perfil, total]) => ({ perfil, total }))
    .sort((a, b) => b.total - a.total);
}

function montarTabela(lista, tbodyId, tipo) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-td">Nenhum registro encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((bm) => {
    if (tipo === 'bm') {
      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(bm.perfis?.nome || '-')}</td>
          <td>${escapeHtml(bm.nome_bm || '-')}</td>
          <td><span class="${getClasseStatus(bm.status)}">${escapeHtml(bm.status || '-')}</span></td>
          <td>${formatarData(bm.updated_at)}</td>
        </tr>
      `;
    }
  });
}

function montarTabelaRanking(lista) {
  const tbody = document.getElementById('rankingPerfisTable');
  tbody.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="empty-td">Nenhum perfil encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((item) => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(item.perfil)}</td>
        <td>${item.total}</td>
      </tr>
    `;
  });
}

function criarGraficoStatus(contagem) {
  const canvas = document.getElementById('statusChart');
  const ctx = canvas.getContext('2d');

  if (window.statusChartInstance) {
    window.statusChartInstance.destroy();
  }

  window.statusChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Vendidas', '250', '2.000', '10.000', '100.000'],
      datasets: [
        {
          label: 'Quantidade de BMs',
          data: [
            contagem['Vendidas'],
            contagem['250 disparos'],
            contagem['2.000 disparos'],
            contagem['10.000 disparos'],
            contagem['100.000 disparos']
          ],
          borderWidth: 0,
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f8fbff'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#c9d8ff'
          },
          grid: {
            color: 'rgba(255,255,255,0.08)'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#c9d8ff',
            precision: 0
          },
          grid: {
            color: 'rgba(255,255,255,0.08)'
          }
        }
      }
    }
  });
}

async function carregarRelatorios() {
  const res = await fetch('/api/bms');
  const bms = await res.json();

  if (!Array.isArray(bms)) {
    return;
  }

  const contagem = contarPorStatus(bms);
  criarGraficoStatus(contagem);

  const rankingPerfis = montarRankingPerfis(bms);
  montarTabelaRanking(rankingPerfis);

  const bmsGrandes = bms.filter(
    (bm) => bm.status === '10.000 disparos' || bm.status === '100.000 disparos'
  );
  montarTabela(bmsGrandes, 'bmsGrandesTable', 'bm');

  const bmsAnalise = bms.filter((bm) => bm.status === 'Vendidas');
  montarTabela(bmsAnalise, 'bmsAnaliseTable', 'bm');
}

carregarRelatorios();
