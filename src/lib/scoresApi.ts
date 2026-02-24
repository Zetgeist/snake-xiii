import { supabase } from '../supabaseClient';
import type { Difficulty } from '../components/GameEngine';

interface SaveScoreParams {
  points: number;
  difficulty: Difficulty;
  playerName?: string | null;
}

interface SaveScoreResult {
  ok: boolean;
  error?: string;
}

/**
 * Guarda una nueva puntuación en la tabla `scores`.
 * La tabla debe tener al menos las columnas:
 * - player_name (text, opcional)
 * - points (int4)
 * - dificulty (text)  <-- (en tu tabla está escrito así, con una sola "f")
 */
export async function saveScore({ points, difficulty, playerName }: SaveScoreParams): Promise<SaveScoreResult> {
  const { data, error } = await supabase
    .from('scores')
    .insert({
    player_name: playerName ?? null,
    points,
      // Ojo: el nombre real de la columna en tu tabla es "dificulty"
      dificulty: difficulty,
    })
    .select('id');

  if (error) {
    return { ok: false, error: error.message };
  }

  // data suele devolver la fila insertada (siempre que RLS y permisos lo permitan)
  if (!data || data.length === 0) {
    return { ok: true };
  }

  return { ok: true };
}

/**
 * Devuelve el máximo valor de `points` de la tabla `scores`.
 * Si no hay registros o hay error, devuelve null.
 */
export async function fetchGlobalHighScore(): Promise<number | null> {
  const { data, error } = await supabase
    .from('scores')
    .select('points')
    .order('points', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching global high score from Supabase:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const top = data[0];
  return typeof top.points === 'number' ? top.points : null;
}

