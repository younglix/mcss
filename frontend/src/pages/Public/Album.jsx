import { useEffect, useState } from 'react';
import PublicHeader from '../../components/public/PublicHeader.jsx';
import PublicFooter from '../../components/public/PublicFooter.jsx';
import { api } from '../../lib/api.js';
import { toEmbedUrl } from '../../lib/videoEmbed.js';

function AlbumCard({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low border border-outline/10 shadow-sm group text-left"
    >
      {item.media_type === 'video' ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-xs bg-nav text-on-nav">
          <span className="material-symbols-outlined text-4xl">play_circle</span>
          <span className="font-label-sm text-label-sm opacity-80">Video</span>
        </div>
      ) : (
        <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      )}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary text-3xl opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
      </div>
      {item.caption && (
        <p className="absolute bottom-0 inset-x-0 bg-nav/70 text-on-nav text-xs px-sm py-1 truncate">{item.caption}</p>
      )}
    </button>
  );
}

function Lightbox({ item, onClose }) {
  if (!item) return null;
  const embedUrl = item.media_type === 'video' ? toEmbedUrl(item.url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-nav/90 flex items-center justify-center p-lg" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-lg right-lg w-10 h-10 rounded-full bg-surface-container-lowest/20 hover:bg-surface-container-lowest/40 flex items-center justify-center text-on-nav"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        {item.media_type === 'video' ? (
          embedUrl ? (
            <div className="aspect-video w-full">
              <iframe src={embedUrl} title="Album video" allow="autoplay; fullscreen" allowFullScreen className="w-full h-full rounded-lg" />
            </div>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={item.url} controls autoPlay className="w-full max-h-[80vh] rounded-lg" />
          )
        ) : (
          <img src={item.url} alt={item.caption || ''} className="w-full max-h-[80vh] object-contain rounded-lg" />
        )}
        {item.caption && <p className="text-on-nav text-center mt-md font-body-md">{item.caption}</p>}
      </div>
    </div>
  );
}

export default function Album() {
  const [items, setItems] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    document.title = 'School Album | MCSS Portal';
    api.get('/config/site-media/public?placement=album', { auth: false })
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col">
      <PublicHeader />

      <main className="grow max-w-container-max mx-auto px-gutter py-xl w-full">
        <header className="mb-xl text-center max-w-2xl mx-auto">
          <span className="text-tertiary font-label-md text-xs tracking-[0.2em] font-bold uppercase mb-sm block">Moments at Mount Carmel</span>
          <h1 className="font-headline-xl text-headline-lg text-primary mb-md">School Album</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            A closer look at campus life — academics, events, and everyday moments, in pictures and video.
          </p>
        </header>

        {items === null ? (
          <div className="flex justify-center py-xl">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-40 mb-md block">photo_library</span>
            <p>No album items have been added yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
            {items.map((item) => (
              <AlbumCard key={item.id} item={item} onOpen={setOpenItem} />
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
      <Lightbox item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
