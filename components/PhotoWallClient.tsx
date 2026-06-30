'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@/lib/blog';

type PhotoWallPhoto = {
  title: string;
  description: string;
  image: string;
  alt: string;
  album: string;
  location?: string;
  date?: string;
};

type PhotoWallAlbum = GalleryItem & {
  photos: PhotoWallPhoto[];
};

function toPhotos(item: GalleryItem): PhotoWallPhoto[] {
  if (item.items?.length) {
    return item.items.map((photo) => ({
      title: photo.title,
      description: item.description,
      image: photo.image,
      alt: photo.alt || photo.title,
      album: item.title,
      location: item.location,
      date: item.date
    }));
  }

  return [{
    title: item.title,
    description: item.description,
    image: item.image,
    alt: item.alt || item.title,
    album: item.collection || item.title,
    location: item.location,
    date: item.date
  }];
}

export function PhotoWallClient({ items }: { items: GalleryItem[] }) {
  const albums = useMemo<PhotoWallAlbum[]>(() => items.map((item) => ({ ...item, photos: toPhotos(item) })), [items]);
  const [currentAlbumTitle, setCurrentAlbumTitle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWallPhoto | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const currentAlbum = albums.find((album) => album.title === currentAlbumTitle) ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveQuery(searchQuery.trim().toLowerCase()), 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const allPhotos = useMemo(() => albums.flatMap((album) => album.photos), [albums]);
  const matchedAlbums = useMemo(() => {
    if (!activeQuery) {
      return albums;
    }

    return albums.filter((album) => `${album.title} ${album.description} ${album.location || ''} ${album.tags?.join(' ') || ''}`.toLowerCase().includes(activeQuery));
  }, [activeQuery, albums]);
  const matchedPhotos = useMemo(() => {
    if (!activeQuery) {
      return [];
    }

    return allPhotos.filter((photo) => `${photo.title} ${photo.description} ${photo.album} ${photo.location || ''}`.toLowerCase().includes(activeQuery));
  }, [activeQuery, allPhotos]);

  const closeLightbox = useCallback(() => setSelectedPhoto(null), []);

  useEffect(() => {
    if (!selectedPhoto) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(lightboxRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeLightbox, selectedPhoto]);

  if (albums.length === 0) {
    return null;
  }

  return (
    <section className="main-shell photowall-world xh-reference-surface" aria-label="照片墙图集">
      <div className="photowall-toolbar xh-reference-toolbar">
        <div>
          <span>{currentAlbum ? `${currentAlbum.photos.length} 张照片` : `${albums.length} 个图集`}</span>
          <strong>{currentAlbum?.title || '光影画廊'}</strong>
        </div>
        <label>
          <span>Search</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.currentTarget.value)} placeholder="搜索相册名或照片描述..." />
        </label>
        {currentAlbum ? <button type="button" onClick={() => setCurrentAlbumTitle(null)}>返回画廊</button> : null}
      </div>

      {!currentAlbum ? (
        <>
          {activeQuery && matchedPhotos.length > 0 ? (
            <div className="photowall-search-strip" aria-label="匹配照片">
              <header>
                <span>匹配的单张照片</span>
                <strong>{matchedPhotos.length}</strong>
              </header>
              <div>
                {matchedPhotos.map((photo, index) => (
                  <button type="button" onClick={() => setSelectedPhoto(photo)} key={`${photo.album}-${photo.title}-${index}`}>
                    <img src={photo.image} alt={photo.alt} loading="lazy" />
                    <small>{photo.album}</small>
                    <strong>{photo.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="photowall-album-grid" aria-label="图集选择">
            {matchedAlbums.map((album, index) => (
              <button
                className="photowall-album-card"
                type="button"
                onClick={() => {
                  setCurrentAlbumTitle(album.title);
                  setSearchQuery('');
                }}
                key={album.title}
              >
                <span className="photowall-album-stack" aria-hidden="true">
                  {[0, 1, 2].map((slot) => {
                    const photo = album.photos[slot] ?? album.photos[0];
                    return <img src={photo.image} alt="" loading={index === 0 && slot === 0 ? 'eager' : 'lazy'} key={`${photo.image}-${slot}`} />;
                  })}
                  <span>{album.photos.length} 张照片</span>
                </span>
                <strong>{album.title}</strong>
                <small>{album.date || album.location || 'Memory'}</small>
                <em>{album.description}</em>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="photowall-album-head">
            <div>
              <span>{currentAlbum.date || currentAlbum.location || 'Album'}</span>
              <strong>{currentAlbum.title}</strong>
              <p>{currentAlbum.description}</p>
            </div>
            <small>{currentAlbum.photos.length} moments</small>
          </div>
          <div className="photowall-masonry" aria-label={`${currentAlbum.title} 照片`}>
            {currentAlbum.photos.map((photo, index) => (
              <button type="button" onClick={() => setSelectedPhoto(photo)} key={`${photo.image}-${index}`}>
                <img src={photo.image} alt={photo.alt} loading="lazy" />
                <span>{photo.title}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {activeQuery && matchedAlbums.length === 0 && matchedPhotos.length === 0 ? <p className="photowall-empty">没有找到相关的记忆。</p> : null}

      {selectedPhoto ? (
        <div ref={lightboxRef} className="photowall-lightbox" role="dialog" aria-modal="true" aria-label={selectedPhoto.title} onClick={closeLightbox}>
          <button ref={closeButtonRef} type="button" aria-label="关闭照片预览" onClick={closeLightbox}>关闭</button>
          <img src={selectedPhoto.image} alt={selectedPhoto.alt} onClick={(event) => event.stopPropagation()} />
          <p>{selectedPhoto.title} / {selectedPhoto.album}</p>
        </div>
      ) : null}
    </section>
  );
}
