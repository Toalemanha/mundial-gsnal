import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, PRAZOS_ELIMINACAO, NOMES_AMIGOS
} from '../data/torneio.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function ApostasEliminacao({ jogador, isAdmin }) {
  const [fase, setFase] = useState('oitavos')
  const [jogadorSel, setJogadorSel] = useState(jogador)
  const [apostas, setApostas] = useState({})   // { id_jogo: { casa, fora, passa } }
  const [equipas, setEquipas] = useState({})   // { id_jogo: { casa, fora } }
  const [confirmacao, setConfirmacao] = useState(null)
  const { toast, showToast } = useToast()
  const agora = new Date()

  useEffect(() => { carregarDados() }, [jogadorSel, fase])

  async function carregarDados() {
    try {
      const [{ data: palp }, { data: eq }] = await Promise.all([
        supabase.from('palpites_eliminacao').select('id_jogo, casa, fora, passa').eq('jogador', jogadorSel),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
      ])
      const mp = {}
      if (palp) palp.forEach(p => { mp[p.id_jogo] = { casa: p.casa, fora: p.fora, passa: p.passa } })
      setApostas(mp)
      const me = {}
      if (eq) eq.forEach(e => { me[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipas(me)
    } catch (err) { console.error(err) }
  }

  const prazo = PRAZOS_ELIMINACAO[fase]
  const bloqueado = prazo && agora >= prazo && !isAdmin

  function pedirConfirmacao() {
    const jogosParaMostrar = JOGOS_ELIMINACAO[fase].filter(j => {
      const a = apostas[j.id]
      return a && (a.casa !== null && a.casa !== undefined) && (a.fora !== null && a.fora !== undefined)
    })
    if (jogosParaMostrar.length === 0) { showToast('❌ Sem apostas para guardar.'); return }
    setConfirmacao({
      linhas: jogosParaMostrar.map(j => {
        const eq = equipas[j.id]
        const a = apostas[j.id]
        const nomeCasa = eq?.casa || j.label + ' (casa)'
        const nomeFora = eq?.fora || j.label + ' (fora)'
        const passa = a.passa ? `→ ${a.passa}` : ''
        return `${nomeCasa} ${a.casa} — ${a.fora} ${nomeFora} ${passa}`
      })
    })
  }

  async function confirmarGuardar() {
    setConfirmacao(null)
    for (const j of JOGOS_ELIMINACAO[fase]) {
      const a = apostas[j.id]
      if (!a || a.casa === null || a.casa === undefined) continue
      await supabase.from('palpites_eliminacao').upsert(
        { jogador: jogadorSel, id_jogo: j.id, casa: Number(a.casa), fora: Number(a.fora), passa: a.passa || null },
        { onConflict: 'jogador,id_jogo' }
      )
    }
    showToast(`✅ ${LABEL_FASE[fase]} guardado!`)
  }

  function setScore(idJogo, campo, valor) {
    setApostas(prev => ({ ...prev, [idJogo]: { ...prev[idJogo], [campo]: valor } }))
  }

  function togglePassa(idJogo, equipa) {
    setApostas(prev => {
      const atual = prev[idJogo]?.passa
      return { ...prev, [idJogo]: { ...prev[idJogo], passa: atual === equipa ? null : equipa } }
    })
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>🏟️ Eliminatórias — apostas</h2>

      {isAdmin && (
        <select value={jogadorSel} onChange={e => setJogadorSel(e.target.value)} style={{ marginBottom: 12 }}>
          {NOMES_AMIGOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      <div className="submenu" style={{ flexWrap: 'wrap' }}>
        {FASES_ELIMINACAO.map(f => (
          <button key={f} className={`submenu-btn ${fase === f ? 'active' : ''}`} onClick={() => setFase(f)}>
            {f === 'oitavos' ? 'R32' : f === 'quartos' ? 'Quartos' : f === 'meias' ? 'Meias' : f === 'terceiro' ? '3.º' : 'Final'}
          </button>
        ))}
      </div>

      <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
        {LABEL_FASE[fase]}
      </h4>

      {bloqueado && <div className="alert alert-warning" style={{ marginBottom: 10 }}>🔒 Prazo de apostas encerrado.</div>}

      {/* Modal */}
      {confirmacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 360 }}>
            <h4 style={{ fontFamily: 'Oswald,sans-serif', textAlign: 'center', color: 'var(--gold)', marginBottom: 16 }}>Confirmar apostas?</h4>
            {confirmacao.linhas.map((linha, i) => (
              <p key={i} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif', fontSize: 14, color: '#eee', margin: '6px 0' }}>{linha}</p>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmarGuardar}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {JOGOS_ELIMINACAO[fase].map(j => {
        const eq = equipas[j.id]
        const nomeCasa = eq?.casa || null
        const nomeFora = eq?.fora || null
        const a = apostas[j.id] || {}
        const temAposta = a.casa !== null && a.casa !== undefined && a.fora !== null && a.fora !== undefined

        return (
          <div key={j.id} className="card" style={{ marginBottom: 10, borderColor: temAposta && !bloqueado ? 'rgba(0,200,83,0.3)' : '#1e1e1e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase' }}>{j.label}</span>
              <span style={{ fontSize: 11, color: temAposta ? '#00C853' : '#444', fontFamily: 'Barlow Condensed,sans-serif' }}>
                {temAposta ? '✓ apostado' : '· por apostar'}
              </span>
            </div>

            {/* Resultado */}
            <div className="jogo-row" style={{ marginBottom: nomeCasa ? 10 : 0 }}>
              <div className="team-name left" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                {nomeCasa || <span style={{ color: '#333' }}>A definir</span>}
              </div>
              <input type="number" min={0} value={a.casa ?? ''} onChange={e => setScore(j.id, 'casa', e.target.value === '' ? null : Number(e.target.value))} disabled={bloqueado} placeholder="–" />
              <span className="sep">—</span>
              <input type="number" min={0} value={a.fora ?? ''} onChange={e => setScore(j.id, 'fora', e.target.value === '' ? null : Number(e.target.value))} disabled={bloqueado} placeholder="–" />
              <div className="team-name right" style={{ fontSize: 'clamp(11px,2.5vw,13px)' }}>
                {nomeFora || <span style={{ color: '#333' }}>A definir</span>}
              </div>
            </div>

            {/* Quem passa — só mostra se as equipas estiverem definidas */}
            {nomeCasa && nomeFora && (
              <div>
                <p style={{ fontSize: 10, color: '#444', textAlign: 'center', margin: '4px 0 6px', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Barlow Condensed,sans-serif' }}>
                  Quem passa? <span style={{ color: '#00C853' }}>(+1 pt)</span>
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[nomeCasa, nomeFora].map(eq => {
                    const ativo = a.passa === eq
                    return (
                      <button
                        key={eq}
                        onClick={() => !bloqueado && togglePassa(j.id, eq)}
                        disabled={bloqueado}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 8, cursor: bloqueado ? 'default' : 'pointer',
                          border: `1px solid ${ativo ? '#00C853' : '#2a2a2a'}`,
                          background: ativo ? 'rgba(0,200,83,0.1)' : 'transparent',
                          color: ativo ? '#00C853' : '#666',
                          fontSize: 'clamp(10px,2.3vw,12px)', fontFamily: 'Barlow Condensed,sans-serif',
                          transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {eq}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {!bloqueado && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-sm" style={{ width: 120 }} onClick={pedirConfirmacao}>Guardar</button>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
