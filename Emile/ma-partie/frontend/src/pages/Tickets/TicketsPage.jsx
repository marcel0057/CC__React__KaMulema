import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRating from '../../components/StarRating';
import { ticketsService } from '../../services/tickets.service';
import { transportsService } from '../../services/transports.service';
import { formatDateTime, formatFcfa, getStatusVariant } from '../../utils/helpers';

const TicketsPage = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('view') === 'commandes' ? 'historique' : 'generer');
  const [livraisons, setLivraisons] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerResult, setScannerResult] = useState('');
  const [currentTicket, setCurrentTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [notationForm, setNotationForm] = useState({
    note_produit: 0,
    note_transporteur: 0,
    note_vendeur: 0,
    commentaire: ''
  });
  const [historyFilters, setHistoryFilters] = useState({
    statut: '',
    date: '',
    produit: ''
  });
  const scannerInstance = useRef(null);
  const qrWrapperRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    const [deliveryData, ticketData] = await Promise.all([
      transportsService.myLivraisons(),
      ticketsService.myTickets()
    ]);
    setLivraisons(deliveryData.livraisons || []);
    setTickets(ticketData.tickets || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      scannerInstance.current?.stop().catch(() => null);
      scannerInstance.current?.clear().catch(() => null);
      return;
    }

    const html5QrCode = new Html5Qrcode('qr-reader');
    scannerInstance.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async (decodedText) => {
          setScannerResult(decodedText);
          setScannerOpen(false);
          try {
            const parsed = JSON.parse(decodedText);
            const data = await ticketsService.detail(parsed.numero_ticket);
            setCurrentTicket(data.ticket);
          } catch (error) {
            const data = await ticketsService.detail(decodedText);
            setCurrentTicket(data.ticket);
          }
        }
      )
      .catch(() => {
        setMessage('Impossible d ouvrir la camera. Verifiez les permissions.');
        setScannerOpen(false);
      });

    return () => {
      html5QrCode.stop().catch(() => null);
      html5QrCode.clear().catch(() => null);
    };
  }, [scannerOpen]);

  const handleGenerate = async () => {
    if (!selectedLivraison) {
      return;
    }
    const data = await ticketsService.generer({ livraison_id: selectedLivraison });
    setGeneratedTicket(data.ticket);
    fetchData();
  };

  const handleDownloadQr = () => {
    const canvas = qrWrapperRef.current?.querySelector('canvas');
    if (!canvas) {
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ticket-${generatedTicket.numero_ticket}.png`;
    link.click();
  };

  const handlePrintTicket = () => {
    const canvas = qrWrapperRef.current?.querySelector('canvas');
    if (!canvas || !generatedTicket) {
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Bon de livraison AgroPlatform', 14, 20);
    doc.setFontSize(12);
    doc.text(`Numero : ${generatedTicket.numero_ticket}`, 14, 34);
    doc.text(`Statut : ${generatedTicket.statut}`, 14, 42);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 50, 60, 60);
    doc.save(`ticket-${generatedTicket.numero_ticket}.pdf`);
  };

  const handleConfirmReception = async () => {
    if (!currentTicket) {
      return;
    }
    const data = await ticketsService.scanner(currentTicket.numero_ticket);
    setMessage(data.message);
    setCurrentTicket((ticket) => (ticket ? { ...ticket, statut: 'confirme' } : ticket));
    setTab('notation');
    await fetchData();
  };

  const handleProblem = async () => {
    if (!currentTicket) {
      return;
    }
    const data = await ticketsService.scanner(currentTicket.numero_ticket, { statut: 'probleme' });
    setMessage(data.message);
    await fetchData();
  };

  const handleNotation = async () => {
    if (!currentTicket) {
      return;
    }
    const data = await ticketsService.notation(currentTicket.id, notationForm);
    setMessage(data.message);
    setNotationForm({
      note_produit: 0,
      note_transporteur: 0,
      note_vendeur: 0,
      commentaire: ''
    });
    setCurrentTicket(null);
    await fetchData();
  };

  const handleSelectForNotation = (ticket) => {
    setCurrentTicket(ticket);
    setNotationForm({ note_produit: 0, note_transporteur: 0, note_vendeur: 0, commentaire: '' });
    setTab('notation');
  };

  const filteredTickets = tickets.filter((item) => {
    const matchesStatus = historyFilters.statut ? item.statut === historyFilters.statut : true;
    const matchesDate = historyFilters.date
      ? String(item.date_generation).slice(0, 10) === historyFilters.date
      : true;
    const matchesProduit = historyFilters.produit
      ? String(item.produit_nom || '')
          .toLowerCase()
          .includes(historyFilters.produit.toLowerCase())
      : true;

    return matchesStatus && matchesDate && matchesProduit;
  });

  if (loading) {
    return <LoadingSpinner label="Chargement des tickets..." />;
  }

  return (
    <div className="page">
      <section className="section-heading left">
        <h1>Tickets QR Code et notation</h1>
        <p>Generez, scannez, confirmez et evaluez vos livraisons depuis un meme espace.</p>
      </section>

      <div className="tab-row">
        <button type="button" className={`tab-button ${tab === 'generer' ? 'active' : ''}`} onClick={() => setTab('generer')}>
          Generer
        </button>
        <button type="button" className={`tab-button ${tab === 'scanner' ? 'active' : ''}`} onClick={() => setTab('scanner')}>
          Scanner
        </button>
        <button type="button" className={`tab-button ${tab === 'notation' ? 'active' : ''}`} onClick={() => setTab('notation')}>
          Notation
        </button>
        <button type="button" className={`tab-button ${tab === 'historique' ? 'active' : ''}`} onClick={() => setTab('historique')}>
          Historique
        </button>
      </div>

      {tab === 'generer' && (
        <div className="dashboard-grid">
          <article className="card">
            <h3>Generer un ticket</h3>
            <select value={selectedLivraison} onChange={(event) => setSelectedLivraison(event.target.value)}>
              <option value="">Choisir une livraison</option>
              {livraisons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.produit_nom} - {item.statut}
                </option>
              ))}
            </select>
            <button type="button" className="btn-primary wide" onClick={handleGenerate}>
              Generer le ticket QR
            </button>
          </article>

          <article className="card">
            <h3>Ticket genere</h3>
            {generatedTicket ? (
              <div ref={qrWrapperRef} className="qr-preview">
                <QRCodeCanvas value={generatedTicket.qr_data} size={200} includeMargin />
                <p>{generatedTicket.numero_ticket}</p>
                <div className="card-actions">
                  <button type="button" className="btn-secondary" onClick={handleDownloadQr}>
                    Telecharger PNG
                  </button>
                  <button type="button" className="btn-primary" onClick={handlePrintTicket}>
                    Imprimer le ticket
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted">Aucun ticket n a encore ete genere.</p>
            )}
          </article>
        </div>
      )}

      {tab === 'scanner' && (
        <div className="dashboard-grid">
          <article className="card">
            <h3>Scanner un QR Code</h3>
            <button type="button" className="btn-primary wide" onClick={() => setScannerOpen(true)}>
              Ouvrir la camera
            </button>
            {scannerOpen && <div id="qr-reader" className="qr-reader-box" />}
            {scannerResult && <p className="muted">Derniere lecture : {scannerResult}</p>}
          </article>

          <article className="card">
            <h3>Livraison scannee</h3>
            {currentTicket ? (
              <>
                <p><strong>Numero :</strong> {currentTicket.numero_ticket}</p>
                <p><strong>Produit :</strong> {currentTicket.produit_nom}</p>
                <p><strong>Montant :</strong> {formatFcfa(currentTicket.montant_total)}</p>
                <Badge variant={getStatusVariant(currentTicket.statut)}>{currentTicket.statut}</Badge>
                <div className="card-actions">
                  <button type="button" className="btn-primary" onClick={handleConfirmReception}>
                    Confirmer la reception
                  </button>
                  <button type="button" className="btn-danger" onClick={handleProblem}>
                    Signaler un probleme
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Scannez un ticket pour afficher ses details.</p>
            )}
          </article>
        </div>
      )}

      {tab === 'notation' && (
        <article className="card">
          <h3>Notation post-livraison</h3>
          {currentTicket ? (
            <div className="stack-form">
              <p className="muted">Évaluation du ticket <strong>{currentTicket.numero_ticket}</strong></p>
              <label>
                Note produit
                <StarRating value={notationForm.note_produit} onChange={(value) => setNotationForm((current) => ({ ...current, note_produit: value }))} />
              </label>
              <label>
                Note transporteur
                <StarRating value={notationForm.note_transporteur} onChange={(value) => setNotationForm((current) => ({ ...current, note_transporteur: value }))} />
              </label>
              <label>
                Note vendeur
                <StarRating value={notationForm.note_vendeur} onChange={(value) => setNotationForm((current) => ({ ...current, note_vendeur: value }))} />
              </label>
              <textarea
                rows="4"
                placeholder="Votre commentaire (optionnel)"
                value={notationForm.commentaire}
                onChange={(event) => setNotationForm((current) => ({ ...current, commentaire: event.target.value }))}
              />
              <div className="card-actions">
                <button type="button" className="btn-secondary" onClick={() => setCurrentTicket(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-primary" onClick={handleNotation}>
                  Soumettre la notation
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Scannez un ticket ou sélectionnez un ticket confirmé depuis l&apos;onglet <strong>Historique</strong> pour activer la notation.</p>
          )}
        </article>
      )}

      {tab === 'historique' && (
        <article className="card">
          <h3>Historique des tickets</h3>
          <div className="filter-grid">
            <select
              value={historyFilters.statut}
              onChange={(event) =>
                setHistoryFilters((current) => ({ ...current, statut: event.target.value }))
              }
            >
              <option value="">Tous les statuts</option>
              <option value="genere">Genere</option>
              <option value="scanne">Scanne</option>
              <option value="confirme">Confirme</option>
              <option value="probleme">Probleme</option>
            </select>
            <input
              type="date"
              value={historyFilters.date}
              onChange={(event) =>
                setHistoryFilters((current) => ({ ...current, date: event.target.value }))
              }
            />
            <input
              placeholder="Produit"
              value={historyFilters.produit}
              onChange={(event) =>
                setHistoryFilters((current) => ({ ...current, produit: event.target.value }))
              }
            />
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Numero</th>
                <th>Produit</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((item) => (
                <tr key={item.id}>
                  <td>{item.numero_ticket}</td>
                  <td>{item.produit_nom}</td>
                  <td>
                    <Badge variant={getStatusVariant(item.statut)}>{item.statut}</Badge>
                  </td>
                  <td>{formatDateTime(item.date_generation)}</td>
                  <td>
                    {item.statut === 'confirme' ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        title="Évaluer cette livraison"
                        onClick={() => handleSelectForNotation(item)}
                      >
                        ⭐ Évaluer
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      {message && <div className="alert alert-success">{message}</div>}
    </div>
  );
};

export default TicketsPage;
