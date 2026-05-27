// src/modules/ngongang/QRTicketGenerator.jsx
import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { createTicket } from "../../api/soilApi";

function QRTicketGenerator() {
  const [productData, setProductData] = useState({
    productName: "",
    quantity: "",
    unit: "kg",
    price: "",
    farmerName: "",
    origin: "",
    destination: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const qrRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newTicket = {
      ticketId: `AGR-${Date.now()}`,
      ...productData,
      status: "EN_ATTENTE",
      createdAt: new Date().toLocaleString("fr-FR"),
    };

    try {
      await createTicket(newTicket);
      setTicket(newTicket);
    } catch {
      const existing = JSON.parse(localStorage.getItem("agroTickets") || "[]");
      localStorage.setItem("agroTickets", JSON.stringify([newTicket, ...existing]));
      setTicket(newTicket);
      setError("⚠️ Backend non disponible — ticket sauvegardé localement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-${ticket.ticketId}.png`;
    link.click();
  };

  const handleReset = () => {
    setTicket(null);
    setError(null);
    setProductData({
      productName: "",
      quantity: "",
      unit: "kg",
      price: "",
      farmerName: "",
      origin: "",
      destination: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎫 Génération de Tickets Produit avec QR Code</h2>

      {!ticket ? (
        <form onSubmit={handleGenerate} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nom du produit</label>
              <input type="text" name="productName" value={productData.productName}
                onChange={handleChange} placeholder="Ex: Tomates fraîches" required style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nom de l'agriculteur</label>
              <input type="text" name="farmerName" value={productData.farmerName}
                onChange={handleChange} placeholder="Ex: Jean Ngono" required style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Quantité</label>
              <input type="number" name="quantity" value={productData.quantity}
                onChange={handleChange} placeholder="Ex: 50" required min="1" style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Unité</label>
              <select name="unit" value={productData.unit} onChange={handleChange} style={styles.input}>
                <option value="kg">kg</option>
                <option value="tonnes">Tonnes</option>
                <option value="sacs">Sacs</option>
                <option value="cartons">Cartons</option>
                <option value="caisses">Caisses</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Prix (FCFA)</label>
              <input type="number" name="price" value={productData.price}
                onChange={handleChange} placeholder="Ex: 25000" required min="0" style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Origine (lieu de départ)</label>
              <input type="text" name="origin" value={productData.origin}
                onChange={handleChange} placeholder="Ex: Bafoussam" required style={styles.input} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Destination</label>
              <input type="text" name="destination" value={productData.destination}
                onChange={handleChange} placeholder="Ex: Yaoundé" required style={styles.input} />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Date de livraison prévue</label>
            <input type="date" name="date" value={productData.date}
              onChange={handleChange} required style={styles.input} />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Génération en cours..." : "🎫 Générer le ticket QR Code"}
          </button>
        </form>
      ) : (
        <div style={styles.ticketWrapper}>
          {error && <p style={styles.warning}>{error}</p>}

          <div style={styles.ticket}>
            <div style={styles.ticketHeader}>
              <span style={styles.ticketBadge}>🌾 AgroPlatform</span>
              <span style={styles.ticketId}>#{ticket.ticketId}</span>
            </div>
            <div style={styles.ticketBody}>
              <div style={styles.ticketInfo}>
                <h3 style={styles.productName}>{ticket.productName}</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Agriculteur</span><span style={styles.infoValue}>{ticket.farmerName}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Quantité</span><span style={styles.infoValue}>{ticket.quantity} {ticket.unit}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Prix</span><span style={styles.infoValue}>{Number(ticket.price).toLocaleString()} FCFA</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Origine</span><span style={styles.infoValue}>{ticket.origin}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Destination</span><span style={styles.infoValue}>{ticket.destination}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Date livraison</span><span style={styles.infoValue}>{ticket.date}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Statut</span><span style={{ ...styles.infoValue, color: "#f57c00", fontWeight: "bold" }}>{ticket.status}</span></div>
                  <div style={styles.infoItem}><span style={styles.infoLabel}>Créé le</span><span style={styles.infoValue}>{ticket.createdAt}</span></div>
                </div>
              </div>
              <div style={styles.qrSection} ref={qrRef}>
                <QRCodeCanvas value={JSON.stringify(ticket)} size={160} bgColor="#ffffff" fgColor="#1b5e20" level="H" />
                <p style={styles.qrHint}>Scanner pour valider</p>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={handleDownload} style={styles.downloadBtn}>⬇️ Télécharger le QR Code</button>
            <button onClick={() => window.print()} style={styles.printBtn}>🖨️ Imprimer le ticket</button>
            <button onClick={handleReset} style={styles.resetBtn}>➕ Nouveau ticket</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "750px", margin: "40px auto", padding: "24px", fontFamily: "Arial" },
  title: { color: "#2e7d32", marginBottom: "24px", fontSize: "22px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "flex", gap: "16px", flexWrap: "wrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "200px" },
  label: { fontWeight: "bold", color: "#333", fontSize: "14px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  button: { padding: "14px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer" },
  warning: { color: "#f57c00", backgroundColor: "#fff8e1", padding: "10px", borderRadius: "6px" },
  ticketWrapper: { display: "flex", flexDirection: "column", gap: "20px" },
  ticket: { border: "2px solid #a5d6a7", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  ticketHeader: { backgroundColor: "#2e7d32", color: "white", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  ticketBadge: { fontWeight: "bold", fontSize: "16px" },
  ticketId: { fontSize: "13px", opacity: 0.85 },
  ticketBody: { display: "flex", padding: "20px", gap: "20px", backgroundColor: "#fff" },
  ticketInfo: { flex: 1 },
  productName: { color: "#1b5e20", fontSize: "20px", margin: "0 0 16px 0" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  infoItem: { display: "flex", flexDirection: "column", gap: "2px" },
  infoLabel: { fontSize: "11px", color: "#888", textTransform: "uppercase" },
  infoValue: { fontSize: "14px", color: "#222", fontWeight: "500" },
  qrSection: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", backgroundColor: "#f9fbe7", borderRadius: "8px", border: "1px dashed #aed581" },
  qrHint: { fontSize: "12px", color: "#777", margin: 0 },
  actions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  downloadBtn: { padding: "10px 20px", backgroundColor: "#1565c0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  printBtn: { padding: "10px 20px", backgroundColor: "#6a1b9a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  resetBtn: { padding: "10px 20px", backgroundColor: "#e65100", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
};

export default QRTicketGenerator;
