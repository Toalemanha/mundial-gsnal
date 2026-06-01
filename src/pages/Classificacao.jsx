import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { NOMES_AMIGOS, LIMITE_REVELACAO, CALENDARIO, prazoJogo } from '../data/torneio.js'

export default function Classificacao() {
  const [dados, setDados] = useState([])
  const [palpites, setPalpites] = useState({})
  const [palpitesGrupos, setPalpitesGrupos] = useState({})
  const [campeaoApostas, setCampeaoApostas] = useState({})
  const [loading, setLoading] = useState(true)
  const [verEstatisticas, setVerEstatisticas] = useState(false)
  const podeRevelar = new Date() >= LIMITE_REVELACAO
  const agora = new Date()

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const [{ data: jogs }, { data: palp }, { data: grps }] = await Promise.all([
        supabase.from('jogadores').select('nome, pontos, campeao, marcador').order('pontos', { ascending: false }),
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
      ])

      if (jogs && jogs.length > 0) setDados(jogs)
      else setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))

      // mapa palpites: { jogador: { id_jogo: {casa,fora} } }
      const mp = {}
      if (palp) palp.forEach(r => {
        if (!mp[r.jogador]) mp[r.jogador] = {}
        mp[r.jogador][r.id_jogo] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mp)

      // mapa grupos: { jogador: { grupo: {primeiro,segundo} } }
      const mg = {}
      if (grps) grps.forEach(r => {
        if (!mg[r.jogador]) mg[r.jogador] = {}
        mg[r.jogador][r.grupo] = { primeiro: r.primeiro, segundo: r.segundo }
      })
      setPalpitesGrupos(mg)

      // campeão apostas: { jogador: campeao }
      const mc = {}
      if (jogs) jogs.forEach(j => { mc[j.nome] = j.campeao })
      setCampeaoApostas(mc)

    } catch {
      setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))
    }
    setLoading(false)
  }

  // Todos os jogos do calendário como lista plana
  const todosJogos = CALENDARIO.flatMap(dia => dia.jogos)

  // Jogos cujo prazo já passou (apostas fechadas)
  const jogosEncerrados = todosJogos.filter(j => {
    const p = prazoJogo(j.id)
    return p && agora >= p
  })

  // Calcula estatísticas para um jogador
  function statsJogador(nome) {
    const apostasJ = palpites[nome] || {}
    let acertosExatos = 0
    let acertosVencedor = 0
    let totalJogados = 0

    for (const j of jogosEncerrados) {
      const ap = apostasJ[j.id]
      if (!ap || ap.casa === null || ap.fora === null) continue
      totalJogados++
      // Precisamos dos resultados reais — não estão aqui, mas podemos contar apostas feitas
    }

    // Para exibir: % de jogos apostados vs encerrados
    const totalApostas = Object.keys(apostasJ).length
    const totalEncerrados = jogosEncerrados.length
    const faltam = todosJogos.filter(j => {
      const p = prazoJogo(j.id)
      const aberto = !p || agora < p
      return aberto && !apostasJ[j.id]
    }).length

    return { totalApostas, totalEncerrados, faltam }
  }

  const cores = ['#FFD700', '#FF69B4', '#8B4513']
  const medalhas = ['🥇', '🥈', '🥉']

  if (loading) return <div className="spinner">A carregar...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>🏆 Classificação</h2>

      <div className="card">
        {dados.map((j, i) => {
          const cor = i < 3 ? cores[i] : '#2a2a2a'
          const campAp = podeRevelar ? (j.campeao || '—') : '🔒'
          const marcAp = podeRevelar ? (j.marcador || '—') : '🔒'
          return (
            <div
              key={j.nome}
              className="rank-card"
              style={{
                borderLeftColor: cor,
                transition: 'all 0.4s ease',
              }}
            >
              <div className="rank-icon" style={{ fontSize: i < 3 ? 20 : 14 }}>
                {i < 3 ? medalhas[i] : <span style={{ color: '#444', fontFamily: 'Oswald,sans-serif' }}>{i + 1}º</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }}>
                <div className="rank-name" style={{ padding: 0 }}>{j.nome}</div>
                <div className="rank-pts-sub">{campAp} · {marcAp}</div>
              </div>
              <div>
                <div className="rank-pts-num">
                  {j.pontos}<span style={{ fontSize: 13, color: '#444', marginLeft: 2 }}>pts</span>
                </div>
              </div>
            </div>
          )
        })}

        <div className="premios-row">
          {[
            { emoji: '🥇', valor: '100€', cor: '#FFD700', lugar: '1.º lugar' },
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

        <p style={{ textAlign: 'center', fontSize: 11, color: '#555', padding: '10px 8px 4px', lineHeight: 1.5 }}>
          Em caso de empate, ganha quem tiver o melhor marcador.<br />Em novo empate, a equipa que foi mais longe no torneio.
        </p>
      </div>

      {/* ── ESTATÍSTICAS ── */}
      <button
        className="btn"
        style={{ marginTop: 8, fontSize: 13, color: verEstatisticas ? 'var(--gold)' : '#666', borderColor: verEstatisticas ? 'var(--gold)' : '#1e1e1e' }}
        onClick={() => setVerEstatisticas(!verEstatisticas)}
      >
        📊 {verEstatisticas ? 'Esconder estatísticas' : 'Ver estatísticas'}
      </button>

      {verEstatisticas && (
        <div className="card" style={{ marginTop: 8 }}>
          <h4 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 14, fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
            📊 Estatísticas
          </h4>

          {/* Apostas feitas vs total */}
          <p style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 10, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
            Apostas feitas ({jogosEncerrados.length} jogos encerrados)
          </p>

          {NOMES_AMIGOS.map(nome => {
            const apostasJ = palpites[nome] || {}
            const feitas = jogosEncerrados.filter(j => apostasJ[j.id] !== undefined).length
            const pct = jogosEncerrados.length > 0 ? Math.round((feitas / jogosEncerrados.length) * 100) : 0
            const corBarra = pct >= 80 ? '#00C853' : pct >= 50 ? '#FFD700' : '#FF3D00'
            const pts = dados.find(d => d.nome === nome)?.pontos || 0

            return (
              <div key={nome} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontFamily: 'Oswald,sans-serif', color: '#eee' }}>{nome}</span>
                  <span style={{ color: '#666', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {feitas}/{jogosEncerrados.length} apostas · <span style={{ color: 'var(--gold)', fontFamily: 'VT323,monospace', fontSize: 16 }}>{pts} pts</span>
                  </span>
                </div>
                <div style={{ background: '#0a0a0a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 4,
                    background: corBarra,
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            )
          })}

          <hr style={{ margin: '14px 0' }} />
          })}
        </div>
      )}
    </div>
  )
}
