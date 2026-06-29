import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { CALENDARIO, CALENDARIO_ELIMINACAO, NOMES_AMIGOS, prazoJogo } from '../data/torneio.js'

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
  function parseDia(data) {
    const partes = data.split(', ')[1].split('/')
    return new Date(2026, parseInt(partes[1]) - 1, parseInt(partes[0]))
  }
  return Object.values(mapa).sort((a, b) => parseDia(a.data) - parseDia(b.data))
})()

function prazoJogoCompleto(j) {
  for (const dia of CALENDARIO_COMPLETO) {
    if (dia.jogos.find(jj => jj.id === j.id)) {
      const partes = dia.data.split(', ')[1].split('/')
      const d = parseInt(partes[0]), m = parseInt(partes[1])
      const [h, min] = j.hora.split(':').map(Number)
      const dtJogo = new Date(2026, m - 1, d, h, min, 0)
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
  if (id.startsWith('R32')) return '16 Avos de Final'
  if (id.startsWith('R16')) return 'Oitavos de Final'
  if (id.startsWith('QF'))  return 'Quartos de Final'
  if (id.startsWith('SF'))  return 'Meias-Finais'
  if (id === 'TP1')          return '3.º Lugar'
  if (id === 'FN1')          return 'Final'
  return null
}

function isElim(id) { return !!labelFase(id) }

export default function PalpitesDeTodos({ jogador, isAdmin }) {
  const [diaIdx, setDiaIdx] = useState(indiceDiaHojeCompleto())
  const [palpites, setPalpites] = useState({})
  const [palpitesElim, setPalpitesElim] = useState({})
  const [resultados, setResultados] = useState({})
  const [resultadosElim, setResultadosElim] = useState({})
  const [equipasElim, setEquipasElim] = useState({})
  const [loading, setLoading] = useState(true)
  const agora = new Date()

  useEffect(() => { carregarPalpites() }, [])

  async function carregarPalpites() {
    try {
      const [{ data }, { data: res }, { data: elimData }, { data: resElim }, { data: equipas }] = await Promise.all([
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('resultados').select('id_jogo, casa, fora'),
        supabase.from('palpites_eliminacao').select('jogador, id_jogo, casa, fora, passa'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora, passa'),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
      ])

      const mapa = {}
      if (data) data.forEach(r => {
        if (!mapa[r.id_jogo]) mapa[r.id_jogo] = {}
        mapa[r.id_jogo][r.jogador] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mapa)

      const mapaRes = {}
      if (res) res.forEach(r => { mapaRes[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(mapaRes)

      const mapaElim = {}
      if (elimData) elimData.forEach(r => {
        if (!mapaElim[r.id_jogo]) mapaElim[r.id_jogo] = {}
        mapaElim[r.id_jogo][r.jogador] = { casa: r.casa, fora: r.fora, passa: r.passa }
      })
      setPalpitesElim(mapaElim)

      const mapaResElim = {}
      if (resElim) resElim.forEach(r => { mapaResElim[r.id_jogo] = { casa: r.casa, fora: r.fora, passa: r.passa } })
      setResultadosElim(mapaResElim)

      const mapaEq = {}
      if (equipas) equipas.forEach(e => { mapaEq[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipasElim(mapaEq)

    } catch {}
    setLoading(false)
  }

  function pontosAposta(p, r, elim) {
    if (!r || r.casa === null || r.fora === null) return null
    const pc = Number(p.casa), pf = Number(p.fora), rc = Number(r.casa), rf = Number(r.fora)
    let pts = 0
    if (pc === rc && pf === rf) pts += 3
    else if ((pc > pf && rc > rf) || (pc < pf && rc < rf) || (pc === pf && rc === rf)) pts += 1
    if (elim && p.passa && r.passa && p.passa === r.passa) pts += 1
    return pts
  }

  if (loading) return <div className="spinner">A carregar...</div>

  const dia = CALENDARIO_COMPLETO[diaIdx]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>👥 Palpites de todos</h2>

      <div className="nav-row">
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.max(0, diaIdx - 1))}>◀</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>
          {dia.data}
        </div>
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO_COMPLETO.length - 1, diaIdx + 1))}>▶</button>
      </div>

      {dia.jogos.map(j => {
        const prazo = prazoJogoCompleto(j)
        const encerrado = prazo && agora >= prazo
        const elim = isElim(j.id)
        const fase = labelFase(j.id)
        const eq = elim ? equipasElim[j.id] : null
        const nomeCasa = elim ? (eq?.casa || null) : j.casa
        const nomeFora = elim ? (eq?.fora || null) : j.fora
        const mp = elim ? palpitesElim : palpites
        const r = elim ? resultadosElim[j.id] : resultados[j.id]

        const partes = dia.data.split(', ')[1].split('/')
        const dd = parseInt(partes[0]), mm = parseInt(partes[1])
        const [hh, mmin] = j.hora.split(':').map(Number)
        const inicio = new Date(2026, mm - 1, dd, hh, mmin, 0)
        const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000)
        const aDecorrer = agora >= inicio && agora <= fim

        return (
          <div key={j.id} className="palpite-card" style={{
            borderColor: aDecorrer ? 'rgba(255,215,0,0.4)' : '#1e1e1e',
            boxShadow: aDecorrer ? '0 0 12px rgba(255,215,0,0.08)' : 'none',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: fase ? 4 : 8 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: aDecorrer ? 'var(--gold)' : '#555', textTransform: 'uppercase', margin: 0 }}>
                {aDecorrer ? '🟢 A DECORRER' : `⏱ ${j.hora} Lisboa`}
              </p>
            </div>

            {fase && (
              <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                🏟️ {fase}
              </div>
            )}

            {r && r.casa !== null && (
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'VT323,monospace', fontSize: 28, color: 'var(--green)', letterSpacing: 3 }}>
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

            <p style={{ textAlign: 'center', fontSize: 'clamp(13px,3vw,15px)', marginBottom: 10, color: '#eee' }}>
              {nomeCasa || <span style={{ color: '#333' }}>A definir</span>}
              <span style={{ color: '#333', padding: '0 6px' }}>VS</span>
              {nomeFora || <span style={{ color: '#333' }}>A definir</span>}
            </p>

            {NOMES_AMIGOS.map(amigo => {
              const p = mp[j.id]?.[amigo]
              const podeVer = encerrado || amigo === jogador || isAdmin

              if (!p) return (
                <p key={amigo} style={{ margin: 0, padding: '4px 0', borderTop: '1px solid #1a1a1a', fontSize: 12, color: '#3a3a3a', textAlign: 'center' }}>
                  {amigo} — sem aposta
                </p>
              )

              const vc = podeVer ? p.casa : '🔒'
              const vf = podeVer ? p.fora : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#ccc'
              const pts = podeVer ? pontosAposta(p, r, elim) : null
              const corPts = pts >= 3 ? '#00C853' : pts > 0 ? 'var(--gold)' : pts === 0 ? '#FF3D00' : null
              const passaAcertou = elim && podeVer && p.passa && r?.passa && p.passa === r.passa

              return (
                <div key={amigo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 'clamp(12px,3vw,14px)', color: destaque, fontFamily: 'Barlow Condensed,sans-serif', flexShrink: 0 }}>
                    {amigo}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(18px,4vw,22px)', color: '#eee', letterSpacing: 2 }}>
                      {vc} - {vf}
                    </span>
                    {elim && podeVer && p.passa && (
                      <span style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(18px,4vw,22px)', color: passaAcertou ? '#00C853' : '#eee', letterSpacing: 1 }}>
                        → {p.passa.split(' ').slice(-2).join(' ')}
                      </span>
                    )}
                    {pts !== null && (
                      <span style={{ fontFamily: 'VT323,monospace', fontSize: 18, color: corPts, minWidth: 32, textAlign: 'right' }}>
                        {pts > 0 ? `+${pts}` : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
