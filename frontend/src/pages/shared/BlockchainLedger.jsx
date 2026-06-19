import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { Timeline } from "primereact/timeline";
import { ProgressBar } from "primereact/progressbar";
import gsap from "gsap";
import { blockchainAPI } from "../../services/api";

export default function BlockchainLedger() {
  const [chain, setChain] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const toast = useRef(null);
  const pageRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chainRes, logsRes, statsRes] = await Promise.all([
        blockchainAPI.getChain(),
        blockchainAPI.getLogs(200),
        blockchainAPI.getStats(),
      ]);
      setChain(chainRes.data.blocks || []);
      setLogs(logsRes.data || []);
      setStats(statsRes.data || null);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load blockchain data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || !pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".bc-stat-card", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
      });
      gsap.from(".p-tabview", {
        y: 15,
        opacity: 0,
        duration: 0.4,
        delay: 0.25,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await blockchainAPI.verify();
      setIntegrity(res.data);
      toast.current?.show({
        severity: res.data.valid ? "success" : "error",
        summary: res.data.valid
          ? "Blockchain integrity verified — no tampering detected."
          : `Integrity check FAILED — ${res.data.issues.length} issue(s) found.`,
        life: 5000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const actionSeverity = (type) => {
    if (!type) return "info";
    if (type.includes("closed") || type.includes("judgment")) return "danger";
    if (type.includes("hearing") || type.includes("bail")) return "warning";
    if (type.includes("registered") || type.includes("assigned"))
      return "success";
    return "info";
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <ProgressBar mode="indeterminate" style={{ height: "4px" }} />
        <p style={{ textAlign: "center", marginTop: "1rem", color: "#94a3b8" }}>
          Loading blockchain…
        </p>
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #000080, #003087)",
          color: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
            <i
              className="pi pi-link"
              style={{ marginRight: "0.5rem", color: "#FF9933" }}
            />
            Blockchain Ledger
          </h2>
          <p style={{ margin: "0.2rem 0 0", opacity: 0.8, fontSize: "0.8rem" }}>
            Immutable audit trail for all case lifecycle actions
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            label="Verify Integrity"
            icon="pi pi-shield"
            loading={verifying}
            onClick={handleVerify}
            style={{ background: "#138808", border: "none" }}
            size="small"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            onClick={fetchData}
            className="p-button-outlined"
            style={{ color: "#fff", borderColor: "#fff" }}
            size="small"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "Blocks",
            value: stats?.chainLength || 0,
            icon: "pi pi-box",
            color: "#000080",
            bg: "#eef0fb",
          },
          {
            label: "Transactions",
            value: stats?.totalLogs || 0,
            icon: "pi pi-list",
            color: "#FF6B00",
            bg: "#fff5e8",
          },
          {
            label: "Cases Tracked",
            value: stats?.uniqueCases || 0,
            icon: "pi pi-folder",
            color: "#138808",
            bg: "#e9f7e9",
          },
          {
            label: "Chain Valid",
            value: integrity ? (integrity.valid ? "YES" : "NO") : "—",
            icon: "pi pi-shield",
            color: integrity?.valid === false ? "#D32F2F" : "#138808",
            bg: integrity?.valid === false ? "#fdecea" : "#e9f7e9",
          },
          {
            label: "Last Block",
            value: stats?.lastBlock ? `#${stats.lastBlock.index}` : "#0",
            icon: "pi pi-clock",
            color: "#6366f1",
            bg: "#eef2ff",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bc-stat-card"
            style={{
              background: s.bg,
              borderRadius: 10,
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <i
              className={s.icon}
              style={{ fontSize: "1.2rem", color: s.color }}
            />
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: s.color,
                marginTop: "0.3rem",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Integrity Alert */}
      {integrity && !integrity.valid && (
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #fca5a5",
            borderRadius: 10,
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "1.5rem", color: "#D32F2F" }}
          />
          <div>
            <div style={{ fontWeight: 700, color: "#D32F2F" }}>
              TAMPERING DETECTED
            </div>
            <div style={{ fontSize: "0.85rem", color: "#991b1b" }}>
              {integrity.issues.length} block(s) have been altered. Chain
              integrity compromised.
            </div>
          </div>
        </div>
      )}

      {integrity && integrity.valid && (
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: 10,
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <i
            className="pi pi-check-circle"
            style={{ fontSize: "1.5rem", color: "#138808" }}
          />
          <div>
            <div style={{ fontWeight: 700, color: "#138808" }}>
              INTEGRITY VERIFIED
            </div>
            <div style={{ fontSize: "0.85rem", color: "#166534" }}>
              All {integrity.totalBlocks} blocks verified. No tampering
              detected.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <TabView>
        {/* Blockchain Blocks */}
        <TabPanel header={`Blocks (${chain.length})`} leftIcon="pi pi-box mr-2">
          <DataTable
            value={[...chain].reverse()}
            size="small"
            stripedRows
            paginator
            rows={15}
            rowClassName={(b) => (b.index === 0 ? "genesis-row" : "")}
            selectionMode="single"
            selection={selectedBlock}
            onSelectionChange={(e) => setSelectedBlock(e.value)}
            emptyMessage="No blocks."
          >
            <Column
              field="index"
              header="#"
              style={{ width: "60px" }}
              body={(b) => (
                <Tag
                  value={`#${b.index}`}
                  style={{
                    background: b.index === 0 ? "#FF9933" : "#000080",
                    color: "#fff",
                    fontSize: "0.7rem",
                  }}
                />
              )}
            />
            <Column
              header="Hash"
              body={(b) => (
                <code
                  style={{
                    fontSize: "0.7rem",
                    background: "#f1f5f9",
                    padding: "0.15rem 0.4rem",
                    borderRadius: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {b.hash?.substring(0, 16)}…
                </code>
              )}
            />
            <Column
              header="Prev Hash"
              body={(b) => (
                <code
                  style={{
                    fontSize: "0.7rem",
                    background: "#f1f5f9",
                    padding: "0.15rem 0.4rem",
                    borderRadius: 4,
                  }}
                >
                  {b.lastHash?.substring(0, 16)}…
                </code>
              )}
            />
            <Column
              header="Transactions"
              body={(b) => b.data?.txCount || (b.index === 0 ? "Genesis" : "—")}
              style={{ width: "110px" }}
            />
            <Column field="nonce" header="Nonce" style={{ width: "80px" }} />
            <Column
              field="difficulty"
              header="Diff"
              style={{ width: "60px" }}
            />
            <Column
              header="Mined At"
              body={(b) => formatDate(b.timestamp)}
              style={{ width: "180px" }}
            />
          </DataTable>
        </TabPanel>

        {/* Transaction Logs */}
        <TabPanel
          header={`Audit Trail (${logs.length})`}
          leftIcon="pi pi-list mr-2"
        >
          <DataTable
            value={logs}
            size="small"
            stripedRows
            paginator
            rows={20}
            sortField="created_at"
            sortOrder={-1}
            emptyMessage="No transactions recorded."
          >
            <Column
              header="Case"
              body={(r) => (
                <Tag
                  value={r.case_number || `#${r.case_id}`}
                  style={{
                    background: "#eef0fb",
                    color: "#000080",
                    fontSize: "0.7rem",
                  }}
                />
              )}
              style={{ width: "110px" }}
            />
            <Column
              field="action_type"
              header="Action"
              body={(r) => (
                <Tag
                  value={r.action_type?.replace(/_/g, " ").toUpperCase()}
                  severity={actionSeverity(r.action_type)}
                  style={{ fontSize: "0.65rem" }}
                />
              )}
              style={{ width: "170px" }}
            />
            <Column field="description" header="Description" />
            <Column
              field="performed_by"
              header="By"
              style={{ width: "130px" }}
            />
            <Column
              field="role"
              header="Role"
              body={(r) => (
                <Tag
                  value={r.role?.toUpperCase()}
                  severity={
                    r.role === "judge"
                      ? "danger"
                      : r.role === "advocate"
                        ? "warning"
                        : "info"
                  }
                  style={{ fontSize: "0.6rem" }}
                />
              )}
              style={{ width: "90px" }}
            />
            <Column
              header="Block"
              body={(r) =>
                r.block_index != null ? (
                  <code style={{ fontSize: "0.7rem" }}>#{r.block_index}</code>
                ) : (
                  "—"
                )
              }
              style={{ width: "70px" }}
            />
            <Column
              header="Hash"
              body={(r) => (
                <code
                  style={{
                    fontSize: "0.65rem",
                    background: "#f1f5f9",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 4,
                  }}
                >
                  {r.transaction_hash?.substring(0, 12)}…
                </code>
              )}
              style={{ width: "120px" }}
            />
            <Column
              field="is_valid"
              header="Valid"
              body={(r) => (
                <i
                  className={
                    r.is_valid ? "pi pi-check-circle" : "pi pi-times-circle"
                  }
                  style={{
                    color: r.is_valid ? "#138808" : "#D32F2F",
                    fontSize: "1rem",
                  }}
                />
              )}
              style={{ width: "60px", textAlign: "center" }}
            />
            <Column
              header="When"
              body={(r) => formatDate(r.created_at)}
              style={{ width: "160px" }}
            />
          </DataTable>
        </TabPanel>

        {/* Visual Chain */}
        <TabPanel header="Chain Visual" leftIcon="pi pi-sitemap mr-2">
          <div
            style={{ maxHeight: "500px", overflow: "auto", padding: "0.5rem" }}
          >
            <Timeline
              value={[...chain].reverse().slice(0, 30)}
              content={(block) => (
                <div
                  style={{
                    background: block.index === 0 ? "#fff8f0" : "#fff",
                    border: `2px solid ${block.index === 0 ? "#FF9933" : "#dee2e6"}`,
                    borderRadius: 10,
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                  onClick={() => setSelectedBlock(block)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <Tag
                      value={
                        block.index === 0 ? "GENESIS" : `BLOCK #${block.index}`
                      }
                      style={{
                        background: block.index === 0 ? "#FF9933" : "#000080",
                        color: "#fff",
                        fontSize: "0.65rem",
                      }}
                    />
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      {formatDate(block.timestamp)}
                    </span>
                  </div>
                  <code
                    style={{
                      fontSize: "0.65rem",
                      color: "#64748b",
                      wordBreak: "break-all",
                    }}
                  >
                    {block.hash}
                  </code>
                  {block.data?.txCount && (
                    <div
                      style={{
                        marginTop: "0.3rem",
                        fontSize: "0.75rem",
                        color: "#6B7280",
                      }}
                    >
                      {block.data.txCount} transaction(s)
                    </div>
                  )}
                </div>
              )}
              opposite={(block) => (
                <code
                  style={{
                    fontSize: "0.6rem",
                    color: "#94a3b8",
                  }}
                >
                  ← {block.lastHash?.substring(0, 10)}…
                </code>
              )}
              marker={(block) => (
                <span
                  style={{
                    display: "flex",
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: block.index === 0 ? "#FF9933" : "#000080",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                  }}
                >
                  {block.index}
                </span>
              )}
            />
          </div>
        </TabPanel>

        {/* Action Breakdown */}
        {stats?.actionBreakdown?.length > 0 && (
          <TabPanel header="Analytics" leftIcon="pi pi-chart-bar mr-2">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {stats.actionBreakdown.map((a, i) => (
                <Card
                  key={i}
                  style={{
                    borderRadius: 10,
                    textAlign: "center",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#000080",
                    }}
                  >
                    {a.count}
                  </div>
                  <Tag
                    value={a.action_type?.replace(/_/g, " ").toUpperCase()}
                    severity={actionSeverity(a.action_type)}
                    style={{ fontSize: "0.6rem", marginTop: "0.3rem" }}
                  />
                </Card>
              ))}
            </div>
          </TabPanel>
        )}
      </TabView>

      {/* Block Detail Dialog */}
      <Dialog
        header={`Block #${selectedBlock?.index ?? ""}`}
        visible={!!selectedBlock}
        onHide={() => setSelectedBlock(null)}
        style={{ width: "600px" }}
        modal
      >
        {selectedBlock && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {[
              { label: "Index", value: selectedBlock.index },
              { label: "Hash", value: selectedBlock.hash, mono: true },
              {
                label: "Previous Hash",
                value: selectedBlock.lastHash,
                mono: true,
              },
              { label: "Nonce", value: selectedBlock.nonce },
              { label: "Difficulty", value: selectedBlock.difficulty },
              { label: "Mined At", value: formatDate(selectedBlock.timestamp) },
            ].map((f) => (
              <div key={f.label}>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    textTransform: "uppercase",
                  }}
                >
                  {f.label}
                </div>
                {f.mono ? (
                  <code
                    style={{
                      fontSize: "0.75rem",
                      background: "#f1f5f9",
                      padding: "0.25rem 0.5rem",
                      borderRadius: 4,
                      display: "block",
                      wordBreak: "break-all",
                    }}
                  >
                    {f.value}
                  </code>
                ) : (
                  <div style={{ fontSize: "0.9rem" }}>{f.value}</div>
                )}
              </div>
            ))}

            {selectedBlock.data?.transactions && (
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    marginBottom: "0.3rem",
                  }}
                >
                  Transactions ({selectedBlock.data.transactions.length})
                </div>
                {selectedBlock.data.transactions.map((tx, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.4rem",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Tag
                        value={tx.actionType?.replace(/_/g, " ").toUpperCase()}
                        severity={actionSeverity(tx.actionType)}
                        style={{ fontSize: "0.6rem" }}
                      />
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        Case #{tx.caseId}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        marginTop: "0.2rem",
                        color: "#334155",
                      }}
                    >
                      {tx.description}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#94a3b8",
                        marginTop: "0.15rem",
                      }}
                    >
                      by {tx.performedBy} ({tx.role}) •{" "}
                      <code style={{ fontSize: "0.6rem" }}>
                        {tx.hash?.substring(0, 16)}…
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
