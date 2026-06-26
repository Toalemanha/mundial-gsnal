import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, prazoJogo, indiceDiaHoje, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

const chavesGrupos = Object.keys(EQUIPAS_POR_GRUPO)
const PARES_GRUPOS = []
for (let i = 0; i < chavesGrupos.length; i += 2) {
  PARES_GRUPOS.push([chavesGrupos[i], chavesGrupos[i + 1]].filter(Boolean))
}

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos')
  const [diaIdx, setDiaIdx] = useState(indiceDiaHoje())
  const [parIdx, setParIdx] = useState(0)
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [apostas, setApostas] = useState({ jogos: {}, grupos: {} })
  const [valoresGrupos, setValoresGrupos] = useState({})
  const [apostasCarregadas, setApostasCarregadas] = useState(false)
  const [scores, setScores] = useState({})
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
      const [{ data: jogosData }, { data: gruposData }, { data: jData }] = await Promise.all([
        supabase.from('palpites').select('id_jogo, casa, fora, classificado').eq('jogador', jogadorSel),
        supabase.from('palpites_grupos').select('grupo, primeiro, segundo').eq('jogador', jogadorSel),
        supabase.from('jogadores').select('campeao, marcador').eq('nome', jogadorSel).single(),
      ])

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => {
        jogosMap[j.id_jogo] = {
          casa: j.casa !== null && j.casa !== undefined ? Number(j.casa) : null,
          fora: j.fora !== null && j.fora !== undefined ? Number(j.fora) : null,
          classificado: j.classificado || null
        }
      })

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => {
        gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo }
      })

      setApostas({ jogos: jogosMap, grupos: gruposMap })
      setValoresGrupos(gruposMap)
      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')
      setScores(jogosMap)
      setApostasCarregadas(true)
    } catch (err) {
      console.error('Erro ao carregar apostas:', err)
    }
  }

  function pedirConfirmacaoJogos() {
    const jogosParaMostrar = []
    let temVazio = false
    let faltaClassificado = false

    for (const j of dia.jogos) {
      const prazo = prazoJogo(j.id)
      if (prazo && agora >= prazo && !isAdmin) continue
      
      const c = scores[j.id]?.casa
      const f = scores[j.id]?.fora
      const cl = scores[j.id]?.classificado

      if (c === undefined || c === null || f === undefined || f === null) { temVazio = true; break }
      
      if (j.eliminatoria && !cl) { 
        faltaClassificado = true; 
        break; 
      }

      let textoJogo = `${j.casa} ${c} — ${f} ${j.fora}`
      if (j.eliminatoria) textoJogo += ` (Passa: ${cl})`
      
      jogosParaMostrar.push({ ...j, sc: c, sf: f, cl: cl, texto: textoJogo })
    }

    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }
    if (faltaClassificado) { showToast('⚠️ Escolha quem passa clicando no nome da equipa!'); return }
    if (jogosParaMostrar.length === 0) { showToast('ℹ️ Não há jogos para guardar.'); return }
    
    setConfirmacao({ tipo: 'jogos', linhas: jogosParaMostrar.map(j => j.texto) })
  }

  function pedirConfirmacaoGrupo() {
    const ativos = PARES_GRUPOS[parIdx] || []
    const linhasConf = []
    let temPeloMenosUm = false

    for (const gNome of ativos) {
      const p1Val = valoresGrupos[gNome]?.primeiro
      const p2Val = valoresGrupos[gNome]?.segundo
      if (p1Val || p2Val) temPeloMenosUm = true
      linhasConf.push(`${gNome} ➔ 🥇 1.º: ${p1Val || '—'} | 🥈 2.º: ${p2Val || '—'}`)
    }

    if (!temPeloMenosUm) { showToast('❌ Escolhe pelo menos um lugar!'); return }
    setConfirmacao({ tipo: 'grupo', linhas: linhasConf, gruposAlvo: ativos })
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
        .map(j => ({ 
          jogador: jogadorSel, 
          id_jogo: j.id, 
          casa: Number(scores[j.id].casa), 
          fora: Number(scores[j.id].fora),
          classificado: j.eliminatoria ? scores[j.id]?.classificado : null
        }))

      for (const row of rows) {
        await supabase.from('palpites').upsert(row, { onConflict: 'jogador,id_jogo' })
      }
      showToast(`✅ Jogos de ${dia.data} guardados!`)
    }
    
    if (tipo === 'grupo') {
      const gruposAlvo = confirmacao.gruposAlvo || []
      for (const gNome of gruposAlvo) {
        const p1Val = valoresGrupos[gNome]?.primeiro || null
        const p2Val = valoresGrupos[gNome]?.segundo || null
        await supabase.from('palpites_grupos').upsert(
          { jogador: jogadorSel, grupo: gNome, primeiro: p1Val, segundo: p2Val },
          { onConflict: 'jogador,grupo' }
        )
      }
      showToast(`✅ Grupos guardados com sucesso!`)
    }
    
    if (tipo === 'final') {
      await supabase.from('jogadores').upsert(
        { nome: jogadorSel, campeao: campeao || null, marcador: marcador || null },
        { onConflict: 'nome' }
      )
      showToast('✅ Escolhas guardadas!')
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
              <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 15, color: '#eee', margin: '6px 0' }}>
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
              {dia?.data}
            </div>
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO.length - 1, diaIdx + 1))}>▶</button>
          </div>

          {dia?.jogos.map(j => {
            const prazo = prazoJogo(j.id)
            const bloqueado = prazo && agora >= prazo && !isAdmin
            const horaCor = bloqueado ? 'var(--red)' : '#555'
            const temAposta = scores[j.id]?.casa !== null && scores[j.id]?.casa !== undefined
                           && scores[j.id]?.fora !== null && scores[j.id]?.fora !== undefined
            const AdvancedTeam = scores[j.id]?.classificado

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
                
                <div className="jogo-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  
                  {j.eliminatoria ? (
                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={() => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], classificado: j.casa } }))}
                      style={{
                        flex: 1, textAlign: 'left', padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                        border: AdvancedTeam === j.casa ? '1px solid var(--gold)' : '1px solid #222',
                        background: AdvancedTeam === j.casa ? 'rgba(212,175,55,0.15)' : '#111',
                        color: AdvancedTeam === j.casa ? 'var(--gold)' : '#fff',
                        fontFamily: 'Barlow Condensed, sans-serif'
                      }}
                    >
                      {j.casa} {AdvancedTeam === j.casa ? '⭐️' : ''}
                    </button>
                  ) : (
                    <div className="team-name left" style={{ flex: 1 }}>{j.casa}</div>
                  )}

                  <input
                    type="number" min={0}
                    value={scores[j.id]?.casa ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado} placeholder="–"
                    style={{ width: 40, textAlign: 'center' }}
                  />
                  
                  <span className="sep">—</span>
                  
                  <input
                    type="number" min={0}
                    value={scores[j.id]?.fora ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado} placeholder="–"
                    style={{ width: 40, textAlign: 'center' }}
                  />

                  {j.eliminatoria ? (
                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={() => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], classificado: j.fora } }))}
                      style={{
                        flex: 1, textAlign: 'right', padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                        border: AdvancedTeam === j.fora ? '1px solid var(--gold)' : '1px solid #222',
                        background: AdvancedTeam === j.fora ? 'rgba(212,175,55,0.15)' : '#111',
                        color: AdvancedTeam === j.fora ? 'var(--gold)' : '#fff',
                        fontFamily: 'Barlow Condensed, sans-serif'
                      }}
                    >
                      {AdvancedTeam === j.fora ? '⭐️ ' : ''}{j.fora}
                    </button>
                  ) : (
                    <div className="team-name right" style={{ flex: 1 }}>{j.fora}</div>
                  )}
                  
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
          {bloqFinal && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição do Campeão e Marcador encerrada.</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, marginTop: 12 }}>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {PARES_GRUPOS.map((par, idx) => {
              const label = par.map(g => g.replace('Grupo ', '')).join(' / ')
              const ativo = parIdx === idx
              return (
                <button
                  key={idx}
                  type="button"
                  className={`btn ${ativo ? 'active' : ''}`}
                  style={{
                    padding: '10px 4px',
                    fontSize: '12px',
                    fontFamily: 'Oswald, sans-serif',
                    textTransform: 'uppercase',
                    border: ativo ? '1px solid var(--gold)' : '1px solid #2a2a2a',
                    color: ativo ? 'var(--gold)' : '#aaa',
                    background: ativo ? '#161616' : '#0d0d0d'
                  }}
                  onClick={() => setParIdx(idx)}
                >
                  Gr. {label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PARES_GRUPOS[parIdx]?.map(gNome => (
              <div key={gNome} style={{ border: '1px solid #1e1e1e', padding: '12px', borderRadius: '8px', background: '#0a0a0a' }}>
                <span style={{ fontSize: 13, fontFamily: 'Oswald, sans-serif', color: 'var(--gold)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
                  {gNome.toUpperCase()}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <select
                    value={valoresGrupos[gNome]?.primeiro || ''}
                    onChange={e => setValoresGrupos(prev => ({ ...prev, [gNome]: { ...prev[gNome], primeiro: e.target.value } }))}
                    disabled={bloqGrupos}
                  >
                    <option value="">🥇 1.º Lugar...</option>
                    {EQUIPAS_POR_GRUPO[gNome]?.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>

                  <select
                    value={valoresGrupos[gNome]?.segundo || ''}
                    onChange={e => setValoresGrupos(prev => ({ ...prev, [gNome]: { ...prev[gNome], segundo: e.target.value } }))}
                    disabled={bloqGrupos}
                  >
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
