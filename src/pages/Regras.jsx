export default function Regras() {
  const regras = [
    { pts: '3', desc: 'Resultado exato de um jogo' },
    { pts: '1', desc: 'Vencedor ou empate correto' },
    { pts: '3', desc: '1.º lugar do grupo correto' },
    { pts: '3', desc: '2.º lugar do grupo correto' },
    { pts: '1', desc: '1.º ou 2.º trocados' },
    { pts: '10', desc: 'Campeão do mundo correto' },
    { pts: '6', desc: 'Melhor marcador correto' },
  ]

  const prazos = [
    { label: 'Campeão e Marcador', data: '11 jun · 18:00' },
    { label: 'Vencedores dos grupos', data: '18 jun · 12:00' },
    { label: 'Jogos (cada jogo)', data: '23:59 do dia anterior' },
    { label: 'Quartos de final', data: '3 jul · 11:59' },
    { label: 'Meias-finais', data: '8 jul · 11:59' },
    { label: '3.º lugar e Final', data: '11 jul · 11:59' },
    { label: 'Revelação na tabela', data: '26 jun · 00:00' },
  ]

  const premios = [
    { pos: '🥇', lugar: '1.º lugar', valor: '80€', cor: '#FFD700' },
    { pos: '🥈', lugar: '2.º lugar', valor: '40€', cor: '#FF69B4' },
    { pos: '🥉', lugar: '3.º lugar', valor: '20€', cor: '#CD7F32' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>📋 Regras</h2>

      {/* Pontuação */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h4 style={{ fontFamily: 'Oswald,sans-serif', color: 'var(--gold)', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>
          🎯 Pontuação
        </h4>
        {regras.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: i > 0 ? '1px solid #1a1a1a' : 'none' }}>
            <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Barlow Condensed,sans-serif' }}>{r.desc}</span>
            <span style={{ fontFamily: 'VT323,monospace', fontSize: 22, color: 'var(--gold)', marginLeft: 12, flexShrink: 0 }}>+{r.pts}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#444', marginTop: 12, textAlign: 'center', lineHeight: 1.5, fontFamily: 'Barlow Condensed,sans-serif' }}>
          Em caso de empate na tabela, ganha quem tiver o melhor marcador.<br />Em novo empate, a equipa que foi mais longe no torneio.
        </p>
      </div>

      {/* Prazos */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h4 style={{ fontFamily: 'Oswald,sans-serif', color: 'var(--gold)', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>
          ⏱ Prazos limite
        </h4>
        {prazos.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: i > 0 ? '1px solid #1a1a1a' : 'none' }}>
            <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Barlow Condensed,sans-serif' }}>{p.label}</span>
            <span style={{ fontSize: 13, color: '#888', fontFamily: 'Barlow Condensed,sans-serif', flexShrink: 0, marginLeft: 12, textAlign: 'right' }}>{p.data}</span>
          </div>
        ))}
      </div>

      {/* Prémios */}
      <div className="card">
        <h4 style={{ fontFamily: 'Oswald,sans-serif', color: 'var(--gold)', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>
          🏆 Prémios
        </h4>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {premios.map(p => (
            <div key={p.lugar} style={{ flex: 1, textAlign: 'center', background: '#0a0a0a', borderRadius: 8, border: '1px solid #1e1e1e', padding: '12px 8px' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{p.pos}</div>
              <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(16px,4vw,20px)', color: p.cor, fontWeight: 600 }}>{p.valor}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontFamily: 'Barlow Condensed,sans-serif' }}>{p.lugar}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
