import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ePub from 'epubjs';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  BookOpen,
  Save
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import PageLayout from '../components/PageLayout';
import { getReaderBook, saveReadingProgress } from '../services/readerService';
import './Reader.css';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function Reader() {
  const { bookId } = useParams();

  const epubContainer = useRef(null);
  const renditionRef = useRef(null);
  const epubBookRef = useRef(null);
  const saveTimer = useRef(null);

  const [book, setBook] = useState(null);
  const [file, setFile] = useState(null);
  const [formats, setFormats] = useState([]);
  const [format, setFormat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);

  const saveProgress = useCallback(async (position, percentage) => {
    try {
      setSaving(true);
      await saveReadingProgress(bookId, position, percentage);
    } catch (err) {
      console.error('No se pudo guardar el progreso:', err.message);
    } finally {
      setSaving(false);
    }
  }, [bookId]);

  const scheduleSave = useCallback((position, percentage) => {
    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveProgress(position, percentage);
    }, 700);
  }, [saveProgress]);

  const loadBook = useCallback(async (selectedFormat = '') => {
    try {
      setLoading(true);
      setError('');

      const result = await getReaderBook(bookId, selectedFormat);

      setBook(result.book);
      setFile(result.file);
      setFormats((current) => {
        const next = [...current];

        if (!next.includes(result.file.format)) {
          next.push(result.file.format);
        }

        return next;
      });

      setFormat(result.file.format);
      setPage(Math.max(1, result.progress.position || 1));
      setProgress(Number(result.progress.percentage) || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadBook();

    return () => {
      clearTimeout(saveTimer.current);

      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }

      if (epubBookRef.current) {
        epubBookRef.current.destroy();
        epubBookRef.current = null;
      }
    };
  }, [loadBook]);

  const handlePdfLoad = ({ numPages }) => {
    setTotalPages(numPages);
  };

  const changePdfPage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);

    setPage(safePage);

    const percentage = totalPages
      ? (safePage / totalPages) * 100
      : 0;

    setProgress(percentage);
    scheduleSave(safePage, percentage);
  };

  useEffect(() => {
    if (!file || file.format !== 'epub' || !epubContainer.current) {
      return;
    }

    let active = true;

    const initializeEpub = async () => {
      try {
        const publication = ePub(file.url);
        epubBookRef.current = publication;

        await publication.ready;
        await publication.locations.generate(1000);

        if (!active || !epubContainer.current) return;

        const rendition = publication.renderTo(epubContainer.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated'
        });

        renditionRef.current = rendition;

        const savedPercentage = progress / 100;
        const savedLocation = publication.locations.cfiFromPercentage(
          savedPercentage
        );

        await rendition.display(savedLocation || undefined);

        rendition.on('relocated', (location) => {
          if (!active) return;

          const percentage = Math.min(
            100,
            Math.max(0, location.start.percentage * 100)
          );

          const position = Math.round(percentage * 100);

          setProgress(percentage);
          scheduleSave(position, percentage);
        });
      } catch (err) {
        if (active) {
          setError('No se pudo abrir el EPUB. Comprueba que el archivo sea válido.');
          console.error(err);
        }
      }
    };

    initializeEpub();

    return () => {
      active = false;

      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }

      if (epubBookRef.current) {
        epubBookRef.current.destroy();
        epubBookRef.current = null;
      }
    };
  }, [file, scheduleSave]);

  const changeEpubPage = (direction) => {
    if (!renditionRef.current) return;

    if (direction === 'next') {
      renditionRef.current.next();
    } else {
      renditionRef.current.prev();
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="reader-message">
          <LoaderCircle className="reader-spinner" size={32} />
          <p>Preparando tu libro...</p>
        </div>
      </PageLayout>
    );
  }

  if (error || !file) {
    return (
      <PageLayout>
        <div className="reader-message">
          <BookOpen size={38} />
          <h2>No pudimos abrir este libro</h2>
          <p>{error || 'No hay contenido disponible.'}</p>
          <Link to={`/libro/${bookId}`}>Volver al libro</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="reader-page">
        <header className="reader-header">
          <Link to={`/libro/${bookId}`} className="reader-back">
            <ArrowLeft size={18} />
            Volver al libro
          </Link>

          <div className="reader-book-heading">
            <span>ESTÁS LEYENDO</span>
            <h1>{book?.title}</h1>
          </div>

          <div className="reader-format">
            <label htmlFor="reader-format">Formato</label>
            <select
              id="reader-format"
              value={format}
              onChange={(event) => loadBook(event.target.value)}
            >
              <option value={format}>{format.toUpperCase()}</option>
              {formats
                .filter((item) => item !== format)
                .map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>
        </header>

        <section className="reader-toolbar">
          <div className="reader-progress-label">
            <span>Tu progreso</span>
            <strong>{progress.toFixed(1)}%</strong>
          </div>

          <div className="reader-progress-track">
            <div
              className="reader-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="reader-save-status">
            <Save size={15} />
            {saving ? 'Guardando...' : 'Progreso automático'}
          </span>
        </section>

        <section className="reader-viewer">
          {file.format === 'pdf' ? (
            <>
              <Document
                file={file.url}
                onLoadSuccess={handlePdfLoad}
                onLoadError={() => setError('No se pudo cargar el PDF.')}
                loading={<p className="reader-loading">Cargando PDF...</p>}
                error={<p className="reader-loading">No se pudo mostrar el PDF.</p>}
              >
                <Page
                  pageNumber={page}
                  renderTextLayer
                  renderAnnotationLayer
                  width={Math.min(850, window.innerWidth - 50)}
                />
              </Document>
            </>
          ) : (
            <div className="reader-epub" ref={epubContainer} />
          )}
        </section>

        <footer className="reader-controls">
          {file.format === 'pdf' ? (
            <>
              <button
                onClick={() => changePdfPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={19} />
                Anterior
              </button>

              <span>
                Página {page} de {totalPages || '...'}
              </span>

              <button
                onClick={() => changePdfPage(page + 1)}
                disabled={!totalPages || page >= totalPages}
              >
                Siguiente
                <ChevronRight size={19} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => changeEpubPage('previous')}>
                <ChevronLeft size={19} />
                Anterior
              </button>

              <span>{progress.toFixed(1)}% leído</span>

              <button onClick={() => changeEpubPage('next')}>
                Siguiente
                <ChevronRight size={19} />
              </button>
            </>
          )}
        </footer>
      </main>
    </PageLayout>
  );
}

export default Reader;
