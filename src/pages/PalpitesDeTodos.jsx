import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { CALENDARIO, NOMES_AMIGOS, prazoJogo } from '../data/torneio.js'

export default function PalpitesDeTodos({ jogador, isAdmin }) {
  const [diaIdx, setDiaIdx] = useState(0)
  const [palpites, setPalpites] = useState({}) // { "id_jogo": { "André": {casa:1,fora:0} } }
  const [loading, setLoading] = useState(true)
  const agora = new Date()

  useEffect(() => { carregarPalpites() }, [])

  async function carregarPalpites() {
    try {
      const { data } = await supabase
        .from('palpites')
        .select('jogador, id_jogo, casa, fora')

      const mapa = {}
      if (data) {
        data.forEach(r => {
          if (!mapa[r.id_jogo]) mapa[r.id_jogo] = {}
          mapa[r.id_jogo][r.jogador] = { casa: r.casa, fora: r.fora }
        })
      }
      setPalpites(mapa)
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="spinner">A carregar...</div>

  const dia = CALENDARIO[diaIdx]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>👥 Palpites de todos</h2>

      <div className="nav-row">
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.max(0, diaIdx - 1))}>◀</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>
          {dia.data}
        </div>
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO.length - 1, diaIdx + 1))}>▶</button>
      </div>

      {dia.jogos.map(j => {
        const prazo = prazoJogo(j.id)
        const encerrado = prazo && agora >= prazo

        return (
          <div key={j.id} className="palpite-card">
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2, color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
              ⏱ {j.hora} Lisboa
            </p>
            <p style={{ textAlign: 'center', fontSize: 'clamp(14px,3.5vw,17px)', marginBottom: 10, color: '#eee' }}>
              {j.casa} <span style={{ color: '#333', padding: '0 6px' }}>VS</span> {j.fora}
            </p>

            {NOMES_AMIGOS.map(amigo => {
              const p = palpites[j.id]?.[amigo]
              const podeVer = encerrado || amigo === jogador || isAdmin

              if (!p) {
                return (
                  <p key={amigo} style={{ margin: 0, padding: '4px 0', borderTop: '1px solid #1a1a1a', fontSize: 12, color: '#3a3a3a', textAlign: 'center' }}>
                    {amigo} — sem aposta
                  </p>
                )
              }

              const vc = podeVer ? p.casa : '🔒'
              const vf = podeVer ? p.fora : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#ccc'

              return (
                <p key={amigo} style={{ margin: 0, padding: '5px 0', borderTop: '1px solid #1a1a1a', fontSize: 'clamp(12px,3vw,14px)', color: destaque, textAlign: 'center' }}>
                  {amigo}&nbsp;
                  <span style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(18px,4vw,22px)', color: '#eee', letterSpacing: 2 }}>
                    {vc} - {vf}
                  </span>
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
