const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')

const supabase = createClient(
  'https://vrfxzapqmpoyqpajfnqf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  }
)

async function seed() {
  // 1. Get Jay's profile id for author fields
  const { data: jayProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', 'jaypantha21@gmail.com')
    .single()
  const authorId = jayProfile?.id
  const authorName = jayProfile?.full_name ?? 'Jay Pantha'
  if (!authorId) { console.error('Could not find jaypantha21@gmail.com profile'); return }
  console.log(`✓ Using author: ${authorName} (${authorId})`)

  // 2. Create demo coach account for hiring manager
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'demo@lakeshow.io',
    password: 'LakersDemo2026!',
    email_confirm: true,
    user_metadata: { full_name: 'Demo Coach' }
  })
  if (authErr && !authErr.message.includes('already')) {
    console.error('Auth error:', authErr.message)
  } else {
    const uid = authData?.user?.id
    if (uid) {
      await supabase.from('profiles').upsert({ id: uid, email: 'demo@lakeshow.io', full_name: 'Demo Coach', role: 'coach' })
      console.log('✓ Demo coach account: demo@lakeshow.io / LakersDemo2026!')
    } else {
      const { data: ex } = await supabase.from('profiles').select('id').eq('email','demo@lakeshow.io').single()
      if (ex) { await supabase.from('profiles').update({ role: 'coach' }).eq('id', ex.id) }
      console.log('✓ Demo coach account already exists')
    }
  }

  // 3. Scouting Reports (schema: opponent_team_id, game_date, offensive_tendencies, defensive_tendencies, key_players, ai_summary, created_by)
  // NBA team IDs from api.ts NBA_TEAMS
  const scoutingReports = [
    {
      opponent_team_id: 1610612760, // OKC Thunder
      game_date: '2026-05-08',
      key_players: ['Shai Gilgeous-Alexander', 'Jalen Williams', 'Chet Holmgren'],
      offensive_tendencies: 'OKC runs heavy pick-and-roll with SGA as the initiator — attacks closeouts at an elite rate (68th percentile DHO). Holmgren spaces the floor as a stretch-5. Williams is secondary creator, prefers mid-range pull-ups on the right side. Push-pace on live-ball turnovers — 6th in fast-break points this season.',
      defensive_tendencies: 'Elite switching scheme — Holmgren anchors the rim (4.1 BPG). Heavy ICE coverage on ball screens. SGA leads team in steals; they gamble for live-ball TOs at a high rate. Vulnerable in transition D and against quick ball movement in the middle.',
      ai_summary: 'KEY GAME PLAN: Attack Holmgren in pick-and-roll to get him in foul trouble early. Luka probes off ball screens and kicks to Reaves/Kennard in the corners. Push pace after every defensive rebound. Post LeBron vs their smaller wings. Force SGA right — he\'s 12% worse driving right. Expect them to ICE every Luka ball screen; counter with slip actions.',
      offensive_rating: 118.4,
      defensive_rating: 109.2,
      three_point_rate: 41.2,
      pace_ranking: 8,
      created_by: authorId
    },
    {
      opponent_team_id: 1610612745, // Houston Rockets
      game_date: '2026-04-22',
      key_players: ['Alperen Sengun', 'Jalen Green', 'Amen Thompson'],
      offensive_tendencies: 'High volume post touches for Sengun — leads the league in post-up frequency. Green is a volume scorer who lives in pull-up 3s. Thompson excels in transition and as a cutter. 7th in offensive rebounding rate; limiting second chances is critical.',
      defensive_tendencies: 'Zone-heavy — 2-3 zone on 34% of possessions to limit Luka off the dribble. Switch on all screens involving Sengun. Force left on Green (31% shooting going left). Sengun is a rim protector (2.3 BPG) — no middle penetration.',
      ai_summary: 'KEY GAME PLAN: Attack the 2-3 zone with quick skip passes to weak-side shooters (Reaves, Kennard, Knecht). Keep Luka stationary in the corner to freeze the zone, then attack closings. Ayton must dominate Sengun on the boards — we were -8 in rebounding in the regular season matchup. Target Thompson in transition on D — he freelances.',
      offensive_rating: 115.7,
      defensive_rating: 111.3,
      three_point_rate: 37.8,
      pace_ranking: 12,
      created_by: authorId
    },
    {
      opponent_team_id: 1610612738, // Boston Celtics
      game_date: '2025-12-25',
      key_players: ['Jayson Tatum', 'Jaylen Brown', 'Kristaps Porzingis'],
      offensive_tendencies: 'Elite motion offense — 16.4 passes per possession before shot attempt. Tatum and Brown split creation duties equally. Porzingis is a floor-spacer who shoots over smaller defenders with ease. "Horns" set is their bread-and-butter.',
      defensive_tendencies: 'Top-3 defense — best at defending pick-and-roll (0.78 PPP allowed). Switch 1-5 when healthy. Will not help off Luka — scheme is to contain at the point of attack and funnel him right. Brown is an elite wing defender.',
      ai_summary: 'KEY GAME PLAN: Spain P&R (Luka + Ayton) to attack their switching defense. LeBron in the post as secondary creator — he\'s elite vs Brown\'s physicality. Quick ball movement within 3 seconds — their help rotations break down vs pace. Reaves off screens late in the clock. Luka must not telegraph his outlets; they rank 2nd in deflections.',
      offensive_rating: 119.1,
      defensive_rating: 107.4,
      three_point_rate: 42.8,
      pace_ranking: 18,
      created_by: authorId
    },
    {
      opponent_team_id: 1610612744, // Golden State Warriors
      game_date: '2025-10-22',
      key_players: ['Stephen Curry', 'Draymond Green', 'Jonathan Kuminga'],
      offensive_tendencies: 'Curry off-ball movement is the system — 4.2 screens taken per game. Draymond as playmaking center orchestrates spacing. Heavy DHO and motion principles. 5-out looks with Kuminga driving baseline.',
      defensive_tendencies: 'Drop coverage with Draymond — gives up mid-range but contests at the rim. Kuminga is an elite wing defender; he\'ll draw Reaves or LeBron. Will aggressively switch everything on Luka. Zone rotations on baseline drives.',
      ai_summary: 'KEY GAME PLAN: Contain Curry off ball — shade his run-throughs, fight over every screen. Accept he will make some, but never spot-up 3s. Post LeBron on Draymond — physical mismatch. Luka attacks the drop with mid-range pull-ups — his sweet spot against this scheme. Do NOT leave Curry for any reason. He made us pay twice in the regular season.',
      offensive_rating: 114.2,
      defensive_rating: 113.6,
      three_point_rate: 44.1,
      pace_ranking: 5,
      created_by: authorId
    }
  ]

  // Clear existing reports first to avoid dupes on re-run
  await supabase.from('scouting_reports').delete().eq('created_by', authorId)

  for (const r of scoutingReports) {
    const { error } = await supabase.from('scouting_reports').insert(r)
    if (error) console.error('Scouting error:', error.message)
    else console.log(`✓ Scouting report vs team ${r.opponent_team_id}`)
  }

  // 4. Development Goals (schema: player_id, title, description, metric, target_value, current_value, baseline_value, unit, deadline, status, created_by)
  // status options: 'active', 'achieved', 'paused'
  await supabase.from('development_goals').delete().eq('created_by', authorId)

  const goals = [
    {
      player_id: '3945274', // Luka
      title: 'Improve Free Throw Consistency',
      description: 'Increase FT% from 78% to 83%+ through a refined pre-shot routine and mental reset between attempts. Focus on slow-breath technique and consistent release point. Track weekly in practice sessions.',
      metric: 'FT%',
      target_value: 83.0,
      current_value: 80.2,
      baseline_value: 78.0,
      unit: '%',
      deadline: '2026-04-15',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '3945274', // Luka
      title: 'Reduce 4th Quarter Turnovers',
      description: 'Limit live-ball turnovers in 4th quarter and overtime situations. Review film on contested dribble-handoffs. Use slower pace on possessions where team is ahead by 5+.',
      metric: 'Q4 TOV/g',
      target_value: 2.5,
      current_value: 3.2,
      baseline_value: 3.8,
      unit: 'per game',
      deadline: '2026-03-01',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '1966', // LeBron
      title: 'Playoff Load Management',
      description: 'Maintain 32 min/game average in remaining regular season games to preserve explosiveness for the postseason. Monitor knee inflammation markers with medical staff after every back-to-back.',
      metric: 'MIN/g',
      target_value: 32.0,
      current_value: 33.1,
      baseline_value: 34.8,
      unit: 'min',
      deadline: '2026-04-13',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '4066457', // Reaves
      title: 'Off-Dribble 3-Point Development',
      description: 'Build a reliable pull-up 3-pointer off 1-2 dribble setup to generate own shot in isolation. Currently 38% catch-and-shoot; goal is 32%+ on off-dribble 3s which would be elite for this shot type.',
      metric: 'Off-dribble 3P%',
      target_value: 32.0,
      current_value: 29.4,
      baseline_value: 24.0,
      unit: '%',
      deadline: '2026-03-15',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '4683774', // Bronny
      title: 'Catch-and-Shoot Corner 3 Consistency',
      description: 'Improve corner 3 shooting to become a dependable spot-up option alongside Luka and LeBron. Focus on timing cuts to find open catch opportunities and eliminating shot clock hesitation.',
      metric: '3P%',
      target_value: 37.0,
      current_value: 33.8,
      baseline_value: 31.0,
      unit: '%',
      deadline: '2026-04-01',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '4683774', // Bronny
      title: 'Defensive On-Ball IQ',
      description: 'Study opposing PG tendencies in pre-game film sessions. Improve staying in front of shifty guards without over-committing. Work on ball pressure technique that generates deflections without reaching.',
      metric: 'Defensive Rating (on-court)',
      target_value: 107.0,
      current_value: 110.2,
      baseline_value: 114.5,
      unit: 'RTG',
      deadline: '2026-03-01',
      status: 'active',
      created_by: authorId
    },
    {
      player_id: '4897943', // Knecht
      title: 'Elite Catch-and-Shoot Floor Spacing',
      description: 'Establish Knecht as a primary floor-spacing weapon. Quick release off movement, pin-down, and DHO actions. He is already above target — maintain and expand to off-dribble pull-ups.',
      metric: '3P%',
      target_value: 40.0,
      current_value: 41.2,
      baseline_value: 36.0,
      unit: '%',
      deadline: '2026-04-01',
      status: 'achieved',
      created_by: authorId
    },
    {
      player_id: '4066648', // Rui
      title: 'Mid-Post Scoring Package',
      description: 'Develop face-up game and footwork in mid-post as a reliable secondary scorer. Add a baby hook over left shoulder and a drive-under-baseline move. Increase mid-range attempts to 3+ per game.',
      metric: 'Mid-range FG%',
      target_value: 48.0,
      current_value: 44.1,
      baseline_value: 41.0,
      unit: '%',
      deadline: '2026-03-15',
      status: 'active',
      created_by: authorId
    }
  ]

  for (const g of goals) {
    const { error } = await supabase.from('development_goals').insert(g)
    if (error) console.error('Goal error:', error.message)
    else console.log(`✓ Goal: player ${g.player_id} — ${g.title}`)
  }

  // 5. Coach Notes (schema: author_id, author_name, subject_type, subject_id, content, is_private)
  await supabase.from('coach_notes').delete().eq('author_id', authorId)

  const notes = [
    {
      subject_id: '3945274', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'Luka\'s conditioning has noticeably improved since January. He\'s staying lower in his defensive stance and communicating switches earlier. The FT work is paying off — went 9/10 in the last 3 games. Continue monitoring right knee load on back-to-backs; will flag any swelling immediately to medical staff.',
      is_private: false
    },
    {
      subject_id: '1966', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'LeBron is fully bought in on the load management plan. His Feb-Mar numbers (23.1 pts / 7.2 reb on 56% TS) are elite. The mentorship with Bronny has been exceptional — they\'re spending extra time after practices reviewing film on their two-man actions. He\'ll be peaking at the right time.',
      is_private: false
    },
    {
      subject_id: '4683774', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'Bronny showed real growth over the All-Star break. Worked with player development coaches specifically on catch-and-shoot footwork and eliminating his pre-catch dip. Defensive awareness in his G League assignment was excellent — 2 charges drawn, 3 steals in the assignment. Needs more reps in the 2-man game with Luka to feel comfortable on the NBA rotation.',
      is_private: false
    },
    {
      subject_id: '4066457', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'AR15 is the team\'s most consistent player since the trade deadline. His gravity forces defenses into decisions that open Luka and LeBron. The off-dribble pull-up is coming along — hit 3 of those in Tuesday\'s win vs Denver. Should continue featuring him in late-clock isolation situations. He\'s our most clutch player by WPA this season.',
      is_private: false
    },
    {
      subject_id: '4897943', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'Knecht is quietly one of the best rookie floor spacers in recent memory. Mechanics are textbook — quick release, excellent balance, no hitch. He\'s already above his 3P% target. Now encouraging him to attack closeouts more aggressively rather than deferring. Shooting 54% on pick-and-roll drives when he chooses to attack. Needs to trust his reads.',
      is_private: false
    },
    {
      subject_id: '4278129', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'Ayton has been a revelation in pick-and-roll with Luka. Roll finishing is elite and his connection with Luka in the two-man game is developing fast. Main focus area: avoid 3rd-quarter defensive lapses — he ball-watches on weak side and it leads to corner 3s. Review film from MIN and OKC games where his lapses were exploited.',
      is_private: false
    },
    {
      subject_id: '4066648', subject_type: 'player', author_id: authorId, author_name: authorName,
      content: 'Rui has been solid and underrated this season. His two-way versatility — defending 3 through 5 and spacing the floor — is exactly what this team needs around Luka and LeBron. The mid-post work is progressing well. Against Boston on Christmas he showed a new right-shoulder turnaround that was effective. Need to see that move become reliable under pressure.',
      is_private: false
    }
  ]

  for (const n of notes) {
    const { error } = await supabase.from('coach_notes').insert(n)
    if (error) console.error('Note error:', error.message)
    else console.log(`✓ Coach note: player ${n.subject_id}`)
  }

  // 6. Nightly Report with AI Insights
  await supabase.from('nightly_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error: reportError } = await supabase.from('nightly_reports').insert({
    report_date: '2026-06-14',
    generated_by: 'auto',
    team_summary: 'The Lakers closed the regular season 49-33 and enter the playoffs as the 4th seed in the Western Conference. The team has been on a 12-4 run over the last 16 games, driven by Luka\'s historic offensive output (33.5 PPG, 8.3 APG) and a vastly improved defensive effort since the February personnel adjustments. LeBron James appears healthy and energized entering the postseason, posting 23.1 points on 56% True Shooting over the final month. Austin Reaves has emerged as a legitimate third star, averaging 25.3 points in March. The team ranks 8th in offensive rating and 12th in defensive rating — with room to improve defensively in the playoffs with sharper rotations.',
    opponent_preview: 'First round opponent: Houston Rockets (5 seed). Rockets finished 47-35, powered by Alperen Sengun (21.4 pts, 11.2 reb) and Jalen Green (22.8 pts). They present challenges in the paint and on the glass. Lakers won 3 of 4 regular season matchups. Key: contain Sengun in the post and neutralize their zone defense with ball movement.',
    injury_updates: 'Luka Doncic (right knee) — Day-to-day, expected to be available for Game 1. Will have additional imaging Monday. Marcus Smart (hamstring) — Probable for G1, limited in practice Friday. Jarred Vanderbilt (foot) — Out for series, on injured reserve.',
    player_highlights: [
      { player: 'Luka Doncic', highlight: '38 pts / 9 reb / 12 ast in regular season finale. Shot 52% FG, 44% 3P. Led the team in a 118-101 win vs Phoenix to lock up the 4 seed.' },
      { player: 'Austin Reaves', highlight: '29 pts on 11/18 FG in the finale. Has scored 25+ in 6 of last 8 games. His off-dribble pull-up was lethal — 7/9 on pull-up jumpers.' },
      { player: 'Dalton Knecht', highlight: 'Career-high 24 pts on 8/12 from the field, 5/8 from three. His corner 3 has become one of the most reliable shots on the team.' },
      { player: 'Deandre Ayton', highlight: '18 pts / 14 reb / 3 blk. Dominant on the glass and as a pick-and-roll finisher. Went 8/8 from the free throw line.' }
    ],
    ai_insights: [
      {
        category: 'Offensive Efficiency',
        insight: 'The Lakers\' Spain pick-and-roll (Luka + Ayton) is yielding 1.24 points per possession — top 5 in the league for two-man actions. Houston\'s switching defense will have difficulty containing this if Ayton can pop to mid-range.',
        priority: 'high'
      },
      {
        category: 'Defensive Focus',
        insight: 'Allow Sengun to receive the ball on the wing rather than in the post. He is 18% less efficient on wing catches vs. post catches. Drop coverage with LeBron or Ayton as the tag is the correct scheme — do not send a double early.',
        priority: 'high'
      },
      {
        category: 'Three-Point Tendency',
        insight: 'Houston generates 37.8% of their offense from 3-point attempts — the Lakers must avoid giving up corner threes in transition. Ayton\'s box-out discipline and transition coverage will be crucial. In the regular season, we gave up 4.2 open corner 3s per game to Houston.',
        priority: 'medium'
      },
      {
        category: 'Reaves Matchup',
        insight: 'Jalen Green will likely draw Reaves on the perimeter. Reaves has held opposing SGs to 38.2% FG this season, but Green shoots well off movement. Use Reaves\' physicality to disrupt Green\'s curl actions — don\'t let him get comfortable off the bounce.',
        priority: 'medium'
      },
      {
        category: 'Pace Control',
        insight: 'Houston likes to push pace after live-ball turnovers (2nd in fast-break points). Zero turnovers in transition for the first 3 minutes of each half. Walk the ball up when possible — Houston\'s half-court defense is notably weaker (5 points per 100 better when forced to set up).',
        priority: 'high'
      }
    ]
  })

  if (reportError) console.error('Report error:', reportError.message)
  else console.log('✓ Nightly report seeded')

  console.log('\n✅ All demo data seeded successfully!')
  console.log('\n🔑 Demo login credentials:')
  console.log('   Email:    demo@lakeshow.io')
  console.log('   Password: LakersDemo2026!')
}

seed().catch(console.error)
