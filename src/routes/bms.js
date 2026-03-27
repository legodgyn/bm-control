import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { perfil_id, q } = req.query;

  let query = supabase
    .from('bms')
    .select(`
      id,
      nome_bm,
      status,
      observacao,
      updated_at,
      perfil_id,
      perfis (
        id,
        nome
      )
    `)
    .order('updated_at', { ascending: false });

  if (perfil_id) {
    query = query.eq('perfil_id', perfil_id);
  }

  if (q && q.trim()) {
    query = query.ilike('nome_bm', `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.get('/resumo', async (req, res) => {
  const { perfil_id, q } = req.query;

  let query = supabase
    .from('bms')
    .select('status, nome_bm, perfil_id');

  if (perfil_id) {
    query = query.eq('perfil_id', perfil_id);
  }

  if (q && q.trim()) {
    query = query.ilike('nome_bm', `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const resumo = {
    total: 0,
    emAnalise: 0,
    status250: 0,
    status2000: 0,
    status10000: 0,
    status100000: 0
  };

  for (const item of data) {
    resumo.total += 1;

    if (item.status === 'Vendidas') resumo.emAnalise += 1;
    if (item.status === '250 disparos') resumo.status250 += 1;
    if (item.status === '2.000 disparos') resumo.status2000 += 1;
    if (item.status === '10.000 disparos') resumo.status10000 += 1;
    if (item.status === '100.000 disparos') resumo.status100000 += 1;
  }

  res.json(resumo);
});

router.post('/', async (req, res) => {
  const { perfil_id, nome_bm, status, observacao } = req.body;

  if (!perfil_id || !nome_bm || !nome_bm.trim() || !status || !status.trim()) {
    return res.status(400).json({ error: 'Preencha perfil, nome da BM e status.' });
  }

  const { data, error } = await supabase
    .from('bms')
    .insert([
      {
        perfil_id,
        nome_bm: nome_bm.trim(),
        status: status.trim(),
        observacao: observacao?.trim() || null,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_bm, status, observacao, perfil_id } = req.body;

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (nome_bm !== undefined) {
    if (!nome_bm.trim()) {
      return res.status(400).json({ error: 'Nome da BM não pode ficar vazio.' });
    }
    updateData.nome_bm = nome_bm.trim();
  }

  if (status !== undefined) {
    if (!status.trim()) {
      return res.status(400).json({ error: 'Status não pode ficar vazio.' });
    }
    updateData.status = status.trim();
  }

  if (observacao !== undefined) {
    updateData.observacao = observacao.trim() || null;
  }

  if (perfil_id !== undefined) {
    updateData.perfil_id = perfil_id;
  }

  const { data, error } = await supabase
    .from('bms')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !status.trim()) {
    return res.status(400).json({ error: 'Status é obrigatório.' });
  }

  const { data, error } = await supabase
    .from('bms')
    .update({
      status: status.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('bms')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

export default router;
