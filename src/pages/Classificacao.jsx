import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { NOMES_AMIGOS, LIMITE_REVELACAO } from '../data/torneio.js'

// Cor única por jogador
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
  const [loading, setLoading] = useState(true)
  const podeRevelar = new Date() >= LIMITE_REVELACAO

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const { data } = await supabase
        .from('jogadores')
        .select('nome, pontos, campeao, marcador')
        .order('pontos', { ascending: false })

      const novos = data && data.length > 0
        ? data
        : NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null }))

      setDadosAntes(dados)
      setDados(novos)
    } catch {
      setDados(NOMES_AMIGOS.map(n => ({ nome: n, pontos: 0, campeao: null, marcador: null })))
    }
    setLoading(false)
  }

  const coresBorda = ['#FFD700', '#FF69B4', '#8B4513']
  const medalhas = ['🥇', '🥈', '🥉']

  // Índice original por nome (para cor consistente)
  const idxNome = {}
  NOMES_AMIGOS.forEach((n, i) => { idxNome[n] = i })

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
          const corBorda = i < 3 ? coresBorda[i] : '#2a2a2a'
          const campAp = podeRevelar ? (j.campeao || '—') : '🔒'
          const marcAp = podeRevelar ? (j.marcador || '—') : '🔒'
          const posAntes = dadosAntes.findIndex(d => d.nome === j.nome)
          const subiu = posAntes > i
          const desceu = posAntes !== -1 && posAntes < i

          return (
            <div
              key={j.nome}
              className="rank-card"
              style={{ borderLeftColor: corBorda, transition: 'all 0.4s ease' }}
            >
              {/* Posição / medalha */}
              <div style={{ width: 28, textAlign: 'center', flexShrink: 0, fontSize: i < 3 ? 20 : 14 }}>
                {i < 3
                  ? medalhas[i]
                  : <span style={{ color: '#444', fontFamily: 'Oswald,sans-serif' }}>{i + 1}º</span>
                }
              </div>

              {/* Avatar */}
              <div style={{ marginLeft: 8, flexShrink: 0 }}>
                <Avatar nome={j.nome} idx={idxNome[j.nome] ?? i} />
              </div>

              {/* Nome e sub */}
              <div style={{ flex: 1, minWidth: 0, padding: '0 10px' }}>
                <div style={{
                  fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3vw,16px)',
                  color: '#eee', letterSpacing: 0.5,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {j.nome}
                  {subiu && <span style={{ fontSize: 11, color: '#00C853', marginLeft: 6 }}>▲</span>}
                  {desceu && <span style={{ fontSize: 11, color: '#FF3D00', marginLeft: 6 }}>▼</span>}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>{campAp} · {marcAp}</div>
              </div>

              {/* Pontos */}
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
