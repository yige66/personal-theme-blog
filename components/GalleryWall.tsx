'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem } from '@/lib/blog';

type GalleryPhoto = {
  title: string;
  description: string;
  image: string;
  alt: string;
  collection: string;
  location?: string;
};

type GalleryCollection = GalleryItem & {
  photos: GalleryPhoto[];
};

function toPhotos(item: GalleryItem): GalleryPhoto[] {
  if (item.items?.length) {
    return item.items.map((child) => ({
      title: child.title,
      description: item.description,
      image: child.image,
      alt: child.alt || child.title,
      collection: item.title,
      location: item.location
    }));
  }

  return [{
    title: item.title,
    description: item.description,
    image: item.image,
    alt: item.alt || item.title,
    collection: item.collection || item.title,
    location: item.location
  }];
}

export function GalleryWall({ items }: { items: GalleryItem[] }) {
  const collections = useMemo(() => items.map((item) => ({
    ...item,
    photos: toPhotos(item)
  })), [items]);

  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const lastPhotoButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeCollection = collections.find((item) => item.title === activeTitle) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const matchedCollections = collections.filter((album) => matchesAlbum(album, normalizedQuery));
  const matchedPhotos = collections.flatMap((album) => album.photos).filter((photo) => matchesPhoto(photo, normalizedQuery));
  const photos = activeCollection?.photos ?? matchedPhotos;
  const filteredPhotos = normalizedQuery ? photos.filter((photo) => matchesPhoto(photo, normalizedQuery)) : photos;
  const featuredPhoto = (activeCollection?.photos ?? matchedPhotos)[0] ?? collections[0]?.photos[0] ?? null;
  const hasSearchResults = Boolean(normalizedQuery && matchedPhotos.length > 0);

  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
    window.setTimeout(() => lastPhotoButtonRef.current?.focus(), 0);
  }, []);

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
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(lightboxRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      ) ?? []).filter((element) => !element.hasAttribute('disabled'));

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

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="main-shell gallery-studio" aria-label="照片墙频道">
      <div className="gallery-studio-toolbar">
        <div>
          <span>{activeCollection ? `${activeCollection.photos.length} 张照片` : `${collections.length} 个图集`}</span>
          <strong>{activeCollection?.title || '照片墙总览'}</strong>
        </div>
        <label>
          <span>搜索相册 / 照片</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标题、地点或描述" />
        </label>
        {activeCollection ? <button type="button" onClick={() => setActiveTitle(null)}>返回图集</button> : null}
      </div>

      {featuredPhoto ? (
        <div className="gallery-light-table" aria-label="当前照片焦点">
          <div className="gallery-light-table-copy">
            <span>{activeCollection ? 'Album focus' : normalizedQuery ? 'Search focus' : 'Gallery focus'}</span>
            <strong>{featuredPhoto.title}</strong>
            <p>{featuredPhoto.description}</p>
            <small>{featuredPhoto.collection}{featuredPhoto.location ? ` / ${featuredPhoto.location}` : ''}</small>
          </div>
          <button
            type="button"
            className="gallery-light-table-frame"
            onClick={(event) => {
              lastPhotoButtonRef.current = event.currentTarget;
              setSelectedPhoto(featuredPhoto);
            }}
          >
            <img src={featuredPhoto.image} alt={featuredPhoto.alt} loading="lazy" />
          </button>
        </div>
      ) : null}

      {hasSearchResults ? (
        <div className="gallery-search-results" aria-live="polite">
          <div className="gallery-search-head">
            <span>匹配的单张照片</span>
            <strong>{matchedPhotos.length}</strong>
          </div>
          <div className="gallery-search-strip">
            {matchedPhotos.map((photo, index) => (
              <button
                type="button"
                onClick={(event) => {
                  lastPhotoButtonRef.current = event.currentTarget;
                  setSelectedPhoto(photo);
                }}
                key={`search-${photo.collection}-${photo.title}-${index}`}
              >
                <img src={photo.image} alt={photo.alt} loading="lazy" />
                <span>{photo.collection}</span>
                <strong>{photo.title}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!activeCollection ? (
        <div className="gallery-album-overview" aria-label="图集选择">
          {matchedCollections.map((album, index) => (
            <button
              className="gallery-album-stack"
              type="button"
              onClick={() => {
                setActiveTitle(album.title);
                setQuery('');
              }}
              key={album.title}
            >
              <span className="gallery-stack-cover" aria-hidden="true">
                {album.photos.slice(0, 3).map((photo, photoIndex) => (
                  <img
                    src={photo.image}
                    alt=""
                    loading={index === 0 && photoIndex === 0 ? 'eager' : 'lazy'}
                    key={`${photo.image}-${photoIndex}`}
                  />
                ))}
              </span>
              <strong>{album.title}</strong>
              <small>{album.photos.length} photos / {album.location || album.collection || 'personal archive'}</small>
              <em>{album.description}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="gallery-album-rail" aria-label="图集选择">
          {collections.map((album, index) => (
            <button
              className={album.title === activeCollection.title ? 'is-active' : ''}
              type="button"
              onClick={() => {
                setActiveTitle(album.title);
                setQuery('');
              }}
              key={album.title}
            >
              <img src={album.image} alt={album.alt || album.title} loading={index === 0 ? 'eager' : 'lazy'} />
              <span>{album.title}</span>
              <small>{album.photos.length} photos</small>
            </button>
          ))}
        </div>
      )}

      {activeCollection || normalizedQuery ? (
        <div className={activeCollection ? 'gallery-polaroid-wall is-album' : 'gallery-polaroid-wall is-search'}>
          {filteredPhotos.map((photo, index) => (
            <button
              type="button"
              onClick={(event) => {
                lastPhotoButtonRef.current = event.currentTarget;
                setSelectedPhoto(photo);
              }}
              className="gallery-polaroid"
              style={{ '--tilt': `${(index % 5) * 2 - 4}deg` } as React.CSSProperties}
              key={`${photo.collection}-${photo.title}-${index}`}
            >
              <img src={photo.image} alt={photo.alt} loading="lazy" />
              <strong>{photo.title}</strong>
              <span>{photo.description}</span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredPhotos.length === 0 ? <p className="gallery-empty">没有找到匹配的照片。</p> : null}

      {selectedPhoto ? (
        <div ref={lightboxRef} className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={selectedPhoto.title} onClick={closeLightbox}>
          <button ref={closeButtonRef} type="button" aria-label="关闭照片预览" onClick={closeLightbox}>关闭</button>
          <img src={selectedPhoto.image} alt={selectedPhoto.alt} onClick={(event) => event.stopPropagation()} />
          <p>{selectedPhoto.title} / {selectedPhoto.collection}</p>
        </div>
      ) : null}
    </section>
  );
}

function matchesAlbum(album: GalleryCollection, query: string): boolean {
  if (!query) {
    return true;
  }

  return `${album.title} ${album.description} ${album.collection || ''} ${album.location || ''} ${album.tags?.join(' ') || ''}`.toLowerCase().includes(query);
}

function matchesPhoto(photo: GalleryPhoto, query: string): boolean {
  if (!query) {
    return true;
  }

  return `${photo.title} ${photo.description} ${photo.collection} ${photo.location || ''}`.toLowerCase().includes(query);
}
