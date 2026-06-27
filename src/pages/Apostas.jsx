import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, prazoJogo, indiceDiaHoje, NOMES_AMIGOS,
  FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, PRAZOS_ELIMINACAO
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

const chavesGrupos = Object.keys(EQUIPAS_POR_GRUPO)
const PARES_GRUPOS = []
for (let i = 0; i < chavesGrupos.length; i += 2) {
  PARES_GRUPOS.push([chavesGrupos[i], chavesGrupos[i + 1]].filter(Boolean))
}

function labelFase(id) {
  if (!id) return null
  if (id.startsWith('R32')) return '32 Avos de Final'
  if (id.startsWith('R16')) return '16 Avos de Final'
  if (id.startsWith('QF'))  return 'Quartos de Final'
  if (id.startsWith('SF'))  return 'Meias-Finais'
  if (id === 'TP1')          return '3.º Lugar'
  if (id === 'FN1')          return 'Final'
  return null
}

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos')
  const [diaIdx, setDiaIdx] = useState(indiceDiaHoje())
  const [parIdx, setParIdx] = useState(0)
  const [faseElim, setFaseElim] = useState('r32')
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [apostas, setApostas] = useState({ jogos: {}, grupos: {} })
  const [valoresGrupos, setValoresGrupos] = useState({})
  const [apostasCarregadas, setApostasCarregadas] = useState(false)
  const [scores, setScores] = useState({})
  const [scoresElim, setScoresElim] = useState({}) // { id_jogo: { casa, fora, passa } }
  const [equipasElim, setEquipasElim] = useState({}) // { id_jogo: { casa, fora } }
  const [campeao, setCampeao] = useState('')
  const [marcador, setMarcador] = useState('')
  const [confirmacao, setConfirmacao] = useState(null)
  const { toast, showToast } = useToast()
  const agora = new Date()
  const bloqFinal = agora >= LIMITE_FASE_FINAL && !isAdmin
  const bloqGrupos = agora >= LIMITE_GRUPOS && !isAdmin
  const dia = CALENDARIO[diaIdx]

  useEffect(() => { carregarApostas() }, [jogadorSel])

  async function carregarApostas() {
    try {
      const [{ data: jogosData }, { data: gruposData }, { data: jData }, { data: elimData }, { data: equipasData }] = await Promise.all([
        supabase.from('palpites').select('id_jogo, casa, fora').eq('jogador', jogadorSel),
        supabase.from('palpites_grupos').select('grupo, primeiro, segundo').eq('jogador', jogadorSel),
        supabase.from('jogadores').select('campeao, marcador').eq('nome', jogadorSel).single(),
        supabase.from('palpites_eliminacao').select('id_jogo, casa, fora, passa').eq('jogador', jogadorSel),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
      ])

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => {
        jogosMap[j.id_jogo] = {
          casa: j.casa !== null && j.casa !== undefined ? Number(j.casa) : null,
          fora: j.fora !== null && j.fora !== undefined ? Number(j.fora) : null,
        }
      })

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => {
        gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo }
      })

      const elimMap = {}
      if (elimData) elimData.forEach(e => {
        elimMap[e.id_jogo] = { casa: e.casa, fora: e.fora, passa: e.passa || null }
      })

      const equipasMap = {}
      if (equipasData) equipasData.forEach(e => {
        equipasMap[e.id_jogo] = { casa: e.casa, fora: e.fora }
      })

      setApostas({ jogos: jogosMap, grupos: gruposMap })
      setValoresGrupos(gruposMap)
      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')
      setScores(jogosMap)
      setScoresElim(elimMap)
      setEquipasElim(equipasMap)
      setApostasCarregadas(true)
    } catch (err) {
      console.error('Erro ao carregar apostas:', err)
    }
  }

  // ── Confirmações ──────────────────────────────────────────
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

  function pedirConfirmacaoElim() {
    const prazo = PRAZOS_ELIMINACAO[faseElim]
    if (prazo && agora >= prazo && !isAdmin) { showToast('🔒 Prazo encerrado.'); return }
    const jogos = JOGOS_ELIMINACAO[faseElim] || []
    const linhas = []
    for (const j of jogos) {
      const a = scoresElim[j.id]
      if (!a || a.casa === null || a.casa === undefined) continue
      const eq = equipasElim[j.id]
      const nomeCasa = eq?.casa || j.label
      const nomeFora = eq?.fora || ''
      linhas.push(`${nomeCasa} ${a.casa} — ${a.fora} ${nomeFora}${a.passa ? ` → ${a.passa}` : ''}`)
    }
    if (linhas.length === 0) { showToast('ℹ️ Sem apostas para guardar.'); return }
    setConfirmacao({ tipo: 'elim', linhas })
  }

  function pedirConfirmacaoGrupo() {
    const ativos = PARES_GRUPOS[parIdx] || []
    const linhas = []
    let temPeloMenosUm = false
    for (const gNome of ativos) {
      const p1 = valoresGrupos[gNome]?.primeiro
      const p2 = valoresGrupos[gNome]?.segundo
      if (p1 || p2) temPeloMenosUm = true
      linhas.push(`${gNome} ➔ 🥇 ${p1 || '—'} · 🥈 ${p2 || '—'}`)
    }
    if (!temPeloMenosUm) { showToast('❌ Escolhe pelo menos um lugar!'); return }
    setConfirmacao({ tipo: 'grupo', linhas, gruposAlvo: ativos })
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

    if (tipo === 'elim') {
      const jogos = JOGOS_ELIMINACAO[faseElim] || []
      for (const j of jogos) {
        const a = scoresElim[j.id]
        if (!a || a.casa === null || a.casa === undefined) continue
        await supabase.from('palpites_eliminacao').upsert(
          { jogador: jogadorSel, id_jogo: j.id, casa: Number(a.casa), fora: Number(a.fora), passa: a.passa || null },
          { onConflict: 'jogador,id_jogo' }
        )
      }
      showToast(`✅ ${LABEL_FASE[faseElim]} guardado!`)
    }

    if (tipo === 'grupo') {
      for (const gNome of (confirmacao.gruposAlvo || [])) {
        const p1 = valoresGrupos[gNome]?.primeiro || null
        const p2 = valoresGrupos[gNome]?.segundo || null
        await supabase.from('palpites_grupos').upsert(
          { jogador: jogadorSel, grupo: gNome, primeiro: p1, segundo: p2 },
          { onConflict: 'jogador,grupo' }
        )
      }
      showToast('✅ Grupos guardados!')
    }

    if (tipo === 'final') {
      await supabase.from('jogadores').upsert(
        { nome: jogadorSel, campeao: campeao || null, marcador: marcador || null },
        { onConflict: 'nome' }
      )
      showToast('✅ Fase final guardada!')
    }
  }

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
      if (diff < 60 * 60 * 1000) return { tipo: 'urgente', msg: `⚠️ Prazo fecha em ${tempo} — ${j.casa} vs ${j.fora}` }
      if (diff < 48 * 60 * 60 * 1000) return { tipo: 'info', msg: `⏱ ${tempo} para fechar apostas — ${j.casa} vs ${j.fora}` }
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
        <button className={`submenu-btn ${subMenu === 'jogos' ? 'active' : ''}`} onClick={() => setSubMenu('jogos')}>Grupos</button>
        <button className={`submenu-btn ${subMenu === 'elim' ? 'active' : ''}`} onClick={() => setSubMenu('elim')}>Eliminat.</button>
        <button className={`submenu-btn ${subMenu === 'grupos' ? 'active' : ''}`} onClick={() => setSubMenu('grupos')}>Vencedores</button>
      </div>

      {/* ── MODAL ── */}
      {confirmacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 340 }}>
            <h4 style={{ fontFamily: 'Oswald,sans-serif', textAlign: 'center', color: 'var(--gold)', marginBottom: 16, letterSpacing: 1 }}>Confirmar aposta?</h4>
            {confirmacao.linhas.map((linha, i) => (
              <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 14, color: '#eee', margin: '6px 0' }}>{linha}</p>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmarGuardar}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOGOS FASE DE GRUPOS ── */}
      {subMenu === 'jogos' && (
        <div>
          {alerta && (
            <div className={`alert ${alerta.tipo === 'urgente' ? 'alert-warning' : 'alert-info'}`} style={{ marginBottom: 10 }}>
              {alerta.msg}
            </div>
          )}
          <div className="nav-row">
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.max(0, diaIdx - 1))}>◀</button>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>{dia?.data}</div>
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO.length - 1, diaIdx + 1))}>▶</button>
          </div>

          {dia?.jogos.map(j => {
            const prazo = prazoJogo(j.id)
            const bloqueado = prazo && agora >= prazo && !isAdmin
            const temAposta = scores[j.id]?.casa !== null && scores[j.id]?.casa !== undefined
                           && scores[j.id]?.fora !== null && scores[j.id]?.fora !== undefined
            return (
              <div key={j.id} className="card" style={{ marginBottom: 10, borderColor: temAposta && !bloqueado ? 'rgba(0,200,83,0.3)' : '#1e1e1e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: bloqueado ? 'var(--red)' : '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    ⏱ {j.hora} Lisboa{bloqueado ? '  🔒' : ''}{!bloqueado && isAdmin && prazo && agora >= prazo ? '  🔓' : ''}
                  </span>
                  <span style={{ fontSize: 11, color: temAposta ? '#00C853' : '#444', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {temAposta ? '✓ apostado' : '· por apostar'}
                  </span>
                </div>
                {labelFase(j.id) && (
                  <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
                    🏟️ {labelFase(j.id)}
                  </div>
                )}
                <div className="jogo-row">
                  <div className="team-name left">{j.casa}</div>
                  <input type="number" min={0} value={scores[j.id]?.casa ?? ''} onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))} disabled={bloqueado} placeholder="–" />
                  <span className="sep">—</span>
                  <input type="number" min={0} value={scores[j.id]?.fora ?? ''} onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))} disabled={bloqueado} placeholder="–" />
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

      {/* ── ELIMINATÓRIAS ── */}
      {subMenu === 'elim' && (
        <div>
          {/* Selector de fase */}
          <div className="submenu" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
            {FASES_ELIMINACAO.map(f => {
              const prazo = PRAZOS_ELIMINACAO[f]
              const bloq = prazo && agora >= prazo && !isAdmin
              return (
                <button key={f} className={`submenu-btn ${faseElim === f ? 'active' : ''}`} onClick={() => setFaseElim(f)}
                  style={{ fontSize: 11, opacity: bloq ? 0.5 : 1 }}>
                  {f === 'r32' ? 'R32' : f === 'r16' ? 'R16' : f === 'quartos' ? 'QF' : f === 'meias' ? 'SF' : f === 'terceiro' ? '3.º' : '🏆'}
                  {bloq ? ' 🔒' : ''}
                </button>
              )
            })}
          </div>

          <h4 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 12, fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
            {LABEL_FASE[faseElim]}
          </h4>

          {(() => {
            const prazo = PRAZOS_ELIMINACAO[faseElim]
            const bloqueado = prazo && agora >= prazo && !isAdmin
            if (bloqueado) return <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Prazo de apostas encerrado.</div>
            return null
          })()}

          {(JOGOS_ELIMINACAO[faseElim] || []).map(j => {
            const prazo = PRAZOS_ELIMINACAO[faseElim]
            const bloqueado = prazo && agora >= prazo && !isAdmin
            const eq = equipasElim[j.id]
            const nomeCasa = eq?.casa || null
            const nomeFora = eq?.fora || null
            const a = scoresElim[j.id] || {}
            const temAposta = a.casa !== null && a.casa !== undefined && a.fora !== null && a.fora !== undefined

            return (
              <div key={j.id} className="card" style={{ marginBottom: 10, borderColor: temAposta && !bloqueado ? 'rgba(0,200,83,0.3)' : '#1e1e1e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#555', letterSpacing: 1, textTransform: 'uppercase' }}>{j.label}</span>
                  <span style={{ fontSize: 11, color: temAposta ? '#00C853' : '#444', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {temAposta ? '✓ apostado' : '· por apostar'}
                  </span>
                </div>

                {/* Resultado */}
                <div className="jogo-row" style={{ marginBottom: nomeCasa ? 10 : 0 }}>
                  <div className="team-name left" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                    {nomeCasa || <span style={{ color: '#333' }}>A definir</span>}
                  </div>
                  <input type="number" min={0} value={a.casa ?? ''} onChange={e => setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))} disabled={bloqueado} placeholder="–" />
                  <span className="sep">—</span>
                  <input type="number" min={0} value={a.fora ?? ''} onChange={e => setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))} disabled={bloqueado} placeholder="–" />
                  <div className="team-name right" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                    {nomeFora || <span style={{ color: '#333' }}>A definir</span>}
                  </div>
                </div>

                {/* Quem passa */}
                {nomeCasa && nomeFora && (
                  <div>
                    <p style={{ fontSize: 10, color: '#444', textAlign: 'center', margin: '4px 0 6px', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Barlow Condensed,sans-serif' }}>
                      Quem passa? <span style={{ color: '#00C853' }}>(+1 pt)</span>
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[nomeCasa, nomeFora].map(eq => {
                        const ativo = a.passa === eq
                        return (
                          <button key={eq} onClick={() => !bloqueado && setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], passa: prev[j.id]?.passa === eq ? null : eq } }))}
                            disabled={bloqueado}
                            style={{
                              flex: 1, padding: '7px 4px', borderRadius: 8, cursor: bloqueado ? 'default' : 'pointer',
                              border: `1px solid ${ativo ? '#00C853' : '#2a2a2a'}`,
                              background: ativo ? 'rgba(0,200,83,0.1)' : 'transparent',
                              color: ativo ? '#00C853' : '#666',
                              fontSize: 'clamp(10px,2.3vw,12px)', fontFamily: 'Barlow Condensed,sans-serif',
                              transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                            {eq}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {(() => {
            const prazo = PRAZOS_ELIMINACAO[faseElim]
            const bloqueado = prazo && agora >= prazo && !isAdmin
            if (bloqueado) return null
            return (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoElim}>Guardar</button>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── VENCEDORES DOS GRUPOS ── */}
      {subMenu === 'grupos' && (
        <div>
          {bloqFinal && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição do Campeão e Marcador encerrada.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, marginTop: 12 }}>
            <select value={campeao} onChange={e => setCampeao(e.target.value)} disabled={bloqFinal}>
              <option value="">Campeão do mundo...</option>
              {TODAS_EQUIPAS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <input type="text" placeholder="Melhor marcador (nome do jogador)" value={marcador} onChange={e => setMarcador(e.target.value)} disabled={bloqFinal} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoFinal} disabled={bloqFinal}>Guardar</button>
            </div>
          </div>
          <hr />
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0' }}>📊 Vencedores dos grupos</h4>
          {bloqGrupos && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição das posições encerrada.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {PARES_GRUPOS.map((par, idx) => {
              const label = par.map(g => g.replace('Grupo ', '')).join(' / ')
              const ativo = parIdx === idx
              return (
                <button key={idx} type="button" onClick={() => setParIdx(idx)}
                  style={{ padding: '10px 4px', fontSize: '12px', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', borderRadius: 8,
                    border: ativo ? '1px solid var(--gold)' : '1px solid #2a2a2a', color: ativo ? 'var(--gold)' : '#aaa', background: ativo ? '#161616' : '#0d0d0d', cursor: 'pointer' }}>
                  Gr. {label}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PARES_GRUPOS[parIdx]?.map(gNome => (
              <div key={gNome} style={{ border: '1px solid #1e1e1e', padding: '12px', borderRadius: '8px', background: '#0a0a0a' }}>
                <span style={{ fontSize: 13, fontFamily: 'Oswald, sans-serif', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>{gNome.toUpperCase()}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <select value={valoresGrupos[gNome]?.primeiro || ''} onChange={e => setValoresGrupos(prev => ({ ...prev, [gNome]: { ...prev[gNome], primeiro: e.target.value } }))} disabled={bloqGrupos}>
                    <option value="">🥇 1.º Lugar...</option>
                    {EQUIPAS_POR_GRUPO[gNome]?.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                  <select value={valoresGrupos[gNome]?.segundo || ''} onChange={e => setValoresGrupos(prev => ({ ...prev, [gNome]: { ...prev[gNome], segundo: e.target.value } }))} disabled={bloqGrupos}>
                    <option value="">🥈 2.º Lugar...</option>
                    {EQUIPAS_POR_GRUPO[gNome]?.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              </div>
            ))}
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
