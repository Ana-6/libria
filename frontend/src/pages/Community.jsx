
import { Users } from 'lucide-react';
import PageLayout from '../components/PageLayout';

function Community() {
  return (
    <PageLayout>
      <span className="libria-section-label">MÁS QUE UNA BIBLIOTECA</span>

      <h1 className="libria-page-title">
        Una comunidad de lectores.
      </h1>

      <p className="libria-page-description">
        Un espacio para compartir recomendaciones,
        descubrir autores y conectar con otros amantes
        de la literatura.
      </p>

      <div className="libria-coming-soon">
        <Users size={35} />
        <h2>Las historias nos conectan</h2>
        <p>Pronto podrás formar parte de nuestra comunidad.</p>
      </div>
    </PageLayout>
  );
}

export default Community;
