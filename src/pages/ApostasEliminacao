import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, PRAZOS_ELIMINACAO, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function ApostasEliminacao({ jogador, isAdmin }) {
  const [fase, setFase] = useState('quartos')
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [scores, setScores] = useState({})       // { id_jogo: { casa, fora } }
  const [equipas, setEquipas] = useState({})      // { id_jogo: { casa, fora } } — nomes das equipas
  const [confirmacao, setConfirmacao] = useState(null)
  const { toast, showToast } = useToast()
  const agora = new Date()

  useEffect(() => { carregarDados() }, [jogadorSel])

  async function carregarDados() {
    try {
      const [{ data: palp }, { data: eq }] = await Promise.all([
        supabase.from('palpites_eliminacao').select('id_jogo, casa, fora').eq('jogador', jogadorSel),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
      ])

      const sc = {}
      if (palp) palp.forEach(p => { sc[p.id_jogo] = { casa: p.casa, fora: p.fora } })
      setScores(sc)

      const eq2 = {}
      if (eq) eq.forEach(e => { eq2[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipas(eq2)
    } catch {}
  }

  const prazo = PRAZOS_ELIMINACAO[fase]
  const bloqueado = agora >= prazo && !isAdmin
  const jogosAtivos = JOGOS_ELIMINACAO[fase].filter(j => equipas[j.id]?.casa && equipas[j.id]?.fora)

  function pedirConfirmacao() {
    const linhas = []
    let temVazio = false

    for (const j of jogosAtivos) {
      if (bloqueado) continue
      const c = scores[j.id]?.casa
      const f = scores[j.id]?.fora
      if (c === undefined || c === null || f === undefined || f === null) { temVazio = true; break }
      const nomeCasa = equipas[j.id]?.casa || j.label
      const nomeFora = equipas[j.id]?.fora || '?'
      linhas.push(`${nomeCasa} ${c} — ${f} ${nomeFora}`)
    }

    if (temVazio) { showToast('❌ Mete um resultado válido, pá!'); return }
    if (linhas.length === 0) { showToast('ℹ️ Não há jogos para guardar.'); return }
    setConfirmacao({ linhas })
  }

  async function confirmarGuardar() {
    setConfirmacao(null)
    for (const j of jogosAtivos) {
      const c = scores[j.id]?.casa
      const f = scores[j.id]?.fora
      if (c === null || f === null || c === undefined || f === undefined) continue
      await supabase.from('palpites_eliminacao').upsert(
        { jogador: jogadorSel, id_jogo: j.id, casa: Number(c), fora: Number(f) },
        { onConflict: 'jogador,id_jogo' }
      )
    }
    showToast(`✅ ${LABEL_FASE[fase]} guardada!`)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>🏟️ Fase a eliminar</h2>

      {isAdmin && (
        <select value={jogadorSel} onChange={e => setJogadorSel(e.target.value)} style={{ marginBottom: 12 }}>
          {NOMES_AMIGOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      {/* Selector de fase */}
      <div className="submenu" style={{ flexWrap: 'wrap' }}>
        {FASES_ELIMINACAO.map(f => (
          <button
            key={f}
            className={`submenu-btn ${fase === f ? 'active' : ''}`}
            onClick={() => setFase(f)}
          >
            {f === 'quartos' ? 'Quartos' : f === 'meias' ? 'Meias' : f === 'terceiro' ? '3.º' : 'Final'}
          </button>
        ))}
      </div>

      <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0 4px', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
        {LABEL_FASE[fase]}
      </h4>

      {bloqueado && (
        <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Apostas encerradas para esta fase.</div>
      )}

      {/* Modal de confirmação */}
      {confirmacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 340 }}>
            <h4 style={{ fontFamily: 'Oswald,sans-serif', textAlign: 'center', color: 'var(--gold)', marginBottom: 16, letterSpacing: 1 }}>
              Confirmar aposta?
            </h4>
            {confirmacao.linhas.map((linha, i) => (
              <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 16, color: '#eee', margin: '6px 0' }}>{linha}</p>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmarGuardar}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Jogos da fase */}
      {JOGOS_ELIMINACAO[fase].map(j => {
        const nomeCasa = equipas[j.id]?.casa
        const nomeFora = equipas[j.id]?.fora
        const jogoDisponivel = nomeCasa && nomeFora

        return (
          <div key={j.id} className="card" style={{ marginBottom: 10 }}>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              {j.label}{bloqueado ? '  🔒' : ''}
            </p>

            {!jogoDisponivel ? (
              <p style={{ textAlign: 'center', color: '#444', fontSize: 13, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1 }}>
                ⏳ Equipas ainda não apuradas
              </p>
            ) : (
              <div className="jogo-row">
                <div className="team-name left">{nomeCasa}</div>
                <input
                  type="number" min={0}
                  value={scores[j.id]?.casa ?? ''}
                  onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value === '' ? null : Number(e.target.value) } }))}
                  disabled={bloqueado}
                  placeholder="–"
                />
                <span className="sep">—</span>
                <input
                  type="number" min={0}
                  value={scores[j.id]?.fora ?? ''}
                  onChange={e => setScores(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value === '' ? null : Number(e.target.value) } }))}
                  disabled={bloqueado}
                  placeholder="–"
                />
                <div className="team-name right">{nomeFora}</div>
              </div>
            )}
          </div>
        )
      })}

      {jogosAtivos.length > 0 && !bloqueado && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacao}>Guardar</button>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
