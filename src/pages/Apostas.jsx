import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  CALENDARIO, CALENDARIO_ELIMINACAO, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS,
  LIMITE_FASE_FINAL, LIMITE_GRUPOS, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

// Calendário unificado: grupos + eliminatórias
const CALENDARIO_COMPLETO = (() => {
  const mapa = {}
  for (const dia of CALENDARIO) {
    mapa[dia.data] = { data: dia.data, jogos: [...dia.jogos] }
  }
  for (const dia of CALENDARIO_ELIMINACAO) {
    if (mapa[dia.data]) {
      mapa[dia.data].jogos.push(...dia.jogos)
    } else {
      mapa[dia.data] = { data: dia.data, jogos: [...dia.jogos] }
    }
  }
  // Ordenar por data
  const ordem = [...CALENDARIO.map(d => d.data), ...CALENDARIO_ELIMINACAO.map(d => d.data)]
  const unique = [...new Set(ordem)]
  return unique.map(d => mapa[d]).filter(Boolean)
})()

function prazoJogoUnificado(j) {
  const [h, m] = j.hora.split(':').map(Number)
  // Encontrar a data do jogo
  for (const dia of CALENDARIO_COMPLETO) {
    if (dia.jogos.find(jj => jj.id === j.id)) {
      const partes = dia.data.split(', ')[1].split('/')
      const d = parseInt(partes[0]), mo = parseInt(partes[1])
      const dtJogo = new Date(2026, mo - 1, d, h, m, 0)
      return new Date(dtJogo.getTime() - 2 * 60 * 60 * 1000)
    }
  }
  return null
}

function indiceDiaHojeCompleto() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  for (let i = 0; i < CALENDARIO_COMPLETO.length; i++) {
    const partes = CALENDARIO_COMPLETO[i].data.split(', ')[1].split('/')
    const d = parseInt(partes[0]), m = parseInt(partes[1])
    const dataDia = new Date(2026, m - 1, d)
    dataDia.setHours(0, 0, 0, 0)
    if (dataDia >= hoje) return i
  }
  return CALENDARIO_COMPLETO.length - 1
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

function isElim(id) { return !!labelFase(id) }

const chavesGrupos = Object.keys(EQUIPAS_POR_GRUPO)
const PARES_GRUPOS = []
for (let i = 0; i < chavesGrupos.length; i += 2) {
  PARES_GRUPOS.push([chavesGrupos[i], chavesGrupos[i + 1]].filter(Boolean))
}

export default function Apostas({ jogador, isAdmin }) {
  const [subMenu, setSubMenu] = useState('jogos')
  const [diaIdx, setDiaIdx] = useState(indiceDiaHojeCompleto())
  const [parIdx, setParIdx] = useState(0)
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [scores, setScores] = useState({})        // { id: { casa, fora } }
  const [scoresElim, setScoresElim] = useState({}) // { id: { casa, fora, passa } }
  const [equipasElim, setEquipasElim] = useState({})
  const [valoresGrupos, setValoresGrupos] = useState({})
  const [campeao, setCampeao] = useState('')
  const [marcador, setMarcador] = useState('')
  const [palpitesTodos, setPalpitesTodos] = useState({})     // { id_jogo: { nome: {casa,fora} } }
  const [palpitesElimTodos, setPalpitesElimTodos] = useState({}) // { id_jogo: { nome: {casa,fora,passa} } }
  const [resultados, setResultados] = useState({})
  const [resultadosElim, setResultadosElim] = useState({})
  const [confirmacao, setConfirmacao] = useState(null)
  const [apostasCarregadas, setApostasCarregadas] = useState(false)
  const { toast, showToast } = useToast()
  const agora = new Date()
  const bloqFinal = agora >= LIMITE_FASE_FINAL && !isAdmin
  const bloqGrupos = agora >= LIMITE_GRUPOS && !isAdmin

  const dia = CALENDARIO_COMPLETO[diaIdx]

  useEffect(() => { carregarTudo() }, [jogadorSel])

  async function carregarTudo() {
    try {
      const [
        { data: jogosData },
        { data: elimData },
        { data: equipasData },
        { data: gruposData },
        { data: jData },
        { data: todosPalpites },
        { data: todosElim },
        { data: resDB },
        { data: resElimDB },
      ] = await Promise.all([
        supabase.from('palpites').select('id_jogo, casa, fora').eq('jogador', jogadorSel),
        supabase.from('palpites_eliminacao').select('id_jogo, casa, fora, passa').eq('jogador', jogadorSel),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('grupo, primeiro, segundo').eq('jogador', jogadorSel),
        supabase.from('jogadores').select('campeao, marcador').eq('nome', jogadorSel).single(),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('palpites_eliminacao').select('jogador, id_jogo, casa, fora, passa'),
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora, passa'),
      ])

      const jogosMap = {}
      if (jogosData) jogosData.forEach(j => {
        jogosMap[j.id_jogo] = { casa: j.casa !== null ? Number(j.casa) : null, fora: j.fora !== null ? Number(j.fora) : null }
      })
      setScores(jogosMap)

      const elimMap = {}
      if (elimData) elimData.forEach(e => { elimMap[e.id_jogo] = { casa: e.casa, fora: e.fora, passa: e.passa || null } })
      setScoresElim(elimMap)

      const equipasMap = {}
      if (equipasData) equipasData.forEach(e => { equipasMap[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipasElim(equipasMap)

      const gruposMap = {}
      if (gruposData) gruposData.forEach(g => { gruposMap[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })
      setValoresGrupos(gruposMap)

      setCampeao(jData?.campeao || '')
      setMarcador(jData?.marcador || '')

      const mpTodos = {}
      if (todosPalpites) todosPalpites.forEach(p => {
        if (!mpTodos[p.id_jogo]) mpTodos[p.id_jogo] = {}
        mpTodos[p.id_jogo][p.jogador] = { casa: p.casa, fora: p.fora }
      })
      setPalpitesTodos(mpTodos)

      const mpElimTodos = {}
      if (todosElim) todosElim.forEach(p => {
        if (!mpElimTodos[p.id_jogo]) mpElimTodos[p.id_jogo] = {}
        mpElimTodos[p.id_jogo][p.jogador] = { casa: p.casa, fora: p.fora, passa: p.passa }
      })
      setPalpitesElimTodos(mpElimTodos)

      const resMap = {}
      if (resDB) resDB.forEach(r => { resMap[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(resMap)

      const resElimMap = {}
      if (resElimDB) resElimDB.forEach(r => { resElimMap[r.id_jogo] = { casa: r.casa, fora: r.fora, passa: r.passa } })
      setResultadosElim(resElimMap)

      setApostasCarregadas(true)
    } catch (err) { console.error(err) }
  }

  function pedirConfirmacaoJogos() {
    const linhas = []
    let temVazio = false
    for (const j of dia.jogos) {
      const prazo = prazoJogoUnificado(j)
      if (prazo && agora >= prazo && !isAdmin) continue
      if (isElim(j.id)) {
        const a = scoresElim[j.id] || {}
        if (a.casa === null || a.casa === undefined) { temVazio = true; break }
        const eq = equipasElim[j.id]
        const nc = eq?.casa || 'Casa'
        const nf = eq?.fora || 'Fora'
        linhas.push(`${nc} ${a.casa} — ${a.fora} ${nf}${a.passa ? ` → ${a.passa}` : ''}`)
      } else {
        const s = scores[j.id] || {}
        if (s.casa === null || s.casa === undefined) { temVazio = true; break }
        linhas.push(`${j.casa} ${s.casa} — ${s.fora} ${j.fora}`)
      }
    }
    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }
    if (linhas.length === 0) { showToast('ℹ️ Não há jogos para guardar.'); return }
    setConfirmacao({ tipo: 'jogos', linhas })
  }

  function pedirConfirmacaoGrupo() {
    const ativos = PARES_GRUPOS[parIdx] || []
    const linhas = []
    let tem = false
    for (const g of ativos) {
      const p1 = valoresGrupos[g]?.primeiro, p2 = valoresGrupos[g]?.segundo
      if (p1 || p2) tem = true
      linhas.push(`${g}: 🥇 ${p1 || '—'} · 🥈 ${p2 || '—'}`)
    }
    if (!tem) { showToast('❌ Escolhe pelo menos um lugar!'); return }
    setConfirmacao({ tipo: 'grupo', linhas, gruposAlvo: ativos })
  }

  function pedirConfirmacaoFinal() {
    setConfirmacao({ tipo: 'final', linhas: [`🏆 Campeão: ${campeao || '—'}`, `⚽ Marcador: ${marcador || '—'}`] })
  }

  async function confirmarGuardar() {
    const tipo = confirmacao.tipo
    setConfirmacao(null)

    if (tipo === 'jogos') {
      for (const j of dia.jogos) {
        const prazo = prazoJogoUnificado(j)
        if (prazo && agora >= prazo && !isAdmin) continue
        if (isElim(j.id)) {
          const a = scoresElim[j.id]
          if (!a || a.casa === null || a.casa === undefined) continue
          await supabase.from('palpites_eliminacao').upsert(
            { jogador: jogadorSel, id_jogo: j.id, casa: Number(a.casa), fora: Number(a.fora), passa: a.passa || null },
            { onConflict: 'jogador,id_jogo' }
          )
        } else {
          const s = scores[j.id]
          if (!s || s.casa === null || s.casa === undefined) continue
          await supabase.from('palpites').upsert(
            { jogador: jogadorSel, id_jogo: j.id, casa: Number(s.casa), fora: Number(s.fora) },
            { onConflict: 'jogador,id_jogo' }
          )
        }
      }
      showToast(`✅ Jogos de ${dia.data} guardados!`)
    }

    if (tipo === 'grupo') {
      for (const g of (confirmacao.gruposAlvo || [])) {
        await supabase.from('palpites_grupos').upsert(
          { jogador: jogadorSel, grupo: g, primeiro: valoresGrupos[g]?.primeiro || null, segundo: valoresGrupos[g]?.segundo || null },
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
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
    if (h > 48) return null
    if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h`
    if (h > 0) return `${h}h ${m}min`
    return `${m} min`
  }

  function alertaPrazo() {
    for (const j of dia.jogos) {
      const prazo = prazoJogoUnificado(j)
      if (!prazo) continue
      const diff = prazo - agora
      if (diff <= 0) continue
      const tempo = formatarTempo(diff)
      if (!tempo) continue
      const nome = isElim(j.id) ? (equipasElim[j.id]?.casa || j.id) + ' vs ' + (equipasElim[j.id]?.fora || '') : `${j.casa} vs ${j.fora}`
      if (diff < 60 * 60 * 1000) return { tipo: 'urgente', msg: `⚠️ Prazo fecha em ${tempo} — ${nome}` }
      if (diff < 48 * 60 * 60 * 1000) return { tipo: 'info', msg: `⏱ ${tempo} para fechar — ${nome}` }
    }
    return null
  }

  function pontosAposta(id, p, r) {
    if (!r || r.casa === null || r.fora === null) return null
    const pc = Number(p.casa), pf = Number(p.fora), rc = Number(r.casa), rf = Number(r.fora)
    if (pc === rc && pf === rf) return 3
    if ((pc > pf && rc > rf) || (pc < pf && rc < rf) || (pc === pf && rc === rf)) return 1
    return 0
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

      {/* Modal */}
      {confirmacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 340 }}>
            <h4 style={{ fontFamily: 'Oswald,sans-serif', textAlign: 'center', color: 'var(--gold)', marginBottom: 16 }}>Confirmar aposta?</h4>
            {confirmacao.linhas.map((l, i) => <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 14, color: '#eee', margin: '6px 0' }}>{l}</p>)}
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
            <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>{dia?.data}</div>
            <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO_COMPLETO.length - 1, diaIdx + 1))}>▶</button>
          </div>

          {dia?.jogos.map(j => {
            const prazo = prazoJogoUnificado(j)
            const bloqueado = prazo && agora >= prazo && !isAdmin
            const elim = isElim(j.id)
            const fase = labelFase(j.id)
            const eq = elim ? equipasElim[j.id] : null
            const nomeCasa = elim ? (eq?.casa || null) : j.casa
            const nomeFora = elim ? (eq?.fora || null) : j.fora
            const a = elim ? (scoresElim[j.id] || {}) : (scores[j.id] || {})
            const temAposta = a.casa !== null && a.casa !== undefined && a.fora !== null && a.fora !== undefined
            const r = elim ? resultadosElim[j.id] : resultados[j.id]
            const encerrado = prazo && agora >= prazo

            return (
              <div key={j.id} className="palpite-card" style={{ marginBottom: 10, borderColor: temAposta && !bloqueado ? 'rgba(0,200,83,0.3)' : '#1e1e1e' }}>

                {/* Cabeçalho */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fase ? 4 : 8 }}>
                  <span style={{ fontSize: 11, color: bloqueado ? 'var(--red)' : '#555', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    ⏱ {j.hora} Lisboa{bloqueado ? '  🔒' : ''}{!bloqueado && isAdmin && prazo && agora >= prazo ? '  🔓' : ''}
                  </span>
                  <span style={{ fontSize: 11, color: temAposta ? '#00C853' : '#444', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {temAposta ? '✓ apostado' : '· por apostar'}
                  </span>
                </div>

                {/* Etiqueta da fase eliminatória */}
                {fase && (
                  <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                    🏟️ {fase}
                  </div>
                )}

                {/* Resultado real (se disponível) */}
                {r && r.casa !== null && (
                  <div style={{ textAlign: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'VT323,monospace', fontSize: 26, color: 'var(--green)', letterSpacing: 3 }}>
                      {r.casa} — {r.fora}
                    </span>
                    {elim && r.passa && (
                      <span style={{ fontSize: 11, color: '#00C853', display: 'block', fontFamily: 'Barlow Condensed,sans-serif' }}>
                        ✓ Passou: {r.passa}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#555', display: 'block', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1 }}>RESULTADO REAL</span>
                  </div>
                )}

                {/* Inputs de resultado — nomes clicáveis nas eliminatórias */}
                <div className="jogo-row">
                  {elim && nomeCasa ? (
                    <button
                      disabled={bloqueado}
                      onClick={() => !bloqueado && setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], passa: prev[j.id]?.passa === nomeCasa ? null : nomeCasa } }))}
                      style={{
                        flex: 1, textAlign: 'left', padding: '4px 6px', borderRadius: 6,
                        border: `1px solid ${scoresElim[j.id]?.passa === nomeCasa ? '#00C853' : '#2a2a2a'}`,
                        background: scoresElim[j.id]?.passa === nomeCasa ? 'rgba(0,200,83,0.1)' : 'transparent',
                        color: scoresElim[j.id]?.passa === nomeCasa ? '#00C853' : '#eee',
                        fontSize: 'clamp(11px,2.5vw,13px)', fontFamily: 'Barlow Condensed,sans-serif',
                        cursor: bloqueado ? 'default' : 'pointer', transition: 'all 0.15s',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                      {scoresElim[j.id]?.passa === nomeCasa ? '✓ ' : ''}{nomeCasa}
                    </button>
                  ) : (
                    <div className="team-name left" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                      {nomeCasa || <span style={{ color: '#333' }}>A definir</span>}
                    </div>
                  )}

                  <input type="number" min={0}
                    value={a.casa ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      if (elim) setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: v } }))
                      else setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: v } }))
                    }}
                    disabled={bloqueado} placeholder="–"
                  />
                  <span className="sep">—</span>
                  <input type="number" min={0}
                    value={a.fora ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      if (elim) setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: v } }))
                      else setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: v } }))
                    }}
                    disabled={bloqueado} placeholder="–"
                  />

                  {elim && nomeFora ? (
                    <button
                      disabled={bloqueado}
                      onClick={() => !bloqueado && setScoresElim(prev => ({ ...prev, [j.id]: { ...prev[j.id], passa: prev[j.id]?.passa === nomeFora ? null : nomeFora } }))}
                      style={{
                        flex: 1, textAlign: 'right', padding: '4px 6px', borderRadius: 6,
                        border: `1px solid ${scoresElim[j.id]?.passa === nomeFora ? '#00C853' : '#2a2a2a'}`,
                        background: scoresElim[j.id]?.passa === nomeFora ? 'rgba(0,200,83,0.1)' : 'transparent',
                        color: scoresElim[j.id]?.passa === nomeFora ? '#00C853' : '#eee',
                        fontSize: 'clamp(11px,2.5vw,13px)', fontFamily: 'Barlow Condensed,sans-serif',
                        cursor: bloqueado ? 'default' : 'pointer', transition: 'all 0.15s',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                      {nomeFora}{scoresElim[j.id]?.passa === nomeFora ? ' ✓' : ''}
                    </button>
                  ) : (
                    <div className="team-name right" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                      {nomeFora || <span style={{ color: '#333' }}>A definir</span>}
                    </div>
                  )}
                </div>
                {elim && nomeCasa && nomeFora && !bloqueado && (
                  <p style={{ fontSize: 10, color: '#444', textAlign: 'center', margin: '4px 0 0', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    Clica no nome da equipa que passa <span style={{ color: '#00C853' }}>(+1 pt)</span>
                  </p>
                )}

                {/* Palpites de todos (após prazo) */}
                {encerrado && (
                  <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 8, marginTop: 4 }}>
                    {NOMES_AMIGOS.map(nome => {
                      const mp = elim ? palpitesElimTodos : palpitesTodos
                      const p = mp[j.id]?.[nome]
                      const podeVer = encerrado || nome === jogadorSel || isAdmin
                      if (!p) return (
                        <p key={nome} style={{ margin: 0, padding: '3px 0', fontSize: 11, color: '#2a2a2a', textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif' }}>
                          {nome} — sem aposta
                        </p>
                      )
                      const vc = podeVer ? p.casa : '🔒'
                      const vf = podeVer ? p.fora : '🔒'
                      const destaque = nome === jogadorSel ? 'var(--gold)' : '#ccc'
                      const pts = podeVer ? pontosAposta(j.id, p, r) : null
                      const corPts = pts === 3 ? '#00C853' : pts === 1 ? 'var(--gold)' : pts === 0 ? '#FF3D00' : null
                      const passaAcertou = elim && p.passa && r?.passa && p.passa === r.passa

                      return (
                        <div key={nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #111' }}>
                          <span style={{ fontSize: 12, color: destaque, fontFamily: 'Barlow Condensed,sans-serif', minWidth: 48 }}>{nome}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'VT323,monospace', fontSize: 18, color: '#eee', letterSpacing: 2 }}>{vc} - {vf}</span>
                            {elim && podeVer && p.passa && (
                              <span style={{ fontSize: 11, color: passaAcertou ? '#00C853' : '#555', fontFamily: 'Barlow Condensed,sans-serif' }}>
                                →{p.passa.split(' ').pop()}
                              </span>
                            )}
                            {pts !== null && (
                              <span style={{ fontFamily: 'VT323,monospace', fontSize: 16, color: corPts, minWidth: 24, textAlign: 'right' }}>
                                {pts === 3 ? '+3' : pts === 1 ? '+1' : '✗'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
              <option value="">🏆 Campeão do mundo...</option>
              {TODAS_EQUIPAS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <input type="text" placeholder="⚽ Melhor marcador (nome do jogador)" value={marcador} onChange={e => setMarcador(e.target.value)} disabled={bloqFinal} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacaoFinal} disabled={bloqFinal}>Guardar</button>
            </div>
          </div>

          <hr />
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0' }}>📊 Vencedores dos grupos</h4>
          {bloqGrupos && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Edição das posições encerrada.</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {PARES_GRUPOS.map((par, idx) => {
              const label = par.map(g => g.replace('Grupo ', '')).join(' / ')
              const ativo = parIdx === idx
              return (
                <button key={idx} onClick={() => setParIdx(idx)}
                  style={{ padding: '10px 4px', fontSize: 12, fontFamily: 'Oswald,sans-serif', textTransform: 'uppercase', borderRadius: 8, cursor: 'pointer',
                    border: ativo ? '1px solid var(--gold)' : '1px solid #2a2a2a', color: ativo ? 'var(--gold)' : '#aaa', background: ativo ? '#161616' : '#0d0d0d' }}>
                  Gr. {label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PARES_GRUPOS[parIdx]?.map(gNome => (
              <div key={gNome} style={{ border: '1px solid #1e1e1e', padding: 12, borderRadius: 8, background: '#0a0a0a' }}>
                <span style={{ fontSize: 13, fontFamily: 'Oswald,sans-serif', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>{gNome.toUpperCase()}</span>
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
