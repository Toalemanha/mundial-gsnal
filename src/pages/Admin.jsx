import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { 
  JOGOS_FASE_GRUPOS, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS, NOMES_AMIGOS, 
  FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, CALENDARIO, prazoJogo 
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

// Bracket fixo: quando X passa, vai para o slot Y como casa ou fora
const BRACKET = {
  // 16avos -> Oitavos
  R32_1:  { nextId: 'R16_1', lado: 'casa' },
  R32_2:  { nextId: 'R16_1', lado: 'fora' },
  R32_3:  { nextId: 'R16_2', lado: 'casa' },
  R32_4:  { nextId: 'R16_2', lado: 'fora' },
  R32_5:  { nextId: 'R16_3', lado: 'casa' },
  R32_6:  { nextId: 'R16_3', lado: 'fora' },
  R32_7:  { nextId: 'R16_4', lado: 'casa' },
  R32_8:  { nextId: 'R16_4', lado: 'fora' },
  R32_9:  { nextId: 'R16_5', lado: 'casa' },
  R32_10: { nextId: 'R16_5', lado: 'fora' },
  R32_11: { nextId: 'R16_6', lado: 'casa' },
  R32_12: { nextId: 'R16_6', lado: 'fora' },
  R32_13: { nextId: 'R16_7', lado: 'casa' },
  R32_14: { nextId: 'R16_7', lado: 'fora' },
  R32_15: { nextId: 'R16_8', lado: 'casa' },
  R32_16: { nextId: 'R16_8', lado: 'fora' },
  // Oitavos -> Quartos
  R16_1: { nextId: 'QF1', lado: 'casa' },
  R16_2: { nextId: 'QF1', lado: 'fora' },
  R16_3: { nextId: 'QF2', lado: 'casa' },
  R16_4: { nextId: 'QF2', lado: 'fora' },
  R16_5: { nextId: 'QF3', lado: 'casa' },
  R16_6: { nextId: 'QF3', lado: 'fora' },
  R16_7: { nextId: 'QF4', lado: 'casa' },
  R16_8: { nextId: 'QF4', lado: 'fora' },
  // Quartos -> Meias
  QF1: { nextId: 'SF1', lado: 'casa' },
  QF2: { nextId: 'SF1', lado: 'fora' },
  QF3: { nextId: 'SF2', lado: 'casa' },
  QF4: { nextId: 'SF2', lado: 'fora' },
  // Meias -> Final e 3.º lugar
  SF1: { nextId: 'FN1', lado: 'casa', perdedorId: 'TP1', perdedorLado: 'casa' },
  SF2: { nextId: 'FN1', lado: 'fora', perdedorId: 'TP1', perdedorLado: 'fora' },
}

function AutocompleteInput({ value, onChange, placeholder, style }) {
  const [sugestoes, setSugestoes] = useState([])
  const [aberto, setAberto] = useState(false)

  function handleChange(e) {
    const val = e.target.value
    onChange(val)
    if (val.length >= 1) {
      const filtradas = TODAS_EQUIPAS.filter(eq =>
        eq.toLowerCase().includes(val.toLowerCase()) ||
        eq.replace(/[^\w\s]/g, '').toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6)
      setSugestoes(filtradas)
      setAberto(filtradas.length > 0)
    } else {
      setSugestoes([])
      setAberto(false)
    }
  }

  function selecionar(eq) {
    onChange(eq)
    setSugestoes([])
    setAberto(false)
  }

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input type="text" placeholder={placeholder} value={value} onChange={handleChange}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onFocus={() => value && sugestoes.length > 0 && setAberto(true)}
        style={{ ...style, width: '100%' }} autoComplete="off"
      />
      {aberto && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {sugestoes.map(eq => (
            <div key={eq} onMouseDown={() => selecionar(eq)}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Barlow Condensed,sans-serif', color: '#ccc', borderBottom: '1px solid #1a1a1a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{eq}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [subMenu, setSubMenu] = useState('resultados')
  const [resultados, setResultados] = useState({})
  const [resultGrupos, setResultGrupos] = useState({})
  const [campeaoReal, setCampeaoReal] = useState('')
  const [marcadorReal, setMarcadorReal] = useState('')
  const [senhas, setSenhas] = useState({})
  const [equipasElim, setEquipasElim] = useState({})
  const [resultadosElim, setResultadosElim] = useState({})
  const [palpites, setPalpites] = useState({})
  const [palpitesGrupos, setPalpitesGrupos] = useState({})
  const [resultadosGruposDB, setResultadosGruposDB] = useState({})
  const [jogosEncerrados, setJogosEncerrados] = useState([])
  const { toast, showToast } = useToast()

  useEffect(() => { carregarResultados() }, [])

  async function carregarResultados() {
    try {
      const [{ data: res }, { data: gr }, { data: geral }, { data: eq }, { data: resElim }, { data: palp }, { data: grps }] = await Promise.all([
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('resultados_grupos').select('grupo, primeiro, segundo'),
        supabase.from('config').select('campeao_real, marcador_real').eq('id', 1).single(),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora, passa'),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
      ])

      const m = {}
      if (res) res.forEach(r => { m[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(m)

      const mg = {}
      if (gr) gr.forEach(g => { mg[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })
      setResultGrupos(mg)
      setResultadosGruposDB(mg)

      if (geral) { setCampeaoReal(geral.campeao_real || ''); setMarcadorReal(geral.marcador_real || '') }

      const eq2 = {}
      if (eq) eq.forEach(e => { eq2[e.id_jogo] = { casa: e.casa || '', fora: e.fora || '' } })
      setEquipasElim(eq2)

      const re2 = {}
      if (resElim) resElim.forEach(r => { re2[r.id_jogo] = { casa: r.casa, fora: r.fora, passa: r.passa || null } })
      setResultadosElim(re2)

      const mp = {}
      if (palp) palp.forEach(r => {
        if (!mp[r.jogador]) mp[r.jogador] = {}
        mp[r.jogador][r.id_jogo] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mp)

      const mgGrps = {}
      if (grps) grps.forEach(r => {
        if (!mgGrps[r.jogador]) mgGrps[r.jogador] = {}
        mgGrps[r.jogador][r.grupo] = { primeiro: r.primeiro, segundo: r.segundo }
      })
      setPalpitesGrupos(mgGrps)

      const agora = new Date()
      const todosJogos = CALENDARIO.flatMap(d => d.jogos)
      setJogosEncerrados(todosJogos.filter(j => { const p = prazoJogo(j.id); return p && agora >= p }))

    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
    }
  }

  function setScore(idJogo, lado, valor) {
    setResultados(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor === '' ? null : Number(valor) } }))
  }
  
  function setScoreElim(idJogo, lado, valor) {
    setResultadosElim(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor === '' ? null : Number(valor) } }))
  }

  function setPassa(idJogo, equipaNome) {
    setResultadosElim(prev => {
      const atual = prev[idJogo]?.passa
      const novoPassa = atual === equipaNome ? null : equipaNome
      const novoState = { ...prev, [idJogo]: { ...prev[idJogo], passa: novoPassa } }

      // Propagar automaticamente para o próximo jogo do bracket
      if (novoPassa && BRACKET[idJogo]) {
        const { nextId, lado } = BRACKET[idJogo]
        setEquipasElim(prevEq => ({
          ...prevEq,
          [nextId]: { ...prevEq[nextId], [lado]: novoPassa }
        }))

        // Se for meia-final, propagar também o perdedor para o 3.º lugar
        if (BRACKET[idJogo].perdedorId) {
          const equipasCasaFora = equipasElim[idJogo] || {}
          const perdedor = novoPassa === equipasCasaFora.casa ? equipasCasaFora.fora : equipasCasaFora.casa
          if (perdedor) {
            const { perdedorId, perdedorLado } = BRACKET[idJogo]
            setEquipasElim(prevEq => ({
              ...prevEq,
              [perdedorId]: { ...prevEq[perdedorId], [perdedorLado]: perdedor }
            }))
          }
        }
      }

      return novoState
    })
  }

  function setEquipa(idJogo, lado, valor) {
    setEquipasElim(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor } }))
  }

  async function calcularPontos() {
    for (const [id, sc] of Object.entries(resultados)) {
      if (sc.casa !== null && sc.fora !== null) {
        await supabase.from('resultados').delete().eq('id_jogo', id)
        await supabase.from('resultados').insert({ id_jogo: id, casa: Number(sc.casa), fora: Number(sc.fora) })
      }
    }
    for (const [grupo, pos] of Object.entries(resultGrupos)) {
      if (pos.primeiro || pos.segundo) {
        await supabase.from('resultados_grupos').delete().eq('grupo', grupo)
        await supabase.from('resultados_grupos').insert({ grupo, primeiro: pos.primeiro || null, segundo: pos.segundo || null })
      }
    }
    await supabase.from('config').update({ campeao_real: campeaoReal || null, marcador_real: marcadorReal || null }).eq('id', 1)

    for (const [id, eq] of Object.entries(equipasElim)) {
      if (eq.casa || eq.fora) {
        await supabase.from('equipas_eliminacao').delete().eq('id_jogo', id)
        await supabase.from('equipas_eliminacao').insert({ id_jogo: id, casa: eq.casa || null, fora: eq.fora || null })
      }
    }
    for (const [id, sc] of Object.entries(resultadosElim)) {
      if (sc.casa !== null && sc.fora !== null) {
        await supabase.from('resultados_eliminacao').delete().eq('id_jogo', id)
        await supabase.from('resultados_eliminacao').insert({ 
          id_jogo: id, casa: Number(sc.casa), fora: Number(sc.fora), passa: sc.passa || null
        })
      }
    }

    const { error } = await supabase.rpc('recalcular_pontos')
    if (error) { console.error('Erro RPC:', error); showToast('❌ Erro ao recalcular!'); return }
    showToast('✅ Tabela atualizada com sucesso!')
  }

  async function guardarSenhas() {
    let conta = 0
    for (const [nome, senha] of Object.entries(senhas)) {
      if (senha?.trim()) {
        await supabase.from('jogadores').update({ senha: senha.trim() }).eq('nome', nome)
        conta++
      }
    }
    if (conta > 0) showToast(`✅ ${conta} palavra(s)-passe atualizada(s)!`)
    else showToast('ℹ️ Nenhuma alteração feita.')
    setSenhas({})
  }

  function pontosGruposPorJogador(nome) {
    let pts = 0
    const pg = palpitesGrupos[nome] || {}
    for (const [grupo, aposta] of Object.entries(pg)) {
      const rg = resultadosGruposDB[grupo]
      if (!rg || !rg.primeiro) continue
      if (aposta.primeiro === rg.primeiro) pts += 3
      else if (aposta.primeiro === rg.segundo) pts += 1
      if (aposta.segundo === rg.segundo) pts += 3
      else if (aposta.segundo === rg.primeiro) pts += 1
    }
    return pts
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>⚙️ Gestão do torneio</h2>

      <div className="submenu">
        {['resultados', 'eliminacao', 'stats', 'senhas'].map(s => (
          <button key={s} className={`submenu-btn ${subMenu === s ? 'active' : ''}`} onClick={() => setSubMenu(s)}>
            {s === 'resultados' ? 'Grupos' : s === 'eliminacao' ? 'Eliminat.' : s === 'stats' ? 'Stats' : 'Senhas'}
          </button>
        ))}
      </div>

      {/* ── RESULTADOS FASE DE GRUPOS ── */}
      {subMenu === 'resultados' && (
        <div>
          <div className="alert alert-success" style={{ marginBottom: 12 }}>Regista resultados reais e recalcula a tabela.</div>

          <h4 style={{ color: 'var(--gold)', marginBottom: 10 }}>🌍 Fase Final</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <input type="text" placeholder="Vencedor Bota de Ouro (nome oficial)" value={marcadorReal} onChange={e => setMarcadorReal(e.target.value)} />
            <select value={campeaoReal} onChange={e => setCampeaoReal(e.target.value)}>
              <option value="">Campeão do Mundo (Oficial)...</option>
              {TODAS_EQUIPAS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <h4 style={{ color: 'var(--gold)', marginBottom: 10 }}>📊 Fase de Grupos</h4>
          {Object.entries(JOGOS_FASE_GRUPOS).map(([grupo, jogos]) => (
            <details key={grupo} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: 'pointer', padding: '10px 14px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Oswald,sans-serif', letterSpacing: 1, listStyle: 'none', userSelect: 'none' }}>
                {grupo}
              </summary>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 2 }}>
                {jogos.map(([casa, fora, id]) => (
                  <div key={id} style={{ marginBottom: 12 }}>
                    <div className="jogo-row">
                      <div className="team-name left">{casa}</div>
                      <input type="number" min={0} value={resultados[id]?.casa ?? ''} onChange={e => setScore(id, 'casa', e.target.value)} placeholder="–" />
                      <span className="sep">—</span>
                      <input type="number" min={0} value={resultados[id]?.fora ?? ''} onChange={e => setScore(id, 'fora', e.target.value)} placeholder="–" />
                      <div className="team-name right">{fora}</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <select value={resultGrupos[grupo]?.primeiro || ''} onChange={e => setResultGrupos(prev => ({ ...prev, [grupo]: { ...prev[grupo], primeiro: e.target.value } }))}>
                    <option value="">🥇 Real 1.º...</option>
                    {EQUIPAS_POR_GRUPO[grupo].map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                  <select value={resultGrupos[grupo]?.segundo || ''} onChange={e => setResultGrupos(prev => ({ ...prev, [grupo]: { ...prev[grupo], segundo: e.target.value } }))}>
                    <option value="">🥈 Real 2.º...</option>
                    {EQUIPAS_POR_GRUPO[grupo].map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              </div>
            </details>
          ))}

          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={calcularPontos}>
            🔄 Guardar e recalcular tabela
          </button>
        </div>
      )}

      {/* ── ELIMINATÓRIAS ── */}
      {subMenu === 'eliminacao' && (
        <div>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Insere o resultado e clica na equipa que passou — o bracket atualiza-se automaticamente.
          </div>

          {FASES_ELIMINACAO.map(fase => (
            <details key={fase} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: 'pointer', padding: '10px 14px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Oswald,sans-serif', letterSpacing: 1, listStyle: 'none', userSelect: 'none' }}>
                {LABEL_FASE[fase] || fase.toUpperCase()}
              </summary>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 2 }}>
                {JOGOS_ELIMINACAO[fase]?.map(j => {
                  const casaReal = equipasElim[j.id]?.casa || ''
                  const foraReal = equipasElim[j.id]?.fora || ''
                  const passaReal = resultadosElim[j.id]?.passa
                  const nextInfo = BRACKET[j.id]
                  const nextLabel = nextInfo ? `→ ${nextInfo.nextId} (${nextInfo.lado})` : ''

                  return (
                    <div key={j.id} style={{ marginBottom: 20, borderBottom: '1px solid #1a1a1a', paddingBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
                          {j.label} <span style={{ color: '#555' }}>({j.id})</span>
                        </p>
                        {nextInfo && (
                          <span style={{ fontSize: 10, color: '#444', fontFamily: 'Barlow Condensed,sans-serif' }}>
                            Vencedor → {nextInfo.nextId}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        <AutocompleteInput placeholder="Equipa Casa" value={casaReal} onChange={val => setEquipa(j.id, 'casa', val)} style={{ fontSize: 13 }} />
                        <AutocompleteInput placeholder="Equipa Fora" value={foraReal} onChange={val => setEquipa(j.id, 'fora', val)} style={{ fontSize: 13 }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" disabled={!casaReal} onClick={() => setPassa(j.id, casaReal)}
                          style={{
                            flex: 1, padding: '6px 4px', borderRadius: 4, fontSize: 12, cursor: casaReal ? 'pointer' : 'default',
                            border: passaReal === casaReal ? '1px solid #00C853' : '1px solid #222',
                            background: passaReal === casaReal ? 'rgba(0,200,83,0.15)' : '#0d0d0d',
                            color: passaReal === casaReal ? '#00C853' : '#aaa',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                          {casaReal || '—'} {passaReal === casaReal ? '✓' : ''}
                        </button>
                        <input type="number" min={0} value={resultadosElim[j.id]?.casa ?? ''} onChange={e => setScoreElim(j.id, 'casa', e.target.value)} placeholder="–" style={{ width: 38, textAlign: 'center' }} />
                        <span className="sep">—</span>
                        <input type="number" min={0} value={resultadosElim[j.id]?.fora ?? ''} onChange={e => setScoreElim(j.id, 'fora', e.target.value)} placeholder="–" style={{ width: 38, textAlign: 'center' }} />
                        <button type="button" disabled={!foraReal} onClick={() => setPassa(j.id, foraReal)}
                          style={{
                            flex: 1, padding: '6px 4px', borderRadius: 4, fontSize: 12, cursor: foraReal ? 'pointer' : 'default',
                            border: passaReal === foraReal ? '1px solid #00C853' : '1px solid #222',
                            background: passaReal === foraReal ? 'rgba(0,200,83,0.15)' : '#0d0d0d',
                            color: passaReal === foraReal ? '#00C853' : '#aaa',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                          {passaReal === foraReal ? '✓ ' : ''}{foraReal || '—'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}

          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={calcularPontos}>
            🔄 Guardar e recalcular tabela
          </button>
        </div>
      )}

      {/* ── ESTATÍSTICAS ── */}
      {subMenu === 'stats' && (
        <div>
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 14, fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>📊 Apostas feitas</h4>
          <p style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 12, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
            {jogosEncerrados.length} jogos encerrados
          </p>
          <div className="card">
            {NOMES_AMIGOS.map(nome => {
              const apostasJ = palpites[nome] || {}
              const feitas = jogosEncerrados.filter(j => apostasJ[j.id] !== undefined).length
              const pct = jogosEncerrados.length > 0 ? Math.round((feitas / jogosEncerrados.length) * 100) : 0
              const corBarra = pct >= 80 ? '#00C853' : pct >= 50 ? '#FFD700' : '#FF3D00'
              return (
                <div key={nome} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontFamily: 'Oswald,sans-serif', color: '#eee' }}>{nome}</span>
                    <span style={{ color: '#666', fontFamily: 'Barlow Condensed,sans-serif' }}>
                      {feitas}/{jogosEncerrados.length}
                      <span style={{ color: 'var(--gold)', fontFamily: 'VT323,monospace', fontSize: 16, marginLeft: 8 }}>{feitas > 0 ? `${pct}%` : '0%'}</span>
                    </span>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: corBarra, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '16px 0 10px', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>🗂️ Pontos dos grupos</h4>
          <div className="card">
            {NOMES_AMIGOS.map(nome => {
              const pts = pontosGruposPorJogador(nome)
              const gruposApostados = Object.keys(palpitesGrupos[nome] || {}).length
              return (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid #1a1a1a', fontSize: 13 }}>
                  <span style={{ fontFamily: 'Oswald,sans-serif', color: '#eee' }}>{nome}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontFamily: 'Barlow Condensed,sans-serif', color: '#666' }}>
                    <span>{gruposApostados}/12 grupos apostados</span>
                    <span style={{ fontFamily: 'VT323,monospace', fontSize: 20, color: pts > 0 ? 'var(--gold)' : '#444' }}>+{pts} pts</span>
                  </div>
                </div>
              )
            })}
          </div>

          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '16px 0 10px', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>📋 Em dia vs em falta</h4>
          <div className="card">
            {NOMES_AMIGOS.map(nome => {
              const apostasJ = palpites[nome] || {}
              const agora = new Date()
              const todosJogos = CALENDARIO.flatMap(d => d.jogos)
              const faltam = todosJogos.filter(j => {
                const p = prazoJogo(j.id)
                return (!p || agora < p) && !apostasJ[j.id]
              }).length
              return (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #1a1a1a', fontSize: 13 }}>
                  <span style={{ fontFamily: 'Oswald,sans-serif', color: '#eee' }}>{nome}</span>
                  <span style={{ color: faltam > 0 ? '#ff6b4a' : '#00C853', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {faltam > 0 ? `⚠️ ${faltam} em falta` : '✅ Em dia'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SENHAS ── */}
      {subMenu === 'senhas' && (
        <div>
          <h4 style={{ color: 'var(--gold)', marginBottom: 6 }}>🔑 Alterar palavras-passe</h4>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666', marginBottom: 16 }}>Deixa em branco para manter a atual.</p>
          <div className="card">
            {NOMES_AMIGOS.map(nome => (
              <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: 15, color: '#eee', width: 70, flexShrink: 0 }}>{nome}</span>
                <input type="text" placeholder="Nova senha..." value={senhas[nome] || ''} onChange={e => setSenhas(prev => ({ ...prev, [nome]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={guardarSenhas}>
            💾 Guardar palavras-passe
          </button>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
