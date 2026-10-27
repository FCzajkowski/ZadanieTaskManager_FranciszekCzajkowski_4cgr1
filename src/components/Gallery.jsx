import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import './Gallery.css';

const photoFiles = import.meta.glob('../../public/zdj*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const teamsByPhotoNumber = {
    'LMP3 Inter Europol': [1, 3, 6, 10, 12],
    'Red Bull Racing': [2, 4, 5, 11, 13],
    TCR: [7, 8, 9, 14, 15],
};

const photos = Object.entries(photoFiles)
    .sort(([firstPath], [secondPath]) => {
        const firstNumber = Number(firstPath.match(/zdj(\d+)\.jpg$/)?.[1] ?? 0);
        const secondNumber = Number(secondPath.match(/zdj(\d+)\.jpg$/)?.[1] ?? 0);
        return firstNumber - secondNumber;
    })
    .map(([path, src], index) => {
        const number = Number(path.match(/zdj(\d+)\.jpg$/)?.[1] ?? index + 1);
        const team = Object.entries(teamsByPhotoNumber)
            .find(([, photoNumbers]) => photoNumbers.includes(number))?.[0] ?? 'Pozostałe';

        return {
            src,
            number,
            index,
            team,
            alt: `Zdjęcie ${number}`,
        };
    });

function Gallery() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [direction, setDirection] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTeam, setActiveTeam] = useState('Wszystkie');
    const imageRef = useRef(null);
    const isOpen = activeIndex !== null;
    const teamNames = ['Wszystkie', ...Object.keys(teamsByPhotoNumber)];
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const visiblePhotos = photos.filter((photo) => {
        const matchesTeam = activeTeam === 'Wszystkie' || photo.team === activeTeam;
        const matchesSearch = `${photo.team} ${photo.alt} ${photo.number}`
            .toLocaleLowerCase()
            .includes(normalizedSearch);
        return matchesTeam && matchesSearch;
    });

    const changePhoto = (step) => {
        setDirection(step);
        setActiveIndex((currentIndex) => {
            const currentPosition = visiblePhotos.findIndex((photo) => photo.index === currentIndex);
            const nextPosition = (currentPosition + step + visiblePhotos.length) % visiblePhotos.length;
            return visiblePhotos[nextPosition].index;
        });
    };

    useEffect(() => {
        if (!isOpen || !imageRef.current) return undefined;

        const $image = $(imageRef.current);
        $image
            .stop(true, true)
            .css({ opacity: 0, left: direction > 0 ? '18px' : '-18px' })
            .animate({ opacity: 1, left: '0px' }, 220);

        return () => $image.stop(true, true);
    }, [activeIndex, direction, isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setActiveIndex(null);
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                const step = event.key === 'ArrowRight' ? 1 : -1;
                setDirection(step);
                setActiveIndex((currentIndex) => {
                    const currentPosition = visiblePhotos.findIndex((photo) => photo.index === currentIndex);
                    const nextPosition = (currentPosition + step + visiblePhotos.length) % visiblePhotos.length;
                    return visiblePhotos[nextPosition].index;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, visiblePhotos]);

    return (
        <section className="gallery" aria-label="Galeria zdjęć">
            <div className="gallery-heading">
                <div>
                    <p className="gallery-eyebrow">Twoja kolekcja</p>
                    <h2>Galeria zdjęć</h2>
                </div>
                <span>{visiblePhotos.length} / {photos.length} zdjęć</span>
            </div>

            <div className="gallery-controls">
                <label className="gallery-search">
                    <span>Szukaj</span>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Zespół lub numer zdjęcia"
                    />
                </label>
                <div className="gallery-filters" aria-label="Filtruj według zespołu">
                    {teamNames.map((team) => (
                        <button
                            className={activeTeam === team ? 'gallery-filter active' : 'gallery-filter'}
                            key={team}
                            type="button"
                            aria-pressed={activeTeam === team}
                            onClick={() => setActiveTeam(team)}
                        >
                            {team}
                        </button>
                    ))}
                </div>
            </div>

            <div className="gallery-grid">
                {visiblePhotos.map((photo) => (
                    <div className="gallery-item" key={photo.src}>
                        <button
                            className="gallery-thumbnail"
                            type="button"
                            onClick={() => {
                                setDirection(1);
                                setActiveIndex(photo.index);
                            }}
                            aria-label={`Powiększ: ${photo.alt}, ${photo.team}`}
                        >
                            <img src={photo.src} alt={photo.alt} loading="lazy" />
                            <span className="gallery-photo-number">{String(photo.number).padStart(2, '0')}</span>
                        </button>
                        <div className="gallery-photo-caption">
                            <span>{photo.alt}</span>
                            <span>{photo.team}</span>
                        </div>
                    </div>
                ))}
            </div>

            {visiblePhotos.length === 0 && (
                <p className="gallery-empty">Brak zdjęć pasujących do wyszukiwania.</p>
            )}

            {isOpen && (
                <div
                    className="gallery-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Powiększone zdjęcie"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setActiveIndex(null);
                    }}
                >
                    <button
                        className="gallery-close"
                        type="button"
                        onClick={() => setActiveIndex(null)}
                        aria-label="Zamknij galerię"
                    >
                        ×
                    </button>
                    <button
                        className="gallery-arrow gallery-previous"
                        type="button"
                        onClick={() => changePhoto(-1)}
                        aria-label="Poprzednie zdjęcie"
                    >
                        ‹
                    </button>
                    <figure className="gallery-figure">
                        <img
                            ref={imageRef}
                            src={photos[activeIndex].src}
                            alt={photos[activeIndex].alt}
                        />
                        <figcaption>
                            <span>{photos[activeIndex].alt} · {photos[activeIndex].team}</span>
                            <span>{visiblePhotos.findIndex((photo) => photo.index === activeIndex) + 1} / {visiblePhotos.length}</span>
                        </figcaption>
                    </figure>
                    <button
                        className="gallery-arrow gallery-next"
                        type="button"
                        onClick={() => changePhoto(1)}
                        aria-label="Następne zdjęcie"
                    >
                        ›
                    </button>
                </div>
            )}
        </section>
    );
}

export default Gallery;