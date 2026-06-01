import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, prazoJogo, indiceDiaHoje, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos') // 'jogos' | 'grupos'
  const [diaIdx, setDiaIdx] = useState(indiceDiaHoje())
  const [grupo, setGrupo] = useState('Grupo A')
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [apostas, setApostas] = useState({ jogos: {}, grupos: {}, campeao: '', marcador: '' })
  const [scores, setScores] = useState({}) // { "Grupo A_J1": { casa: 2, fora: 1 } }
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [campeao, setCampeao] = useState('')
  const [marcador, setMarcador] = useState('')
  const { toast, showToast } = useToast()
  const agora = new Date()
  const bloqFinal = agora >= LIMITE_FASE_FINAL && !isAdmin
  const bloqGrupos = agora >= LIMITE_GRUPOS && !isAdmin

  useEffect(() => { carregarApostas() }, [jogadorSel])

  async function carregarApostas() {
    try {
      // Jogos
      const { data: jogosData } = await supabase
        .from('palpites')
        .select('id_jogo, casa, fora')
        .eq('jogador', jogadorSel)

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => { jogosMap[j.id_jogo] = { casa: j.casa, fora: j.fora } })

      // Grupos
      const { data: gruposData } = await supabase
        .from('palpites_grupos')
        .select('grupo, primeiro, segundo')
        .eq('jogador', jogadorSel)

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => { gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })

      // Fase final
      const { data: jData } = await supabase
        .from('jogadores')
        .select('campeao, marcador')
        .eq('nome', jogadorSel)
        .single()

      setApostas({ jogos: jogosMap, grupos: gruposMap })
      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')
      setScores(jogosMap)
    } catch {
      // sem Supabase configurado: começa vazio
    }
  }

  // Sync UI ao mudar de grupo
  useEffect(() => {
    const g = apostas.grupos?.[grupo] || {}
    setP1(g.primeiro || '')
    setP2(g.segundo || '')
  }, [grupo, apostas])

  const dia = CALENDARIO[diaIdx]

  async function guardarJogosDia() {
    const jogosParaSalvar = []
    let temVazio = false

    for (const j of dia.jogos) {
      const prazo = prazoJogo(j.id)
      if (prazo && agora >= prazo && !isAdmin) continue
      const c = scores[j.id]?.casa
      const f = scores[j.id]?.fora
      if (c === undefined || c === null || f === undefined || f === null) { temVazio = true; break }
      jogosParaSalvar.push({ jogador: jogadorSel, id_jogo: j.id, casa: Number(c), fora: Number(f) })
    }

    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }

    for (const row of jogosParaSalvar) {
      await supabase.from('palpites').upsert(row, { onConflict: 'jogador,id_jogo' })
    }
    showToast(`✅ Jogos de ${dia.data} guardados!`)
  }

  async function guardarGrupo() {
    await supabase.from('palpites_grupos').upsert(
      { jogador: jogadorSel, grupo, primeiro: p1 || null, segundo: p2 || null },
      { onConflict: 'jogador,grupo' }
    )
    showToast(`✅ ${grupo} guardado!`)
  }

  async function guardarFaseFinal() {
    await supabase.from('jogadores').upsert(
      { nome: jogadorSel, campeao: campeao || null, marcador: marcador || null },
      { onConflict: 'nome' }
    )
    showToast('✅ Fase final guardada!')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>🎯 As minhas apostas</h2>

      {isAdmin && (
        <select value={jogadorSel} onChange={e => setJogadorSel(e.target.value)} style={{ marginBottom: 12 }}>
          {NOMES_AMIGOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      <div className="submenu">
        <button className={`submenu-btn ${subMenu === 'jogos' ? 'active' : ''}`} onClick={() => setSubMenu('jogos')}>
          Jogos
        </button>
        <button className={`submenu-btn ${subMenu === 'grupos' ? 'active' : ''}`} onClick={() => setSubMenu('grupos')}>
          Vencedores
        </button>
      </div>

      {/* ── JOGOS ── */}
      {subMenu === 'jogos' && (
        <div>
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

            return (
              <div key={j.id} className="card" style={{ marginBottom: 10 }}>
                <p style={{ textAlign: 'center', fontSize: 11, color: horaCor, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  ⏱ {j.hora} Lisboa{bloqueado ? '  🔒 ENCERRADO' : ''}
                  {!bloqueado && isAdmin && prazo && agora >= prazo ? '  🔓 ADMIN' : ''}
                </p>

                <div className="jogo-row">
                  <div className="team-name left">{j.casa}</div>
                  <input
                    type="number"
                    min={0}
                    value={scores[j.id]?.casa ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado}
                    placeholder="–"
                  />
                  <span className="sep">—</span>
                  <input
                    type="number"
                    min={0}
                    value={scores[j.id]?.fora ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))}
                    disabled={bloqueado}
                    placeholder="–"
                  />
                  <div className="team-name right">{j.fora}</div>
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" style={{ width: 120 }} onClick={guardarJogosDia}>Guardar</button>
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
              type="text"
              placeholder="Melhor marcador (nome do jogador)"
              value={marcador}
              onChange={e => setMarcador(e.target.value)}
              disabled={bloqFinal}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ width: 120 }} onClick={guardarFaseFinal} disabled={bloqFinal}>Guardar</button>
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
              <button className="btn btn-sm" style={{ width: 120 }} onClick={guardarGrupo} disabled={bloqGrupos}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
