// ── Dados do torneio ──────────────────────────────────────────────────────────

export const NOMES_AMIGOS = ["André", "Filipe", "Paulo", "Tiago", "Hugo", "Tó", "Ricardo"]

export const SENHA_ADMIN = "gsnal2026"

export const SENHAS_DEFAULT = {
  "André": "1111", "Filipe": "2222", "Paulo": "3333", "Tiago": "4444",
  "Hugo": "5555", "Tó": "7777", "Ricardo": "8888"
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
  "Grupo D": [["🇺🇸 EUA","🇵🇾 Paraguai","Grupo D_J1"],["🇹🇷 Turquia","🇵🇾 Paraguai","Grupo D_J2"],["🇵🇾 Paraguai","🇦🇺 Austrália","Grupo D_J3"]],
  "Grupo E": [["🇩🇪 Alemanha","🇨🇼 Curaçau","Grupo E_J1"],["🇪🇨 Equador","🇨🇼 Curaçau","Grupo E_J2"],["🇨🇮 C. Marfim","🇨🇼 Curaçau","Grupo E_J3"]],
  "Grupo F": [["🇸🇪 Suécia","🇹🇳 Tunísia","Grupo F_J1"],["🇹🇳 Tunísia","🇯🇵 Japão","Grupo F_J2"],["🇯🇵 Japão","🇸🇪 Suécia","Grupo F_J3"]],
  "Grupo G": [["🇮🇷 Irão","🇳🇿 N. Zelândia","Grupo G_J1"],["🇳🇿 N. Zelândia","🇪🇬 Egito","Grupo G_J2"],["🇧🇪 Bélgica","🇳🇿 N. Zelândia","Grupo G_J3"]],
  "Grupo H": [["🇪🇸 Espanha","🇨🇻 Cabo Verde","Grupo H_J1"],["🇨🇻 Cabo Verde","🇺🇾 Uruguai","Grupo H_J2"],["🇨🇻 Cabo Verde","🇸🇦 Arábia S.","Grupo H_J3"]],
  "Grupo I": [["🇮🇶 Iraque","🇳🇴 Noruega","Grupo I_J1"],["🇳🇴 Noruega","🇸🇳 Senegal","Grupo I_J2"],["🇸🇳 Senegal","🇮🇶 Iraque","Grupo I_J3"]],
  "Grupo J": [["🇦🇹 Áustria","🇯🇴 Jordânia","Grupo J_J1"],["🇯🇴 Jordânia","🇩🇿 Argélia","Grupo J_J2"],["🇩🇿 Argélia","🇦🇹 Áustria","Grupo J_J3"]],
  "Grupo K": [["🇺🇿 Usbequistão","🇨🇴 Colômbia","Grupo K_J1"],["🇨🇴 Colômbia","🇨🇩 RD Congo","Grupo K_J2"],["🇨🇩 RD Congo","🇺🇿 Usbequistão","Grupo K_J3"]],
  "Grupo L": [["🇬🇭 Gana","🇵🇦 Panamá","Grupo L_J1"],["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra","🇬🇭 Gana","Grupo L_J2"],["🇭🇷 Croácia","🇬🇭 Gana","Grupo L_J3"]],
}

export const CALENDARIO = [
  { data: "Sex., 12/06", jogos: [
    { hora: "03:30", id: "Grupo A_J1", casa: "🇰🇷 Cor. Sul", fora: "🇨🇿 Chéquia" },
    { hora: "20:00", id: "Grupo B_J1", casa: "🇨🇦 Canadá", fora: "🇧🇦 Bósnia" }
  ]},
  { data: "Sáb., 13/06", jogos: [
    { hora: "02:00", id: "Grupo D_J1", casa: "🇺🇸 EUA", fora: "🇵🇾 Paraguai" }
  ]},
  { data: "Dom., 14/06", jogos: [
    { hora: "02:00", id: "Grupo C_J1", casa: "🇭🇹 Haiti", fora: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia" },
    { hora: "18:00", id: "Grupo E_J1", casa: "🇩🇪 Alemanha", fora: "🇨🇼 Curaçau" }
  ]},
  { data: "Seg., 15/06", jogos: [
    { hora: "03:00", id: "Grupo F_J1", casa: "🇸🇪 Suécia", fora: "🇹🇳 Tunísia" },
    { hora: "17:00", id: "Grupo H_J1", casa: "🇪🇸 Espanha", fora: "🇨🇻 Cabo Verde" }
  ]},
  { data: "Ter., 16/06", jogos: [
    { hora: "02:00", id: "Grupo G_J1", casa: "🇮🇷 Irão", fora: "🇳🇿 N. Zelândia" },
    { hora: "23:00", id: "Grupo I_J1", casa: "🇮🇶 Iraque", fora: "🇳🇴 Noruega" }
  ]},
  { data: "Qua., 17/06", jogos: [
    { hora: "05:00", id: "Grupo J_J1", casa: "🇦🇹 Áustria", fora: "🇯🇴 Jordânia" }
  ]},
  { data: "Qui., 18/06", jogos: [
    { hora: "00:00", id: "Grupo L_J1", casa: "🇬🇭 Gana", fora: "🇵🇦 Panamá" },
    { hora: "03:00", id: "Grupo K_J1", casa: "🇺🇿 Usbequistão", fora: "🇨🇴 Colômbia" },
    { hora: "17:00", id: "Grupo A_J2", casa: "🇿🇦 Áfr. Sul", fora: "🇨🇿 Chéquia" },
    { hora: "23:00", id: "Grupo B_J2", casa: "🇨🇦 Canadá", fora: "🇶🇦 Catar" }
  ]},
  { data: "Sáb., 20/06", jogos: [
    { hora: "01:30", id: "Grupo C_J2", casa: "🇧🇷 Brasil", fora: "🇭🇹 Haiti" },
    { hora: "04:00", id: "Grupo D_J2", casa: "🇹🇷 Turquia", fora: "🇵🇾 Paraguai" }
  ]},
  { data: "Dom., 21/06", jogos: [
    { hora: "01:00", id: "Grupo E_J2", casa: "🇪🇨 Equador", fora: "🇨🇼 Curaçau" },
    { hora: "05:00", id: "Grupo F_J2", casa: "🇹🇳 Tunísia", fora: "🇯🇵 Japão" },
    { hora: "23:00", id: "Grupo H_J2", casa: "🇨🇻 Cabo Verde", fora: "🇺🇾 Uruguai" }
  ]},
  { data: "Seg., 22/06", jogos: [
    { hora: "02:00", id: "Grupo G_J2", casa: "🇳🇿 N. Zelândia", fora: "🇪🇬 Egito" }
  ]},
  { data: "Ter., 23/06", jogos: [
    { hora: "01:00", id: "Grupo I_J2", casa: "🇳🇴 Noruega", fora: "🇸🇳 Senegal" },
    { hora: "04:00", id: "Grupo J_J2", casa: "🇯🇴 Jordânia", fora: "🇩🇿 Argélia" },
    { hora: "21:00", id: "Grupo L_J2", casa: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", fora: "🇬🇭 Gana" }
  ]},
  { data: "Qua., 24/06", jogos: [
    { hora: "03:00", id: "Grupo K_J2", casa: "🇨🇴 Colômbia", fora: "🇨🇩 RD Congo" },
    { hora: "20:00", id: "Grupo B_J3", casa: "🇧🇦 Bósnia", fora: "🇶🇦 Catar" },
    { hora: "23:00", id: "Grupo C_J3", casa: "🇲🇦 Marrocos", fora: "🇭🇹 Haiti" }
  ]},
  { data: "Qui., 25/06", jogos: [
    { hora: "02:00", id: "Grupo A_J3", casa: "🇿🇦 Áfr. Sul", fora: "🇰🇷 Cor. Sul" },
    { hora: "21:00", id: "Grupo E_J3", casa: "🇨🇮 C. Marfim", fora: "🇨🇼 Curaçau" }
  ]},
  { data: "Sex., 26/06", jogos: [
    { hora: "00:00", id: "Grupo F_J3", casa: "🇯🇵 Japão", fora: "🇸🇪 Suécia" },
    { hora: "03:00", id: "Grupo D_J3", casa: "🇵🇾 Paraguai", fora: "🇦🇺 Austrália" },
    { hora: "20:00", id: "Grupo I_J3", casa: "🇸🇳 Senegal", fora: "🇮🇶 Iraque" }
  ]},
  { data: "Sáb., 27/06", jogos: [
    { hora: "01:00", id: "Grupo H_J3", casa: "🇨🇻 Cabo Verde", fora: "🇸🇦 Arábia S." },
    { hora: "04:00", id: "Grupo G_J3", casa: "🇧🇪 Bélgica", fora: "🇳🇿 N. Zelândia" },
    { hora: "22:00", id: "Grupo L_J3", casa: "🇭🇷 Croácia", fora: "🇬🇭 Gana" }
  ]},
  { data: "Dom., 28/06", jogos: [
    { hora: "03:00", id: "Grupo J_J3", casa: "🇩🇿 Argélia", fora: "🇦🇹 Áustria" },
    { hora: "00:30", id: "Grupo K_J3", casa: "🇨🇩 RD Congo", fora: "🇺🇿 Usbequistão" }
  ]}
]

// Datas limite (fuso de Lisboa)
export const LIMITE_FASE_FINAL = new Date("2026-06-11T18:00:00+01:00")
export const LIMITE_GRUPOS    = new Date("2026-06-18T12:00:00+01:00")
export const LIMITE_REVELACAO = new Date("2026-06-26T00:00:00+01:00")

// Prazo de cada jogo = 2 horas antes do início
export function prazoJogo(idJogo) {
  for (const dia of CALENDARIO) {
    for (const j of dia.jogos) {
      if (j.id === idJogo) {
        const partes = dia.data.split(", ")[1].split("/")
        const d = parseInt(partes[0]), m = parseInt(partes[1])
        const [hJogo, mJogo] = j.hora.split(":").map(Number)
        const dtJogo = new Date(2026, m - 1, d, hJogo, mJogo, 0)
        return new Date(dtJogo.getTime() - 2 * 60 * 60 * 1000)
      }
    }
  }
  return null
}

export function indiceDiaHoje() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  for (let i = 0; i < CALENDARIO.length; i++) {
    const partes = CALENDARIO[i].data.split(", ")[1].split("/")
    const d = parseInt(partes[0]), m = parseInt(partes[1])
    const dataDia = new Date(2026, m - 1, d)
    dataDia.setHours(0, 0, 0, 0)
    if (dataDia >= hoje) return i
  }
  return CALENDARIO.length - 1
}

// ── Fase a eliminar ───────────────────────────────────────────────────────────

export const FASES_ELIMINACAO = ['r32', 'r16', 'quartos', 'meias', 'terceiro', 'final']

export const CALENDARIO_ELIMINACAO = [
  { data: "Sáb., 28/06", jogos: [{ hora: "20:00", id: "R32_1", label: "16avos Jogo 1" }]},
  { data: "Dom., 29/06", jogos: [
    { hora: "18:00", id: "R32_3", label: "16avos Jogo 3" },
    { hora: "21:00", id: "R32_2", label: "16avos Jogo 2" },
    { hora: "02:00", id: "R32_4", label: "16avos Jogo 4" },
  ]},
  { data: "Seg., 30/06", jogos: [
    { hora: "18:00", id: "R32_6", label: "16avos Jogo 6" },
    { hora: "22:00", id: "R32_5", label: "16avos Jogo 5" },
    { hora: "02:00", id: "R32_7", label: "16avos Jogo 7" },
  ]},
  { data: "Ter., 01/07", jogos: [
    { hora: "17:00", id: "R32_8",  label: "16avos Jogo 8" },
    { hora: "21:00", id: "R32_9",  label: "16avos Jogo 9" },
    { hora: "01:00", id: "R32_10", label: "16avos Jogo 10" },
  ]},
  { data: "Qua., 02/07", jogos: [
    { hora: "00:00", id: "R32_11", label: "16avos Jogo 11" },
    { hora: "20:00", id: "R32_12", label: "16avos Jogo 12" },
    { hora: "02:00", id: "R32_13", label: "16avos Jogo 13" },
  ]},
  { data: "Qui., 03/07", jogos: [
    { hora: "19:00", id: "R32_16", label: "16avos Jogo 16" },
    { hora: "23:00", id: "R32_14", label: "16avos Jogo 14" },
    { hora: "02:30", id: "R32_15", label: "16avos Jogo 15" },
  ]},
  { data: "Sáb., 04/07", jogos: [
    { hora: "18:00", id: "R16_2", label: "Oitavos Jogo 2" },
    { hora: "22:00", id: "R16_1", label: "Oitavos Jogo 1" },
  ]},
  { data: "Dom., 05/07", jogos: [
    { hora: "21:00", id: "R16_3", label: "Oitavos Jogo 3" },
    { hora: "01:00", id: "R16_4", label: "Oitavos Jogo 4" },
  ]},
  { data: "Seg., 07/07", jogos: [
    { hora: "20:00", id: "R16_5", label: "Oitavos Jogo 5" },
    { hora: "01:00", id: "R16_6", label: "Oitavos Jogo 6" },
  ]},
  { data: "Ter., 08/07", jogos: [
    { hora: "17:00", id: "R16_7", label: "Oitavos Jogo 7" },
    { hora: "21:00", id: "R16_8", label: "Oitavos Jogo 8" },
  ]},
  { data: "Qui., 09/07", jogos: [{ hora: "21:00", id: "QF1", label: "Quarto 1" }]},
  { data: "Sex., 10/07", jogos: [{ hora: "20:00", id: "QF2", label: "Quarto 2" }]},
  { data: "Sáb., 11/07", jogos: [
    { hora: "22:00", id: "QF3", label: "Quarto 3" },
    { hora: "02:00", id: "QF4", label: "Quarto 4" },
  ]},
  { data: "Ter., 14/07", jogos: [{ hora: "20:00", id: "SF1", label: "Meia-final 1" }]},
  { data: "Qua., 15/07", jogos: [{ hora: "20:00", id: "SF2", label: "Meia-final 2" }]},
  { data: "Sex., 18/07", jogos: [{ hora: "22:00", id: "TP1", label: "3.º Lugar" }]},
  { data: "Dom., 19/07", jogos: [{ hora: "20:00", id: "FN1", label: "Final" }]},
]

export const JOGOS_ELIMINACAO = {
  r32: [
    { id: 'R32_1',  label: 'Jogo 1' },  { id: 'R32_2',  label: 'Jogo 2' },
    { id: 'R32_3',  label: 'Jogo 3' },  { id: 'R32_4',  label: 'Jogo 4' },
    { id: 'R32_5',  label: 'Jogo 5' },  { id: 'R32_6',  label: 'Jogo 6' },
    { id: 'R32_7',  label: 'Jogo 7' },  { id: 'R32_8',  label: 'Jogo 8' },
    { id: 'R32_9',  label: 'Jogo 9' },  { id: 'R32_10', label: 'Jogo 10' },
    { id: 'R32_11', label: 'Jogo 11' }, { id: 'R32_12', label: 'Jogo 12' },
    { id: 'R32_13', label: 'Jogo 13' }, { id: 'R32_14', label: 'Jogo 14' },
    { id: 'R32_15', label: 'Jogo 15' }, { id: 'R32_16', label: 'Jogo 16' },
  ],
  r16: [
    { id: 'R16_1', label: 'Jogo 1' }, { id: 'R16_2', label: 'Jogo 2' },
    { id: 'R16_3', label: 'Jogo 3' }, { id: 'R16_4', label: 'Jogo 4' },
    { id: 'R16_5', label: 'Jogo 5' }, { id: 'R16_6', label: 'Jogo 6' },
    { id: 'R16_7', label: 'Jogo 7' }, { id: 'R16_8', label: 'Jogo 8' },
  ],
  quartos:  [{ id: 'QF1', label: 'Quarto 1' }, { id: 'QF2', label: 'Quarto 2' }, { id: 'QF3', label: 'Quarto 3' }, { id: 'QF4', label: 'Quarto 4' }],
  meias:    [{ id: 'SF1', label: 'Meia-final 1' }, { id: 'SF2', label: 'Meia-final 2' }],
  terceiro: [{ id: 'TP1', label: '3.º Lugar' }],
  final:    [{ id: 'FN1', label: 'Final' }],
}

export const LABEL_FASE = {
  r32:      '🆕 16 Avos de Final',
  r16:      '⚔️ Oitavos de Final',
  quartos:  '💥 Quartos de Final',
  meias:    '🔥 Meias-Finais',
  terceiro: '🥉 3.º Lugar',
  final:    '🏆 Final',
}

export const PRAZOS_ELIMINACAO = {
  r32:      new Date("2026-06-27T22:30:00+01:00"),
  r16:      new Date("2026-07-03T22:30:00+01:00"),
  quartos:  new Date("2026-07-08T22:30:00+01:00"),
  meias:    new Date("2026-07-13T22:30:00+01:00"),
  terceiro: new Date("2026-07-17T22:30:00+01:00"),
  final:    new Date("2026-07-18T22:30:00+01:00"),
}
