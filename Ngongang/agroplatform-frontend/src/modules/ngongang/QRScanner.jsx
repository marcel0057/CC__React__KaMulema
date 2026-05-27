// src/modules/ngongang/QRScanner.jsx
import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {
  // "idle"     = en attente, caméra pas encore lancée
  // "scanning" = caméra active, scan en course
  // "scanned"  = QR Code détecté, résultat affiché
  // "error"    = erreur caméra ou QR Code invalid
  const [scanStatus, setScanStatus] = useState("idle");

  // Les données du ticket scanné
  const [scannedTicket, setScannedTicket] = useState(null);

  // Message d'erreur
  const [errorMsg, setErrorMsg] = useState("");

  // Statut de validation (après avoir cliqué "Valider")
  const [validated, setValidated] = useState(false);

  // Référence vers l'instance html5-qrcode
  const scannerRef = useRef(null);

  // Nettoyage : arrêter la caméra quand on quitte le composant
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setScanStatus("scanning");
    setErrorMsg("");
    setScannedTicket(null);
    setValidated(false);

    // On crée une instance html5-qrcode liée au div avec l'id "qr-reader"
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" }, // Caméra arrière sur mobile
        {
          fps: 10,        // Fréquence d'analyse : 10 images par seconde
          qrbox: 250,     // Zone de scan : carré de 250px au centre
        },
        (decodedText) => {
          // Callback appelé quand un QR Code est détecté
          handleScanSuccess(decodedText, html5QrCode);
        },
        () => {
          // Callback appelé à chaque frame sans QR Code — on ignore
        }
      );
    } catch {
      setScanStatus("error");
      setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const handleScanSuccess = async (decodedText, html5QrCode) => {
    // Arrêter la caméra dès qu'un QR Code est trouvé
    await html5QrCode.stop();
    scannerRef.current = null;

    try {
      // Le QR Code contient un JSON — on le parse
      const ticketData = JSON.parse(decodedText);
      setScannedTicket(ticketData);
      setScanStatus("scanned");
    } catch {
      // Si ce n'est pas un JSON valid (QR Code d'une autre app)
      setScanStatus("error");
      setErrorMsg("QR Code invalid. Ce ticket ne provient pas d'AgroPlatform.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanStatus("idle");
  };

  const handleValidate = async () => {
    // Ici on appellerait l'API Spring Boot pour changer le statut
    // Example : await axios.put(`http://localhost:8080/api/tickets/${scannedTicket.ticketId}/validate`)

    // Pour l'instant on simule la validation
    setValidated(true);
    setScannedTicket((prev) => ({ ...prev, status: "LIVRE" }));
  };

  const handleReset = () => {
    setScanStatus("idle");
    setScannedTicket(null);
    setValidated(false);
    setErrorMsg("");
  };

  // Couleur du badge selon le statut
  const getStatusColor = (status) => {
    if (status === "LIVRE") return "#2e7d32";
    if (status === "EN_ATTENTE") return "#f57c00";
    return "#1565c0";
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📷 Scanner QR Code — Validation Livraison</h2>

      {/* ÉTAT INITIAL */}
      {scanStatus === "idle" && (
        <div style={styles.idleBox}>
          <div style={styles.cameraIcon}>📷</div>
          <p style={styles.idleText}>
            Scannez le QR Code d'un ticket produit pour valider la livraison
          </p>
          <button onClick={startScanner} style={styles.startBtn}>
            🚀 Démarrer le scanner
          </button>
        </div>
      )}

      {/* SCAN EN COURSE */}
      {scanStatus === "scanning" && (
        <div style={styles.scanningBox}>
          <p style={styles.scanningText}>
            📡 Scanner actif — Pointez vers un QR Code
          </p>
          {/* Ce div est le conteneur de la caméra — html5-qrcode l'utilise */}
          <div id="qr-reader" style={styles.qrReader} />
          <button onClick={stopScanner} style={styles.stopBtn}>
            ⏹️ Arrêter le scanner
          </button>
        </div>
      )}

      {/* ERREUR */}
      {scanStatus === "error" && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>❌ {errorMsg}</p>
          <button onClick={handleReset} style={styles.startBtn}>
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* TICKET SCANNÉ */}
      {scanStatus === "scanned" && scannedTicket && (
        <div style={styles.resultBox}>

          {/* Badge succès */}
          <div style={styles.successBadge}>
            ✅ QR Code scanné avec succès !
          </div>

          {/* Carte ticket */}
          <div style={styles.ticket}>
            <div style={styles.ticketHeader}>
              <span style={styles.ticketBadge}>🌾 AgroPlatform</span>
              <span style={styles.ticketId}>#{scannedTicket.ticketId}</span>
            </div>

            <div style={styles.ticketBody}>
              <h3 style={styles.productName}>{scannedTicket.productName}</h3>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Agriculture</span>
                  <span style={styles.infoValue}>{scannedTicket.farmerName}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Quantité</span>
                  <span style={styles.infoValue}>
                    {scannedTicket.quantity} {scannedTicket.unit}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Prix</span>
                  <span style={styles.infoValue}>
                    {Number(scannedTicket.price).toLocaleString()} FCFA
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Origine</span>
                  <span style={styles.infoValue}>{scannedTicket.origin}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Destination</span>
                  <span style={styles.infoValue}>{scannedTicket.destination}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date livraison</span>
                  <span style={styles.infoValue}>{scannedTicket.date}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Créé le</span>
                  <span style={styles.infoValue}>{scannedTicket.createdAt}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Statut</span>
                  <span style={{
                    ...styles.infoValue,
                    color: getStatusColor(scannedTicket.status),
                    fontWeight: "bold",
                  }}>
                    {scannedTicket.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={styles.actions}>
            {!validated ? (
              <button onClick={handleValidate} style={styles.validateBtn}>
                ✅ Valider la livraison
              </button>
            ) : (
              <div style={styles.validatedMsg}>
                🎉 Livraison validée ! Statut mis à jour : LIVRÉ
              </div>
            )}
            <button onClick={handleReset} style={styles.resetBtn}>
              🔄 Scanner un autre ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "650px", margin: "40px auto",
    padding: "24px", fontFamily: "Arial",
  },
  title: { color: "#2e7d32", marginBottom: "24px", fontSize: "22px" },
  idleBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "20px", padding: "48px", backgroundColor: "#f9fbe7",
    borderRadius: "12px", border: "2px dashed #aed581",
  },
  cameraIcon: { fontSize: "64px" },
  idleText: { color: "#555", textAlign: "center", fontSize: "15px", margin: 0 },
  startBtn: {
    padding: "14px 32px", backgroundColor: "#2e7d32", color: "white",
    border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer",
  },
  scanningBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "16px",
  },
  scanningText: {
    color: "#1565c0", fontWeight: "bold",
    fontSize: "15px", margin: 0,
  },
  qrReader: {
    width: "100%", maxWidth: "400px",
    borderRadius: "12px", overflow: "hidden",
    border: "3px solid #2e7d32",
  },
  stopBtn: {
    padding: "10px 24px", backgroundColor: "#c62828", color: "white",
    border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer",
  },
  errorBox: {
    padding: "32px", backgroundColor: "#ffebee",
    borderRadius: "12px", border: "2px solid #ef9a9a",
    textAlign: "center",
  },
  errorText: { color: "#c62828", fontSize: "15px", marginBottom: "16px" },
  resultBox: { display: "flex", flexDirection: "column", gap: "20px" },
  successBadge: {
    backgroundColor: "#e8f5e9", color: "#2e7d32",
    padding: "12px 20px", borderRadius: "8px",
    fontWeight: "bold", fontSize: "15px",
    border: "1px solid #a5d6a7", textAlign: "center",
  },
  ticket: {
    border: "2px solid #a5d6a7", borderRadius: "12px",
    overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  ticketHeader: {
    backgroundColor: "#2e7d32", color: "white",
    padding: "12px 20px", display: "flex",
    justifyContent: "space-between", alignItems: "center",
  },
  ticketBadge: { fontWeight: "bold", fontSize: "16px" },
  ticketId: { fontSize: "13px", opacity: 0.85 },
  ticketBody: { padding: "20px", backgroundColor: "#fff" },
  productName: { color: "#1b5e20", fontSize: "20px", margin: "0 0 16px 0" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  infoItem: { display: "flex", flexDirection: "column", gap: "2px" },
  infoLabel: { fontSize: "11px", color: "#888", textTransform: "uppercase" },
  infoValue: { fontSize: "14px", color: "#222", fontWeight: "500" },
  actions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  validateBtn: {
    padding: "12px 28px", backgroundColor: "#2e7d32", color: "white",
    border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer",
    flex: 1,
  },
  validatedMsg: {
    padding: "12px 20px", backgroundColor: "#e8f5e9",
    borderRadius: "8px", color: "#2e7d32",
    fontWeight: "bold", fontSize: "15px", flex: 1,
    textAlign: "center",
  },
  resetBtn: {
    padding: "12px 20px", backgroundColor: "#555", color: "white",
    border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
  },
};

export default QRScanner;
