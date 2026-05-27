// src/modules/ngongang/TicketTracking.jsx
import { useState, useEffect } from "react";
import { getAllTickets, updateTicketStatus, deleteTicketApi } from "../../api/soilApi";

function TicketTracking() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("TOUS");
  const [loadingMsg, setLoadingMsg] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await getAllTickets();
      setTickets(response.data);
    } catch {
      // Fallback localStorage si backend non disponible
      const saved = localStorage.getItem("agroTickets");
      if (saved) setTickets(JSON.parse(saved));
    }
  };

  const updateStatus = async (ticketId, newStatus) => {
    setLoadingMsg(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus);
      await loadTickets();
    } catch {
      // Mise à jour locale si backend non disponible
      const updated = tickets.map((t) =>
        t.ticketId === ticketId ? { ...t, status: newStatus } : t
      );
      setTickets(updated);
      localStorage.setItem("agroTickets", JSON.stringify(updated));
    } finally {
      setLoadingMsg("");
    }
  };

  const deleteTicket = async (ticketId) => {
    setLoadingMsg(ticketId);
    try {
      await deleteTicketApi(ticketId);
      await loadTickets();
    } catch {
      const updated = tickets.filter((t) => t.ticketId !== ticketId);
      setTickets(updated);
      localStorage.setItem("agroTickets", JSON.stringify(updated));
    } finally {
      setLoadingMsg("");
    }
  };

  const filteredTickets = filter === "TOUS" ? tickets : tickets.filter((t) => t.status === filter);
  const countByStatus = (status) => tickets.filter((t) => t.status === status).length;

  const getStatusStyle = (status) => {
    if (status === "LIVRE") return { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" };
    if (status === "EN_TRANSIT") return { backgroundColor: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9" };
    if (status === "EN_ATTENTE") return { backgroundColor: "#fff8e1", color: "#f57c00", border: "1px solid #ffe082" };
    return { backgroundColor: "#fce4ec", color: "#c62828", border: "1px solid #ef9a9a" };
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 Suivi des Tickets & Statuts de Livraison</h2>

      {/* Statistiques */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{tickets.length}</span>
          <span style={styles.statLabel}>Total tickets</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#ffe082" }}>
          <span style={{ ...styles.statNumber, color: "#f57c00" }}>{countByStatus("EN_ATTENTE")}</span>
          <span style={styles.statLabel}>En attente</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#90caf9" }}>
          <span style={{ ...styles.statNumber, color: "#1565c0" }}>{countByStatus("EN_TRANSIT")}</span>
          <span style={styles.statLabel}>En transit</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#a5d6a7" }}>
          <span style={{ ...styles.statNumber, color: "#2e7d32" }}>{countByStatus("LIVRE")}</span>
          <span style={styles.statLabel}>Livrés</span>
        </div>
      </div>

      {/* Bouton rafraîchir */}
      <button onClick={loadTickets} style={styles.refreshBtn}>🔄 Rafraîchir</button>

      {/* Filtres */}
      <div style={styles.filterRow}>
        {["TOUS", "EN_ATTENTE", "EN_TRANSIT", "LIVRE"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}>
            {f === "TOUS" ? "Tous" : f === "EN_ATTENTE" ? "En attente" : f === "EN_TRANSIT" ? "En transit" : "Livrés"}
          </button>
        ))}
      </div>

      {/* Liste des tickets */}
      {filteredTickets.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyText}>
            {tickets.length === 0
              ? "Aucun ticket pour l'instant. Générez un ticket depuis le formulaire ci-dessus."
              : "Aucun ticket avec ce statut."}
          </p>
        </div>
      ) : (
        <div style={styles.ticketsList}>
          {filteredTickets.map((ticket) => (
            <div key={ticket.ticketId} style={styles.ticketCard}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.productName}>{ticket.productName}</span>
                  <span style={styles.ticketId}>#{ticket.ticketId}</span>
                </div>
                <span style={{ ...styles.statusBadge, ...getStatusStyle(ticket.status) }}>
                  {ticket.status === "EN_ATTENTE" ? "⏳ En attente"
                    : ticket.status === "EN_TRANSIT" ? "🚚 En transit"
                    : ticket.status === "LIVRE" ? "✅ Livré"
                    : ticket.status}
                </span>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Agriculteur</span><span style={styles.infoValue}>{ticket.farmerName}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Quantité</span><span style={styles.infoValue}>{ticket.quantity} {ticket.unit}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Prix</span><span style={styles.infoValue}>{Number(ticket.price).toLocaleString()} FCFA</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Trajet</span><span style={styles.infoValue}>{ticket.origin} → {ticket.destination}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Date prévue</span><span style={styles.infoValue}>{ticket.date || ticket.deliveryDate}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Créé le</span><span style={styles.infoValue}>{ticket.createdAt}</span></div>
                </div>
              </div>

              <div style={styles.cardActions}>
                {loadingMsg === ticket.ticketId ? (
                  <span style={styles.loadingMsg}>⏳ Mise à jour...</span>
                ) : (
                  <>
                    {ticket.status === "EN_ATTENTE" && (
                      <button onClick={() => updateStatus(ticket.ticketId, "EN_TRANSIT")} style={styles.transitBtn}>
                        🚚 Marquer En transit
                      </button>
                    )}
                    {ticket.status === "EN_TRANSIT" && (
                      <button onClick={() => updateStatus(ticket.ticketId, "LIVRE")} style={styles.deliverBtn}>
                        ✅ Marquer Livré
                      </button>
                    )}
                    {ticket.status === "LIVRE" && (
                      <span style={styles.doneMsg}>🎉 Livraison complète</span>
                    )}
                    <button onClick={() => deleteTicket(ticket.ticketId)} style={styles.deleteBtn}>
                      🗑️ Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "40px auto", padding: "24px", fontFamily: "Arial" },
  title: { color: "#2e7d32", marginBottom: "24px", fontSize: "22px" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: "120px", padding: "16px", backgroundColor: "#fff", border: "2px solid #e0e0e0", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" },
  statNumber: { fontSize: "28px", fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: "12px", color: "#888", textTransform: "uppercase" },
  refreshBtn: { marginBottom: "16px", padding: "8px 16px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  filterRow: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
  filterBtn: { padding: "8px 18px", borderRadius: "20px", border: "2px solid #e0e0e0", backgroundColor: "#fff", cursor: "pointer", fontSize: "13px", color: "#555" },
  filterBtnActive: { backgroundColor: "#2e7d32", color: "white", borderColor: "#2e7d32" },
  emptyBox: { padding: "48px", textAlign: "center", backgroundColor: "#f9fbe7", borderRadius: "12px", border: "2px dashed #aed581" },
  emptyText: { color: "#777", fontSize: "15px", margin: 0 },
  ticketsList: { display: "flex", flexDirection: "column", gap: "16px" },
  ticketCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", backgroundColor: "#f9fbe7", borderBottom: "1px solid #e8f5e9" },
  productName: { fontWeight: "bold", fontSize: "16px", color: "#1b5e20", marginRight: "10px" },
  ticketId: { fontSize: "12px", color: "#999" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" },
  cardBody: { padding: "16px 20px" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" },
  infoItem: { display: "flex", flexDirection: "column", gap: "2px" },
  infoLabel: { fontSize: "11px", color: "#888", textTransform: "uppercase" },
  infoValue: { fontSize: "14px", color: "#222", fontWeight: "500" },
  cardActions: { display: "flex", gap: "10px", padding: "12px 20px", backgroundColor: "#fafafa", borderTop: "1px solid #f0f0f0", flexWrap: "wrap", alignItems: "center" },
  transitBtn: { padding: "8px 16px", backgroundColor: "#1565c0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  deliverBtn: { padding: "8px 16px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  doneMsg: { color: "#2e7d32", fontWeight: "bold", fontSize: "14px" },
  loadingMsg: { color: "#f57c00", fontSize: "14px" },
  deleteBtn: { padding: "8px 16px", backgroundColor: "#fff", color: "#c62828", border: "1px solid #ef9a9a", borderRadius: "6px", cursor: "pointer", fontSize: "13px", marginLeft: "auto" },
};

export default TicketTracking;
