import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { NOMES_AMIGOS, LIMITE_REVELACAO } from '../data/torneio.js'

export default function Classificacao() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const podeRevelar = new Date() >= LIMITE_REVELACAO

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const { data } = await supabase
        .from('jogadores')
        .select('nome, pontos, campeao, marcador')
        .order('pontos', { ascending: false })

      if (data && data.length > 0) setDados(data)
      else setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))
    } catch {
      setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))
    }
    setLoading(false)
  }

  const cores = ['#FFD700', '#FF69B4', '#8B4513']
  const medalhas = ['🥇', '🥈', '🥉']

  if (loading) return <div className="spinner">A carregar...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🏆 Classificação</h2>
        <button
          className="btn btn-sm"
          style={{ width: 'auto', padding: '0 14px', fontSize: 13, color: '#888' }}
          onClick={carregarDados}
        >
          ↻ Atualizar
        </button>
      </div>
      <div className="card">
        {dados.map((j, i) => {
          const cor = i < 3 ? cores[i] : '#2a2a2a'
          const campAp = podeRevelar ? (j.campeao || '—') : '🔒'
          const marcAp = podeRevelar ? (j.marcador || '—') : '🔒'
          return (
            <div key={j.nome} className="rank-card" style={{ borderLeftColor: cor }}>
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
    </div>
  )
}
