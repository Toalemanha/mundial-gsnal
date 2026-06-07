import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, prazoJogo, indiceDiaHoje, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos')
  const [diaIdx, setDiaIdx] = useState(indiceDiaHoje())
  const [grupo, setGrupo] = useState('Grupo A')
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [apostas, setApostas] = useState({ jogos: {}, grupos: {} })
  const [apostasCarregadas, setApostasCarregadas] = useState(false)
  const [scores, setScores] = useState({})
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [campeao, setCampeao] = useState('')
  const [marcador, setMarcador] = useState('')
  const [confirmacao, setConfirmacao] = useState(null)
  const { toast, showToast } = useToast()
  const agora = new Date()
  const bloqFinal = agora >= LIMITE_FASE_FINAL && !isAdmin
  const bloqGrupos = agora >= LIMITE_GRUPOS && !isAdmin

  useEffect(() => { carregarApostas() }, [jogadorSel])

  async function carregarApostas() {
    try {
      const [{ data: jogosData, error: e1 }, { data: gruposData, error: e2 }, { data: jData }] = await Promise.all([
        supabase.from('palpites').select('id_jogo, casa, fora').eq('jogador', jogadorSel),
        supabase.from('palpites_grupos').select('grupo, primeiro, segundo').eq('jogador', jogadorSel),
        supabase.from('jogadores').select('campeao, marcador').eq('nome', jogadorSel).single(),
      ])

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => {
        // Garante que os valores são números ou null, nunca undefined
        jogosMap[j.id_jogo] = {
          casa: j.casa !== null && j.casa !== undefined ? Number(j.casa) : null,
          fora: j.fora !== null && j.fora !== undefined ? Number(j.fora) : null,
        }
      })

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => {
        gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo }
      })

      setApostas({ jogos: jogosMap, grupos: gruposMap })
      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')
      setScores(jogosMap)
      setApostasCarregadas(true)
    } catch (err) {
      console.error('Erro ao carregar apostas:', err)
    }
  }

  useEffect(() => {
    if (!apostasCarregadas) return
    const g = apostas.grupos?.[grupo] || {}
    setP1(g.primeiro || '')
    setP2(g.segundo || '')
  }, [grupo, apostas, apostasCarregadas])

  const dia = CALENDARIO[diaIdx]

  // ── Guardar com confirmação ───────────────────────────────
  function pedirConfirmacaoJogos() {
    const jogosParaMostrar = []
    let temVazio = false
    for (const j of dia.jogos) {
      const prazo = prazoJogo(j.id)
      if (prazo && agora >= prazo && !isAdmin) continue
      const c = scores[j.id]?.casa
      const f = scores[j.id]?.fora
      if (c === undefined || c === null || f === undefined || f === null) { temVazio = true; break }
      jogosParaMostrar.push({ ...j, sc: c, sf: f })
    }
    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }
    if (jogosParaMostrar.length === 0) { showToast('ℹ️ Não há jogos para guardar.'); return }
    setConfirmacao({ tipo: 'jogos', linhas: jogosParaMostrar.map(j => `${j.casa} ${j.sc} — ${j.sf} ${j.fora}`) })
  }

  function pedirConfirmacaoGrupo() {
    if (!p1 && !p2) { showToast('❌ Escolhe pelo menos um lugar!'); return }
    setConfirmacao({ tipo: 'grupo', linhas: [p1 ? `🥇 1.º: ${p1}` : '🥇 1.º: —', p2 ? `🥈 2.º: ${p2}` : '🥈 2.º: —'] })
  }

  function pedirConfirmacaoFinal() {
    setConfirmacao({ tipo: 'final', linhas: [`🏆 Campeão: ${campeao || '—'}`, `⚽ Marcador: ${marcador || '—'}`] })
  }

  async function confirmarGuardar() {
    const tipo = confirmacao.tipo
    setConfirmacao(null)
    if (tipo === 'jogos') {
      const rows = dia.jogos
        .filter(j => { const p = prazoJogo(j.id); return !(p && agora >= p && !isAdmin) })
        .filter(j => scores[j.id]?.casa !== null && scores[j.id]?.fora !== null)
        .map(j => ({ jogador: jogadorSel, id_jogo: j.id, casa: Number(scores[j.id].casa), fora: Number(scores[j.id].fora) }))
      for (const row of rows) {
        await supabase.from('palpites').upsert(row, { onConflict: 'jogador,id_jogo' })
      }
      showToast(`✅ Jogos de ${dia.data} guardados!`)
    }
    if (tipo === 'grupo') {
      await supabase.from('palpites_grupos').upsert(
        { jogador: jogadorSel, grupo, primeiro: p1 || null, segundo: p2 || null },
        { onConflict: 'jogador,grupo' }
      )
      showToast(`✅ ${grupo} guardado!`)
    }
    if (tipo === 'final') {
      await supabase.from('jogadores').upsert(
        { nome: jogadorSel, campeao: campeao || null, marcador: marcador || null },
        { onConflict: 'nome' }
      )
      showToast('✅ Fase final guardada!')
    }
  }

  // ── Calcular tempo até ao próximo prazo ──────────────────
  function formatarTempo(ms) {
    if (ms <= 0) return null
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    if (h > 48) return null
    if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h`
    if (h > 0) return `${h}h ${m}min`
    return `${m} min`
  }

  function alertaPrazo() {
    for (const j of dia.jogos) {
      const prazo = prazoJogo(j.id)
      if (!prazo) continue
      const diff = prazo - agora
      if (diff <= 0) continue
      const tempo = formatarTempo(diff)
      if (!tempo) continue
      if (diff < 60 * 60 * 1000) {
        return { tipo: 'urgente', msg: `⚠️ Prazo fecha em ${tempo} — ${j.casa} vs ${j.fora}` }
      }
      if (diff < 48 * 60 * 60 * 1000) {
        return { tipo: 'info', msg: `⏱ ${tempo} para fechar apostas — ${j.casa} vs ${j.fora}` }
      }
    }
    return null
  }

  const alerta = alertaPrazo()

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>🎯 As minhas apostas</h2>

      {isAdmin && (
        <select value={jogadorSel} onChange={e => setJogadorSel(e.target.value)} style={{ marginBottom: 12 }}>
          {NOMES_AMIGOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      <div className="submenu">
        <button className={`submenu-btn ${subMenu === 'jogos' ? 'active' : ''}`} onClick={() => setSubMenu('jogos')}>Jogos</button>
        <button className={`submenu-btn ${subMenu === 'grupos' ? 'active' : ''}`} onClick={() => setSubMenu('grupos')}>Vencedores</button>
      </div>


      {/* ── MODAL DE CONFIRMAÇÃO ── */}
      {confirmacao && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20
        }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 340 }}>
            <h4 style={{ fontFamily: 'Oswald,sans-serif', textAlign: 'center', color: 'var(--gold)', marginBottom: 16, letterSpacing: 1 }}>
              Confirmar aposta?
            </h4>
            {confirmacao.linhas.map((linha, i) => (
              <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 16, color: '#eee', margin: '6px 0' }}>
                {linha}
              </p>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmarGuardar}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOGOS ── */}
      {subMenu === 'jogos' && (
        <div>
          {alerta && (
            <div className={`alert ${alerta.tipo === 'urgente' ? 'alert-warning' : 'alert-info'}`} style={{ marginBottom: 10 }}>
              {alerta.msg}
            </div>
          )}

          <div className="nav-row">
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.max(0, diaIdx - 1))}>◀</button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>
              {dia.data}
            </div>
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO.length - 1, diaIdx + 1))}>▶</button>
          </div>

          {dia.jogos.map(j => {
            const prazo = prazoJogo(j.id)
            const bloqueado = prazo && agora >= prazo && !isAdmin
            const horaCor = bloqueado ? 'var(--red)' : '#555'
            const temAposta = scores[j.id]?.casa !== null && scores[j.id]?.casa !== undefined
                           && scores[j.id]?.fora !== null && scores[j.id]?.fora !== undefined

            return (
              <div key={j.id} className="card" style={{
                marginBottom: 10,
                borderColor: temAposta && !bloqueado ? 'rgba(0,200,83,0.3)' : '#1e1e1e',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: horaCor, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    ⏱ {j.hora} Lisboa{bloqueado ? '  🔒' : ''}{!bloqueado && isAdmin && prazo && agora >= prazo ? '  🔓' : ''}
                  </span>
                  <span style={{ fontSize: 11, color: temAposta ? '#00C853' : '#444', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 0.5 }}>
                    {temAposta ? '✓ apostado' : '· por apostar'}
                  </span>
                </div>
                <div className="jogo-row">
                  <div className="team-name left">{j.casa}</div>
                  <input
                    type="number" min={0}
                    value={scores[j.id]?.casa ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado} placeholder="–"
                  />
                  <span className="sep">—</span>
                  <input
                    type="number" min={0}
                    value={scores[j.id]?.fora ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado} placeholder="–"
                  />
                  <div className="team-name right">{j.fora}</div>
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoJogos}>Guardar</button>
          </div>
        </div>
      )}

      {/* ── VENCEDORES ── */}
      {subMenu === 'grupos' && (
        <div>
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 12 }}>🌍 Fase Final</h4>
          {bloqFinal && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição do Campeão e Marcador encerrada.</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <select value={campeao} onChange={e => setCampeao(e.target.value)} disabled={bloqFinal}>
              <option value="">Campeão do mundo...</option>
              {TODAS_EQUIPAS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <input
              type="text" placeholder="Melhor marcador (nome do jogador)"
              value={marcador} onChange={e => setMarcador(e.target.value)} disabled={bloqFinal}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoFinal} disabled={bloqFinal}>Guardar</button>
            </div>
          </div>

          <hr />

          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0' }}>📊 Vencedores dos grupos</h4>
          {bloqGrupos && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição das posições encerrada.</div>}

          <select value={grupo} onChange={e => setGrupo(e.target.value)} style={{ marginBottom: 12 }}>
            {Object.keys(EQUIPAS_POR_GRUPO).map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={p1} onChange={e => setP1(e.target.value)} disabled={bloqGrupos}>
              <option value="">🥇 1.º Lugar...</option>
              {EQUIPAS_POR_GRUPO[grupo].map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <select value={p2} onChange={e => setP2(e.target.value)} disabled={bloqGrupos}>
              <option value="">🥈 2.º Lugar...</option>
              {EQUIPAS_POR_GRUPO[grupo].map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoGrupo} disabled={bloqGrupos}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
