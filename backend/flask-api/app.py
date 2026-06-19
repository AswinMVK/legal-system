import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
import pymysql.cursors
from dotenv import load_dotenv
from datetime import date, datetime
import json
import urllib.request as urllib_req
import urllib.error

load_dotenv()

app = Flask(__name__)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, origins=[frontend_url, "http://localhost:3000"])

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "user":     os.getenv("DB_USER",     "root"),
    "password": os.getenv("DB_PASSWORD", "Root@123"),
    "database": os.getenv("DB_NAME",     "legal_db"),
    "cursorclass": pymysql.cursors.DictCursor,
    "charset":  "utf8mb4",
}


def get_db():
    return pymysql.connect(**DB_CONFIG)


def json_serial(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# ─── Priority scoring ───────────────────────────────────────

def compute_priority_score(case: dict) -> float:
    """
    Returns a 0-100 priority score.
    Higher = more urgent.
    """
    score = 0.0

    # 1. Detention overstay (max 35 pts)
    detention_ratio = float(case.get("detention_ratio") or 0)
    if detention_ratio >= 1.0:
        score += 35
    else:
        score += detention_ratio * 25

    # 2. Overstay flag (bonus 10 pts)
    if case.get("overstay_flag"):
        score += 10

    # 3. Vulnerability (max 20 pts)
    vuln = int(case.get("vulnerability_score") or 0)
    score += min(vuln / 10.0 * 20, 20)

    # 4. Case age – days pending (max 15 pts)
    days_pending = int(case.get("days_pending") or 0)
    score += min(days_pending / 730.0 * 15, 15)  # 2 years cap

    # 5. Severity (max 10 pts)
    severity = int(case.get("severity_score") or 0)
    score += min(severity / 10.0 * 10, 10)

    # 6. Adjournments (max 10 pts)
    adjourns = int(case.get("no_of_adjournments") or 0)
    score += min(adjourns * 2, 10)

    return round(min(score, 100), 2)


def assign_cluster(score: float) -> int:
    if score >= 75:   return 0   # CRITICAL
    if score >= 50:   return 1   # HIGH
    if score >= 25:   return 2   # MEDIUM
    return 3                     # LOW


CLUSTER_LABELS = {0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW"}
CLUSTER_COLORS = {0: "#ef4444", 1: "#f97316", 2: "#eab308", 3: "#22c55e"}


# ─── Routes ─────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "flask-api"})


@app.route("/api/priority/cases", methods=["GET"])
def get_priority_cases():
    """
    Returns cases sorted by computed priority score.
    Optional query params: judge_id, court_id, limit
    """
    judge_id = request.args.get("judge_id")
    court_id = request.args.get("court_id")
    limit    = int(request.args.get("limit", 100))

    conn = get_db()
    try:
        with conn.cursor() as cur:
            where = ["c.is_active = TRUE"]
            params = []
            if judge_id:
                where.append("c.judge_id = %s")
                params.append(judge_id)
            if court_id:
                where.append("c.court_id = %s")
                params.append(court_id)

            where_sql = "WHERE " + " AND ".join(where)

            cur.execute(f"""
                SELECT
                    c.case_id, c.case_type, c.offense_type, c.current_status,
                    c.current_stage, c.filing_date, c.last_hearing_date,
                    c.court_id, c.judge_id,
                    co.court_name,
                    j.name  AS judge_name,
                    dd.detention_days, dd.expected_sentence_days,
                    dd.detention_ratio, dd.overstay_flag,
                    ct.days_pending, ct.no_of_adjournments, ct.number_of_trials,
                    cf.severity_score, cf.vulnerability_score, cf.urgency_score,
                    cf.priority_cluster,
                    (SELECT COUNT(*) FROM persons p
                     WHERE p.case_id = c.case_id AND p.vulnerability_score > 5) AS vuln_persons
                FROM cases c
                LEFT JOIN courts  co ON co.court_id = c.court_id
                LEFT JOIN judges  j  ON j.judge_id  = c.judge_id
                LEFT JOIN detention_details dd  ON dd.case_id  = c.case_id
                LEFT JOIN case_timeline     ct  ON ct.case_id  = c.case_id
                LEFT JOIN case_features     cf  ON cf.case_id  = c.case_id
                {where_sql}
                LIMIT %s
            """, params + [limit])

            cases = cur.fetchall()

            # Compute scores
            for case in cases:
                # Use max vulnerability from persons if higher
                vuln = max(int(case.get("vulnerability_score") or 0),
                           int(case.get("vuln_persons") or 0) * 3)
                case["vulnerability_score"] = vuln

                score   = compute_priority_score(case)
                cluster = assign_cluster(score)

                case["computed_priority_score"] = score
                case["computed_cluster"]        = cluster
                case["cluster_label"]           = CLUSTER_LABELS[cluster]
                case["cluster_color"]           = CLUSTER_COLORS[cluster]

                # Persist computed values back
                cur.execute("""
                    UPDATE case_features
                    SET urgency_score = %s, priority_cluster = %s
                    WHERE case_id = %s
                """, (score, cluster, case["case_id"]))

            conn.commit()

            # Sort by score descending, then by filing date ascending
            cases.sort(key=lambda x: (-x["computed_priority_score"],
                                       str(x.get("filing_date") or "")))

            # Add rank
            for i, case in enumerate(cases):
                case["priority_rank"] = i + 1

        return app.response_class(
            response=json.dumps(cases, default=json_serial),
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/priority/case/<int:case_id>", methods=["GET"])
def get_case_priority(case_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    c.case_id, dd.detention_days, dd.expected_sentence_days,
                    dd.detention_ratio, dd.overstay_flag,
                    ct.days_pending, ct.no_of_adjournments,
                    cf.severity_score, cf.vulnerability_score
                FROM cases c
                LEFT JOIN detention_details dd ON dd.case_id = c.case_id
                LEFT JOIN case_timeline     ct ON ct.case_id = c.case_id
                LEFT JOIN case_features     cf ON cf.case_id = c.case_id
                WHERE c.case_id = %s
            """, (case_id,))
            case = cur.fetchone()
            if not case:
                return jsonify({"error": "Case not found"}), 404

            score   = compute_priority_score(case)
            cluster = assign_cluster(score)

            return jsonify({
                "case_id":       case_id,
                "priority_score": score,
                "cluster":        cluster,
                "cluster_label":  CLUSTER_LABELS[cluster],
                "cluster_color":  CLUSTER_COLORS[cluster],
                "breakdown": {
                    "detention_ratio":    float(case.get("detention_ratio") or 0),
                    "overstay_flag":      bool(case.get("overstay_flag")),
                    "days_pending":       int(case.get("days_pending") or 0),
                    "vulnerability_score": int(case.get("vulnerability_score") or 0),
                    "no_of_adjournments": int(case.get("no_of_adjournments") or 0),
                    "severity_score":     int(case.get("severity_score") or 0),
                }
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/nlp/analyze", methods=["POST"])
def analyze_case_text():
    """
    Simple keyword analysis on fir_text / summary.
    Returns urgency, complexity, bail eligibility hints.
    """
    data = request.get_json()
    text = (data.get("fir_text", "") + " " + data.get("summary", "")).lower()

    HIGH_URGENCY_KEYWORDS = [
        "murder", "rape", "kidnap", "child", "minor", "elderly",
        "attack", "assault", "life", "death", "critical"
    ]
    COMPLEXITY_KEYWORDS = [
        "multiple", "organized", "gang", "syndicate", "network",
        "cyber", "financial", "fraud", "forgery", "evidence"
    ]
    BAIL_NEGATIVE_KEYWORDS = [
        "murder", "rape", "kidnap", "terrorism", "non-bailable", "heinous"
    ]

    urgency_hits     = [kw for kw in HIGH_URGENCY_KEYWORDS if kw in text]
    complexity_hits  = [kw for kw in COMPLEXITY_KEYWORDS   if kw in text]
    bail_neg_hits    = [kw for kw in BAIL_NEGATIVE_KEYWORDS if kw in text]

    urgency_nlp = (
        "high"   if len(urgency_hits) >= 3 else
        "medium" if len(urgency_hits) >= 1 else
        "low"
    )
    complexity = (
        "complex" if len(complexity_hits) >= 2 else
        "moderate" if len(complexity_hits) >= 1 else
        "simple"
    )
    bail_eligible = len(bail_neg_hits) == 0

    all_keywords = list(set(urgency_hits + complexity_hits))

    return jsonify({
        "urgency_nlp":          urgency_nlp,
        "case_complexity":      complexity,
        "bail_eligibility_nlp": bail_eligible,
        "keywords":             ", ".join(all_keywords),
        "matched_urgency":      urgency_hits,
        "matched_complexity":   complexity_hits,
    })


# ─── AI Summary Generation (Ollama) ─────────────────────────

@app.route("/api/nlp/generate-summary", methods=["POST"])
def generate_summary():
    """
    Uses Ollama LLM to generate a concise case summary from FIR text.
    """
    data = request.get_json(silent=True) or {}
    fir_text = (data.get("fir_text") or "").strip()

    if not fir_text:
        return jsonify({"error": "fir_text is required"}), 400

    prompt = (
        "You are a legal document summarizer for the Indian judiciary. "
        "Read the following FIR (First Information Report) text and produce a concise, "
        "factual case summary in 3-5 sentences. Include: the nature of the offense, "
        "key parties involved, date/location if mentioned, and severity. "
        "Write in professional legal language. Do NOT add opinions or recommendations.\n\n"
        f"FIR TEXT:\n{fir_text}\n\n"
        "CASE SUMMARY:"
    )

    payload = json.dumps({
        "model":    OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": "You are a legal document summarizer for the Indian judiciary. Be concise and factual."},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 300},
    }).encode("utf-8")

    try:
        req_obj = urllib_req.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req_obj, timeout=90) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        summary = result.get("message", {}).get("content", "").strip()
        return jsonify({"summary": summary})
    except urllib.error.URLError as e:
        return jsonify({"error": f"Ollama unreachable: {e.reason}"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── AI Section Recommendation (Ollama + DB) ────────────────

@app.route("/api/nlp/recommend-sections", methods=["POST"])
def recommend_sections():
    """
    Uses Ollama LLM to recommend applicable IPC sections based on FIR/summary.
    Returns matched sections from the legal_sections table.
    """
    data = request.get_json(silent=True) or {}
    fir_text = (data.get("fir_text") or "").strip()
    summary  = (data.get("summary") or "").strip()
    text = fir_text or summary

    if not text:
        return jsonify({"error": "fir_text or summary is required"}), 400

    # Fetch all available sections from DB
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT section_id, section, law_code, description,
                       punishment_type, max_sentence_years, bailability
                FROM legal_sections
            """)
            all_sections = cur.fetchall()
    finally:
        conn.close()

    # Build a reference list for the LLM
    section_list = "\n".join(
        f"- Section {s['section']} ({s['law_code']}): {s['description']} "
        f"[{s['bailability']}, Max {s['max_sentence_years']} years]"
        for s in all_sections
    )

    prompt = (
        "You are an expert Indian criminal law advisor. "
        "Based on the FIR text below, identify which IPC sections from the provided list "
        "are most applicable to this case.\n\n"
        f"AVAILABLE SECTIONS:\n{section_list}\n\n"
        f"FIR TEXT:\n{text}\n\n"
        "Respond ONLY with a JSON array of objects, each having:\n"
        '  {"section": "<section_number>", "law_code": "<IPC/BNS>", "reason": "<brief reason>"}\n'
        "Return ONLY the JSON array, no extra text. If no sections match, return []."
    )

    payload = json.dumps({
        "model":    OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": "You are an Indian criminal law expert. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 500},
    }).encode("utf-8")

    try:
        req_obj = urllib_req.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req_obj, timeout=90) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        raw_reply = result.get("message", {}).get("content", "").strip()

        # Parse the LLM JSON response
        # Extract JSON array from the response (handle markdown code blocks)
        json_str = raw_reply
        if "```" in json_str:
            # Extract content between code blocks
            parts = json_str.split("```")
            for part in parts:
                stripped = part.strip()
                if stripped.startswith("json"):
                    stripped = stripped[4:].strip()
                if stripped.startswith("["):
                    json_str = stripped
                    break

        try:
            recommendations = json.loads(json_str)
        except json.JSONDecodeError:
            recommendations = []

        # Match recommendations to actual DB sections and enrich
        matched = []
        for rec in recommendations:
            rec_section = str(rec.get("section", "")).strip()
            for db_sec in all_sections:
                if db_sec["section"].strip() == rec_section:
                    matched.append({
                        "section_id":        db_sec["section_id"],
                        "section":           db_sec["section"],
                        "law_code":          db_sec["law_code"],
                        "description":       db_sec["description"],
                        "bailability":       db_sec["bailability"],
                        "max_sentence_years": db_sec["max_sentence_years"],
                        "reason":            rec.get("reason", ""),
                    })
                    break

        return jsonify({
            "recommendations": matched,
            "raw_count":       len(recommendations),
            "matched_count":   len(matched),
        })

    except urllib.error.URLError as e:
        return jsonify({"error": f"Ollama unreachable: {e.reason}"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stats/overview", methods=["GET"])
def stats_overview():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM cases WHERE is_active = TRUE")
            total = cur.fetchone()["total"]

            cur.execute("""
                SELECT priority_cluster, COUNT(*) AS count
                FROM case_features GROUP BY priority_cluster
            """)
            by_cluster = cur.fetchall()

            cur.execute("""
                SELECT SUM(overstay_flag) AS overstay_count,
                       AVG(detention_ratio) AS avg_ratio
                FROM detention_details
            """)
            detention_stats = cur.fetchone()

            cur.execute("""
                SELECT current_status, COUNT(*) AS count
                FROM cases WHERE is_active = TRUE
                GROUP BY current_status
            """)
            by_status = cur.fetchall()

        return app.response_class(
            response=json.dumps({
                "total_cases":    total,
                "by_cluster":     by_cluster,
                "detention_stats": detention_stats,
                "by_status":      by_status,
                "cluster_labels": CLUSTER_LABELS,
                "cluster_colors": CLUSTER_COLORS,
            }, default=json_serial),
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ─── AI Chat (Ollama / qwen2.5) ─────────────────────────────

OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:latest")
TODAY_STR    = "16 April 2026"


def _fetch_judge_context(conn, judge_id):
    """Return a text summary of the judge's current workload."""
    lines = []
    with conn.cursor() as cur:
        # Judge profile
        cur.execute("""
            SELECT j.name, j.specialization, j.experience_years, j.active_cases,
                   c.court_name
            FROM judges j LEFT JOIN courts c ON c.court_id = j.court_id
            WHERE j.judge_id = %s
        """, (judge_id,))
        p = cur.fetchone()
        if p:
            lines.append(f"Judge: {p['name']} | Court: {p['court_name']} | "
                         f"Specialization: {p['specialization']} | "
                         f"Experience: {p['experience_years']} yrs | "
                         f"Active cases: {p['active_cases']}")

        # Today's hearings
        cur.execute("""
            SELECT hs.time_slot, c.case_id, c.offense_type, c.current_stage,
                   hs.scheduling_reason
            FROM hearing_schedule hs
            JOIN cases c ON c.case_id = hs.case_id
            WHERE hs.judge_id = %s AND hs.scheduled_date = CURDATE()
            ORDER BY hs.time_slot
        """, (judge_id,))
        hearings = cur.fetchall()
        if hearings:
            lines.append(f"\nToday's hearings ({len(hearings)}):")
            for h in hearings:
                lines.append(f"  [{h['time_slot']}] Case #{h['case_id']} – "
                             f"{h['offense_type']} (Stage: {h['current_stage']}) — "
                             f"{h['scheduling_reason']}")
        else:
            lines.append("\nNo hearings scheduled for today.")

        # Top priority cases
        cur.execute("""
            SELECT c.case_id, c.offense_type, c.current_stage, c.filing_date,
                   cf.priority_cluster, cf.urgency_score, dd.detention_days,
                   dd.overstay_flag
            FROM cases c
            LEFT JOIN case_features cf ON cf.case_id = c.case_id
            LEFT JOIN detention_details dd ON dd.case_id = c.case_id
            WHERE c.judge_id = %s AND c.is_active = TRUE
            ORDER BY cf.urgency_score DESC
            LIMIT 10
        """, (judge_id,))
        cases = cur.fetchall()
        cluster_map = {0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW"}
        if cases:
            lines.append(f"\nActive cases ({len(cases)}):")
            for c in cases:
                overstay = " ⚠ OVERSTAY" if c.get("overstay_flag") else ""
                lines.append(
                    f"  Case #{c['case_id']} [{cluster_map.get(c.get('priority_cluster'), 'N/A')}] "
                    f"– {c['offense_type']} | Stage: {c['current_stage']} | "
                    f"Filed: {c['filing_date']} | Detained: {c.get('detention_days', 0)} days"
                    f"{overstay}"
                )

        # Recent adjournments
        cur.execute("""
            SELECT a.case_id, a.reason, a.adjourned_date, a.next_date
            FROM adjournments a
            JOIN cases c ON c.case_id = a.case_id
            WHERE c.judge_id = %s
            ORDER BY a.adjourned_date DESC LIMIT 5
        """, (judge_id,))
        adjs = cur.fetchall()
        if adjs:
            lines.append(f"\nRecent adjournments:")
            for a in adjs:
                lines.append(f"  Case #{a['case_id']}: {a['reason']} "
                             f"(adjourned {a['adjourned_date']} → next {a['next_date']})")

    return "\n".join(lines)


def _fetch_admin_context(conn):
    """Return a text summary of system-wide statistics."""
    lines = []
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM cases")
        total = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) n FROM cases WHERE is_active=TRUE")
        active = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) n FROM cases WHERE current_status='closed'")
        closed = cur.fetchone()["n"]
        lines.append(f"Cases: {total} total | {active} active | {closed} closed")

        cur.execute("""
            SELECT cf.priority_cluster, COUNT(*) n
            FROM case_features cf JOIN cases c ON c.case_id=cf.case_id
            WHERE c.is_active=TRUE GROUP BY cf.priority_cluster
        """)
        clusters = {0: 0, 1: 0, 2: 0, 3: 0}
        for r in cur.fetchall():
            clusters[r["priority_cluster"]] = r["n"]
        lines.append(f"Priority: CRITICAL={clusters[0]} HIGH={clusters[1]} "
                     f"MEDIUM={clusters[2]} LOW={clusters[3]}")

        cur.execute("SELECT COUNT(*) n FROM detention_details WHERE overstay_flag=TRUE")
        overstay = cur.fetchone()["n"]
        lines.append(f"Overstay alerts: {overstay} cases")

        cur.execute("SELECT role, COUNT(*) n FROM users GROUP BY role")
        users_by_role = {r["role"]: r["n"] for r in cur.fetchall()}
        lines.append(f"Users: {users_by_role}")

        cur.execute("SELECT COUNT(*) n FROM courts")
        courts = cur.fetchone()["n"]
        lines.append(f"Courts: {courts}")

        cur.execute("SELECT COUNT(*) n FROM judges")
        judges = cur.fetchone()["n"]
        lines.append(f"Judges: {judges}")

        # Today's hearings system-wide
        cur.execute("""
            SELECT COUNT(*) n FROM hearing_schedule
            WHERE scheduled_date = CURDATE()
        """)
        today_h = cur.fetchone()["n"]
        lines.append(f"Hearings today: {today_h}")

        # Top 5 critical overstay cases
        cur.execute("""
            SELECT c.case_id, c.offense_type, dd.detention_days,
                   dd.expected_sentence_days, j.name judge_name
            FROM cases c
            LEFT JOIN detention_details dd ON dd.case_id=c.case_id
            LEFT JOIN judges j ON j.judge_id=c.judge_id
            WHERE dd.overstay_flag=TRUE AND c.is_active=TRUE
            ORDER BY dd.detention_days DESC LIMIT 5
        """)
        os_cases = cur.fetchall()
        if os_cases:
            lines.append("\nTop overstay cases:")
            for c in os_cases:
                lines.append(f"  Case #{c['case_id']} ({c['offense_type']}) – "
                             f"{c['detention_days']} days detained, "
                             f"expected {c['expected_sentence_days']} days. "
                             f"Judge: {c.get('judge_name','Unassigned')}")

    return "\n".join(lines)


def _fetch_writer_context(conn, user_id):
    """Return a text summary of cases registered by this writer."""
    lines = []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.name, u.email FROM users u WHERE u.user_id = %s
        """, (user_id,))
        u = cur.fetchone()
        if u:
            lines.append(f"Writer: {u['name']} ({u['email']})")

        cur.execute("""
            SELECT COUNT(*) n FROM cases WHERE created_by = %s
        """, (user_id,))
        total = cur.fetchone()["n"]
        cur.execute("""
            SELECT COUNT(*) n FROM cases WHERE created_by=%s AND is_active=TRUE
        """, (user_id,))
        active = cur.fetchone()["n"]
        lines.append(f"Total cases registered: {total} | Active: {active}")

        cur.execute("""
            SELECT c.case_id, c.offense_type, c.current_status, c.current_stage,
                   c.filing_date, j.name judge_name, co.court_name
            FROM cases c
            LEFT JOIN judges j  ON j.judge_id = c.judge_id
            LEFT JOIN courts co ON co.court_id = c.court_id
            WHERE c.created_by = %s
            ORDER BY c.filing_date DESC LIMIT 15
        """, (user_id,))
        cases = cur.fetchall()
        if cases:
            lines.append(f"\nYour registered cases:")
            for c in cases:
                lines.append(
                    f"  Case #{c['case_id']} – {c['offense_type']} | "
                    f"Status: {c['current_status']} | Stage: {c['current_stage']} | "
                    f"Filed: {c['filing_date']} | Judge: {c.get('judge_name','Unassigned')} | "
                    f"Court: {c.get('court_name','N/A')}"
                )

    return "\n".join(lines)


def _build_system_prompt(role, db_context):
    base = (
        f"You are an AI legal assistant embedded in the Legal Case Management System "
        f"(Legal CMS) for the Indian judiciary. Today's date is {TODAY_STR}.\n"
        f"You must ONLY discuss data that belongs to the current user. "
        f"Be concise, factual, and use legal terminology appropriately. "
        f"Do not fabricate case numbers or data not present in the context below.\n\n"
    )
    role_intro = {
        "judge":  "You are assisting a JUDGE. Answer questions about their assigned cases, "
                  "hearings schedule, priority queue, adjournments, and case stages.\n\n",
        "admin":  "You are assisting the SYSTEM ADMINISTRATOR. Answer questions about system-wide "
                  "statistics, user management, court operations, and overstay alerts.\n\n",
        "writer": "You are assisting a COURT WRITER/CLERK. Answer questions about cases they "
                  "have registered, filing statuses, judge assignments, and upcoming hearings.\n\n",
    }
    return (
        base
        + role_intro.get(role, role_intro["writer"])
        + "=== CURRENT DATA CONTEXT ===\n"
        + db_context
        + "\n=== END OF CONTEXT ===\n\n"
        "Answer based only on the context above. "
        "If data is not in the context, say so honestly."
    )


@app.route("/api/chat", methods=["POST"])
def chat_with_llm():
    data     = request.get_json(silent=True) or {}
    message  = (data.get("message") or "").strip()
    role     = data.get("role", "writer")
    user_id  = data.get("user_id")
    judge_id = data.get("judge_id")
    history  = data.get("history", [])   # [{role, content}, ...]

    if not message:
        return jsonify({"error": "message is required"}), 400

    # ── Fetch role-specific DB context ──────────────────────
    conn = get_db()
    try:
        if role == "judge" and judge_id:
            db_context = _fetch_judge_context(conn, judge_id)
        elif role == "admin":
            db_context = _fetch_admin_context(conn)
        else:
            db_context = _fetch_writer_context(conn, user_id) if user_id else ""
    except Exception as e:
        db_context = f"(Could not load context: {e})"
    finally:
        conn.close()

    system_prompt = _build_system_prompt(role, db_context)

    # ── Build message list for Ollama ───────────────────────
    # Keep last 8 exchanges (16 messages) for context window
    recent_history = history[-16:] if len(history) > 16 else history

    ollama_messages = [{"role": "system", "content": system_prompt}]
    ollama_messages += recent_history
    ollama_messages.append({"role": "user", "content": message})

    payload = json.dumps({
        "model":    OLLAMA_MODEL,
        "messages": ollama_messages,
        "stream":   False,
        "options":  {"temperature": 0.3, "num_predict": 512},
    }).encode("utf-8")

    try:
        req_obj = urllib_req.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req_obj, timeout=90) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        reply = result.get("message", {}).get("content", "")
        return jsonify({"reply": reply, "role": "assistant"})
    except urllib.error.URLError as e:
        return jsonify({"error": f"Ollama unreachable: {e.reason}"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
