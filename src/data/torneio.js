// ── Dados do torneio ──────────────────────────────────────────────────────────

export const NOMES_AMIGOS = ["André", "Filipe", "Paulo", "Tiago", "Hugo", "Raul", "Tó", "Ricardo"]

export const SENHA_ADMIN = "gsnal2026"

export const SENHAS_DEFAULT = {
  "André": "1111", "Filipe": "2222", "Paulo": "3333", "Tiago": "4444",
  "Hugo": "5555", "Raul": "6666", "Tó": "7777", "Ricardo": "8888"
}

export const EQUIPAS_POR_GRUPO = {
  "Grupo A": ["🇲🇽 México", "🇿🇦 Áfr. Sul", "🇰🇷 Cor. Sul", "🇨🇿 Chéquia"],
  "Grupo B": ["🇨🇦 Canadá", "🇧🇦 Bósnia", "🇶🇦 Catar", "🇨🇭 Suíça"],
  "Grupo C": ["🇧🇷 Brasil", "🇲🇦 Marrocos", "🇭🇹 Haiti", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia"],
  "Grupo D": ["🇺🇸 EUA", "🇵🇾 Paraguai", "🇦🇺 Austrália", "🇹🇷 Turquia"],
  "Grupo E": ["🇩🇪 Alemanha", "🇨🇼 Curaçau", "🇨🇮 C. Marfim", "🇪🇨 Equador"],
  "Grupo F": ["🇳🇱 P. Baixos", "🇯🇵 Japão", "🇸🇪 Suécia", "🇹🇳 Tunísia"],
  "Grupo G": ["🇧🇪 Bélgica", "🇪🇬 Egito", "🇮🇷 Irão", "🇳🇿 N. Zelândia"],
  "Grupo H": ["🇪🇸 Espanha", "🇨🇻 Cabo Verde", "🇸🇦 Arábia S.", "🇺🇾 Uruguai"],
  "Grupo I": ["🇫🇷 França", "🇸🇳 Senegal", "🇮🇶 Iraque", "🇳🇴 Noruega"],
  "Grupo J": ["🇦🇷 Argentina", "🇩🇿 Argélia", "🇦🇹 Áustria", "🇯🇴 Jordânia"],
  "Grupo K": ["🇵🇹 Portugal", "🇨🇩 RD Congo", "🇺🇿 Usbequistão", "🇨🇴 Colômbia"],
  "Grupo L": ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", "🇭🇷 Croácia", "🇬🇭 Gana", "🇵🇦 Panamá"],
}

export const TODAS_EQUIPAS = Object.values(EQUIPAS_POR_GRUPO).flat().sort()

export const JOGOS_FASE_GRUPOS = {
  "Grupo A": [["🇰🇷 Cor. Sul","🇨🇿 Chéquia","Grupo A_J1"],["🇿🇦 Áfr. Sul","🇨🇿 Chéquia","Grupo A_J2"],["🇿🇦 Áfr. Sul","🇰🇷 Cor. Sul","Grupo A_J3"]],
  "Grupo B": [["🇨🇦 Canadá","🇧🇦 Bósnia","Grupo B_J1"],["🇨🇦 Canadá","🇶🇦 Catar","Grupo B_J2"],["🇧🇦 Bósnia","🇶🇦 Catar","Grupo B_J3"]],
  "Grupo C": [["🇭🇹 Haiti","🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia","Grupo C_J1"],["🇧🇷 Brasil","🇭🇹 Haiti","Grupo C_J2"],["🇲🇦 Marrocos","🇭🇹 Haiti","Grupo C_J3"]],
  "Grupo D": [["🇺🇸 EUA","🇵🇾 Paraguai","Grupo D_J1"],["🇵🇾 Paraguai","🇹🇷 Turquia","Grupo D_J2"],["🇵🇾 Paraguai","🇦🇺 Austrália","Grupo D_J3"]],
  "Grupo E": [["🇩🇪 Alemanha","🇨🇼 Curaçau","Grupo E_J1"],["🇨🇼 Curaçau","🇪🇨 Equador","Grupo E_J2"],["🇨🇮 C. Marfim","🇨🇼 Curaçau","Grupo E_J3"]],
  "Grupo F": [["🇸🇪 Suécia","🇹🇳 Tunísia","Grupo F_J1"],["🇯🇵 Japão","🇹🇳 Tunísia","Grupo F_J2"],["🇯🇵 Japão","🇸🇪 Suécia","Grupo F_J3"]],
  "Grupo G": [["🇮🇷 Irão","🇳🇿 N. Zelândia","Grupo G_J1"],["🇪🇬 Egito","🇳🇿 N. Zelândia","Grupo G_J2"],["🇧🇪 Bélgica","🇳🇿 N. Zelândia","Grupo G_J3"]],
  "Grupo H": [["🇪🇸 Espanha","🇨🇻 Cabo Verde","Grupo H_J1"],["🇨🇻 Cabo Verde","🇺🇾 Uruguai","Grupo H_J2"],["🇨🇻 Cabo Verde","🇸🇦 Arábia S.","Grupo H_J3"]],
  "Grupo I": [["🇮🇶 Iraque","🇳🇴 Noruega","Grupo I_J1"],["🇸🇳 Senegal","🇳🇴 Noruega","Grupo I_J2"],["🇸🇳 Senegal","🇮🇶 Iraque","Grupo I_J3"]],
  "Grupo J": [["🇦🇹 Áustria","🇯🇴 Jordânia","Grupo J_J1"],["🇩🇿 Argélia","🇯🇴 Jordânia","Grupo J_J2"],["🇩🇿 Argélia","🇦🇹 Áustria","Grupo J_J3"]],
  "Grupo K": [["🇺🇿 Usbequistão","🇨🇴 Colômbia","Grupo K_J1"],["🇨🇩 RD Congo","🇨🇴 Colômbia","Grupo K_J2"],["🇨🇩 RD Congo","🇺🇿 Usbequistão","Grupo K_J3"]],
  "Grupo L": [["🇬🇭 Gana","🇵🇦 Panamá","Grupo L_J1"],["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra","🇬🇭 Gana","Grupo L_J2"],["🇭🇷 Croácia","🇬🇭 Gana","Grupo L_J3"]],
}

export const CALENDARIO = [
  { data: "Sex., 12/06", jogos: [{ hora: "03:00", id: "Grupo A_J1", casa: "🇰🇷 Cor. Sul", fora: "🇨🇿 Chéquia" }, { hora: "20:00", id: "Grupo B_J1", casa: "🇨🇦 Canadá", fora: "🇧🇦 Bósnia" }] },
  { data: "Sáb., 13/06", jogos: [{ hora: "02:00", id: "Grupo D_J1", casa: "🇺🇸 EUA", fora: "🇵🇾 Paraguai" }] },
  { data: "Dom., 14/06", jogos: [{ hora: "02:00", id: "Grupo C_J1", casa: "🇭🇹 Haiti", fora: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia" }, { hora: "18:00", id: "Grupo E_J1", casa: "🇩🇪 Alemanha", fora: "🇨🇼 Curaçau" }] },
  { data: "Seg., 15/06", jogos: [{ hora: "03:00", id: "Grupo F_J1", casa: "🇸🇪 Suécia", fora: "🇹🇳 Tunísia" }, { hora: "17:00", id: "Grupo H_J1", casa: "🇪🇸 Espanha", fora: "🇨🇻 Cabo Verde" }] },
  { data: "Ter., 16/06", jogos: [{ hora: "02:00", id: "Grupo G_J1", casa: "🇮🇷 Irão", fora: "🇳🇿 N. Zelândia" }, { hora: "23:00", id: "Grupo I_J1", casa: "🇮🇶 Iraque", fora: "🇳🇴 Noruega" }] },
  { data: "Qua., 17/06", jogos: [{ hora: "05:00", id: "Grupo J_J1", casa: "🇦🇹 Áustria", fora: "🇯🇴 Jordânia" }] },
  { data: "Qui., 18/06", jogos: [{ hora: "00:00", id: "Grupo L_J1", casa: "🇬🇭 Gana", fora: "🇵🇦 Panamá" }, { hora: "03:00", id: "Grupo K_J1", casa: "🇺🇿 Usbequistão", fora: "🇨🇴 Colômbia" }] },
  { data: "Sáb., 20/06", jogos: [{ hora: "01:30", id: "Grupo C_J2", casa: "🇧🇷 Brasil", fora: "🇭🇹 Haiti" }, { hora: "04:00", id: "Grupo D_J2", casa: "🇵🇾 Paraguai", fora: "🇹🇷 Turquia" }] },
  { data: "Dom., 21/06", jogos: [{ hora: "01:00", id: "Grupo E_J2", casa: "🇨🇼 Curaçau", fora: "🇪🇨 Equador" }, { hora: "05:00", id: "Grupo F_J2", casa: "🇯🇵 Japão", fora: "🇹🇳 Tunísia" }, { hora: "23:00", id: "Grupo H_J2", casa: "🇨🇻 Cabo Verde", fora: "🇺🇾 Uruguai" }] },
  { data: "Ter., 23/06", jogos: [{ hora: "01:00", id: "Grupo I_J2", casa: "🇸🇳 Senegal", fora: "🇳🇴 Noruega" }, { hora: "04:00", id: "Grupo J_J2", casa: "🇩🇿 Argélia", fora: "🇯🇴 Jordânia" }, { hora: "21:00", id: "Grupo L_J2", casa: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", fora: "🇬🇭 Gana" }] },
  { data: "Qua., 24/06", jogos: [{ hora: "03:00", id: "Grupo K_J2", casa: "🇨🇩 RD Congo", fora: "🇨🇴 Colômbia" }, { hora: "20:00", id: "Grupo A_J3", casa: "🇿🇦 Áfr. Sul", fora: "🇰🇷 Cor. Sul" }] },
  { data: "Qui., 25/06", jogos: [{ hora: "20:00", id: "Grupo D_J3", casa: "🇵🇾 Paraguai", fora: "🇦🇺 Austrália" }] },
]

// Datas limite (fuso de Lisboa)
export const LIMITE_FASE_FINAL = new Date("2026-06-11T18:00:00+01:00")
export const LIMITE_GRUPOS    = new Date("2026-06-18T12:00:00+01:00")
export const LIMITE_REVELACAO = new Date("2026-06-26T00:00:00+01:00")

// Prazo de cada jogo = meia-noite do dia anterior
export function prazoJogo(idJogo) {
  for (const dia of CALENDARIO) {
    for (const j of dia.jogos) {
      if (j.id === idJogo) {
        const partes = dia.data.split(", ")[1].split("/")
        const d = parseInt(partes[0]), m = parseInt(partes[1])
        // Prazo: 22:30 do dia anterior ao jogo
        const dtJogo = new Date(2026, m - 1, d)
        const dtPrazo = new Date(dtJogo)
        dtPrazo.setDate(dtPrazo.getDate() - 1)
        dtPrazo.setHours(22, 30, 0, 0)
        return dtPrazo
      }
    }
  }
  return null
}

export function indiceDiaHoje() {
  // Devolve o índice do próximo dia com jogos
  // Ex: se hoje é dia 14, devolve o índice do dia 15 (o próximo)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  for (let i = 0; i < CALENDARIO.length; i++) {
    const partes = CALENDARIO[i].data.split(", ")[1].split("/")
    const d = parseInt(partes[0]), m = parseInt(partes[1])
    const dataDia = new Date(2026, m - 1, d)
    dataDia.setHours(0, 0, 0, 0)
    // Se a data do dia ainda não passou (é hoje ou no futuro)
    if (dataDia >= hoje) return i
  }
  return CALENDARIO.length - 1
}

// ── Fase a eliminar ───────────────────────────────────────────────────────────
// As equipas ficam em branco — o admin preenche à medida que se apuram

export const FASES_ELIMINACAO = ['oitavos', 'quartos', 'meias', 'terceiro', 'final']

export const JOGOS_ELIMINACAO = {
  oitavos: [
    { id: 'R16_1', label: 'Oitavo 1' },
    { id: 'R16_2', label: 'Oitavo 2' },
    { id: 'R16_3', label: 'Oitavo 3' },
    { id: 'R16_4', label: 'Oitavo 4' },
    { id: 'R16_5', label: 'Oitavo 5' },
    { id: 'R16_6', label: 'Oitavo 6' },
    { id: 'R16_7', label: 'Oitavo 7' },
    { id: 'R16_8', label: 'Oitavo 8' },
  ],
  quartos: [
    { id: 'QF1', label: 'Quarto 1' },
    { id: 'QF2', label: 'Quarto 2' },
    { id: 'QF3', label: 'Quarto 3' },
    { id: 'QF4', label: 'Quarto 4' },
  ],
  meias: [
    { id: 'SF1', label: 'Meia-final 1' },
    { id: 'SF2', label: 'Meia-final 2' },
  ],
  terceiro: [
    { id: 'TP1', label: '3.º Lugar' },
  ],
  final: [
    { id: 'FN1', label: 'Final' },
  ],
}

export const LABEL_FASE = {
  oitavos:  '🎯 Oitavos de Final',
  quartos:  '💥 Quartos de Final',
  meias:    '🔥 Meias-Finais',
  terceiro: '🥉 3.º Lugar',
  final:    '🏆 Final',
}

// Prazos: 22:30 do dia anterior ao primeiro jogo de cada fase
export const PRAZOS_ELIMINACAO = {
  oitavos:  new Date("2026-07-03T22:30:00+01:00"),  // 1º jogo: 4 jul
  quartos:  new Date("2026-07-08T22:30:00+01:00"),  // 1º jogo: 9 jul
  meias:    new Date("2026-07-13T22:30:00+01:00"),  // 1º jogo: 14 jul
  terceiro: new Date("2026-07-17T22:30:00+01:00"),  // jogo: 18 jul
  final:    new Date("2026-07-18T22:30:00+01:00"),  // jogo: 19 jul
}
