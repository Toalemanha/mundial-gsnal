import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { NOMES_AMIGOS, LIMITE_REVELACAO } from '../data/torneio.js'

const CORES_JOGADOR = [
  '#4FC3F7', '#81C784', '#FFB74D', '#F06292',
  '#BA68C8', '#4DB6AC', '#FF8A65', '#A1887F',
]

function Avatar({ nome, idx }) {
  const cor = CORES_JOGADOR[idx % CORES_JOGADOR.length]
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: cor + '22', border: `2px solid ${cor}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Oswald,sans-serif', fontSize: 15, color: cor, fontWeight: 700,
    }}>
      {nome[0]}
    </div>
  )
}

export default function Classificacao() {
  const [dados, setDados] = useState([])
  const [dadosAntes, setDadosAntes] = useState([])
  const [stats, setStats] = useState({})
  const [ptsGrupos, setPtsGrupos] = useState({})
  const [loading, setLoading] = useState(true)
  const podeRevelar = new Date() >= LIMITE_REVELACAO

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const [{ data }, { data: palpitesJogos }, { data: resultadosDB }, { data: palpGrupos }, { data: resGrupos }] = await Promise.all([
        supabase.from('jogadores').select('nome, pontos, campeao, marcador').order('pontos', { ascending: false }),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora').limit(5000),
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
        supabase.from('resultados_grupos').select('grupo, primeiro, segundo'),
      ])

      const novos = data && data.length > 0
        ? data
        : NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null }))

      setDadosAntes(dados)
      setDados(novos)

      // Stats de jogos
      const resMap = {}
      if (resultadosDB) resultadosDB.forEach(r => { resMap[r.id_jogo] = { casa: Number(r.casa), fora: Number(r.fora) } })

      const statsCalc = {}
      NOMES_AMIGOS.forEach(n => { statsCalc[n] = { jogados: 0, tendencias: 0, exatos: 0 } })

      if (palpitesJogos) {
        for (const p of palpitesJogos) {
          const r = resMap[p.id_jogo]
          if (!r) continue
          const nome = p.jogador.trim()
          if (!statsCalc[nome]) statsCalc[nome] = { jogados: 0, tendencias: 0, exatos: 0 }
          statsCalc[nome].jogados += 1
          const pc = Number(p.casa), pf = Number(p.fora), rc = r.casa, rf = r.fora
          if (pc === rc && pf === rf) statsCalc[nome].exatos += 1
          else if ((pc > pf && rc > rf) || (pc < pf && rc < rf) || (pc === pf && rc === rf)) statsCalc[nome].tendencias += 1
        }
      }
      setStats(statsCalc)

      // Pontos de grupos
      const resGrMap = {}
      if (resGrupos) resGrupos.forEach(r => { resGrMap[r.grupo] = { primeiro: r.primeiro, segundo: r.segundo } })

      const ptsGrCalc = {}
      NOMES_AMIGOS.forEach(n => { ptsGrCalc[n] = 0 })

      if (palpGrupos) {
        for (const pg of palpGrupos) {
          const rg = resGrMap[pg.grupo]
          if (!rg || !rg.primeiro) continue
          const nome = pg.jogador.trim()
          if (pg.primeiro === rg.primeiro) ptsGrCalc[nome] = (ptsGrCalc[nome] || 0) + 3
          else if (pg.primeiro === rg.segundo) ptsGrCalc[nome] = (ptsGrCalc[nome] || 0) + 1
          if (pg.segundo === rg.segundo) ptsGrCalc[nome] = (ptsGrCalc[nome] || 0) + 3
          else if (pg.segundo === rg.primeiro) ptsGrCalc[nome] = (ptsGrCalc[nome] || 0) + 1
        }
      }
      setPtsGrupos(ptsGrCalc)

    } catch {
      setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))
    }
    setLoading(false)
  }

  const coresBorda = ['#FFD700', '#FF69B4', '#8B4513']
  const medalhas = ['🥇', '🥈', '🥉']
  const idxNome = {}
  NOMES_AMIGOS.forEach((n, i) => { idxNome[n] = i })

  if (loading) return <div className="spinner">A carregar...</div>

  const temResultadosGrupos = Object.values(ptsGrupos).some(v => v > 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🏆 Classificação</h2>
        <button className="btn btn-sm" style={{ width: 'auto', padding: '0 14px', fontSize: 13, color: '#888' }} onClick={carregarDados}>
          ↻ Atualizar
        </button>
      </div>

      <div className="card">
        {dados.map((j, i) => {
          const corBorda = i < 3 ? coresBorda[i] : '#2a2a2a'
          const posAntes = dadosAntes.findIndex(d => d.nome === j.nome)
          const subiu = posAntes > i
          const desceu = posAntes !== -1 && posAntes < i
          const s = stats[j.nome] || { jogados: 0, tendencias: 0, exatos: 0 }
          const pg = ptsGrupos[j.nome] || 0

          return (
            <div key={j.nome} className="rank-card" style={{ borderLeftColor: corBorda, transition: 'all 0.4s ease', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
              <div style={{ width: 28, textAlign: 'center', flexShrink: 0, fontSize: i < 3 ? 20 : 14 }}>
                {i < 3 ? medalhas[i] : <span style={{ color: '#444', fontFamily: 'Oswald,sans-serif' }}>{i + 1}º</span>}
              </div>

              <div style={{ marginLeft: 8, flexShrink: 0 }}>
                <Avatar nome={j.nome} idx={idxNome[j.nome] ?? i} />
              </div>

              <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }}>
                <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(13px,2.8vw,15px)', color: '#eee', letterSpacing: 0.3, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nome}</span>
                  {subiu && <span style={{ fontSize: 10, color: '#00C853', flexShrink: 0 }}>▲</span>}
                  {desceu && <span style={{ fontSize: 10, color: '#FF3D00', flexShrink: 0 }}>▼</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontFamily: 'Barlow Condensed,sans-serif', fontSize: 11, flexWrap: 'wrap' }}>
                  <span style={{ color: '#666' }}>⚽<strong style={{ color: '#888' }}>{s.jogados}</strong></span>
                  <span style={{ color: '#333' }}>·</span>
                  <span style={{ color: '#666' }}>🎯<strong style={{ color: '#00C853' }}>{s.exatos}</strong></span>
                  <span style={{ color: '#333' }}>·</span>
                  <span style={{ color: '#666' }}>✅<strong style={{ color: 'var(--gold)' }}>{s.tendencias}</strong></span>
                  {temResultadosGrupos && (
                    <>
                      <span style={{ color: '#333' }}>·</span>
                      <span style={{ color: '#666' }}>🗂️<strong style={{ color: pg > 0 ? '#4FC3F7' : '#444' }}>+{pg}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(24px,5vw,30px)', color: 'var(--gold)', lineHeight: 1 }}>
                  {j.pontos}
                </div>
                <div style={{ fontSize: 11, color: '#444' }}>pts</div>
              </div>
            </div>
          )
        })}

        <div className="premios-row">
          {[
            { emoji: '🥇', valor: '80€', cor: '#FFD700', lugar: '1.º lugar' },
            { emoji: '🥈', valor: '40€', cor: '#FF69B4', lugar: '2.º lugar' },
            { emoji: '🥉', valor: '20€', cor: '#CD7F32', lugar: '3.º lugar' },
          ].map(p => (
            <div key={p.lugar} className="premio-card">
              <div style={{ fontSize: 20 }}>{p.emoji}</div>
              <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(15px,4vw,18px)', color: p.cor, fontWeight: 600, lineHeight: 1.3 }}>{p.valor}</div>
              <div style={{ fontSize: 11, color: '#f5fffb' }}>{p.lugar}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', padding: '10px 8px 4px', lineHeight: 1.5 }}>
          Em caso de empate, ganha quem tiver o melhor marcador.<br />Em novo empate, a equipa que foi mais longe no torneio.
        </p>
      </div>
    </div>
  )
}
