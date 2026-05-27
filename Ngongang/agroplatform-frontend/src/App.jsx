import SoilAnalysisForm from "./modules/ngongang/SoilAnalysisForm";
import QRTicketGenerator from "./modules/ngongang/QRTicketGenerator";
import QRScanner from "./modules/ngongang/QRScanner";
import TicketTracking from "./modules/ngongang/TicketTracking";

function App() {
  return (
    <div>
      <SoilAnalysisForm />
      <hr />
      <QRTicketGenerator />
      <hr />
      <QRScanner />
      <hr />
      <TicketTracking />
    </div>
  );
}

export default App;