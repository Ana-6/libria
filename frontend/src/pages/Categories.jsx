
import { Library } from 'lucide-react';
import PageLayout from '../components/PageLayout';

function Categories() {
  return (
    <PageLayout>
      <span className="libria-section-label">ENCUENTRA TU GÉNERO</span>

      <h1 className="libria-page-title">
        Historias para cada momento.
      </h1>

      <p className="libria-page-description">
        Explora diferentes mundos literarios y encuentra
        el género que conecta contigo.
      </p>

      <div className="libria-coming-soon">
        <Library size={35} />
        <h2>Un universo de categorías</h2>
        <p>Próximamente podrás explorar nuestras colecciones.</p>
      </div>
    </PageLayout>
  );
}

export default Categories;
