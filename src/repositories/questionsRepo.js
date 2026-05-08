const { getPool } = require("../db/pool");
const { isDbUnavailableError } = require("../lib/dbError");
const {
  createQuestion: createFallbackQuestion,
  listQuestions: listFallbackQuestions,
  getQuestionById: getFallbackQuestionById,
  addAnswer: addFallbackAnswer,
  addRating: addFallbackRating,
  getAnswersForQuestion: getFallbackAnswersForQuestion,
  dashboardCounts: getFallbackDashboardCounts,
  analyticsOverview: getFallbackAnalyticsOverview,
} = require("../lib/fallbackStore");

async function createQuestion({ farmerId, guestName, body, cropHint }) {
  try {
    const { rows } = await getPool().query(
      `INSERT INTO farmer_questions (farmer_id, guest_name, body, crop_hint)
       VALUES ($1, $2, $3, $4)
       RETURNING id, farmer_id, guest_name, body, crop_hint, status, created_at`,
      [farmerId || null, guestName || null, body, cropHint || null]
    );
    return rows[0];
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return createFallbackQuestion({ farmerId, guestName, body, cropHint });
    }
    throw error;
  }
}

async function listQuestions({ status, limit = 100 }) {
  try {
    const pool = getPool();
    const lim = Math.min(Number(limit) || 100, 500);
    const rows = status
      ? (
          await pool.query(
            `SELECT fq.*, u.full_name AS farmer_name, u.email AS farmer_email
             FROM farmer_questions fq
             LEFT JOIN users u ON u.id = fq.farmer_id
             WHERE fq.status = $1
             ORDER BY fq.created_at DESC
             LIMIT $2`,
            [status, lim]
          )
        ).rows
      : (
          await pool.query(
            `SELECT fq.*, u.full_name AS farmer_name, u.email AS farmer_email
             FROM farmer_questions fq
             LEFT JOIN users u ON u.id = fq.farmer_id
             ORDER BY fq.created_at DESC
             LIMIT $1`,
            [lim]
          )
        ).rows;

    return rows.length ? rows : listFallbackQuestions({ status, limit });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return listFallbackQuestions({ status, limit });
    }
    throw error;
  }
}

async function getQuestionById(id) {
  try {
    const { rows } = await getPool().query("SELECT * FROM farmer_questions WHERE id = $1", [id]);
    if (rows[0]) {
      return rows[0];
    }
    return getFallbackQuestionById(id);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackQuestionById(id);
    }
    throw error;
  }
}

async function addAnswer({ questionId, expertId, body }) {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const qRes = await client.query(
        "SELECT * FROM farmer_questions WHERE id = $1 FOR UPDATE",
        [questionId]
      );
      const q = qRes.rows[0];
      if (!q) {
        await client.query("ROLLBACK");
        return addFallbackAnswer({ questionId, expertId, body });
      }
      if (q.status === "answered") {
        await client.query("ROLLBACK");
        return { error: "already_answered" };
      }
      const aRes = await client.query(
        `INSERT INTO expert_answers (question_id, expert_id, body) VALUES ($1, $2, $3)
         RETURNING *`,
        [questionId, expertId, body]
      );
      await client.query(
        `UPDATE farmer_questions SET status = 'answered', answered_at = NOW(), assigned_expert_id = $2 WHERE id = $1`,
        [questionId, expertId]
      );
      await client.query("COMMIT");
      return { answer: aRes.rows[0] };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore rollback failures when the DB is unavailable */
      }
      if (isDbUnavailableError(error)) {
        return addFallbackAnswer({ questionId, expertId, body });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return addFallbackAnswer({ questionId, expertId, body });
    }
    throw error;
  }
}

async function addRating({ answerId, userId, stars }) {
  try {
    const { rows } = await getPool().query(
      `INSERT INTO answer_ratings (answer_id, user_id, stars) VALUES ($1, $2, $3)
       ON CONFLICT (answer_id, user_id) DO UPDATE SET stars = EXCLUDED.stars
       RETURNING *`,
      [answerId, userId, stars]
    );
    return rows[0];
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return addFallbackRating({ answerId, userId, stars });
    }
    throw error;
  }
}

async function getAnswersForQuestion(questionId) {
  try {
    const { rows } = await getPool().query(
      `SELECT ea.*, u.full_name AS expert_name, u.verified_expert
       FROM expert_answers ea
       JOIN users u ON u.id = ea.expert_id
       WHERE ea.question_id = $1
       ORDER BY ea.created_at ASC`,
      [questionId]
    );
    return rows.length ? rows : getFallbackAnswersForQuestion(questionId);
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackAnswersForQuestion(questionId);
    }
    throw error;
  }
}

async function dashboardCounts() {
  try {
    const pool = getPool();
    const today = new Date().toISOString().slice(0, 10);
    const [pending, answeredToday, experts, total] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM farmer_questions WHERE status = 'pending'`),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM farmer_questions WHERE status = 'answered' AND answered_at::date = $1::date`,
        [today]
      ),
      pool.query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'expert'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM farmer_questions`),
    ]);

    const counts = {
      pendingQuestions: pending.rows[0].c,
      answeredToday: answeredToday.rows[0].c,
      activeExperts: experts.rows[0].c,
      totalQuestions: total.rows[0].c,
    };

    if (
      counts.pendingQuestions === 0 &&
      counts.answeredToday === 0 &&
      counts.activeExperts === 0 &&
      counts.totalQuestions === 0
    ) {
      return getFallbackDashboardCounts();
    }

    return counts;
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackDashboardCounts();
    }
    throw error;
  }
}

async function analyticsOverview() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT body, created_at FROM farmer_questions ORDER BY created_at DESC LIMIT 500
    `);
    if (!rows.length) {
      return getFallbackAnalyticsOverview();
    }
    return { recentQuestions: rows.length, sample: rows.slice(0, 20) };
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return getFallbackAnalyticsOverview();
    }
    throw error;
  }
}

module.exports = {
  createQuestion,
  listQuestions,
  getQuestionById,
  addAnswer,
  addRating,
  getAnswersForQuestion,
  dashboardCounts,
  analyticsOverview,
};
