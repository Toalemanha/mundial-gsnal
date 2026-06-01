import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { JOGOS_FASE_GRUPOS, EQUIPAS_POR_GRUPO, TODAS_EQUIPAS, NOMES_AMIGOS } from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Admin() {
  const [subMenu, setSubMenu] = useState('resultados')
  const [resultados, setResultados] = useState({})
  const [resultGrupos, setResultGrupos] = useState({})
  const [campeaoReal, setCampeaoReal] = useState('')
  const [marcadorReal, setMarcadorReal] = useState('')
  const [senhas, setSenhas] = useState({})
  const { toast, showToast } = useToast()

  useEffect(() => { carregarResultados() }, [])

  async function carregarResultados() {
    try {
      const { data: res } = await supabase.from('resultados').select('id_jogo, casa, fora')
      const m = {}
      if (res) res.forEach(r => { m[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(m)

      const { data: gr } = await supabase.from('resultados_grupos').select('grupo, primeiro, segundo')
      const mg = {}
      if (gr) gr.forEach(g => { mg[g.grupo] = { primeiro: g.primeiro, segundo: g.segundo } })
      setResultGrupos(mg)

      const { data: geral } = await supabase.from('config').select('campeao_real, marcador_real').eq('id', 1).single()
      if (geral) { setCampeaoReal(geral.campeao_real || ''); setMarcadorReal(geral.marcador_real || '') }
    } catch {}
  }

  function setScore(idJogo, lado, valor) {
    setResultados(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [lado]: valor === '' ? null : Number(valor) } }))
  }

  function setGrupo1(grupo, val) {
    setResultGrupos(prev => ({ ...prev, [grupo]: { ...prev[grupo], primeiro: val } }))
  }
  function setGrupo2(grupo, val) {
    setResultGrupos(prev => ({ ...prev, [grupo]: { ...prev[grupo], segundo: val } }))
  }

  async function calcularPontos() {
    // Guarda resultados
    for (const [id, scores] of Object.entries(resultados)) {
      if (scores.casa !== null && scores.fora !== null) {
        await supabase.from('resultados').upsert({ id_jogo: id, casa: scores.casa, fora: scores.fora }, { onConflict: 'id_jogo' })
      }
    }
    for (const [grupo, pos] of Object.entries(resultGrupos)) {
      if (pos.primeiro || pos.segundo) {
        await supabase.from('resultados_grupos').upsert({ grupo, primeiro: pos.primeiro || null, segundo: pos.segundo || null }, { onConflict: 'grupo' })
      }
    }
    await supabase.from('config').upsert({ id: 1, campeao_real: campeaoReal || null, marcador_real: marcadorReal || null }, { onConflict: 'id' })

    // Recalcula pontos para cada jogador
    const { data: jogadores } = await supabase.from('jogadores').select('nome, campeao, marcador')
    const { data: palpitesJogos } = await supabase.from('palpites').select('jogador, id_jogo, casa, fora')
    const { data: palpitesGrupos } = await supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo')

    const pontos = {}
    NOMES_AMIGOS.forEach(n => { pontos[n] = 0 })

    for (const j of (jogadores || [])) {
      // Campeão: 10 pts
      if (campeaoReal && j.campeao === campeaoReal) pontos[j.nome] = (pontos[j.nome] || 0) + 10
      // Marcador: 6 pts
      if (marcadorReal && j.marcador?.trim().toLowerCase() === marcadorReal.trim().toLowerCase()) pontos[j.nome] = (pontos[j.nome] || 0) + 6
    }

    for (const p of (palpitesJogos || [])) {
      const r = resultados[p.id_jogo]
      if (!r || r.casa === null || r.fora === null) continue
      if (p.casa === r.casa && p.fora === r.fora) pontos[p.jogador] = (pontos[p.jogador] || 0) + 3
      else if ((p.casa > p.fora && r.casa > r.fora) || (p.casa < p.fora && r.casa < r.fora) || (p.casa === p.fora && r.casa === r.fora)) pontos[p.jogador] = (pontos[p.jogador] || 0) + 1
    }

    for (const pg of (palpitesGrupos || [])) {
      const rg = resultGrupos[pg.grupo]
      if (!rg) continue
      if (pg.primeiro === rg.primeiro) pontos[pg.jogador] = (pontos[pg.jogador] || 0) + 3
      else if (pg.primeiro === rg.segundo) pontos[pg.jogador] = (pontos[pg.jogador] || 0) + 1
      if (pg.segundo === rg.segundo) pontos[pg.jogador] = (pontos[pg.jogador] || 0) + 3
      else if (pg.segundo === rg.primeiro) pontos[pg.jogador] = (pontos[pg.jogador] || 0) + 1
    }

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
        <button className={`submenu-btn ${subMenu === 'resultados' ? 'active' : ''}`} onClick={() => setSubMenu('resultados')}>
          Resultados
        </button>
        <button className={`submenu-btn ${subMenu === 'senhas' ? 'active' : ''}`} onClick={() => setSubMenu('senhas')}>
          Palavras-passe
        </button>
      </div>

      {/* ── RESULTADOS ── */}
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
                  <select value={resultGrupos[grupo]?.primeiro || ''} onChange={e => setGrupo1(grupo, e.target.value)}>
                    <option value="">🥇 Real 1.º...</option>
                    {EQUIPAS_POR_GRUPO[grupo].map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                  <select value={resultGrupos[grupo]?.segundo || ''} onChange={e => setGrupo2(grupo, e.target.value)}>
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

      {/* ── SENHAS ── */}
      {subMenu === 'senhas' && (
        <div>
          <h4 style={{ color: 'var(--gold)', marginBottom: 6 }}>🔑 Alterar palavras-passe</h4>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666', marginBottom: 16 }}>Deixa em branco para manter a atual.</p>

          <div className="card">
            {NOMES_AMIGOS.map(nome => (
              <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: 15, color: '#eee', width: 70, flexShrink: 0 }}>{nome}</span>
                <input
                  type="text"
                  placeholder="Nova senha..."
                  value={senhas[nome] || ''}
                  onChange={e => setSenhas(prev => ({ ...prev, [nome]: e.target.value }))}
                />
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
