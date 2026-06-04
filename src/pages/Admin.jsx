import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { JOGOS_FASE_GRUPOS, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS, NOMES_AMIGOS, FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, CALENDARIO, prazoJogo } from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Admin() {
  const [subMenu, setSubMenu] = useState('resultados')
  const [resultados, setResultados] = useState({})
  const [resultGrupos, setResultGrupos] = useState({})
  const [campeaoReal, setCampeaoReal] = useState('')
  const [marcadorReal, setMarcadorReal] = useState('')
  const [senhas, setSenhas] = useState({})
  // Eliminatórias
  const [equipasElim, setEquipasElim] = useState({})    // { id_jogo: { casa, fora } }
  const [resultadosElim, setResultadosElim] = useState({})
  const [palpites, setPalpites] = useState({})
  const [palpitesGrupos, setPalpitesGrupos] = useState({})
  const [jogosEncerrados, setJogosEncerrados] = useState([])
  const { toast, showToast } = useToast()

  useEffect(() => {
    carregarResultados()

    const canal = supabase
      .channel('admin-resultados')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados' }, () => carregarResultados())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_grupos' }, () => carregarResultados())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogadores' }, () => carregarResultados())
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  async function carregarResultados() {
    try {
      const [{ data: res }, { data: gr }, { data: geral }, { data: eq }, { data: resElim }, { data: palp }, { data: grps }] = await Promise.all([
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('resultados_grupos').select('grupo, primeiro, segundo'),
        supabase.from('config').select('campeao_real, marcador_real').eq('id', 1).single(),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
      ])

      const m = {}
      if (res) res.forEach(r => { m[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(m)

      const mg = {}
      if (gr) gr.forEach(g => { mg[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })
      setResultGrupos(mg)

      if (geral) { setCampeaoReal(geral.campeao_real || ''); setMarcadorReal(geral.marcador_real || '') }

      const eq2 = {}
      if (eq) eq.forEach(e => { eq2[e.id_jogo] = { casa: e.casa || '', fora: e.fora || '' } })
      setEquipasElim(eq2)

      const re2 = {}
      if (resElim) resElim.forEach(r => { re2[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultadosElim(re2)
      const mp = {}
      if (palp) palp.forEach(r => {
        if (!mp[r.jogador]) mp[r.jogador] = {}
        mp[r.jogador][r.id_jogo] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mp)

      const mg = {}
      if (grps) grps.forEach(r => {
        if (!mg[r.jogador]) mg[r.jogador] = {}
        mg[r.jogador][r.grupo] = { primeiro: r.primeiro, segundo: r.segundo }
      })
      setPalpitesGrupos(mg)

      const agora = new Date()
      const todosJogos = CALENDARIO.flatMap(d => d.jogos)
      setJogosEncerrados(todosJogos.filter(j => { const p = prazoJogo(j.id); return p && agora >= p }))

    } catch {}
  }

  function setScore(idJogo, lado, valor) {
    setResultados(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor === '' ? null : Number(valor) } }))
  }
  function setScoreElim(idJogo, lado, valor) {
    setResultadosElim(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor === '' ? null : Number(valor) } }))
  }
  function setEquipa(idJogo, lado, valor) {
    setEquipasElim(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor } }))
  }

  async function calcularPontos() {
    // 1. Guardar resultados fase de grupos
    for (const [id, sc] of Object.entries(resultados)) {
      if (sc.casa !== null && sc.fora !== null)
        await supabase.from('resultados').upsert({ id_jogo: id, casa: sc.casa, fora: sc.fora }, { onConflict: 'id_jogo' })
    }
    for (const [grupo, pos] of Object.entries(resultGrupos)) {
      if (pos.primeiro || pos.segundo)
        await supabase.from('resultados_grupos').upsert({ grupo, primeiro: pos.primeiro || null, segundo: pos.segundo || null }, { onConflict: 'grupo' })
    }
    await supabase.from('config').upsert({ id: 1, campeao_real: campeaoReal || null, marcador_real: marcadorReal || null }, { onConflict: 'id' })

    // 2. Guardar equipas e resultados eliminatórias
    for (const [id, eq] of Object.entries(equipasElim)) {
      if (eq.casa || eq.fora)
        await supabase.from('equipas_eliminacao').upsert({ id_jogo: id, casa: eq.casa || null, fora: eq.fora || null }, { onConflict: 'id_jogo' })
    }
    for (const [id, sc] of Object.entries(resultadosElim)) {
      if (sc.casa !== null && sc.fora !== null)
        await supabase.from('resultados_eliminacao').upsert({ id_jogo: id, casa: sc.casa, fora: sc.fora }, { onConflict: 'id_jogo' })
    }

    // 3. Buscar todos os palpites
    const [
      { data: jogadores },
      { data: palpitesJogos },
      { data: palpitesGrupos },
      { data: palpitesElim },
    ] = await Promise.all([
      supabase.from('jogadores').select('nome, campeao, marcador'),
      supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
      supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
      supabase.from('palpites_eliminacao').select('jogador, id_jogo, casa, fora'),
    ])

    const pontos = {}
    NOMES_AMIGOS.forEach(n => { pontos[n] = 0 })

    // Campeão e marcador
    for (const j of (jogadores || [])) {
      if (campeaoReal && j.campeao === campeaoReal) pontos[j.nome] += 10
      if (marcadorReal && j.marcador?.trim().toLowerCase() === marcadorReal.trim().toLowerCase()) pontos[j.nome] += 6
    }

    // Jogos fase de grupos
    for (const p of (palpitesJogos || [])) {
      const r = resultados[p.id_jogo]
      if (!r || r.casa === null || r.fora === null) continue
      if (p.casa === r.casa && p.fora === r.fora) pontos[p.jogador] += 3
      else if ((p.casa > p.fora && r.casa > r.fora) || (p.casa < p.fora && r.casa < r.fora) || (p.casa === p.fora && r.casa === r.fora)) pontos[p.jogador] += 1
    }

    // Vencedores de grupos
    for (const pg of (palpitesGrupos || [])) {
      const rg = resultGrupos[pg.grupo]
      if (!rg) continue
      if (pg.primeiro === rg.primeiro) pontos[pg.jogador] += 3
      else if (pg.primeiro === rg.segundo) pontos[pg.jogador] += 1
      if (pg.segundo === rg.segundo) pontos[pg.jogador] += 3
      else if (pg.segundo === rg.primeiro) pontos[pg.jogador] += 1
    }

    // Eliminatórias — mesma lógica: 3 pts resultado exato, 1 pt vencedor certo
    for (const p of (palpitesElim || [])) {
      const r = resultadosElim[p.id_jogo]
      if (!r || r.casa === null || r.fora === null) continue
      if (p.casa === r.casa && p.fora === r.fora) pontos[p.jogador] += 3
      else if ((p.casa > p.fora && r.casa > r.fora) || (p.casa < p.fora && r.casa < r.fora) || (p.casa === p.fora && r.casa === r.fora)) pontos[p.jogador] += 1
    }

    // Guardar pontos
    for (const [nome, pts] of Object.entries(pontos)) {
      await supabase.from('jogadores').upsert({ nome, pontos: pts }, { onConflict: 'nome' })
    }

    showToast('✅ Tabela atualizada com sucesso!')
  }

  async function guardarSenhas() {
    let conta = 0
    for (const [nome, senha] of Object.entries(senhas)) {
      if (senha?.trim()) {
        await supabase.from('jogadores').upsert({ nome, senha: senha.trim() }, { onConflict: 'nome' })
        conta++
      }
    }
    if (conta > 0) showToast(`✅ ${conta} palavra(s)-passe atualizada(s)!`)
    else showToast('ℹ️ Nenhuma alteração feita.')
    setSenhas({})
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
            Preenche as equipas de cada jogo à medida que se apuram. Depois insere os resultados e recalcula.
          </div>

          {FASES_ELIMINACAO.map(fase => (
            <details key={fase} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: 'pointer', padding: '10px 14px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Oswald,sans-serif', letterSpacing: 1, listStyle: 'none', userSelect: 'none' }}>
                {LABEL_FASE[fase]}
              </summary>
              <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 2 }}>
                {JOGOS_ELIMINACAO[fase].map(j => (
                  <div key={j.id} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{j.label}</p>

                    {/* Nomes das equipas */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input
                        type="text" placeholder="Equipa Casa"
                        value={equipasElim[j.id]?.casa || ''}
                        onChange={e => setEquipa(j.id, 'casa', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text" placeholder="Equipa Fora"
                        value={equipasElim[j.id]?.fora || ''}
                        onChange={e => setEquipa(j.id, 'fora', e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>

                    {/* Resultado real */}
                    <div className="jogo-row">
                      <div className="team-name left" style={{ fontSize: 12 }}>{equipasElim[j.id]?.casa || '—'}</div>
                      <input type="number" min={0} value={resultadosElim[j.id]?.casa ?? ''} onChange={e => setScoreElim(j.id, 'casa', e.target.value)} placeholder="–" />
                      <span className="sep">—</span>
                      <input type="number" min={0} value={resultadosElim[j.id]?.fora ?? ''} onChange={e => setScoreElim(j.id, 'fora', e.target.value)} placeholder="–" />
                      <div className="team-name right" style={{ fontSize: 12 }}>{equipasElim[j.id]?.fora || '—'}</div>
                    </div>
                  </div>
                ))}
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
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 14, fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
            📊 Apostas feitas
          </h4>
          <p style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 12, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
            {jogosEncerrados.length} jogos encerrados
          </p>
          <div className="card">
            {NOMES_AMIGOS.map(nome => {
              const apostasJ = palpites[nome] || {}
              const feitas = jogosEncerrados.filter(j => apostasJ[j.id] !== undefined).length
              const pct = jogosEncerrados.length > 0 ? Math.round((feitas / jogosEncerrados.length) * 100) : 0
              const corBarra = pct >= 80 ? '#00C853' : pct >= 50 ? '#FFD700' : '#FF3D00'
              const pts = 0

              return (
                <div key={nome} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontFamily: 'Oswald,sans-serif', color: '#eee' }}>{nome}</span>
                    <span style={{ color: '#666', fontFamily: 'Barlow Condensed,sans-serif' }}>
                      {feitas}/{jogosEncerrados.length}
                      <span style={{ color: 'var(--gold)', fontFamily: 'VT323,monospace', fontSize: 16, marginLeft: 8 }}>
                        {feitas > 0 ? `${pct}%` : '0%'}
                      </span>
                    </span>
                  </div>
                  <div style={{ background: '#0a0a0a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: corBarra, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '16px 0 10px', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
            📋 Em dia vs em falta
          </h4>
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
