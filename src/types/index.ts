export type Role = 'coach' | 'analyst' | 'player'

export interface UserProfile {
  id: string
  email: string
  role: Role
  full_name: string
  player_id?: string // links to NBA player ID if role === 'player'
  avatar_url?: string
  created_at: string
}

export interface Player {
  id: string
  nba_player_id: number
  full_name: string
  position: string
  jersey_number: number
  team_id: string
  height: string
  weight: number
  age: number
  experience: number
  college?: string
  avatar_url?: string
}

export interface PlayerStats {
  player_id: number
  season: string
  games_played: number
  ppg: number
  rpg: number
  apg: number
  spg: number
  bpg: number
  fg_pct: number
  fg3_pct: number
  ft_pct: number
  mpg: number
  topg: number
  per: number
  ts_pct: number
  usg_pct: number
}

export interface DevelopmentGoal {
  id: string
  player_id: string
  created_by: string
  title: string
  description: string
  metric: string
  target_value: number
  current_value: number
  baseline_value: number
  unit: string
  deadline: string
  status: 'active' | 'achieved' | 'paused'
  created_at: string
  updated_at: string
}

export interface GoalProgress {
  id: string
  goal_id: string
  value: number
  note?: string
  recorded_by: string
  recorded_at: string
}

export interface CoachNote {
  id: string
  author_id: string
  author_name: string
  subject_type: 'player' | 'game' | 'opponent'
  subject_id: string
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface OpponentTeam {
  id: string
  nba_team_id: number
  name: string
  abbreviation: string
  city: string
  conference: string
  division: string
  logo_url?: string
}

export interface ScoutingReport {
  id: string
  opponent_team_id: number
  game_date: string
  created_by: string
  offensive_tendencies: string
  defensive_tendencies: string
  key_players: string[]
  shot_chart_data?: ShotChartData[]
  pace_ranking: number
  offensive_rating: number
  defensive_rating: number
  three_point_rate: number
  paint_scoring_rate: number
  transition_rate: number
  ai_summary?: string
  created_at: string
  updated_at: string
}

export interface ShotChartData {
  x: number
  y: number
  makes: number
  attempts: number
  zone: string
}

export interface NightlyReport {
  id: string
  report_date: string
  generated_by: 'auto' | string
  team_summary: string
  player_highlights: PlayerHighlight[]
  opponent_preview?: string
  injury_updates: string
  ai_insights: string[]
  created_at: string
}

export interface PlayerHighlight {
  player_id: string
  player_name: string
  headline: string
  stat_line: string
  trend: 'up' | 'down' | 'stable'
  flag_type?: 'slump' | 'hot_streak' | 'milestone' | 'concern'
}

export interface UpcomingGame {
  game_id: string
  date: string
  home_team: string
  away_team: string
  home_team_id: number
  away_team_id: number
  arena: string
  broadcast: string
  is_home: boolean
}

export interface BenchmarkComparison {
  stat_name: string
  player_value: number
  position_avg: number
  league_avg: number
  percentile: number
  unit: string
}
