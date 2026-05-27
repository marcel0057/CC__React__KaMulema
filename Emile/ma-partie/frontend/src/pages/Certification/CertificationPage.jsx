import { useEffect, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import AppModal from '../../components/AppModal';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { certificationsService } from '../../services/certifications.service';
import {
  formatDate,
  formatFcfa,
  getCertificationIcon,
  getStatusVariant
} from '../../utils/helpers';

const chartColors = ['#2d8a4e', '#f59e0b', '#3182ce', '#8b5cf6'];

const CertificationPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myData, setMyData] = useState(null);
  const [adminData, setAdminData] = useState({ certifications: [], stats: null });
  const [filters, setFilters] = useState({ niveau: '', statut: '', region: '' });
  const [feedback, setFeedback] = useState(null);
  const [decisionDraft, setDecisionDraft] = useState(null);

  const loadAgriculteurData = async () => {
    const data = await certificationsService.mine();
    setMyData(data);
  };

  const loadAdminData = async () => {
    const [list, stats] = await Promise.all([
      certificationsService.list(filters),
      certificationsService.stats()
    ]);
    setAdminData({ certifications: list.certifications || [], stats });
  };

  useEffect(() => {
    setLoading(true);
    const task = user?.role === 'admin' ? loadAdminData() : loadAgriculteurData();
    Promise.resolve(task).finally(() => setLoading(false));
  }, [user?.role, filters.niveau, filters.statut, filters.region]);

  const handleDemande = async () => {
    const data = await certificationsService.submit();
    setFeedback({ type: 'success', text: data.message || 'Demande envoyee avec succes.' });
    await loadAgriculteurData();
  };

  const handleDecision = async () => {
    if (!decisionDraft) {
      return;
    }

    await certificationsService.decide(decisionDraft.id, {
      statut: decisionDraft.statut,
      commentaire_admin: decisionDraft.commentaire_admin,
      niveau: decisionDraft.niveau
    });
    setFeedback({
      type: 'success',
      text: `La decision ${decisionDraft.statut} a bien ete enregistree.`
    });
    setDecisionDraft(null);
    await loadAdminData();
  };

  if (loading) {
    return <LoadingSpinner label="Chargement des certifications..." />;
  }

  if (user?.role === 'admin') {
    return (
      <div className="page">
        <section className="section-heading left">
          <h1>Pilotage des certifications</h1>
          <p>Validez les demandes, comparez les niveaux et suivez les regions actives.</p>
        </section>

        {feedback ? (
          <div className={`alert alert-${feedback.type}`}>
            <div className="list-row">
              <span>{feedback.text}</span>
              <button type="button" className="btn-secondary" onClick={() => setFeedback(null)}>
                Fermer
              </button>
            </div>
          </div>
        ) : null}

        <div className="filter-grid">
          <select
            value={filters.niveau}
            onChange={(event) => setFilters((current) => ({ ...current, niveau: event.target.value }))}
          >
            <option value="">Tous les niveaux</option>
            <option value="bronze">Bronze</option>
            <option value="argent">Argent</option>
            <option value="or">Or</option>
            <option value="platine">Platine</option>
          </select>
          <select
            value={filters.statut}
            onChange={(event) => setFilters((current) => ({ ...current, statut: event.target.value }))}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="approuve">Approuve</option>
            <option value="rejete">Rejete</option>
          </select>
          <input
            placeholder="Region"
            value={filters.region}
            onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
          />
        </div>

        <div className="dashboard-grid">
          <article className="card chart-card">
            <h3>Repartition par niveau</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={adminData.stats?.repartition_niveaux || []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                  >
                    {(adminData.stats?.repartition_niveaux || []).map((item, index) => (
                      <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card chart-card">
            <h3>Repartition par statut</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={adminData.stats?.repartition_statuts || []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                  >
                    {(adminData.stats?.repartition_statuts || []).map((item, index) => (
                      <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        <article className="card">
          <h3>Demandes en cours et historique</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agriculteur</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Region</th>
                <th>Anciennete</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminData.certifications.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.prenom} {item.nom}
                  </td>
                  <td>
                    {getCertificationIcon(item.niveau)} {item.niveau}
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(item.statut)}>{item.statut}</Badge>
                  </td>
                  <td>{item.region}</td>
                  <td>{item.anciennete_mois} mois</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          setDecisionDraft({
                            id: item.id,
                            niveau: item.niveau,
                            statut: 'approuve',
                            commentaire_admin: '',
                            nom: `${item.prenom} ${item.nom}`
                          })
                        }
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() =>
                          setDecisionDraft({
                            id: item.id,
                            niveau: item.niveau,
                            statut: 'rejete',
                            commentaire_admin: '',
                            nom: `${item.prenom} ${item.nom}`
                          })
                        }
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <AppModal
          open={Boolean(decisionDraft)}
          title="Confirmer la decision"
          subtitle={
            decisionDraft
              ? `Vous allez ${decisionDraft.statut} la demande de ${decisionDraft.nom}.`
              : ''
          }
          onClose={() => setDecisionDraft(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setDecisionDraft(null)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={handleDecision}>
                Enregistrer la decision
              </button>
            </>
          }
        >
          <label>
            Commentaire administrateur
            <textarea
              rows="4"
              value={decisionDraft?.commentaire_admin || ''}
              onChange={(event) =>
                setDecisionDraft((current) =>
                  current
                    ? { ...current, commentaire_admin: event.target.value }
                    : current
                )
              }
              placeholder="Ajoutez un commentaire utile pour l agriculteur."
            />
          </label>
        </AppModal>
      </div>
    );
  }

  if (user?.role === 'agronome') {
    return (
      <div className="page">
        <section className="section-heading left">
          <h1>Suivi des certifications</h1>
          <p>Les agronomes contribuent via les evaluations terrain et les rendez-vous termines.</p>
        </section>
        <article className="card">
          <h3>Votre contribution</h3>
          <p>
            Chaque accompagnement termine peut renforcer les criteres de certification des
            agriculteurs suivis sur AgroPlatform.
          </p>
        </article>
      </div>
    );
  }

  const criteriaEntries = myData
    ? [
        ['Formation complete', myData.criteres.formation_complete],
        ['2+ annees d activite', myData.criteres.anciennete_ok],
        ['10 avis positifs minimum', myData.criteres.avis_positifs_ok],
        ['3 produits bio ou plus', myData.criteres.produits_bio_ok],
        ['Evaluation par agronome certifie', myData.criteres.evaluation_agronome_ok]
      ]
    : [];

  return (
    <div className="page">
      <section className="section-heading left">
        <h1>Certification agricole</h1>
        <p>Suivez votre progression, vos bons de fidelite et demandez une evaluation officielle.</p>
      </section>

      {feedback ? (
        <div className={`alert alert-${feedback.type}`}>
          <div className="list-row">
            <span>{feedback.text}</span>
            <button type="button" className="btn-secondary" onClick={() => setFeedback(null)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      <div className="dashboard-grid">
        <article className="card certificate-card">
          <span className="certificate-emoji">{getCertificationIcon(myData?.certification?.niveau)}</span>
          <h2>{myData?.certification?.niveau}</h2>
          <Badge variant={getStatusVariant(myData?.certification?.statut)}>
            {myData?.certification?.statut}
          </Badge>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${myData?.progression || 0}%` }} />
          </div>
          <p>{myData?.progression || 0}% vers le niveau suivant</p>
        </article>

        <article className="card">
          <h3>Checklist des criteres</h3>
          <ul className="plain-list">
            {criteriaEntries.map(([label, valid]) => (
              <li key={label}>
                {valid ? '\u2705' : '\u2B1C'} {label}
              </li>
            ))}
          </ul>
          <div className="metric-box">
            <strong>{myData?.points_fidelite || 0} points</strong>
            <span className="muted">Fidelite disponible sur votre compte</span>
          </div>
          <button type="button" className="btn-primary wide" onClick={handleDemande}>
            Demander une evaluation
          </button>
        </article>
      </div>

      <article className="card">
        <h3>Bons de fidelite disponibles</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Valeur</th>
              <th>Raison</th>
              <th>Expiration</th>
            </tr>
          </thead>
          <tbody>
            {myData?.bons_fidelite?.map((item) => (
              <tr key={item.id}>
                <td>{item.code_bon}</td>
                <td>{formatFcfa(item.valeur_fcfa)}</td>
                <td>{item.raison}</td>
                <td>{formatDate(item.date_expiration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
};

export default CertificationPage;
